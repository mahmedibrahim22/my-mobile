import deliveryModel from "../models/deliveryModel.js";

// تسجيل مندوب جديد
const registerDelivery = async (req, res) => {
    try {
        const { name, phone, password } = req.body;
        const newDelivery = new deliveryModel({ name, phone, password }); // يفضل تشفير الباسورد كما فعلنا فوق
        await newDelivery.save();
        res.json({ success: true, message: "تم تسجيل المندوب بنجاح" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// جلب المندوبين المتاحين حالياً (للأدمن أو الصيدلية)
const getAvailableDelivery = async (req, res) => {
    try {
        const available = await deliveryModel.find({ isAvailable: true }).select("-password");
        res.json({ success: true, available });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export { registerDelivery, getAvailableDelivery };