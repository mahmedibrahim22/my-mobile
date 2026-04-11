import axios, { isAxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * ✅ تحديث BASE_URL بدون سلاش في النهاية للتحكم الكامل في الدمج
 */
const BASE_URL = 'http://192.168.1.7:4000/api'; 

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 30000, // 30 ثانية لضمان استقرار رفع الملفات أو في حالات الشبكة الضعيفة
    headers: {
        'Accept': 'application/json',
        'X-App-Platform': Platform.OS,
        'X-App-Version': '1.0.0-Awn-Mobile'
    }
});

// إعداد الـ Interceptor لإضافة التوكنات وتصحيح المسارات تلقائياً
axiosInstance.interceptors.request.use(
    async (config) => {
        try {
            // جلب التوكنات المخزنة بناءً على حالة تسجيل الدخول
            const [atoken, dtoken, utoken] = await Promise.all([
                AsyncStorage.getItem('atoken'),
                AsyncStorage.getItem('dtoken'),
                AsyncStorage.getItem('token')
            ]);

            /**
             * 🛠️ معالجة المسار (URL Formatting):
             * نضمن أن المسار يبدأ بـ / دائماً حتى لا يلتصق بكلمة api
             * مثال: يتحول من 'admin/login' إلى '/admin/login'
             */
            if (config.url && !config.url.startsWith('/')) {
                config.url = `/${config.url}`;
            }

            /**
             * 🛠️ ربط الهيدرز بناءً على نوع المستخدم (إدمن، دكتور، أو مريض):
             * التغيير الجديد يضمن أن كل طلب يرسل التوكن الصحيح للمسار الصحيح
             */
            
            // 1. طلبات الإدمن (Admin)
            if (config.url?.includes('/admin') && atoken) {
                config.headers.atoken = atoken; 
            } 
            // 2. طلبات الأطباء (Doctors)
            else if (config.url?.includes('/doctor') && dtoken) {
                config.headers.dtoken = dtoken; 
            }
            // 3. طلبات المستخدمين/المرضى (Users)
            else if (utoken) {
                config.headers.token = utoken;
            }

            // إضافة طابع زمني للمساعدة في تتبع الطلبات ومنع التكرار غير المقصود
            config.headers['X-Request-Timestamp'] = new Date().getTime().toString();

            // طباعة المسار الكامل في الـ Console للتأكد من صحته (فقط في وضع التطوير)
            if (__DEV__) {
                const fullUrl = `${config.baseURL}${config.url}`;
                console.log(`🚀 Sending [${config.method?.toUpperCase()}] to: ${fullUrl}`);
            }

        } catch (error) {
            console.error("🔒 Auth Storage Error:", error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// إعداد الـ Interceptor لمعالجة الردود والأخطاء بناءً على هيكلة الباك إند الجديدة
axiosInstance.interceptors.response.use(
    (response) => {
        // في حال كان الرد ناجحاً، نقوم بتمرير البيانات مباشرة
        return response;
    },
    async (error) => {
        if (isAxiosError(error)) {
            if (!error.response) {
                console.error("🌐 Network Error: السيرفر غير متاح على 192.168.1.7:4000 (تأكد من الـ IP أو الـ VPN)");
            } else {
                console.log("❌ Axios Error Status:", error.response.status);
                
                /**
                 * 🛠️ معالجة الأخطاء الشائعة:
                 * نقوم بقراءة الرسالة (message) التي يرجعها الباك إند في الـ Response
                 */
                const serverMsg = error.response.data?.message || error.response.data;
                console.log("❌ Server Response Message:", typeof serverMsg === 'object' ? JSON.stringify(serverMsg) : serverMsg);
                
                // حالة 401: التوكن انتهى أو غير صالح
                if (error.response.status === 401) {
                    console.warn("⚠️ Session Expired: التوكن غير صالح أو انتهى مفعوله");
                    // هنا يمكن إضافة logic لمسح AsyncStorage أو توجيه المستخدم لصفحة تسجيل الدخول
                }
                
                // حالة 404: المسار غير موجود أو خطأ في الـ URL
                if (error.response.status === 404) {
                    const failedUrl = error.config?.url ? `${error.config.baseURL}${error.config.url}` : 'Unknown';
                    console.error(`🚨 404 Not Found: المسار [${failedUrl}] غير موجود.`);
                }
                
                // حالة 500: خطأ في السيرفر (مثل مشاكل الـ MongoDB أو الـ Controller)
                if (error.response.status === 500) {
                    console.error("🔥 Internal Server Error: خطأ داخلي في الباك إند.");
                }
            }
        } else {
            console.error("🧨 Unexpected Non-Axios Error:", error);
        }
        
        return Promise.reject(error);
    }
);

export default axiosInstance;