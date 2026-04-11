import { Platform } from 'react-native';

/**
 * 🛠️ إعدادات النظام الموحدة - AWN Project
 */
const CONFIG = {
    // 1️⃣ الرابط الأساسي للسيرفر
    // ⚠️ تنبيه: استبدل 192.168.1.12 بـ IP جهازك الحالي إذا تغير
    BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL || (
        Platform.OS === 'android' 
            ? "http://192.168.1.7:4000" // تم التغيير من 10.0.2.2 ليعمل على الجهاز الحقيقي والمحاكي معاً
            : "http://192.168.1.7:4000" 
    ),

    ADMIN_URL: process.env.EXPO_PUBLIC_ADMIN_URL || "http://192.168.1.7:5174",

    // 2️⃣ المسار الموحد (Prefix)
    API_PREFIX: "/api",

    // 3️⃣ مفاتيح الـ Headers (التوكنز)
    HEADERS: {
        ADMIN_TOKEN: 'atoken',
        DOCTOR_TOKEN: 'dtoken',
        USER_TOKEN: 'token', 
    }
};

/**
 * 🚀 FULL_API_URL: الرابط الكامل الجاهز للاستخدام
 * تم إضافة منطق تنظيف (Cleanup) لمنع تكرار الـ /api/api
 */
const cleanBaseUrl = CONFIG.BACKEND_URL.endsWith('/api') 
    ? CONFIG.BACKEND_URL.replace(/\/api$/, '') 
    : CONFIG.BACKEND_URL;

export const FULL_API_URL = `${cleanBaseUrl}${CONFIG.API_PREFIX}`;

// ✅ تسجيل الإعدادات في الـ Console عند التشغيل للتأكد من صحة الربط
console.log("---------------------------------------");
console.log(`📡 Device Platform: ${Platform.OS}`);
console.log(`🌐 Backend Base: ${cleanBaseUrl}`);
console.log(`🚀 Final API URL: ${FULL_API_URL}`);
console.log("---------------------------------------");

export default CONFIG;