import express from 'express';
import { 
    loginDoctor, 
    appointmentsDoctor, 
    appointmentCancel, 
    doctorList, 
    appointmentComplete, 
    doctorDashboard, 
    doctorProfile, 
    updateDoctorProfile, 
    changeAvailability,
    updateDoctorSlots // ✅ استيراد دالة تحديث المواعيد والإعدادات (التي سيتم ربطها بـ ManageSlotsScreen)
} from '../controllers/doctorController.js';
import authDoctor from '../middlewares/authDoctor.js';
import upload from '../middlewares/multer.js';

const doctorRouter = express.Router();

// --- مسارات عامة (متاحة لجميع الزوار لعرض الأطباء) ---
// يتم استدعاؤه من AppContext عبر axios.get لملء مصفوفة doctors وعرضها للمرضى
doctorRouter.get("/list", doctorList);

// --- مسار تسجيل دخول الطبيب ---
// يرسل البريد الإلكتروني وكلمة المرور ويُرجع التوكن (Token) للوصول للوحة التحكم
doctorRouter.post("/login", loginDoctor);

// --- مسارات الطبيب (محمية بـ authDoctor) ---
// ملاحظة: الـ Middleware (authDoctor) يتحقق من التوكن ويضيف docId للـ req.body تلقائياً لضمان الأمان
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor);
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel);
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete);
doctorRouter.post("/change-availability", authDoctor, changeAvailability);
doctorRouter.get("/dashboard", authDoctor, doctorDashboard);
doctorRouter.get("/profile", authDoctor, doctorProfile);

// ✅ --- تحديث جدول المواعيد، مدة الكشف، والراحة، وأيام الإجازة، وساعات العمل ---
// هذا المسار يستقبل البيانات من ManageSlotsScreen ويحدث (slots, duration, breakTime, offDays, startTime, endTime, breakStart)
// تم ربطه بـ authDoctor لضمان أن الطبيب المسجل دخوله فقط هو من يعدل جدوله الخاص
doctorRouter.post("/update-slots", authDoctor, updateDoctorSlots);

// --- تحديث بيانات البروفايل (الاسم، التخصص، السعر، العناوين، والصورة، وساعات العمل) ---
// يستخدم multer لرفع الصورة تحت اسم الحقل 'image' ومعالجتها
doctorRouter.post("/update-profile", authDoctor, upload.single('image'), updateDoctorProfile);

export default doctorRouter;