import validator from "validator"
import bcrypt from "bcrypt"
import userModel from "../models/userModel.js"
import jwt from "jsonwebtoken"
import doctorModel from "../models/doctorModel.js"
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
        .replace(/\s+/g, '') // إزالة كافة المسافات
        .replace(/^0/, '');   // إزالة الصفر الافتتاحي
};

// --- تسجيل مستخدم جديد ---
const registerUser = async (req, res) => {
    try {
        const { name, email, password, username, phone, address, dob, gender } = req.body
        if (!name || !email || !password || !username || !phone || !dob || !gender) {
            return res.json({ success: false, message: "بيانات ناقصة" })
        }
        if (!validator.isEmail(email)) return res.json({ success: false, message: "بريد غير صحيح" })
        
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new userModel({ 
            name, 
            email, 
            username: username.toLowerCase(), 
            password: hashedPassword, 
            phone, 
            address, 
            dob, 
            gender 
        })
        const user = await newUser.save()
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
        res.json({ success: true, token })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// --- تسجيل الدخول ---
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await userModel.findOne({ email })
        if (!user) return res.json({ success: false, message: "المستخدم غير موجود" })

        const isMatch = await bcrypt.compare(password, user.password)
        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            return res.json({ success: false, message: "كلمة مرور خاطئة" })
        }
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// ✅ --- حجز موعد (تم التحديث ليدعم حالة Pending افتراضياً) ---
const bookAppointment = async (req, res) => {
    try {
        const { 
            userId, docId, slotDate, slotTime, 
            patientName, patientPhone, patientAge, 
            patientGender, illnessDescription 
        } = req.body
        
        const files = req.files 
        const docData = await doctorModel.findById(docId).select("-password")
        if (!docData || !docData.available) {
            return res.json({ success: false, message: "الطبيب غير متاح حالياً" })
        }

        const daysArabic = ['الأحد', 'الأثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const dateParts = slotDate.split('_'); 
        const dateObj = new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
        const dayName = daysArabic[dateObj.getDay()];

        if (docData.offDays && docData.offDays.includes(dayName)) {
            return res.json({ success: false, message: `عذراً، الدكتور في إجازة يوم ${dayName}` })
        }

        const cleanRequested = normalizeTime(slotTime);
        const slotsForThisDay = docData.slots_available?.[dayName] || [];

        if (slotsForThisDay.length === 0) {
            return res.json({ success: false, message: `لا توجد مواعيد متاحة يوم ${dayName}` });
        }

        const isInManualSlots = slotsForThisDay.some(slot => {
            const cleanDB = normalizeTime(slot);
            return cleanDB === "طوالاليوم" || cleanDB.includes("-") || cleanDB === cleanRequested;
        });

        if (!isInManualSlots) {
            return res.json({ success: false, message: "الموعد غير متاح في الجدول" })
        }

        let slots_booked = docData.slots_booked || {}
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].some(s => normalizeTime(s) === cleanRequested)) {
                return res.json({ success: false, message: "هذا الموعد محجوز بالفعل" })
            }
            slots_booked[slotDate].push(slotTime)
        } else {
            slots_booked[slotDate] = [slotTime]
        }

        let illnessImageUrl = ""
        let patientImageUrl = ""
        if (files) {
            if (files.illnessImage) {
                const upload = await cloudinary.uploader.upload(files.illnessImage[0].path, { resource_type: "image" })
                illnessImageUrl = upload.secure_url
            }
            if (files.patientImage) {
                const upload = await cloudinary.uploader.upload(files.patientImage[0].path, { resource_type: "image" })
                patientImageUrl = upload.secure_url
            }
        }

        const userData = await userModel.findById(userId).select("-password")

        const appointmentData = {
            userId, docId, userData, docData,
            amount: docData.fees,
            slotTime, slotDate,
            patientName, patientPhone, patientAge, patientGender,
            illnessDescription,
            illnessImage: illnessImageUrl,
            patientImage: patientImageUrl,
            date: Date.now(),
            status: "Pending" // الموعد يبدأ دائماً كطلب معلق
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()
        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({ success: true, message: "تم إرسال طلب الحجز للطبيب بنجاح ✅" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// ✅ --- قبول طلب الحجز (خاص بالدكتور) ---
const approveAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.body
        const appointment = await appointmentModel.findById(appointmentId)
        const doctor = await doctorModel.findById(appointment.docId)

        if (!appointment) return res.json({ success: false, message: "الحجز غير موجود" })

        // تحديث الحالة لـ Accepted وإضافة عنوان الدكتور للإشعار
        await appointmentModel.findByIdAndUpdate(appointmentId, { 
            status: "Accepted",
            doctorAddress: doctor.address // إرسال العنوان للمريض
        })

        res.json({ success: true, message: "تم قبول طلب الحجز وإشعار المريض بالعنوان ✅" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// ✅ --- رفض طلب الحجز (خاص بالدكتور) ---
const rejectAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.body
        const appointment = await appointmentModel.findById(appointmentId)

        if (!appointment) return res.json({ success: false, message: "الحجز غير موجود" })

        // تحديث الحالة لـ Rejected (يظهر للمريض "لم يتم قبول طلبك")
        await appointmentModel.findByIdAndUpdate(appointmentId, { status: "Rejected", cancelled: true })

        // مسح الموعد من جدول الطبيب لفتحه مرة أخرى
        const { docId, slotDate, slotTime } = appointment
        const docData = await doctorModel.findById(docId)
        let slots_booked = docData.slots_booked
        slots_booked[slotDate] = slots_booked[slotDate].filter(item => item !== slotTime)
        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({ success: true, message: "تم رفض طلب الحجز بنجاح" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// ✅ --- إتمام الكشف (الزرار اللي بيفك الـ Blur) ---
const completeAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.body
        await appointmentModel.findByIdAndUpdate(appointmentId, { 
            status: "Completed", 
            isCompleted: true 
        })
        res.json({ success: true, message: "تم إتمام الكشف بنجاح، تم فتح الموعد التالي ✅" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// --- عرض قائمة المواعيد الخاصة بالمستخدم ---
const listAppointment = async (req, res) => {
    try {
        const { userId } = req.body
        const appointments = await appointmentModel.find({ userId })
        res.json({ success: true, appointments })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// 🛡️ --- نظام الإلغاء المحدث ---
const cancelAppointment = async (req, res) => {
    try {
        const { userId, appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)
        
        if (!appointmentData) return res.json({ success: false, message: "الموعد غير موجود" })
        if (String(appointmentData.userId) !== String(userId)) return res.json({ success: false, message: "غير مصرح لك" })

        await appointmentModel.findByIdAndUpdate(appointmentId, { 
            cancellationRequest: true,
            cancellationStatus: 'pending'
        })

        res.json({ success: true, message: "تم إرسال طلب الإلغاء للطبيب بنجاح" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// --- جلب وتحديث البروفايل ---
const getProfile = async (req, res) => {
    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select("-password")
        res.json({ success: true, userData })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

const updateProfile = async (req, res) => {
    try {
        const { userId, name, phone, address, dob, gender } = req.body
        const imageFile = req.file
        if (!name || !phone) return res.json({ success: false, message: "بيانات ناقصة" })

        let parsedAddress = address;
        if (typeof address === 'string') {
            try { parsedAddress = JSON.parse(address); } catch (e) { }
        }

        await userModel.findByIdAndUpdate(userId, { name, phone, address: parsedAddress, dob, gender })
        
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            await userModel.findByIdAndUpdate(userId, { image: imageUpload.secure_url })
        }
        res.json({ success: true, message: "تم تحديث البيانات بنجاح ✅" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export { 
    registerUser, loginUser, bookAppointment, listAppointment, 
    cancelAppointment, getProfile, updateProfile,
    approveAppointment, rejectAppointment, completeAppointment // الدوال الجديدة
}