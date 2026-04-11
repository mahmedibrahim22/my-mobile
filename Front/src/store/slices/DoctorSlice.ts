import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Doctor } from '../../types/doctor'; 

interface DoctorState {
    doctors: Doctor[];
    loading: boolean;
    error: string | null;
    lastUpdated: number | null; 
}

const initialState: DoctorState = {
    doctors: [], 
    loading: false,
    error: null,
    lastUpdated: null,
};

const doctorSlice = createSlice({
    name: 'doctors',
    initialState,
    reducers: {
        /**
         * 🩺 تحديث قائمة الأطباء بالكامل
         * يتم التحقق من التغيير قبل التحديث لتقليل عمليات الـ Re-render
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
         * ➕ إضافة طبيب جديد للقائمة (في البداية)
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
         * 🔄 تحديث بيانات طبيب معين في الـ Store
         * يدعم تحديث الحقول الجديدة مثل isAvailableNow و offDays
         */
        updateDoctorInStore: (state, action: PayloadAction<Partial<Doctor> & { _id: string }>) => {
            const index = state.doctors.findIndex(doc => doc._id === action.payload._id);
            if (index !== -1) {
                state.doctors[index] = { ...state.doctors[index], ...action.payload };
            }
        },

        /**
         * ✅ تحديث جداول المواعيد المتاحة (Slots)
         * تم تحديث النوع ليتوافق مع Record<string, string[]> الموجود في Doctor Type
         */
        updateDoctorSlotsInStore: (state, action: PayloadAction<{ _id: string, slots: Record<string, string[]> }>) => {
            const index = state.doctors.findIndex(doc => doc._id === action.payload._id);
            if (index !== -1) {
                state.doctors[index].slots_available = action.payload.slots;
                state.lastUpdated = Date.now(); // تحديث التوقيت لإجبار الواجهة على قراءة المواعيد الجديدة
            }
        },

        /**
         * 🗑️ حذف طبيب من القائمة
         */
        deleteDoctorFromStore: (state, action: PayloadAction<string>) => {
            state.doctors = state.doctors.filter(doc => doc._id !== action.payload);
        },

        /**
         * 🧹 إعادة ضبط حالة الأطباء (عند تسجيل الخروج مثلاً)
         */
        resetDoctorState: (state) => {
            state.doctors = [];
            state.loading = false;
            state.error = null;
            state.lastUpdated = null;
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
    resetDoctorState
} = doctorSlice.actions;

// Selector لجلب الأطباء من الـ State
export const selectAllDoctors = (state: { doctors: DoctorState }) => state.doctors.doctors;

export default doctorSlice.reducer;