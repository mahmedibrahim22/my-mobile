/**
 * 👤 تعريف هيكل بيانات المستخدم (User Types) لنظام "عون"
 * تم ضبطه ليكون متوافقاً مع MongoDB و React Native Forms
 */

export interface Address {
    line1: string;
    line2?: string;
}

export interface UserData {
    _id: string;          // المعرف الفريد من قاعدة البيانات
    name: string;         // اسم المستخدم الكامل
    email: string;        // البريد الإلكتروني
    image: string;        // رابط الصورة الشخصية
    phone: string;        // رقم الهاتف
    
    // العنوان كائن مفصل للتحكم الأفضل في حقول الإدخال
    address: Address; 

    gender: 'Male' | 'Female' | 'Not Selected'; 
    dob: string;          // تاريخ الميلاد بتنسيق YYYY-MM-DD
    
    // حقول إضافية قد تأتي من الباك إيند
    role?: 'user' | 'admin' | 'doctor'; 
}

/**
 * 📦 تعريف حالة المستخدم في Redux Store (UserState)
 * تم تحسينها لتعمل مع AsyncStorage وعمليات الـ Auth
 */
export interface UserState {
    token: string;        // توكن المصادقة (JWT)
    role: 'user' | 'admin' | 'doctor' | null; // نوع المستخدم للتوجيه (Routing)
    userData: UserData | null;
    backendUrl: string;   // الرابط الأساسي للسيرفر
    loading: boolean;     // حالة التحميل العامة
    error: string | null; // رسائل الخطأ
    
    // التحكم في حالة العمليات الـ Async لضمان استقرار الواجهة (UI Stability)
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    
    // المواعيد الخاصة بالمستخدم (تم إضافتها لضمان التوافق مع UserSlice)
    appointments: any[]; 
}

/**
 * 🚨 تنبيه تقني (حل مشكلة الـ 404):
 * اللوجز عندك بتطلع: "Cannot GET /api/api/admin/appointments"
 * ده معناه إن المسار اللي بتبعت عليه فيه /api مرتين.
 * الحل: في الـ UserSlice والـ Context، تأكد إنك بتنادي المسار كدا:
 * `${FULL_API_URL}/admin/appointments` 
 * وليس: `${FULL_API_URL}/api/admin/appointments`
 */