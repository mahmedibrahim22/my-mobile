import express from 'express';
import { registerDelivery, getAvailableDelivery } from '../controllers/deliveryController.js';

const deliveryRouter = express.Router();

// تسجيل مندوب جديد
deliveryRouter.post('/register', registerDelivery);

// جلب المندوبين المتاحين حالياً
deliveryRouter.get('/available', getAvailableDelivery);

export default deliveryRouter;