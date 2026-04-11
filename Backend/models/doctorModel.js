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

    // ✅ إعدادات وقت الكشف والراحة (تستخدم لتوليد المواعيد تلقائياً في Frontend)
    startTime: { type: String, default: "09:00 AM" }, // وقت بدء العيادة
    endTime: { type: String, default: "09:00 PM" },   // وقت إغلاق العيادة
    duration: { type: Number, default: 30 },          // مدة الكشف بالدقائق
    breakStart: { type: String, default: "03:00 PM" }, // وقت بدء الاستراحة
    breakTime: { type: Number, default: 60 },         // مدة الراحة بالدقائق
    offDays: { type: [String], default: ["الجمعة"] }, // أيام الإجازة الأسبوعية

    // ✅ المواعيد المتاحة (الجدول الأسبوعي الثابت)
    // تم ضبط القيم الافتراضية لضمان وجود الهيكل حتى لو لم يقم الطبيب بتعديله بعد
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

    // ✅ المواعيد المحجوزة فعلياً (تاريخ محدد: مصفوفة ساعات)
    // مثال: "11_4_2026": ["09:00 AM", "10:30 AM"]
    slots_booked: { 
        type: Object, 
        default: {} 
    },

    // العنوان (يحتوي على line1 و line2)
    address: { type: Object, required: true },

    // تاريخ التسجيل
    date: { type: Date, default: Date.now },

}, { 
    // minimize: false تضمن حفظ الحقول الفارغة {} في MongoDB
    minimize: false, 
    // timestamps توفر createdAt و updatedAt تلقائياً لتتبع آخر تحديث للجدول
    timestamps: true 
});

// تصدير الموديل مع التحقق من وجوده مسبقاً لمنع خطأ إعادة التعريف في Next.js/Node
const doctorModel = mongoose.models.doctor || mongoose.model("doctor", doctorSchema);

export default doctorModel;