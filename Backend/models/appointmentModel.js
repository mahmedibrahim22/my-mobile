import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    // --- بيانات الربط الأساسية بين المستخدم والطبيب ---
    userId: { type: String, required: true },
    docId: { type: String, required: true },
    
    // --- بيانات الموعد الزمانية ---
    // slotDate: يتم تخزينه بصيغة DD_MM_YYYY
    slotDate: { type: String, required: true }, 
    // slotTime: الوقت المختار (مثلاً 06:20 PM)
    slotTime: { type: String, required: true }, 
    
    // --- بيانات مرجعية (Snapshot) لضمان ثبات السجل التاريخي ---
    userData: { type: Object, required: true },
    docData: { type: Object, required: true },
    
    // --- البيانات المالية وحالة الموعد الأساسية ---
    amount: { type: Number, required: true },
    date: { type: Number, required: true }, // Timestamp وقت إجراء عملية الحجز
    cancelled: { type: Boolean, default: false }, 
    payment: { type: Boolean, default: false }, 
    isCompleted: { type: Boolean, default: false }, // الزرار الإلزامي للدكتور لفك الـ Blur عن التالي

    // 🟢 نظام إدارة طلب الحجز (Logic الجديد)
    // الحالات: Pending (انتظار)، Accepted (مقبول)، Rejected (مرفوض)
    status: { 
        type: String, 
        enum: ["Pending", "Accepted", "Rejected", "Completed"], 
        default: "Pending" 
    },
    // حقل لتخزين عنوان العيادة وقت قبول الطلب ليظهر للمريض كإشعار ثابت
    doctorAddress: { type: String, default: "" },

    // 🛡️ نظام إدارة الإلغاء (بموافقة الطبيب)
    cancellationRequest: { type: Boolean, default: false }, 
    cancellationStatus: { 
        type: String, 
        enum: ["none", "pending", "accepted", "rejected"], 
        default: "none" 
    },

    // 🕒 نظام تتابع المواعيد (الـ Blur)
    isNext: { type: Boolean, default: false }, 
    doctorAction: { type: Boolean, default: false }, 

    // ✅ بيانات المريض (يدخلها المستخدم يدوياً)
    patientName: { type: String, required: true }, 
    patientPhone: { type: String, required: true },
    patientAge: { type: String, required: true },
    patientGender: { type: String, required: true },
    illnessDescription: { type: String, default: "" }, 
    
    // ✅ الملفات المرفقة (Cloudinary links)
    illnessImage: { type: String, default: "" },
    patientImage: { type: String, default: "" }
});

// منع تكرار إنشاء الموديل لضمان استقرار التطبيق
const appointmentModel = mongoose.models.appointment || mongoose.model("appointment", appointmentSchema);

export default appointmentModel;