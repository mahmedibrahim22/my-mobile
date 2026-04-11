import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    // الاسم الكامل (ناتج دمج الاسم الأول والعائلة من الفرونت إند)
    name: { 
        type: String, 
        required: true,
        trim: true 
    },
    
    // اسم المستخدم: فريد، مطلوب، ويحول دائماً لحروف صغيرة
    username: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true,
        trim: true 
    },
    
    // البريد الإلكتروني: فريد ومطلوب
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true 
    },
    
    // كلمة المرور مشفرة
    password: { 
        type: String, 
        required: true 
    },

    // الصورة الشخصية: رابط Cloudinary (تم وضع الرابط الافتراضي الخاص بك)
    image: { 
        type: String, 
        default: 'https://res.cloudinary.com/dt9vsq6p5/image/upload/v1711234567/default_profile.png' 
    },
    
    // رقم الهاتف: افتراضي 11 صفر ليتماشى مع شرط الـ 11 رقم
    phone: { 
        type: String, 
        default: '00000000000' 
    },
    
    // العنوان: يخزن كمجسم يحتوي على المحافظة والمدينة
    address: { 
        type: Object, 
        default: { line1: '', line2: '' } 
    },
    
    // النوع: (Male / Female)
    gender: { 
        type: String, 
        default: 'Not Selected' 
    },
    
    // تاريخ الميلاد: (YYYY-MM-DD)
    dob: { 
        type: String, 
        default: 'Not Selected' 
    },
    
    // تاريخ إنشاء الحساب
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
}, { minimize: false }) // minimize: false تضمن حفظ الكائنات الفارغة مثل address لو كانت لسه محددتش

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;