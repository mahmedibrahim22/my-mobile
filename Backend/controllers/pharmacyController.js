import pharmacyModel from "../models/pharmacyModel.js";
import bcrypt from "bcrypt";

// إضافة صيدلية جديدة
const addPharmacy = async (req, res) => {
    try {
        const { name, address, phone, location, password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.onhash(password, salt);

        const newPharmacy = new pharmacyModel({
            name, address, phone, location, password: hashedPassword
        });
        await newPharmacy.save();
        res.json({ success: true, message: "تم إضافة الصيدلية بنجاح" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// جلب كل الصيدليات (للعرض في صفحة الأدمن)
const getPharmacies = async (req, res) => {
    try {
        const pharmacies = await pharmacyModel.find({}).select("-password");
        res.json({ success: true, pharmacies });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// إضافة دواء لصيدلية معينة
const addMedicine = async (req, res) => {
    try {
        const { pharmacyId, medicine } = req.body; // medicine: {name, price, quantity}
        await pharmacyModel.findByIdAndUpdate(pharmacyId, { $push: { medicines: medicine } });
        res.json({ success: true, message: "تم إضافة الدواء بنجاح" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// البحث عن دواء في كل الصيدليات
const searchMedicine = async (req, res) => {
    try {
        const { name } = req.query;
        const results = await pharmacyModel.find({ "medicines.name": { $regex: name, $options: "i" } }).select("name address phone medicines");
        res.json({ success: true, results });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export { addPharmacy, getPharmacies, addMedicine, searchMedicine };