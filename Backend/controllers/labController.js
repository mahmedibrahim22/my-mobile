import labModel from "../models/labModel.js";
import bcrypt from 'bcrypt'

// 1. تسجيل معمل تحاليل جديد
const registerLab = async (req, res) => {
    try {
        const { name, phone, tests, homeService, password } = req.body;

        // التحقق من البيانات الأساسية
        if (!name || !phone || !password) {
            return res.json({ success: false, message: "برجاء إكمال البيانات المطلوبة" });
        }

        // تشفير كلمة المرور للحماية
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newLab = new labModel({ 
            name, 
            phone, 
            tests: Array.isArray(tests) ? tests : JSON.parse(tests || "[]"), // التأكد أنها Array
            homeService: homeService === 'true' || homeService === true, 
            password: hashedPassword 
        });

        await newLab.save();
        res.json({ success: true, message: "تم تسجيل المعمل بنجاح ✨" });

    } catch (error) {
        console.log("❌ Register Lab Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// 2. جلب قائمة كل المعامل (بدون الباسورد)
const getLabs = async (req, res) => {
    try {
        const labs = await labModel.find({}).select("-password").sort({ createdAt: -1 });
        res.json({ success: true, labs });
    } catch (error) {
        console.log("❌ Get Labs Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// 3. تحديث بيانات معمل موجود
const updateLab = async (req, res) => {
    try {
        const { labId, name, phone, homeService, tests } = req.body;

        const updateData = {
            name,
            phone,
            homeService: homeService === 'true' || homeService === true,
            tests: Array.isArray(tests) ? tests : JSON.parse(tests || "[]")
        };

        const updatedLab = await labModel.findByIdAndUpdate(labId, updateData, { new: true });

        if (!updatedLab) {
            return res.json({ success: false, message: "المعمل غير موجود" });
        }

        res.json({ success: true, message: "تم تحديث بيانات المعمل بنجاح" });

    } catch (error) {
        console.log("❌ Update Lab Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// 4. حذف معمل
const deleteLab = async (req, res) => {
    try {
        const { labId } = req.body;
        await labModel.findByIdAndDelete(labId);
        res.json({ success: true, message: "تم حذف المعمل نهائياً" });
    } catch (error) {
        console.log("❌ Delete Lab Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// 5. حجز تحليل (مثال مبدئي)
const bookTest = async (req, res) => {
    try {
        const { labId, testName, userId, slotDate } = req.body;
        // هنا يمكنك إضافة منطق الحجز في موديل Appointments أو LabOrders
        res.json({ success: true, message: "تم استلام طلب التحليل، سيتم التواصل معك قريباً" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export { registerLab, getLabs, updateLab, deleteLab, bookTest };