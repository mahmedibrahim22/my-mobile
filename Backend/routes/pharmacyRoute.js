import express from 'express';
import { addPharmacy, getPharmacies, addMedicine, searchMedicine } from '../controllers/pharmacyController.js';

const pharmacyRouter = express.Router();

// إضافة صيدلية (يمكن حمايتها بـ admin auth لاحقاً)
pharmacyRouter.post('/add', addPharmacy);

// جلب كل الصيدليات
pharmacyRouter.get('/all', getPharmacies);

// إضافة دواء جديد
pharmacyRouter.post('/add-medicine', addMedicine);

// البحث عن دواء (Query params: ?name=panadol)
pharmacyRouter.get('/search', searchMedicine);

export default pharmacyRouter;