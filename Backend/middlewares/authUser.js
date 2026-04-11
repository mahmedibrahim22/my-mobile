import jwt from 'jsonwebtoken'

const authUser = async (req, res, next) => {
    try {
        const { token } = req.headers

        if (!token) {
            return res.json({ success: false, message: 'غير مصرح لك، سجل دخول أولاً' })
        }

        // فك التوكن
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)

        // ✅ الحل الأفضل: تخزين المعرف في req.userId مباشرة
        // ده بيمنع كراش السيرفر لو الـ body مش موجود
        req.userId = token_decode.id 
        
        // لو لسه محتاج ترفقها في الـ body كدعم احتياطي:
        req.body = req.body || {}; 
        req.body.userId = token_decode.id;

        next()

    } catch (error) {
        console.log("Auth Error:", error.message)
        res.json({ success: false, message: 'جلسة العمل انتهت، سجل دخول مجدداً' })
    }
}

export default authUser 