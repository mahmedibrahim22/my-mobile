import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, required: true }, // رابط الصورة (Cloudinary)
    
    // الحقول الأساسية
    age: { type: Number, required: true }, 
    phone: { type: String, required: true }, 

    // حقول التواصل المضافة (WhatsApp)
    whatsapp: { type: String, default: "" }, // الرقم الأساسي
    whatsapp2: { type: String, default: "" }, // الرقم الإضافي (اختياري)
    
    // التخصص والدرجة
    speciality: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },

    // حالة الظهور للمرضى (الحالة العامة للعيادة)
    available: { type: Boolean, default: true },

    fees: { type: Number, required: true },

    // ✅ إعدادات وقت الكشف والراحة
    startTime: { type: String, default: "09:00 AM" }, 
    endTime: { type: String, default: "09:00 PM" },   
    duration: { type: Number, default: 30 },          
    breakStart: { type: String, default: "03:00 PM" }, 
    breakTime: { type: Number, default: 60 },         
    offDays: { type: [String], default: ["الجمعة"] }, 

    // ✅ المواعيد المتاحة (الجدول الأسبوعي الثابت)
    slots_available: { 
        type: Object, 
        default: {
            "السبت": [],
            "الأحد": [],
            "الأثنين": [],
            "الثلاثاء": [],
            "الأربعاء": [],
            "الخميس": [],
            "الجمعة": []
        } 
    },

    // ✅ المواعيد المحجوزة فعلياً
    slots_booked: { 
        type: Object, 
        default: {} 
    },

    // 💰 نظام رسوم تشغيل وصيانة "عون" (10ج على كل كشف بعد أول 7 حجوزات)
    dailyAppointmentsCount: { type: Number, default: 0 }, // عداد الكشوفات اليومي
    totalFeesToAwn: { type: Number, default: 0 },       // إجمالي المبلغ المستحق لعون (عدد الكشوفات بعد الـ7 * 10)
    isSuspended: { type: Boolean, default: false },     // هل تم إيقاف الطبيب لعدم السداد؟
    paymentStatus: { 
        type: String, 
        enum: ["none", "pending", "verified"], 
        default: "none" 
    }, // حالة السداد (none: لم يرفع، pending: رفع الصورة وينتظر الأدمن، verified: تم التأكد)
    paymentScreenshot: { type: String, default: "" },   // رابط صورة إيصال الدفع (فودافون كاش / انستا باي)

    // العنوان
    address: { type: Object, required: true },

    // تاريخ التسجيل
    date: { type: Date, default: Date.now },

}, { 
    minimize: false, 
    timestamps: true 
});

const doctorModel = mongoose.models.doctor || mongoose.model("doctor", doctorSchema);

export default doctorModel;