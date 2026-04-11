import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    isAvailable: { type: Boolean, default: true }, // متاح للطلب الآن أم لا
    location: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 }
    },
    currentOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'order' }], // الطلبات اللي معاه حالياً
    password: { type: String, required: true },
}, { timestamps: true });

const deliveryModel = mongoose.models.delivery || mongoose.model("delivery", deliverySchema);
export default deliveryModel;