import React, { createContext, useState, ReactNode, useEffect, useCallback, useRef } from "react";
import { Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ استيراد الـ axiosInstance الموحد
import axiosInstance from "../api/axiosInstance";
import CONFIG from "../constants/Config";
import { Doctor, Appointment, DashData } from "../types/api";

interface AdminContextType {
    aToken: string;
    setAToken: (token: string) => void;
    dToken: string; 
    setDToken: (token: string) => void; 
    doctors: Doctor[];
    getAllDoctors: (token?: string) => Promise<void>;
    changeAvailability: (docId: string) => Promise<void>;
    deleteDoctor: (docId: string) => Promise<void>;
    getDoctorData: (docId: string) => Promise<Doctor | undefined>;
    updateDoctor: (formData: FormData) => Promise<boolean>;
    appointments: Appointment[];
    getAllAppointments: (token?: string) => Promise<void>;
    cancelAppointment: (appointmentId: string) => Promise<void>;
    deleteAppointments: (appointmentIds: string[]) => Promise<boolean>;
    dashData: DashData | null;
    getDashData: (token?: string) => Promise<void>;
    pharmaciesData: any[]; 
    setPharmaciesData: (data: any[]) => void;
    getAllPharmacies: (token?: string) => Promise<void>; 
    deletePharmacy: (id: string) => Promise<void>;
    deliveryData: any[];
    setDeliveryData: (data: any[]) => void;
    getAllDelivery: (token?: string) => Promise<void>;
    changeDeliveryAvailability: (deliveryId: string) => Promise<void>;
    labsData: any[];
    getAllLabs: (token?: string) => Promise<void>;
    deleteLab: (labId: string) => Promise<void>;
    adminLogout: () => void;
}

export const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminContextProvider = ({ children }: { children: ReactNode }) => {
    
    const isInitializing = useRef(false);
    const [aToken, setATokenState] = useState<string>("");
    const [dToken, setDToken] = useState<string>("");
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [dashData, setDashData] = useState<DashData | null>(null);
    const [pharmaciesData, setPharmaciesData] = useState<any[]>([]);
    const [labsData, setLabsData] = useState<any[]>([]);
    const [deliveryData, setDeliveryData] = useState<any[]>([]);

    const setAToken = useCallback((token: string) => {
        setATokenState(token);
        if (!token) {
            setDashData(null); setDoctors([]); setAppointments([]);
            setPharmaciesData([]); setDeliveryData([]); setLabsData([]);
        }
    }, []);

    const getAdminHeaders = useCallback((tokenOverride?: string) => {
        const tokenToUse = tokenOverride || aToken;
        const headerKey = CONFIG.HEADERS?.ADMIN_TOKEN || 'atoken';
        return {
            headers: { [headerKey]: tokenToUse }
        };
    }, [aToken]);

    // ✅ تم تصحيح جميع المسارات لتعمل مع axiosInstance (baseURL/api)
    
    const getDashData = useCallback(async (token?: string) => {
        const currentToken = token || aToken;
        if (!currentToken) return;
        try {
            const { data } = await axiosInstance.get('admin/dashboard', getAdminHeaders(currentToken));
            if (data.success) setDashData(data.dashData || null);
        } catch (err) { console.log("📊 Dash Data failed"); }
    }, [aToken, getAdminHeaders]);

    const getAllDoctors = useCallback(async (token?: string) => {
        const currentToken = token || aToken;
        if (!currentToken) return;
        try {
            const { data } = await axiosInstance.get('admin/all-doctors', getAdminHeaders(currentToken));
            if (data.success) setDoctors(data.doctors || []);
        } catch { console.log("🩺 Doctors failed"); }
    }, [aToken, getAdminHeaders]);

    const getAllAppointments = useCallback(async (token?: string) => {
        const currentToken = token || aToken;
        if (!currentToken) return;
        try {
            // ✅ المسار الآن "admin/appointments" وسيقوم axiosInstance بإضافة "api/" مرة واحدة فقط
            const { data } = await axiosInstance.get('admin/appointments', getAdminHeaders(currentToken));
            if (data.success) setAppointments(data.appointments || []);
        } catch { console.log("📅 Appointments failed"); }
    }, [aToken, getAdminHeaders]);

    const getAllDelivery = useCallback(async (token?: string) => {
        const currentToken = token || aToken;
        if (!currentToken) return; 
        try {
            const { data } = await axiosInstance.get('admin/all-delivery', getAdminHeaders(currentToken));
            if (data.success) setDeliveryData(data.delivery || []);
        } catch { console.log("🚚 Delivery failed"); }
    }, [aToken, getAdminHeaders]);

    const getAllPharmacies = useCallback(async (token?: string) => {
        const currentToken = token || aToken;
        if (!currentToken) return; 
        try {
            const { data } = await axiosInstance.get('admin/all-pharmacies', getAdminHeaders(currentToken));
            if (data.success) setPharmaciesData(data.pharmacies || []);
        } catch { console.log("💊 Pharmacy failed"); }
    }, [aToken, getAdminHeaders]);

    const getAllLabs = useCallback(async (token?: string) => {
        const currentToken = token || aToken;
        if (!currentToken) return;
        try {
            const { data } = await axiosInstance.get('admin/all-labs', getAdminHeaders(currentToken));
            if (data.success) setLabsData(data.labs || []);
        } catch { setLabsData([]); }
    }, [aToken, getAdminHeaders]);

    const getDoctorData = async (docId: string) => {
        try {
            const { data } = await axiosInstance.post('admin/get-doctor-info', { docId }, getAdminHeaders());
            return data.success ? data.docData : undefined;
        } catch { return undefined; }
    };

    const updateDoctor = async (formData: FormData) => {
        try {
            const { data } = await axiosInstance.post('admin/update-doctor', formData, {
                headers: { ...getAdminHeaders().headers, 'Content-Type': 'multipart/form-data' }
            });
            if (data.success) { 
                await getAllDoctors(); 
                await getDashData(); 
                return true; 
            }
            return false;
        } catch { return false; }
    };

    const changeAvailability = async (docId: string) => {
        try {
            const { data } = await axiosInstance.post('admin/change-availability', { docId }, getAdminHeaders());
            if (data.success) { getAllDoctors(); getDashData(); }
        } catch { console.log("Error availability"); }
    };

    const deleteDoctor = async (docId: string) => {
        Alert.alert("تأكيد", "حذف الطبيب؟", [
            { text: "إلغاء" },
            { text: "حذف", onPress: async () => {
                const { data } = await axiosInstance.post('admin/delete-doctor', { docId }, getAdminHeaders());
                if (data.success) { getAllDoctors(); getDashData(); }
            }}
        ]);
    };

    const cancelAppointment = async (id: string) => {
        try {
            const { data } = await axiosInstance.post('admin/cancel-appointment', { appointmentId: id }, getAdminHeaders());
            if (data.success) { getAllAppointments(); getDashData(); }
        } catch { console.log("Error cancelling"); }
    };

    const deleteAppointments = async (ids: string[]) => {
        try {
            const { data } = await axiosInstance.post('admin/delete-appointments', { appointmentIds: ids }, getAdminHeaders());
            if (data.success) { getAllAppointments(); getDashData(); return true; }
            return false;
        } catch { return false; }
    };

    const deletePharmacy = async (id: string) => {
        try {
            const { data } = await axiosInstance.post('admin/delete-pharmacy', { id }, getAdminHeaders());
            if (data.success) getAllPharmacies();
        } catch { console.log("Error pharmacy"); }
    };

    const deleteLab = async (labId: string) => {
        try {
            const { data } = await axiosInstance.post('admin/delete-lab', { labId }, getAdminHeaders());
            if (data.success) getAllLabs();
        } catch { console.log("Error lab"); }
    };

    const changeDeliveryAvailability = async (deliveryId: string) => {
        try {
            const { data } = await axiosInstance.post('admin/change-delivery-availability', { deliveryId }, getAdminHeaders());
            if (data.success) getAllDelivery();
        } catch { console.log("Error delivery"); }
    };

    useEffect(() => {
        const initSystem = async () => {
            if (isInitializing.current) return;
            isInitializing.current = true;
            try {
                const storedRole = await AsyncStorage.getItem("user_role");
                if (storedRole !== "admin") {
                    setATokenState(""); isInitializing.current = false; return;
                }
                const storedAToken = await AsyncStorage.getItem("atoken");
                if (storedAToken) {
                    setATokenState(storedAToken);
                    // تحميل متوازي للبيانات عند البداية
                    await Promise.all([
                        getDashData(storedAToken),
                        getAllDoctors(storedAToken),
                        getAllAppointments(storedAToken),
                        getAllPharmacies(storedAToken),
                        getAllDelivery(storedAToken),
                        getAllLabs(storedAToken)
                    ]);
                    console.log("✅ [Admin] System Initialized Successfully");
                }
            } catch (e) {
                console.error("❌ Global Init Error:", e);
            } finally {
                isInitializing.current = false;
            }
        };
        initSystem();
    }, [getDashData, getAllDoctors, getAllAppointments, getAllPharmacies, getAllLabs, getAllDelivery]);

    const adminLogout = async () => {
        setATokenState(""); setDToken(""); setDoctors([]); setAppointments([]); setDashData(null);
        setPharmaciesData([]); setLabsData([]); setDeliveryData([]);
        await AsyncStorage.multiRemove(["atoken", "dtoken", "user_role"]);
        Alert.alert("خروج", "تم تسجيل الخروج");
    };

    const value = {
        aToken, setAToken, dToken, setDToken,
        doctors, getAllDoctors, changeAvailability, deleteDoctor, getDoctorData, updateDoctor,
        appointments, getAllAppointments, cancelAppointment, deleteAppointments,
        dashData, getDashData,
        pharmaciesData, setPharmaciesData, getAllPharmacies, deletePharmacy,
        deliveryData, setDeliveryData, getAllDelivery, changeDeliveryAvailability,
        labsData, getAllLabs, deleteLab, adminLogout
    };

    return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export default AdminContextProvider;