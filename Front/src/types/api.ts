/**
 * 📅 تعريف هيكل البيانات القادمة من الباك أند (Awn API Types)
 * تم تحديث الملف ليدعم كافة موديولات النظام (Admin, User, Doctor)
 */

export interface Address {
    line1: string;
    line2: string;
}

export interface Doctor {
    _id: string;
    name: string;
    email: string;
    image: string;
    speciality: 
        | "General physician" 
        | "Gynecologist" 
        | "Dermatologist" 
        | "Pediatricians" 
        | "Neurologist" 
        | "Gastroenterologist" 
        | "Cardiologist" 
        | "Orthopedic" 
        | "Dentist" 
        | "Ophthalmologist" 
        | "Urologist" 
        | "Lab Consultant" 
        | "Physiotherapist";
    degree: string;
    experience: string;
    about: string;
    available: boolean;
    fees: number;
    address: Address;
    age: number;
    phone: string;
    whatsapp?: string;
    whatsapp2?: string;
    date: number;
    slots_booked: Record<string, string[]>;
}

export interface Appointment {
    _id: string;
    userId: string;
    docId: string;
    slotDate: string;
    slotTime: string;
    userData: any;
    docData: Doctor;
    amount: number;
    date: number;
    cancelled: boolean;
    isCompleted: boolean;
    payment: boolean;
}

export interface DashData {
    doctors: number;
    appointments: number;
    patients: number;
    latestAppointments: Appointment[];
}

/**
 * 🚀 واجهة ردود أفعال السيرفر الموحدة (Generic API Response)
 * تم إضافة كافة الحقول المتوقعة من الـ Admin API لضمان عدم حدوث إيرور Types
 */
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    token?: string;
    
    // بيانات الأطباء والمواعيد
    doctors?: Doctor[];
    docData?: Doctor;
    appointments?: Appointment[];
    
    // بيانات لوحة التحكم
    dashData?: T | DashData;

    // --- الحقول المضافة لدعم AdminContext (حل مشاكل الـ 404 والـ Mapping) ---
    
    // الصيدليات
    pharmacies?: any[]; 
    
    // خدمات التوصيل
    delivery?: any[];    
    
    // المعامل
    labs?: any[];        
}

/**
 * 🛠️ ملاحظة تقنية: 
 * ظهور الخطأ 404 في الـ Logs بمسار /api/api/ يعود إلى تكرار المسار في ملف الإعدادات.
 * وظيفة هذا الملف (Types) هي ضمان أن TypeScript يتعرف على الحقول labs و pharmacies 
 * عند استقبالها من السيرفر بنجاح.
 */