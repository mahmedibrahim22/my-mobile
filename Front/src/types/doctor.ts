/**
 * 🩺 تعريف هيكل بيانات الطبيب في نظام "عون" (AWN)
 * تم تحديثه ليتوافق مع الـ Schema الجديدة لضمان استقرار المواعيد والجدول الزمني
 */

export interface Address {
    line1: string;
    line2: string;
}

export interface Doctor {
    _id: string;          // المعرف الفريد من قاعدة البيانات (MongoDB)
    name: string;         // اسم الطبيب
    email: string;        // البريد الإلكتروني
    image: string | any;  // رابط الصورة أو ملف (FormData)
    speciality: string;   // التخصص (باطنة، أطفال، إلخ)
    degree: string;       // الدرجة العلمية
    experience: string;   // سنوات الخبرة
    about: string;        // نبذة عن الطبيب
    available: boolean;   // حالة الإتاحة العامة (Toggle)
    fees: number;         // سعر الكشف
    address: Address;     // عنوان العيادة (Object)
    
    // --- حقول الجدول الزمني (تتوافق مع Schema الباك إيند الجديدة) ---
    startTime: string;        // وقت بداية العمل (مثال: "09:00 AM")
    endTime: string;          // وقت نهاية العمل (مثال: "09:00 PM")
    breakStart: string;       // وقت بداية الاستراحة (مثال: "03:00 PM")
    breakTime: number;        // مدة الاستراحة بالدقائق (مثال: 60)
    duration: number;         // مدة الكشف الواحد بالدقائق (مثال: 30)
    offDays: string[];        // أيام الإجازة الأسبوعية بالعربي (مثال: ["الجمعة"])
    isAvailableNow: boolean;  // هل الطبيب متاح لاستقبال حجز الآن؟ (محسوب من الباك إند)
    remainingSlotsToday?: number; // عدد الحجوزات المتبقية لليوم
    
    // --- حقول التواصل والبيانات الشخصية ---
    phone: string;       
    whatsapp: string;
    whatsapp2?: string;   // رقم واتساب إضافي
    age: number;
    date: number | string | Date; // تاريخ التسجيل 
    
    // ✅ المواعيد المتاحة (الجدول الأسبوعي)
    // Key: اسم اليوم بالعربي ("السبت") -> Value: مصفوفة مواعيد ["09:00 AM", ...]
    slots_available: Record<string, string[]>; 
    
    // ✅ المواعيد المحجوزة فعلياً
    // Key: التاريخ ("11_4_2026") -> Value: مصفوفة مواعيد محجوزة
    slots_booked: Record<string, string[]>; 
}

/**
 * 📅 تعريف هيكل الموعد (Appointment) 
 * يتوافق مع هيكلة المواعيد في نظام "عون"
 */
export interface Appointment {
    _id: string;
    userId: string;
    docId: string;
    slotDate: string; // التنسيق: "11_4_2026"
    slotTime: string; // التنسيق: "10:00 AM"
    isCompleted: boolean;
    cancelled: boolean;
    payment: boolean;
    userData: {
        name: string;
        image?: string;
        phone?: string;
    };
    docData: Partial<Doctor>; // بيانات الطبيب المختصرة داخل الموعد
    amount: number;
    patientName: string;
    patientPhone: string;
    patientAge: string;
    patientGender: string;
    illnessDescription: string;
    illnessImage?: string;
    date: number; // Timestamp للحجز
}

/**
 * 📦 تعريف حالة الأطباء في Redux (DoctorState)
 */
export interface DoctorState {
    doctors: Doctor[];
    loading: boolean;
    error: string | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

/**
 * 🛠️ تنبيه تقني للمطور (محمد إبراهيم):
 * تم تحديث الواجهات لدعم حقول المواعيد الجديدة. 
 * تأكد من استخدام `slots_available` لعرض جدول الطبيب الأسبوعي،
 * واستخدم `isAvailableNow` للفلترة السريعة في صفحة الـ Home.
 */