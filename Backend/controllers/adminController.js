import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";

// --- قائمة التخصصات المعتمدة (تم تحديثها لتطابق الفرونت آند) ---
const ALLOWED_SPECIALITIES = [
    "General physician", 
    "Gynecologist", 
    "Dermatologist", 
    "Pediatricians", 
    "Neurologist", 
    "Gastroenterologist",
    "Cardiologist",
    "Orthopedic",
    "Dentist",
    "Ophthalmologist",
    "Urologist",
    "Lab Consultant",
    "Physiotherapist"
];

// --- نظام الدخول ---
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email, process.env.JWT_SECRET); 
            res.json({ success: true, token });
        } else {
            res.json({ success: false, message: "بيانات الدخول غير صحيحة" });
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// --- إدارة الأطباء ---
const addDoctor = async (req, res) => {
    try {
        const { name, email, password, speciality, degree, experience, about, fees, address, age, phone } = req.body;
        const imageFile = req.file;

        // 1. التحقق من وجود كافة البيانات
        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address || !age || !phone) {
            return res.json({ success: false, message: "برجاء إكمال كافة البيانات المطلوبة" });
        }

        // 2. التحقق من صحة البريد وكلمة المرور
        if (!validator.isEmail(email)) return res.json({ success: false, message: "بريد إلكتروني غير صالح" });
        
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.json({ success: false, message: "كلمة المرور يجب أن تحتوي على حروف وأرقام وألا تقل عن 8 رموز" });
        }

        // 3. التأكد أن التخصص ضمن القائمة المسموح بها (تم تحديث القائمة أعلاه)
        if (!ALLOWED_SPECIALITIES.includes(speciality)) {
            return res.json({ success: false, message: "التخصص المختار غير مدعوم حالياً" });
        }

        // 4. تشفير كلمة المرور ورفع الصورة
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        if (!imageFile) return res.json({ success: false, message: "يرجى إرفاق صورة الطبيب" });
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
        
        const doctorData = {
            name, 
            email, 
            image: imageUpload.secure_url, 
            password: hashedPassword,
            speciality, 
            degree, 
            experience, 
            about, 
            age: Number(age), 
            phone,           
            fees: Number(fees),
            address: JSON.parse(address), 
            date: Date.now()
        };

        const newDoctor = new doctorModel(doctorData);
        await newDoctor.save();
        res.json({ success: true, message: "تم إضافة الطبيب بنجاح ✅" });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

const allDoctors = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select('-password');
        res.json({ success: true, doctors });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

const deleteDoctor = async (req, res) => {
    try {
        const { docId } = req.body;
        await doctorModel.findByIdAndDelete(docId);
        res.json({ success: true, message: "تم حذف الطبيب بنجاح" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

const updateDoctor = async (req, res) => {
    try {
        const { docId, name, fees, experience, address, speciality, about, degree, age, phone } = req.body;
        const imageFile = req.file;

        const updateData = { 
            name, 
            fees: Number(fees), 
            experience, 
            speciality, 
            about, 
            degree,
            age: Number(age), 
            phone,           
            address: typeof address === 'string' ? JSON.parse(address) : address 
        };

        if (speciality && !ALLOWED_SPECIALITIES.includes(speciality)) {
            return res.json({ success: false, message: "التخصص غير صالح" });
        }

        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            updateData.image = imageUpload.secure_url;
        }

        const updatedDoc = await doctorModel.findByIdAndUpdate(docId, updateData, { new: true });

        if (updatedDoc) {
            res.json({ success: true, message: "تم تحديث بيانات الطبيب بنجاح" });
        } else {
            res.json({ success: false, message: "فشل التحديث: الطبيب غير موجود" });
        }
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

const getDoctorInfo = async (req, res) => {
    try {
        const { docId } = req.body;
        const docData = await doctorModel.findById(docId).select('-password');
        res.json({ success: true, docData });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// --- إدارة المواعيد ---
const appointmentsAdmin = async (req, res) => {
    try {
        const appointments = await appointmentModel.find({});
        res.json({ success: true, appointments });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

const appointmentCancel = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);
        
        if (!appointmentData) return res.json({ success: false, message: "الحجز غير موجود" });

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

        const { docId, slotDate, slotTime } = appointmentData;
        const doctorData = await doctorModel.findById(docId);
        
        let slots_booked = doctorData.slots_booked;
        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);

        await doctorModel.findByIdAndUpdate(docId, { slots_booked });
        res.json({ success: true, message: 'تم إلغاء الحجز بنجاح' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

const deleteAppointments = async (req, res) => {
    try {
        const { appointmentIds } = req.body; 
        if (!appointmentIds || appointmentIds.length === 0) {
            return res.json({ success: false, message: "برجاء تحديد مواعيد للحذف" });
        }

        await appointmentModel.deleteMany({ _id: { $in: appointmentIds } });
        res.json({ success: true, message: "تم حذف المواعيد نهائياً" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// --- لوحة التحكم ---
const adminDashboard = async (req, res) => {
    try {
        const [doctors, users, appointments] = await Promise.all([
            doctorModel.find({}),
            userModel.find({}),
            appointmentModel.find({})
        ]);

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: users.length,
            latestAppointments: appointments.reverse().slice(0, 5)
        };
        res.json({ success: true, dashData });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

export { 
    loginAdmin, addDoctor, allDoctors, appointmentsAdmin, 
    appointmentCancel, adminDashboard, deleteDoctor, 
    getDoctorInfo, updateDoctor, deleteAppointments 
};