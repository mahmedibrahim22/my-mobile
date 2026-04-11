/**
 * 🖼️ ملف الأصول المركزي - منصة عون (Awn Mobile)
 * الموقع: src/assets/assets.ts
 * تم التعديل للاعتماد على الصور المحلية (Local Assets) لضمان أقصى سرعة واستقرار.
 */

export interface Speciality {
    speciality: string;
    image: any; 
}

// 1. الأصول الأساسية (Images)
export const assets = {
    // الصور اللي في فولدر images
    logo: require('./images/logo.png'),
    doctor_banner: require('./images/doctor_banner.png'),
    default_user: require('./images/default_user.png'),
    default_doctor: require('./images/default_doctor.png'),

    // أيقونات الوظائف (Icons) - إذا لم تتوفر محلياً نستخدم placeholders مؤقتاً
    add_icon: require('./icons/general.png'), // مثال لاستخدام أيقونة موجودة
    appointment_icon: require('./icons/urology.png'), 
    home_icon: require('./icons/general.png'),
    upload_area: require('./images/default_user.png'), // بنستخدم صورة المستخدم كمنطقة رفع مؤقتة
};

// 2. بيانات التخصصات (بناءً على الصور اللي في فولدر icons عندك)
export const specialityData: Speciality[] = [
    { 
        speciality: 'General physician', 
        image: require('./icons/general.png') 
    },
    { 
        speciality: 'Gynecologist', 
        image: require('./icons/gynecology.png') 
    },
    { 
        speciality: 'Dermatologist', 
        image: require('./icons/dermatology.png') 
    },
    { 
        speciality: 'Pediatricians', 
        image: require('./icons/pediatrics.png') 
    },
    { 
        speciality: 'Neurologist', 
        image: require('./icons/neurology.png') 
    },
    { 
        speciality: 'Gastroenterologist', 
        image: require('./icons/gastroenterology.png') 
    },
    { 
        speciality: 'Cardiologist', 
        image: require('./icons/cardiology.png') 
    },
    { 
        speciality: 'Orthopedic', 
        image: require('./icons/orthopedic.png') 
    },
    { 
        speciality: 'Dentist', 
        image: require('./icons/dentist.png') 
    },
    { 
        speciality: 'Ophthalmologist', 
        image: require('./icons/ophthalmology.png') 
    },
    { 
        speciality: 'Urologist', 
        image: require('./icons/urology.png') 
    },
    { 
        speciality: 'Lab Consultant', 
        image: require('./icons/laboratory.png') 
    },
    { 
        speciality: 'Physiotherapist', 
        image: require('./icons/physiotherapy.png') 
    },
];

// تصدير افتراضي للسهولة
export default assets;