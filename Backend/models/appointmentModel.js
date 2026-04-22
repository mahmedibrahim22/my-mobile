import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    // --- بيانات الربط الأساسية بين المستخدم والطبيب ---
    userId: { type: String, required: true },
    docId: { type: String, required: true },
    
    // --- بيانات الموعد الزمانية ---
    // slotDate: يتم تخزينه بصيغة DD_MM_YYYY لتسهيل الفلترة والتحقق من الإجازات
    slotDate: { type: String, required: true }, 
    // slotTime: الوقت المختار بناءً على تقسيم الـ duration (مثلاً 06:20 PM)
    slotTime: { type: String, required: true }, 
    
    // --- بيانات مرجعية (Snapshot) لضمان ثبات السجل التاريخي ---
    // تخزين بيانات الطبيب والمستخدم وقت الحجز يحمي السجل من التغير في حال تم تعديل البروفايلات لاحقاً
    userData: { type: Object, required: true },
    docData: { type: Object, required: true },
    
    // --- البيانات المالية وحالة الموعد ---
    amount: { type: Number, required: true },
    date: { type: Number, required: true }, // Timestamp وقت إجراء عملية الحجز الفعلية
    cancelled: { type: Boolean, default: false }, // هل الموعد ملغي نهائياً؟
    payment: { type: Boolean, default: false }, // هل تم الدفع؟
    isCompleted: { type: Boolean, default: false }, // هل انتهى الكشف بنجاح؟ (الزرار الإلزامي للدكتور)
    
    // 🛡️ نظام إدارة الإلغاء الجديد (بموافقة الطبيب)
    // تم إضافة هذه الحقول لتمكين منطق طلب الإلغاء بدلاً من الإلغاء الفوري
    cancellationRequest: { type: Boolean, default: false }, // هل قدم المريض طلب إلغاء؟
    cancellationStatus: { 
        type: String, 
        enum: ["none", "pending", "accepted", "rejected"], 
        default: "none" 
    }, // حالة طلب الإلغاء: (لا يوجد، معلق، مقبول، مرفوض)

    // 🕒 نظام تتابع المواعيد (الـ Blur)
    isNext: { type: Boolean, default: false }, // هل هذا هو الموعد التالي الذي يجب أن يظهر بدون Blur؟
    doctorAction: { type: Boolean, default: false }, // هل ضغط الدكتور "صح" أو "خطأ" لبدء التعامل مع الحجز؟

    // ✅ بيانات المريض (التي يدخلها المستخدم يدوياً لكل حجز)
    // تدعم حجز المستخدم لنفسه أو لغيره من أفراد العائلة
    patientName: { type: String, required: true }, 
    patientPhone: { type: String, required: true },
    patientAge: { type: String, required: true },
    patientGender: { type: String, required: true },
    illnessDescription: { type: String, default: "" }, // وصف الحالة المرضية
    
    // ✅ الملفات المرفقة (رابط الصورة المرفوعة على Cloudinary)
    // يظهر للطبيب في لوحة التحكم للاطلاع على التحاليل أو الأشعة قبل أو أثناء الكشف
    illnessImage: { type: String, default: "" } 
});

// منع تكرار إنشاء الموديل لضمان استقرار التطبيق أثناء التطوير (Hot Reloading safe)
// يتحقق أولاً إذا كان الموديل موجوداً في mongoose.models لتجنب أخطاء إعادة التعريف
const appointmentModel = mongoose.models.appointment || mongoose.model("appointment", appointmentSchema);

export default appointmentModel;