import express from 'express';
import { 
    registerUser, 
    loginUser, 
    getProfile, 
    updateProfile, 
    bookAppointment, 
    listAppointment, 
    cancelAppointment 
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
userRouter.post("/book-appointment", upload.single('image'), authUser, bookAppointment)

// --- إدارة المواعيد الخاصة بالمستخدم ---
// عرض كافة المواعيد التي قام المستخدم بحجزها مسبقاً (سواء قادمة أو منتهية أو ملغاة)
userRouter.get("/appointments", authUser, listAppointment)

// إلغاء الموعد: يقوم بتغيير حالة الموعد وفتح الـ Slot مرة أخرى في جدول الطبيب بناءً على التعديلات الأخيرة
userRouter.post("/cancel-appointment", authUser, cancelAppointment)

export default userRouter;