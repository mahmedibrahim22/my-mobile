import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import fs from 'fs' 
import path from 'path' 
import { createServer } from 'http'
import { Server } from 'socket.io'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'

// الروابط
import adminRouter from './routes/adminRoute.js'
import doctorRouter from './routes/doctorRoute.js'
import userRouter from './routes/userRoute.js'
import pharmacyRouter from './routes/pharmacyRoute.js'
import deliveryRouter from './routes/deliveryRoute.js'
import labRouter from './routes/labRoute.js'

const app = express()
const port = process.env.PORT || 4000
const httpServer = createServer(app)

// ✅ إنشاء مجلد uploads تلقائياً
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// ✅ إعداد Socket.io (تأكد من السماح لجميع المصادر للربط مع الموبايل)
const io = new Server(httpServer, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
})

// الاتصال بقواعد البيانات
connectDB()
connectCloudinary()

// ✅ تحسين إعدادات CORS للسماح بالوصول الكامل (الموبايل + المتصفح)
app.use(cors({
    origin: true, 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
}));

// ✅ زيادة حجم البيانات المسموح بها للصور والملفات
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// إعداد Socket.io للوصول إليه من الـ Controllers
app.set('socketio', io)

io.on('connection', (socket) => {
    socket.on('join_room', (userId) => {
        socket.join(userId)
    })
})

// --- الروابط الأساسية ---
app.use('/api/admin', adminRouter)
app.use('/api/doctor', doctorRouter)
app.use("/api/user", userRouter)
app.use('/api/pharmacy', pharmacyRouter)
app.use('/api/delivery', deliveryRouter)
app.use('/api/labs', labRouter)

// Root Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running 🚀 | Awn Platform API"
    })
});

// ✅ معالجة الأخطاء
app.use((err, req, res, next) => {
    console.error("❌ Backend Error:", err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

/**
 * 🛠️ التعديل الجوهري هنا:
 * استخدمنا "0.0.0.0" بدلاً من localhost
 * ده بيخلي السيرفر "يسمع" لأي جهاز في الشبكة (زي موبايلك) مش بس الكمبيوتر نفسه.
 */
httpServer.listen(port, "0.0.0.0", () => {
    console.log(`---------------------------------------`);
    console.log(`🚀 Awn Server is Live!`);
    console.log(`🏠 Local: http://localhost:${port}`);
    console.log(`🌐 Network: http://192.168.1.6:${port}`); // تأكد من الـ IP بتاعك
    console.log(`---------------------------------------`);
})