import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Doctor } from '../../types/doctor'; 

interface DoctorState {
    doctors: Doctor[]; // قائمة الأطباء (للمستخدم/الأدمن)
    loading: boolean;
    error: string | null;
    lastUpdated: number | null; 
    
    // ✅ حقول المحاسبة والرسوم (خاصة ببيانات الدكتور المسجل دخوله)
    totalFeesToAwn: number; 
    isSuspended: boolean;
    paymentStatus: 'none' | 'pending' | 'verified';
    completedAppointmentsCount: number;
}

const initialState: DoctorState = {
    doctors: [], 
    loading: false,
    error: null,
    lastUpdated: null,
    
    // القيم الافتراضية للمحاسبة
    totalFeesToAwn: 0,
    isSuspended: false,
    paymentStatus: 'none',
    completedAppointmentsCount: 0
};

const doctorSlice = createSlice({
    name: 'doctors',
    initialState,
    reducers: {
        /**
         * 🩺 تحديث قائمة الأطباء بالكامل
         */
        setDoctors: (state, action: PayloadAction<Doctor[]>) => {
            if (JSON.stringify(state.doctors) !== JSON.stringify(action.payload)) {
                state.doctors = action.payload;
                state.lastUpdated = Date.now();
            }
            state.loading = false;
            state.error = null;
        },

        /**
         * ➕ إضافة طبيب جديد للقائمة
         */
        addDoctor: (state, action: PayloadAction<Doctor>) => {
            state.doctors = [action.payload, ...state.doctors];
        },

        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },

        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            state.loading = false;
        },

        /**
         * 💰 تحديث البيانات المالية للدكتور (رسوم عون)
         * تُستدعى عند جلب الـ Dashboard Data
         */
        updateDoctorFinancials: (state, action: PayloadAction<{
            totalFeesToAwn: number, 
            isSuspended: boolean, 
            paymentStatus: 'none' | 'pending' | 'verified',
            completedAppointmentsCount?: number
        }>) => {
            state.totalFeesToAwn = action.payload.totalFeesToAwn;
            state.isSuspended = action.payload.isSuspended;
            state.paymentStatus = action.payload.paymentStatus;
            if (action.payload.completedAppointmentsCount !== undefined) {
                state.completedAppointmentsCount = action.payload.completedAppointmentsCount;
            }
        },

        /**
         * 🔄 تحديث بيانات طبيب معين في الـ Store
         */
        updateDoctorInStore: (state, action: PayloadAction<Partial<Doctor> & { _id: string }>) => {
            const index = state.doctors.findIndex(doc => doc._id === action.payload._id);
            if (index !== -1) {
                state.doctors[index] = { ...state.doctors[index], ...action.payload };
            }
        },

        /**
         * ✅ تحديث جداول المواعيد المتاحة (Slots)
         */
        updateDoctorSlotsInStore: (state, action: PayloadAction<{ _id: string, slots: Record<string, string[]> }>) => {
            const index = state.doctors.findIndex(doc => doc._id === action.payload._id);
            if (index !== -1) {
                state.doctors[index].slots_available = action.payload.slots;
                state.lastUpdated = Date.now();
            }
        },

        /**
         * 🗑️ حذف طبيب من القائمة
         */
        deleteDoctorFromStore: (state, action: PayloadAction<string>) => {
            state.doctors = state.doctors.filter(doc => doc._id !== action.payload);
        },

        /**
         * 🧹 إعادة ضبط حالة الأطباء (عند تسجيل الخروج)
         */
        resetDoctorState: (state) => {
            state.doctors = [];
            state.loading = false;
            state.error = null;
            state.lastUpdated = null;
            state.totalFeesToAwn = 0;
            state.isSuspended = false;
            state.paymentStatus = 'none';
            state.completedAppointmentsCount = 0;
        }
    },
});

export const { 
    setDoctors, 
    addDoctor,
    setLoading, 
    setError, 
    updateDoctorInStore,
    updateDoctorSlotsInStore, 
    deleteDoctorFromStore,
    resetDoctorState,
    updateDoctorFinancials // المصدر الجديد للبيانات المالية
} = doctorSlice.actions;

export const selectAllDoctors = (state: { doctors: DoctorState }) => state.doctors.doctors;
// Selector جديد لمعرفة حالة الحساب
export const selectDoctorFinancials = (state: { doctors: DoctorState }) => ({
    totalFeesToAwn: state.doctors.totalFeesToAwn,
    isSuspended: state.doctors.isSuspended,
    paymentStatus: state.doctors.paymentStatus,
    completedAppointmentsCount: state.doctors.completedAppointmentsCount
});

export default doctorSlice.reducer;