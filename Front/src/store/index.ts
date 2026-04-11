import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

/** * استيراد الـ Reducers الأساسية لمنصة "عون"
 * تأكد من وجود ملفات الـ Slices في المجلد المخصص لها
 */
import userReducer from './slices/UserSlice'; 
import doctorReducer from './slices/DoctorSlice'; 

/**
 * ⚙️ إعداد الـ Redux Store المركزي.
 * تم دمج الـ Reducers الخاصة بالمستخدمين والأطباء لضمان تدفق البيانات بسلاسة.
 */
export const store = configureStore({
    reducer: {
        user: userReducer,
        doctors: doctorReducer, 
    },
    // 🛡️ Middleware: تعطيل فحص الـ Serializability لمرونة أكبر في التعامل مع بيانات الموبايل
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

/** * 🏗️ إعدادات TypeScript لضمان الـ Type-Safety داخل التطبيق 
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/**
 * ⚡ Hooks مخصصة (Custom Hooks) 
 * استخدام هذه الـ Hooks بدلاً من useDispatch و useSelector التقليدية 
 * يضمن لك Auto-complete دقيق لكل الـ States والـ Actions.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;