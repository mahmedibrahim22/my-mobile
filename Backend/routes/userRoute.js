import express from 'express';
import { 
    registerUser, 
    loginUser, 
    getProfile, 
    updateProfile, 
    bookAppointment, 
    listAppointment, 
    cancelAppointment,
    approveAppointment,   // ✅ الدالة الجديدة للقبول
    rejectAppointment,    // ✅ الدالة الجديدة للرفض
    completeAppointment   // ✅ الدالة الجديدة لإتمام الكشف (فك الـ Blur)
} from '../controllers/userController.js';
import authUser from '../middlewares/authUser.js';
import upload from '../middlewares/multer.js';

const userRouter = express.Router();

// --- مسارات المصادقة (Authentication) ---
// إنشاء حساب جديد أو تسجيل الدخول للوصول إلى خدمات التطبيق
userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)

// --- مسارات الملف الشخصي (Profile) ---
// جلب بيانات المستخدم (محمي بـ authUser)
userRouter.get("/get-profile", authUser, getProfile)

// تحديث البروفايل: يدعم رفع صورة المستخدم الشخصية عبر حقل 'image'
// ملاحظة: يتم وضع upload قبل authUser لمعالجة بيانات الـ FormData بشكل صحيح
userRouter.post("/update-profile", upload.single('image'), authUser, updateProfile)

// ✅ --- حجز موعد جديد ---
// هذا المسار متوافق تماماً مع نظام الـ Slots المولد بناءً على (startTime, endTime, breakStart)
// نستخدم upload.single('image') لاستقبال صور المرفقات (مثل صور التحاليل أو الأشعة) التي يرفعها المريض
// authUser يقوم باستخراج userId من التوكن وإضافته للـ req.body تلقائياً لضمان الأمان
userRouter.post("/book-appointment", upload.fields([{ name: 'illnessImage', maxCount: 1 }, { name: 'patientImage', maxCount: 1 }]), authUser, bookAppointment)

// --- إدارة المواعيد الخاصة بالمستخدم ---
// عرض كافة المواعيد التي قام المستخدم بحجزها مسبقاً (سواء قادمة أو منتهية أو ملغاة)
userRouter.get("/appointments", authUser, listAppointment)

// إلغاء الموعد: يقوم بتغيير حالة الموعد وفتح الـ Slot مرة أخرى في جدول الطبيب بناءً على التعديلات الأخيرة
userRouter.post("/cancel-appointment", authUser, cancelAppointment)

// 🩺 --- مسارات تحكم الطبيب في الحجوزات (نظام القبول والـ Blur) ---

// قبول طلب الحجز وإرسال العنوان للمريض
userRouter.post("/approve-appointment", authUser, approveAppointment)

// رفض طلب الحجز (يؤدي لإلغاء الموعد وفتح الفترة في الجدول مرة أخرى)
userRouter.post("/reject-appointment", authUser, rejectAppointment)

// إتمام الكشف بنجاح: هذا المسار هو المسؤول عن فك الـ Blur عن الموعد التالي في لوحة تحكم الدكتور
userRouter.post("/complete-appointment", authUser, completeAppointment)

export default userRouter;