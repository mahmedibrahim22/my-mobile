import React, { createContext, useState, ReactNode, useEffect, useCallback } from "react";
import axios from "axios";
import { Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from "../constants/Config"; 

// 1. تعريف الـ Types لضمان استقرار التطبيق
interface DoctorContextType {
    dToken: string;
    setDToken: (token: string) => void;
    backendUrl: string;
    appointments: any[];
    setAppointments: (data: any[]) => void;
    getAppointments: (token?: string) => Promise<void>;
    dashData: any;
    setDashData: (data: any) => void;
    getDashData: (token?: string) => Promise<void>;
    profileData: any;
    setProfileData: (data: any) => void;
    getProfileData: (token?: string) => Promise<void>;
    completeAppointment: (appointmentId: string) => Promise<void>;
    cancelAppointment: (appointmentId: string) => Promise<void>;
    changeAvailability: () => Promise<void>;
    // ✅ تحديث الـ Signature لتستقبل 4 معاملات
    updateSlots: (slots: any, duration: number, breakTime: number, extraData: any) => Promise<boolean>; 
    logout: () => void;
}

export const DoctorContext = createContext<DoctorContextType | null>(null);

export const DoctorContextProvider = ({ children }: { children: ReactNode }) => {
    
    const backendUrl = CONFIG.BACKEND_URL; 
    
    const [dToken, setDToken] = useState<string>("");
    const [appointments, setAppointments] = useState<any[]>([]);
    const [dashData, setDashData] = useState<any>(false);
    const [profileData, setProfileData] = useState<any>(null);

    // 🛠 دالة الـ Headers الموحدة لجلب التوكن بشكل ديناميكي
    const getHeaders = useCallback((tokenOverride?: string) => ({ 
        headers: { 
            [CONFIG.HEADERS?.DOCTOR_TOKEN || 'dtoken']: tokenOverride || dToken 
        } 
    }), [dToken]);

    // ================= 🩺 العمليات الخاصة بالطبيب (Logic) =================

    // جلب بيانات البروفايل
    const getProfileData = useCallback(async (token?: string) => {
        const currentToken = token || dToken;
        if (!currentToken) return;
        try {
            const { data } = await axios.get(`${backendUrl}${CONFIG.API_PREFIX}/doctor/profile`, getHeaders(currentToken));
            if (data.success) {
                setProfileData(data.profileData);
            }
        } catch (error: any) {
            console.log("❌ GetProfile Error:", error.response?.data?.message || error.message);
        }
    }, [backendUrl, dToken, getHeaders]);

    // جلب بيانات الإحصائيات (Dashboard)
    const getDashData = useCallback(async (token?: string) => {
        const currentToken = token || dToken;
        if (!currentToken) return;
        try {
            const { data } = await axios.get(`${backendUrl}${CONFIG.API_PREFIX}/doctor/dashboard`, getHeaders(currentToken));
            if (data.success) {
                setDashData(data.dashData);
            }
        } catch (error: any) {
            console.log("❌ GetDash Error:", error.response?.data?.message || error.message);
        }
    }, [backendUrl, dToken, getHeaders]);

    // جلب المواعيد
    const getAppointments = useCallback(async (token?: string) => {
        const currentToken = token || dToken;
        if (!currentToken) return;
        try {
            const { data } = await axios.get(`${backendUrl}${CONFIG.API_PREFIX}/doctor/appointments`, getHeaders(currentToken));
            if (data.success) {
                setAppointments(data.appointments.reverse());
            }
        } catch (error: any) {
            console.log("❌ GetAppointments Error:", error.response?.data?.message || error.message);
        }
    }, [backendUrl, dToken, getHeaders]);

    // 🔄 تحميل التوكن والبيانات فور فتح التطبيق
    useEffect(() => {
        const initDoctor = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('dtoken');
                const userRole = await AsyncStorage.getItem('user_role');
                
                if (storedToken && userRole === 'doctor') {
                    setDToken(storedToken);
                    await Promise.all([
                        getProfileData(storedToken),
                        getDashData(storedToken),
                        getAppointments(storedToken)
                    ]);
                }
            } catch (err) {
                console.log("❌ Error initializing doctor context:", err);
            }
        };
        initDoctor();
    }, [getProfileData, getDashData, getAppointments]);

    // 🔑 تحديث التوكن عند تسجيل الدخول
    const updateToken = async (token: string) => {
        try {
            if (token) {
                setDToken(token);
                await AsyncStorage.setItem('dtoken', token);
                await AsyncStorage.setItem('user_role', 'doctor');
                getProfileData(token);
                getDashData(token);
                getAppointments(token);
            } else {
                setDToken('');
                await AsyncStorage.removeItem('dtoken');
                await AsyncStorage.removeItem('user_role');
            }
        } catch (err) {
            console.log("❌ Token update error:", err);
        }
    };

    // إتمام موعد
    const completeAppointment = async (appointmentId: string) => {
        try {
            const { data } = await axios.post(`${backendUrl}${CONFIG.API_PREFIX}/doctor/complete-appointment`, { appointmentId }, getHeaders());
            if (data.success) {
                Alert.alert("تم بنجاح", data.message);
                getDashData();
                getAppointments(); 
            } else {
                Alert.alert("تنبيه", data.message);
            }
        } catch (error: any) {
            Alert.alert("خطأ", error.response?.data?.message || "فشل في تحديث حالة الموعد");
        }
    };

    // إلغاء موعد
    const cancelAppointment = async (appointmentId: string) => {
        try {
            const { data } = await axios.post(`${backendUrl}${CONFIG.API_PREFIX}/doctor/cancel-appointment`, { appointmentId }, getHeaders());
            if (data.success) {
                Alert.alert("تم الإلغاء", data.message);
                getDashData();
                getAppointments();
            } else {
                Alert.alert("تنبيه", data.message);
            }
        } catch (error: any) {
            Alert.alert("خطأ", error.response?.data?.message || "فشل في إلغاء الموعد");
        }
    };

    // تغيير حالة التوفر
    const changeAvailability = async () => {
        try {
            const { data } = await axios.post(`${backendUrl}${CONFIG.API_PREFIX}/doctor/change-availability`, {}, getHeaders());
            if (data.success) {
                Alert.alert("تحديث الحالة", data.message);
                getProfileData(); 
            }
        } catch (err: any) {
            console.log("❌ ChangeAvailability Error:", err.message);
            Alert.alert("خطأ", "فشل في تغيير حالة التوفر");
        }
    };

    // ✅ دالة تحديث جدول المواعيد - ترسل كافة البيانات المجمعة من واجهة الإعدادات
    const updateSlots = async (slots: any, duration: number, breakTime: number, extraData: any) => {
        try {
            const { data } = await axios.post(
                `${backendUrl}${CONFIG.API_PREFIX}/doctor/update-slots`, 
                { 
                    slots, 
                    duration, 
                    breakTime, 
                    offDays: extraData.offDays,
                    breakStart: extraData.breakStart,
                    startTime: extraData.startTime,
                    endTime: extraData.endTime
                }, 
                getHeaders()
            );
            
            if (data.success) {
                Alert.alert("نجاح", "تم حفظ جدول المواعيد وإعدادات الوقت بنجاح ✅");
                await getProfileData(); 
                return true;
            } else {
                Alert.alert("فشل", data.message);
                return false;
            }
        } catch (error: any) {
            console.log("❌ UpdateSlots Error:", error.response?.data?.message || error.message);
            Alert.alert("خطأ", error.response?.data?.message || "فشل في تحديث الجدول");
            return false;
        }
    };

    // 🚪 تسجيل الخروج
    const logout = async () => {
        try {
            setDToken('');
            setAppointments([]);
            setDashData(false);
            setProfileData(null);
            await AsyncStorage.multiRemove(['dtoken', 'user_role']);
            Alert.alert("عَوْن", "تم تسجيل الخروج بنجاح");
        } catch (err) {
            console.log("Logout error:", err);
        }
    };

    // 📦 القيم المشاركة عبر الـ Context
    const value: DoctorContextType = {
        dToken, 
        setDToken: updateToken, 
        backendUrl,
        getAppointments, 
        appointments, 
        setAppointments,
        getDashData, 
        dashData, 
        setDashData,
        completeAppointment, 
        cancelAppointment,
        profileData, 
        setProfileData, 
        getProfileData,
        changeAvailability, 
        updateSlots, 
        logout
    };

    return (
        <DoctorContext.Provider value={value}>
            {children}
        </DoctorContext.Provider>
    );
};

export default DoctorContextProvider;