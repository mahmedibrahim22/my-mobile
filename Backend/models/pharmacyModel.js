import mongoose from "mongoose";

const pharmacySchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    // لتحديد الموقع بدقة على الخريطة
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    // قائمة الأدوية المتوفرة
    medicines: [{
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, default: 0 }
    }],
    image: { type: String, default: "" }, // لو حابب تضيف لوجو الصيدلية
    password: { type: String, required: true }, // للدخول للوحة تحكم الصيدلية
}, { timestamps: true });

const pharmacyModel = mongoose.models.pharmacy || mongoose.model("pharmacy", pharmacySchema);
export default pharmacyModel;