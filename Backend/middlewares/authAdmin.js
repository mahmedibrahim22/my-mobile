import jwt from "jsonwebtoken"

const authAdmin = async (req, res, next) => {
    try {
        // استخراج التوكن من الهيدرز
        const { atoken } = req.headers
        
        // التحقق من وجود التوكن في الطلب
        if (!atoken) {
            return res.json({ success: false, message: 'سجل دخول أولاً' })
        }

        // فك تشفير التوكن باستخدام المفتاح السري المخزن في .env
        const token_decode = jwt.verify(atoken, process.env.JWT_SECRET)

        /**
         * 🛠️ التعديل الجوهري:
         * في دالة loginAdmin، قمت بتشفير (email) فقط.
         * لذا يجب هنا مقارنة التوكن المفكوك بـ (ADMIN_EMAIL) فقط لضمان النجاح.
         */
        if (token_decode !== process.env.ADMIN_EMAIL) {
            return res.json({ success: false, message: 'بيانات الاعتماد غير صالحة' })
        }

        // في حال التطابق، يتم الانتقال لتنفيذ الدالة التالية (مثل get-all-doctors)
        next()

    } catch (error) {
        console.error("❌ Auth Error:", error.message)
        // معالجة حالات التوكن المنتهي أو غير الصحيح
        res.json({ success: false, message: 'انتهت الجلسة أو حدث خطأ في التحقق، سجل دخول مجدداً' })
    }
}

export default authAdmin;