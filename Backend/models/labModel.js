import mongoose from "mongoose";

const labSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    homeService: { type: Boolean, default: true }, // هل متاح سحب عينات من البيت؟
    // قائمة التحاليل المتوفرة وأسعارها
    tests: [{
        name: { type: String, required: true },
        price: { type: Number, required: true },
        description: { type: String } // وصف بسيط للتحليل (صائم/فاطر)
    }],
    image: { type: String, default: "" },
    password: { type: String, required: true },
}, { timestamps: true });

const labModel = mongoose.models.lab || mongoose.model("lab", labSchema);
export default labModel;