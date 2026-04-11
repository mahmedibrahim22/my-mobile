/**
 * تنسيق حجم البيانات من Bytes إلى وحدات مقروءة
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * تحويل كائن التاريخ (Date) إلى الصيغة التي يتوقعها الباك إند: "D_M_YYYY"
 * مثال: 11_4_2026
 */
export const formatDateForBackend = (date: Date): string => {
    const day = date.getDate();
    const month = date.getMonth() + 1; // الأشهر في JavaScript تبدأ من 0
    const year = date.getFullYear();
    return `${day}_${month}_${year}`;
};

/**
 * دالة التحقق من إتاحة الدكتور (Helper Function)
 * الوظيفة: تأخذ حقل isAvailableNow الجديد وجدول المواعيد المتاحة
 * تُستخدم لتوحيد منطق (إطفاء البطاقة، الترتيب في القائمة، والفلترة)
 */
export const checkDoctorAvailability = (
    isAvailableNow: boolean | undefined,
    slots_available: Record<string, string[]> | undefined
): boolean => {
    // 1. إذا كان الطبيب مغلق الحجز يدوياً من لوحة التحكم
    if (isAvailableNow === false) {
        return false;
    }

    // 2. التأكد من وجود كائن المواعيد
    if (!slots_available || typeof slots_available !== 'object') {
        return false;
    }

    // 3. الحصول على مصفوفة القيم (المواعيد لكل يوم)
    const daysSlots = Object.values(slots_available);

    // 4. التحقق مما إذا كان هناك يوم واحد على الأقل يحتوي على مصفوفة مواعيد غير فارغة
    const hasAvailableSlots = daysSlots.some(slots => Array.isArray(slots) && slots.length > 0);

    return hasAvailableSlots;
};

/**
 * دالة مساعدة إضافية لفلترة الساعات المتأخرة
 * تُستخدم في شاشة الحجز AppointmentScreen لإخفاء الساعات التي مرت في "اليوم الحالي"
 */
export const filterPassedTimeSlots = (slots: string[], isToday: boolean): string[] => {
    if (!isToday) return slots;

    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    return slots.filter(slot => {
        // التعامل مع صيغة "10:30 AM" أو "04:00 PM"
        const [time, modifier] = slot.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;

        if (hours > currentHour) return true;
        if (hours === currentHour && minutes > currentMinute) return true;
        
        return false;
    });
};

/**
 * دالة للتحقق مما إذا كان اليوم الحالي هو يوم إجازة للطبيب
 */
export const isDoctorOffDay = (dayNameArabic: string, offDays: string[] = []): boolean => {
    return offDays.includes(dayNameArabic);
};