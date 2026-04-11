import express from 'express'
import { 
    addDoctor, 
    adminDashboard, 
    allDoctors, 
    appointmentCancel, 
    appointmentsAdmin, 
    loginAdmin, 
    deleteDoctor,
    getDoctorInfo, 
    updateDoctor,
    deleteAppointments 
} from '../controllers/adminController.js'
import upload from '../middlewares/multer.js'
import authAdmin from '../middlewares/authAdmin.js'
import { changeAvailability } from '../controllers/doctorController.js'

// ✅ استيراد الدوال مع مراعاة الأسماء الصحيحة في الـ Controllers
import { getPharmacies } from '../controllers/pharmacyController.js' 
import { getAvailableDelivery } from '../controllers/deliveryController.js' 
import { getLabs } from '../controllers/labController.js' // تم إضافة استيراد المعامل

const adminRouter = express.Router()

// --- مسارات المصادقة (Auth) ---
adminRouter.post("/login", loginAdmin)

// --- مسارات إدارة الأطباء (Doctors Management) ---
adminRouter.post("/add-doctor", authAdmin, upload.single('image'), addDoctor)
adminRouter.get("/all-doctors", authAdmin, allDoctors)
adminRouter.post("/change-availability", authAdmin, changeAvailability)
adminRouter.post("/delete-doctor", authAdmin, deleteDoctor)
adminRouter.post('/get-doctor-info', authAdmin, getDoctorInfo) 
adminRouter.post('/update-doctor', authAdmin, upload.single('image'), updateDoctor)

// --- مسارات المواعيد (Appointments Management) ---
// تأكد في الفرونت إند إن النداء يكون '/admin/appointments' فقط بدون تكرار /api
adminRouter.get("/appointments", authAdmin, appointmentsAdmin)
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel)

// 🔥 المسار الجديد: حذف مواعيد نهائياً من قاعدة البيانات
adminRouter.post("/delete-appointments", authAdmin, deleteAppointments)

// --- لوحة التحكم (Dashboard) ---
adminRouter.get("/dashboard", authAdmin, adminDashboard)

// ✅ مسارات الصيدليات، الدليفري، والمعامل (حل مشكلة الـ 404 نهائياً)

// 1. جلب كل الصيدليات للأدمن
adminRouter.get('/all-pharmacies', authAdmin, getPharmacies)

// 2. جلب المندوبين المتاحين للأدمن
adminRouter.get('/all-delivery', authAdmin, getAvailableDelivery)

// 3. جلب كل المعامل للأدمن (تم الربط مع دالة getLabs)
adminRouter.get('/all-labs', authAdmin, getLabs)

export default adminRouter