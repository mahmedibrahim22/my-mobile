import doctorModel from "../models/doctorModel.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import appointmentModel from "../models/appointmentModel.js"
import { v2 as cloudinary } from 'cloudinary'

/**
 * 🛠️ دالة مساعدة لتنظيف تنسيق الوقت لضمان دقة المقارنة
 */
const normalizeTime = (time) => {
    if (!time) return "";
    return time.toString()
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '')
        .replace(/^0/, '');
};

// --- جلب قائمة الأطباء ---
const doctorList = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select("-password");

        if (!doctors || doctors.length === 0) {
            return res.json({ success: true, doctors: [], message: "لا يوجد أطباء في قاعدة البيانات" });
        }

        const today = new Date();
        const slotDate = `${today.getDate()}_${today.getMonth() + 1}_${today.getFullYear()}`;
        
        const daysArabic = ['الأحد', 'الأثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const dayNameNow = daysArabic[today.getDay()];

        const doctorsWithStatus = doctors.map(doc => {
            const docObj = doc.toObject();
            
            const bookedSlotsToday = (doc.slots_booked && doc.slots_booked[slotDate]) 
                ? doc.slots_booked[slotDate].length 
                : 0;

            const hasSlotsDefined = doc.slots_available && 
                                    doc.slots_available[dayNameNow] && 
                                    doc.slots_available[dayNameNow].length > 0;

            const isNotOffDay = !doc.offDays.includes(dayNameNow);

            const isAvailableNow = (doc.available !== undefined ? doc.available : true) && 
                                   isNotOffDay && 
                                   hasSlotsDefined && 
                                   bookedSlotsToday < 20 &&
                                   !doc.isSuspended;

            return {
                ...docObj,
                isAvailableNow,
                remainingSlotsToday: Math.max(0, 20 - bookedSlotsToday)
            };
        });

        const sortedDoctors = doctorsWithStatus.sort((a, b) => {
            if (a.isAvailableNow === b.isAvailableNow) return 0;
            return a.isAvailableNow ? -1 : 1;
        });

        res.json({ success: true, doctors: sortedDoctors });

    } catch (error) {
        console.error("❌ Error in doctorList:", error);
        res.json({ success: false, message: "فشل في جلب قائمة الأطباء" });
    }
}

// --- تسجيل دخول الطبيب ---
const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body;
        const doctor = await doctorModel.findOne({ email });
        
        if (!doctor) {
            return res.json({ success: false, message: "بيانات الاعتماد غير صالحة" });
        }

        const isMatch = await bcrypt.compare(password, doctor.password);
        
        if (isMatch) {
            const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET);
            res.json({ success: true, token });
        } else {
            return res.json({ success: false, message: "بيانات الاعتماد غير صالحة" });
        }
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "حدث خطأ أثناء تسجيل الدخول" });
    }
}

// --- لوحة التحكم (إحصائيات الطبيب) ---
const doctorDashboard = async (req, res) => {
    try {
        const { docId } = req.body;
        const appointments = await appointmentModel.find({ docId });
        const doctor = await doctorModel.findById(docId);

        let earnings = 0;
        appointments.forEach((item) => { 
            if (item.isCompleted || item.payment) earnings += item.amount;
        });

        const patientIds = [...new Set(appointments.map(item => item.userId.toString()))];

        // ✅ تحسين جلب الحجز القادم: استبعاد أي حجز ملغي أو تم طلب إلغاؤه حالياً
        const activeAppointments = appointments.filter(a => !a.cancelled && !a.isCompleted && !a.cancellationRequest);
        const nextAppointmentId = activeAppointments.length > 0 ? activeAppointments[0]._id : null;

        const dashData = {
            earnings,
            appointmentsCount: appointments.length,
            patientsCount: patientIds.length,
            latestAppointments: appointments.reverse().slice(0, 5),
            totalFeesToAwn: doctor.totalFeesToAwn,
            isSuspended: doctor.isSuspended,
            paymentStatus: doctor.paymentStatus,
            completedAppointmentsCount: doctor.completedAppointmentsCount,
            nextAppointmentId 
        };

        res.json({ success: true, dashData });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

// --- إدارة المواعيد ---
const appointmentsDoctor = async (req, res) => {
    try {
        const { docId } = req.body;
        const appointments = await appointmentModel.find({ docId });
        
        // جلب أول حجز نشط (غير مكتمل وغير ملغي) لفك الـ Blur عنه في الموبايل
        const activeSlots = appointments.filter(a => !a.isCompleted && !a.cancelled);
        const nextId = activeSlots.length > 0 ? activeSlots[0]._id : null;

        res.json({ success: true, appointments, nextId });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// ✅ إتمام الكشف
const appointmentComplete = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);

        if (appointmentData && appointmentData.docId.toString() === docId) {
            // تحديث حالة الحجز واكتماله
            await appointmentModel.findByIdAndUpdate(appointmentId, { 
                isCompleted: true,
                cancellationRequest: false // لضمان إغلاق أي طلب معلق بالخطأ
            });

            const doctor = await doctorModel.findById(docId);
            let newCompletedCount = (doctor.completedAppointmentsCount || 0) + 1;
            let newFees = doctor.totalFeesToAwn || 0;

            // لوجيك الرسوم الخاص بسيستم AWN
            if (newCompletedCount > 7) {
                newFees += 10;
            }

            await doctorModel.findByIdAndUpdate(docId, {
                completedAppointmentsCount: newCompletedCount,
                totalFeesToAwn: newFees
            });

            return res.json({ success: true, message: "تم إتمام الموعد وتحديث الحسابات بنجاح ✅" });
        }
        res.json({ success: false, message: "فشل تحديث الموعد" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// 🛡️ إدارة إلغاء الموعد (موافقة أو رفض من الطبيب)
const appointmentCancel = async (req, res) => {
    try {
        const { docId, appointmentId, action } = req.body; // action: 'accepted' OR 'rejected'
        const appointmentData = await appointmentModel.findById(appointmentId);

        if (appointmentData && appointmentData.docId.toString() === docId) {
            if (action === 'accepted') {
                // ✅ 1. تحديث الحجز ليكون ملغياً نهائياً وإغلاق الطلب
                await appointmentModel.findByIdAndUpdate(appointmentId, { 
                    cancelled: true, 
                    cancellationStatus: 'accepted',
                    cancellationRequest: false
                });

                // ✅ 2. تحرير الـ Slot من جدول الطبيب (slots_booked) لفتحه لمريض آخر
                const { slotDate, slotTime } = appointmentData;
                const docData = await doctorModel.findById(docId);
                let slots_booked = docData.slots_booked;
                
                const cleanToCancel = normalizeTime(slotTime);
                if (slots_booked[slotDate]) {
                    slots_booked[slotDate] = slots_booked[slotDate].filter(e => 
                        normalizeTime(e) !== cleanToCancel
                    );
                }
                
                await doctorModel.findByIdAndUpdate(docId, { slots_booked });

                return res.json({ success: true, message: "تم قبول الإلغاء وتحرير الموعد بنجاح" });
            } else {
                // ❌ في حالة الرفض: يعود الموعد كما كان ويختفي طلب الإلغاء من عند الطبيب
                await appointmentModel.findByIdAndUpdate(appointmentId, { 
                    cancellationStatus: 'rejected',
                    cancellationRequest: false 
                });
                return res.json({ success: true, message: "تم رفض طلب الإلغاء، الموعد ما زال قائماً" });
            }
        }
        res.json({ success: false, message: "لا يمكن تنفيذ الإجراء، الحجز غير موجود أو غير تابع لك" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// --- ملف الطبيب وإدارة الحالة ---
const doctorProfile = async (req, res) => {
    try {
        const { docId } = req.body;
        const profileData = await doctorModel.findById(docId).select("-password");
        res.json({ success: true, profileData });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

const changeAvailability = async (req, res) => {
    try {
        const { docId } = req.body;
        const docData = await doctorModel.findById(docId);
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available });
        res.json({ success: true, message: "تم تحديث الحالة بنجاح" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// ✅ رفع إثبات الدفع
const uploadPaymentScreenshot = async (req, res) => {
    try {
        const { docId } = req.body;
        const imageFile = req.file;

        if (!imageFile) return res.json({ success: false, message: "يرجى إرفاق صورة الإيصال" });

        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image", folder: "payments" });
        
        await doctorModel.findByIdAndUpdate(docId, {
            paymentScreenshot: imageUpload.secure_url,
            paymentStatus: 'pending'
        });

        res.json({ success: true, message: "تم رفع الإيصال، يرجى الانتظار حتى مراجعة الإدارة ✅" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

const updateDoctorProfile = async (req, res) => {
    try {
        const { 
            docId, name, about, fees, address, available, 
            whatsapp, whatsapp2, phone, age, speciality, degree, experience,
            startTime, endTime, breakStart 
        } = req.body;
        
        const imageFile = req.file;
        const doctor = await doctorModel.findById(docId);

        if (!doctor) return res.json({ success: false, message: "الطبيب غير موجود" });

        let parsedAddress = doctor.address;
        if (address) {
            try {
                parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
            } catch (e) { console.log("Address parse error"); }
        }

        const updateData = {
            name: name || doctor.name,
            about: about || doctor.about,
            fees: fees !== undefined ? Number(fees) : doctor.fees,
            phone: phone || doctor.phone,
            age: age || doctor.age,
            speciality: speciality || doctor.speciality,
            degree: degree || doctor.degree,
            experience: experience || doctor.experience,
            whatsapp: whatsapp || doctor.whatsapp,
            whatsapp2: whatsapp2 || doctor.whatsapp2,
            address: parsedAddress,
            available: available !== undefined ? (available === 'true' || available === true) : doctor.available,
            startTime: startTime || doctor.startTime,
            endTime: endTime || doctor.endTime,
            breakStart: breakStart || doctor.breakStart
        };

        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { 
                resource_type: "image",
                folder: "doctor_profiles" 
            });
            updateData.image = imageUpload.secure_url;
        }

        await doctorModel.findByIdAndUpdate(docId, updateData);
        res.json({ success: true, message: "تم تحديث بياناتك بنجاح ✅" });

    } catch (error) {
        console.error("❌ updateDoctorProfile Error:", error);
        res.json({ success: false, message: "فشل في تحديث البيانات" });
    }
}

const updateDoctorSlots = async (req, res) => {
    try {
        const { docId, slots, duration, breakTime, offDays, startTime, endTime, breakStart } = req.body;

        const activeAppointments = await appointmentModel.find({ 
            docId: docId, 
            cancelled: false, 
            isCompleted: false 
        });

        if (activeAppointments.length > 0) {
            return res.json({ 
                success: false, 
                message: "لا يمكن تحديث الجدول وهناك حجوزات جارية. يرجى إنهاء المواعيد الحالية أولاً." 
            });
        }

        await doctorModel.findByIdAndUpdate(docId, { 
            slots_available: slots || {},
            duration: duration !== undefined ? Number(duration) : 30,
            breakTime: breakTime !== undefined ? Number(breakTime) : 0,
            offDays: offDays || [],
            startTime: startTime || "09:00 AM",
            endTime: endTime || "09:00 PM",
            breakStart: breakStart || "03:00 PM"
        });

        res.json({ success: true, message: "تم تحديث جدول المواعيد والإعدادات بنجاح ✅" });
    } catch (error) {
        console.error("❌ UpdateDoctorSlots Error:", error);
        res.json({ success: false, message: "حدث خطأ أثناء تحديث المواعيد" });
    }
}

export { 
    loginDoctor, 
    appointmentsDoctor, 
    appointmentCancel, 
    appointmentComplete, 
    doctorProfile, 
    changeAvailability, 
    doctorList, 
    doctorDashboard, 
    updateDoctorProfile,
    updateDoctorSlots,
    uploadPaymentScreenshot
}