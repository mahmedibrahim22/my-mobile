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
        .replace(/^0/, '');   // إزالة الصفر الافتتاحي (مثل 09:00 تصبح 9:00)
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

// ✅ --- حجز موعد (تم التحديث لضمان مطابقة الجدولة الذكية) ---
const bookAppointment = async (req, res) => {
    try {
        const { 
            userId, docId, slotDate, slotTime, 
            patientName, patientPhone, patientAge, 
            patientGender, illnessDescription 
        } = req.body
        
        const imageFile = req.file 

        const docData = await doctorModel.findById(docId).select("-password")
        if (!docData || !docData.available) {
            return res.json({ success: false, message: "الطبيب غير متاح حالياً" })
        }

        // --- تحويل التاريخ لجلب اسم اليوم بالعربي ---
        const daysArabic = ['الأحد', 'الأثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const dateParts = slotDate.split('_'); 
        const day = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; 
        const year = parseInt(dateParts[2]);
        const dateObj = new Date(year, month, day);
        const dayName = daysArabic[dateObj.getDay()];

        // 1️⃣ التحقق من الإجازات الرسمية المسجلة للطبيب
        if (docData.offDays && docData.offDays.includes(dayName)) {
            return res.json({ success: false, message: `عذراً، الدكتور في إجازة يوم ${dayName}` })
        }

        // 2️⃣ فحص جدول الفترات (Slots)
        const cleanRequested = normalizeTime(slotTime);
        const availableDays = docData.slots_available || {};
        const slotsForThisDay = availableDays[dayName] || [];

        if (slotsForThisDay.length === 0) {
            return res.json({ 
                success: false, 
                message: `لا توجد مواعيد متاحة مسجلة للطبيب في يوم ${dayName}`,
            });
        }

        // التحقق من التوفر الفعلي (يدوي أو فترة مفتوحة) باستخدام normalizeTime
        const isInManualSlots = slotsForThisDay.some(slot => {
            const cleanDB = normalizeTime(slot);
            
            // دعم الكلمات الدلالية للفترات المفتوحة
            if (cleanDB === "طوالاليوم" || cleanDB.includes("إلى") || cleanDB.includes("من") || cleanDB.includes("-")) {
                return true;
            }
            
            return cleanDB === cleanRequested;
        });

        if (!isInManualSlots) {
            return res.json({ 
                success: false, 
                message: `الموعد (${slotTime}) غير متاح في جدول يوم ${dayName}`,
            })
        }

        // 3️⃣ التحقق من الازدحام (bookedSlots)
        let slots_booked = docData.slots_booked || {}
        if (slots_booked[slotDate]) {
            const isAlreadyBooked = slots_booked[slotDate].some(s => 
                normalizeTime(s) === cleanRequested
            );
            
            if (isAlreadyBooked) {
                return res.json({ success: false, message: "هذا الموعد محجوز بالفعل، يرجى اختيار وقت آخر" })
            }
            slots_booked[slotDate].push(slotTime)
        } else {
            slots_booked[slotDate] = [slotTime]
        }

        // معالجة صورة الحالة المرضية
        let illnessImageUrl = ""
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            illnessImageUrl = imageUpload.secure_url
        }

        const userData = await userModel.findById(userId).select("-password")

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            patientName,
            patientPhone,
            patientAge,
            patientGender,
            illnessDescription,
            illnessImage: illnessImageUrl,
            date: Date.now()
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()

        // تحديث قاعدة بيانات الطبيب بالمواعيد الجديدة المحجوزة
        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({ success: true, message: "تم حجز الموعد بنجاح ✅" })

    } catch (error) {
        console.error("❌ Error in bookAppointment:", error)
        res.json({ success: false, message: "حدث خطأ أثناء معالجة الحجز" })
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

// 🛡️ --- نظام الإلغاء المحدث (طلب إلغاء بدل إلغاء فوري) ---
const cancelAppointment = async (req, res) => {
    try {
        const { userId, appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)
        
        if (!appointmentData) return res.json({ success: false, message: "الموعد غير موجود" })
        if (String(appointmentData.userId) !== String(userId)) return res.json({ success: false, message: "غير مصرح لك بإلغاء هذا الحجز" })

        // 1️⃣ التحقق من الوقت: هل متبقي أقل من 20 دقيقة؟
        const [day, month, year] = appointmentData.slotDate.split('_').map(Number);
        
        // استخراج الوقت وتحويله لـ 24 ساعة (مثال: 06:20 PM -> 18:20)
        let [time, modifier] = appointmentData.slotTime.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;

        const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);
        const currentTime = new Date();
        const timeDiff = (appointmentDateTime - currentTime) / (1000 * 60); // الفرق بالدقائق

        if (timeDiff < 20 && timeDiff > 0) {
            return res.json({ 
                success: false, 
                message: "عذراً، لا يمكن طلب الإلغاء قبل الموعد بأقل من 20 دقيقة" 
            });
        }

        // 2️⃣ تحديث الحالة لطلب إلغاء معلق (Pending Approval)
        await appointmentModel.findByIdAndUpdate(appointmentId, { 
            cancellationRequest: true,
            cancellationStatus: 'pending'
        })

        res.json({ success: true, message: "تم إرسال طلب الإلغاء للطبيب بنجاح، بانتظار الموافقة" })
        
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// --- جلب بيانات بروفايل المستخدم ---
const getProfile = async (req, res) => {
    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select("-password")
        res.json({ success: true, userData })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// --- تحديث بيانات بروفايل المستخدم ---
const updateProfile = async (req, res) => {
    try {
        const { userId, name, phone, address, dob, gender } = req.body
        const imageFile = req.file
        if (!name || !phone) return res.json({ success: false, message: "الاسم ورقم الهاتف مطلوبان" })

        let parsedAddress = address;
        if (typeof address === 'string') {
            try { parsedAddress = JSON.parse(address); } catch (e) { console.log("Address parse error"); }
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

export { registerUser, loginUser, bookAppointment, listAppointment, cancelAppointment, getProfile, updateProfile }