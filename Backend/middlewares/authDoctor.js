import jwt from 'jsonwebtoken';

const authDoctor = async (req, res, next) => {
    try {
        const { dtoken } = req.headers;

        if (!dtoken) {
            return res.status(401).json({ success: false, message: 'جلسة العمل انتهت، سجل دخول مجدداً' });
        }

        const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET);
        
        // 🔍 سطر كاشف للمشكلة
        console.log("Decoded Doctor Token:", token_decode);

        if (!token_decode || !token_decode.id) {
            return res.status(401).json({ success: false, message: 'توكن غير صالح: لا يحتوي على ID' });
        }

        // تخزين المعرف بطريقة احترافية
        req.docId = token_decode.id; 
        
        // ضمان وجود body لتجنب الـ undefined في الكنترولرز
        if (!req.body) req.body = {};
        req.body.docId = token_decode.id;

        next();
    } catch (error) {
        console.log("Auth Doctor Error:", error.message);
        res.status(401).json({ success: false, message: 'توكن غير صالح أو منتهي' });
    }
};

export default authDoctor;