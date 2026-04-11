import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData, UserState } from '../../types/user';
import CONFIG, { FULL_API_URL } from '../../constants/Config';

/**
 * 🏠 جلب بيانات الصفحة الرئيسية (أطباء مقترحين)
 */
export const getHomeData = createAsyncThunk<any, void, { rejectValue: string }>(
    'user/getHomeData',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(`${FULL_API_URL}/doctor/list`);
            if (data.success) return data.doctors;
            return rejectWithValue(data.message);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "خطأ اتصال");
        }
    }
);

/**
 * 📅 جلب مواعيد المستخدم
 */
export const getUserAppointments = createAsyncThunk<any[], void, { rejectValue: string }>(
    'user/getUserAppointments',
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState() as { user: ExtendedUserState };
            const token = state.user.token || await AsyncStorage.getItem('token');
            if (!token) return rejectWithValue("Login Required");

            const { data } = await axios.get(`${FULL_API_URL}/user/appointments`, {
                headers: { token }
            });
            return data.success ? data.appointments.reverse() : rejectWithValue(data.message);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Error");
        }
    }
);

/**
 * 🚀 جلب بيانات البروفايل
 */
export const loadUserProfile = createAsyncThunk<{ userData: UserData, role: string }, void, { rejectValue: string }>(
    'user/loadUserProfile',
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState() as { user: ExtendedUserState };
            let token = state.user.token || await AsyncStorage.getItem('token');
            if (!token) return rejectWithValue("Expired Session");

            const { data } = await axios.get(`${FULL_API_URL}/user/get-profile`, {
                headers: { token }
            });

            if (data.success) {
                return { userData: data.userData, role: data.userData.role || 'user' };
            }
            return rejectWithValue(data.message);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Connection Error");
        }
    }
);

interface ExtendedUserState extends UserState {
    appointments: any[];
    homeData: any[]; 
    role: 'user' | 'admin' | 'doctor' | null;
}

const initialState: ExtendedUserState = {
    token: '', 
    userData: null,
    role: null, 
    appointments: [], 
    homeData: [],
    backendUrl: CONFIG.BACKEND_URL, 
    loading: false,
    error: null,
    status: 'idle'
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        syncAuth: (state, action: PayloadAction<{token: string, role: any}>) => {
            state.token = action.payload.token;
            state.role = action.payload.role;
        },
        setToken: (state, action: PayloadAction<{token: string, role?: any} | string>) => {
            let token = typeof action.payload === 'string' ? action.payload : action.payload.token;
            let role = typeof action.payload === 'string' ? 'user' : action.payload.role || 'user';
            
            state.token = token;
            state.role = role;

            if (token) {
                AsyncStorage.setItem('token', token);
                AsyncStorage.setItem('user_role', role);
            } else {
                AsyncStorage.multiRemove(['token', 'user_role']);
            }
        },
        setUserData: (state, action: PayloadAction<UserData | null>) => {
            state.userData = action.payload;
        },
        updateAppointmentStatus: (state, action: PayloadAction<{id: string, status: boolean}>) => {
            state.appointments = state.appointments.map(app => 
                app._id === action.payload.id ? { ...app, cancelled: action.payload.status } : app
            );
        },
        logout: (state) => {
            state.token = '';
            state.userData = null;
            state.role = null;
            state.appointments = [];
            state.homeData = [];
            AsyncStorage.multiRemove(['token', 'user_role', 'atoken']);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getHomeData.fulfilled, (state, action) => {
                state.homeData = action.payload;
                state.loading = false;
            })
            .addCase(loadUserProfile.fulfilled, (state, action) => {
                state.userData = action.payload.userData;
                state.role = action.payload.role as any;
                state.status = 'succeeded';
                state.loading = false;
            })
            .addCase(loadUserProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                // تنظيف التوكن إذا كان الخطأ متعلق بالصلاحية لمنع الـ Loop
                if (state.error?.includes('Session') || state.error?.includes('token')) {
                    state.token = '';
                    AsyncStorage.removeItem('token');
                }
            })
            .addCase(getUserAppointments.fulfilled, (state, action) => {
                state.appointments = action.payload;
                state.loading = false;
            });
    }
});

export const { setToken, setUserData, logout, syncAuth, updateAppointmentStatus } = userSlice.actions;
export default userSlice.reducer;