import doctorModel from "../models/doctorModel.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import appointmentModel from "../models/appointmentModel.js"
import { v2 as cloudinary } from 'cloudinary'

// --- جلب قائمة الأطباء (تم تحسين المنطق ليعكس التوفر الحقيقي) ---
const doctorList = async (req, res) => {
    try {
        // جلب جميع الأطباء مع استثناء كلمة المرور
        const doctors = await doctorModel.find({}).select("-password");

        if (!doctors || doctors.length === 0) {
            return res.json({ success: true, doctors: [], message: "لا يوجد أطباء في قاعدة البيانات" });
        }

        const today = new Date();
        const slotDate = `${today.getDate()}_${today.getMonth() + 1}_${today.getFullYear()}`;
        
        // مصفوفة الأيام بالعربي للمطابقة مع Schema
        const daysArabic = ['الأحد', 'الأثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const dayNameNow = daysArabic[today.getDay()];

        const doctorsWithStatus = doctors.map(doc => {
            const docObj = doc.toObject();
            
            // 1. حساب المواعيد المحجوزة لليوم
            const bookedSlotsToday = (doc.slots_booked && doc.slots_booked[slotDate]) 
                ? doc.slots_booked[slotDate].length 
                : 0;

            // 2. التحقق من وجود فترات متاحة مسجلة لهذا اليوم في جدول الطبيب
            const hasSlotsDefined = doc.slots_available && 
                                   doc.slots_available[dayNameNow] && 
                                   doc.slots_available[dayNameNow].length > 0;

            // 3. التحقق مما إذا كان اليوم هو يوم إجازة للطبيب
            const isNotOffDay = !doc.offDays.includes(dayNameNow);

            // 4. تحديد التوفر الحقيقي:
            // أضفنا شرط isSuspended: لو الطبيب موقوف بسبب الديون لا يظهر متاحاً
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

        // ترتيب الأطباء: المتاح حالياً يظهر أولاً
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

// --- لوحة التحكم (إحصائيات الطبيب مع نظام المديونية) ---
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

        // منطق الـ Blur: جلب أول حجز نشط فقط ليتم عرضه بدون تشويش
        const activeAppointments = appointments.filter(a => !a.cancelled && !a.isCompleted);
        const nextAppointmentId = activeAppointments.length > 0 ? activeAppointments[0]._id : null;

        const dashData = {
            earnings,
            appointmentsCount: appointments.length,
            patientsCount: patientIds.length,
            latestAppointments: appointments.reverse().slice(0, 5),
            // بيانات المديونية للفرونت إند
            totalFeesToAwn: doctor.totalFeesToAwn,
            isSuspended: doctor.isSuspended,
            paymentStatus: doctor.paymentStatus,
            nextAppointmentId // إرسال معرف الحجز الذي لا يجب عمل Blur له
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
        
        // تحديد أول موعد متاح ليكون هو المسموح به (Non-Blur)
        const activeSlots = appointments.filter(a => !a.isCompleted && !a.cancelled);
        const nextId = activeSlots.length > 0 ? activeSlots[0]._id : null;

        res.json({ success: true, appointments, nextId });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// ✅ زر "تم الكشف بنجاح" الإلزامي + حساب الـ 10ج بعد الحجز السابع
const appointmentComplete = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);

        if (appointmentData && appointmentData.docId.toString() === docId) {
            // 1. تحديث الحجز كمكتمل
            await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });

            // 2. تحديث عداد الدكتور والمديونية
            const doctor = await doctorModel.findById(docId);
            let newDailyCount = (doctor.dailyAppointmentsCount || 0) + 1;
            let newFees = doctor.totalFeesToAwn || 0;

            // إذا تخطى 7 حجوزات، نبدأ بحساب 10ج على كل كشف جديد
            if (newDailyCount > 7) {
                newFees += 10;
            }

            await doctorModel.findByIdAndUpdate(docId, {
                dailyAppointmentsCount: newDailyCount,
                totalFeesToAwn: newFees
            });

            return res.json({ success: true, message: "تم إتمام الموعد وتحديث الحسابات بنجاح ✅" });
        }
        res.json({ success: false, message: "فشل تحديث الموعد" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

const appointmentCancel = async (req, res) => {
    try {
        const { docId, appointmentId, action } = req.body; // action: 'accepted' or 'rejected'
        const appointmentData = await appointmentModel.findById(appointmentId);

        if (appointmentData && appointmentData.docId.toString() === docId) {
            if (action === 'accepted') {
                await appointmentModel.findByIdAndUpdate(appointmentId, { 
                    cancelled: true, 
                    cancellationStatus: 'accepted' 
                });
                return res.json({ success: true, message: "تم قبول الإلغاء والموعد متاح الآن" });
            } else {
                await appointmentModel.findByIdAndUpdate(appointmentId, { 
                    cancellationStatus: 'rejected',
                    cancellationRequest: false 
                });
                return res.json({ success: true, message: "تم رفض طلب الإلغاء" });
            }
        }
        res.json({ success: false, message: "لا يمكن تنفيذ الإجراء" });
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

// ✅ رفع إثبات الدفع (Screenshot) لعون
const uploadPaymentScreenshot = async (req, res) => {
    try {
        const { docId } = req.body;
        const imageFile = req.file;

        if (!imageFile) return res.json({ success: false, message: "يرجى إرفاق صورة الإيصال" });

        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
        
        await doctorModel.findByIdAndUpdate(docId, {
            paymentScreenshot: imageUpload.secure_url,
            paymentStatus: 'pending'
        });

        res.json({ success: true, message: "تم رفع الإيصال، يرجى الانتظار حتى التحقق ✅" });
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

// --- ✅ تحديث جدول المواعيد والإعدادات ---
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