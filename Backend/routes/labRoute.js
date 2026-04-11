import express from 'express';
import { 
    registerLab, 
    getLabs, 
    updateLab, 
    deleteLab, 
    bookTest 
} from '../controllers/labController.js';
import authAdmin from '../middlewares/authAdmin.js'; // تأكد من المسار حسب مشروعك

const labRouter = express.Router();

// --- روابط لوحة تحكم الأدمن (محمية بـ authAdmin) ---

// 1. تسجيل معمل تحاليل جديد
labRouter.post('/register', authAdmin, registerLab);

// 2. جلب قائمة كل المعامل (لعرضها في الجدول)
labRouter.get('/all', authAdmin, getLabs);

// 3. تحديث بيانات معمل (بالاسم، التليفون، والتحاليل)
labRouter.post('/update', authAdmin, updateLab);

// 4. حذف معمل نهائياً من السيستم
labRouter.post('/delete', authAdmin, deleteLab);


// --- روابط المرضى / المستخدمين ---

// 5. حجز موعد فحص (منزلي أو في المعمل)
labRouter.post('/book', bookTest);


export default labRouter;