import React, {
    createContext,
    useEffect,
    useState,
    ReactNode,
    useCallback,
    useMemo,
    useRef
} from "react";
import { useColorScheme, Appearance } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from "../api/axiosInstance";
import CONFIG from "../constants/Config";
import { Doctor } from "../types/doctor"; // استيراد التعريفات الجديدة

// --- الواجهات (Interfaces) ---

interface UserData {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
    image?: string;
    gender?: string;
    dob?: string;
    role?: 'user' | 'doctor' | 'admin';
    address?: {
        line1?: string;
        line2?: string;
    };
}

interface AppContextType {
    doctors: Doctor[]; // استخدام نوع Doctor المحدث
    getDoctorsData: () => Promise<void>;
    userData: UserData | null;
    setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
    loadUserProfileData: () => Promise<void>;
    currency: string;
    backendUrl: string;
    token: string;
    setToken: (token: string) => Promise<void>;
    userRole: string | null;
    setUserRole: (role: string | null) => Promise<void>;
    calculateAge: (dob: string) => number;
    isDarkMode: boolean;
    setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
    toggleTheme: () => void;
    logout: () => Promise<void>;
    isLoading: boolean;
}

// --- إنشاء السياق (Context) ---

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
    const backendUrl = CONFIG.BACKEND_URL;
    const currency = 'EGP';
    const systemColorScheme = useColorScheme();

    // --- الحالات (States) ---
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [token, setTokenState] = useState<string>("");
    const [userRole, setUserRoleState] = useState<string | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(systemColorScheme === 'dark');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const isFetchingProfile = useRef(false);

    /**
     * 🩺 جلب قائمة الأطباء (محدثة لدعم منطق الإتاحة الجديد)
     */
    const getDoctorsData = useCallback(async () => {
        try {
            const { data } = await axiosInstance.get(`/doctor/list`);
            if (data?.success) {
                // الباك إند الآن يرسل حقل isAvailableNow محسوباً لكل طبيب
                setDoctors(data.doctors);
            }
        } catch (error: any) {
            console.error("❌ Doctors List Error:", error.message);
        }
    }, []);

    /**
     * 🚪 تسجيل الخروج وتنظيف كافة البيانات
     */
    const logout = useCallback(async () => {
        setTokenState("");
        setUserData(null);
        setUserRoleState(null);
        const tokenKey = CONFIG.HEADERS.USER_TOKEN || 'token';
        try {
            await AsyncStorage.multiRemove([tokenKey, 'atoken', 'dtoken', 'user_role']);
        } catch (e) {
            console.error("❌ Logout Storage Error:", e);
        }
    }, []);

    /**
     * 👤 جلب بيانات البروفايل
     */
    const loadUserProfileData = useCallback(async () => {
        if (!token || isFetchingProfile.current) return;

        isFetchingProfile.current = true;
        try {
            const { data } = await axiosInstance.get('/user/get-profile');
            if (data?.success && data?.userData) {
                setUserData(data.userData);
                
                const roleFromApi = data.userData.role || 'user';
                if (roleFromApi !== userRole) {
                    setUserRoleState(roleFromApi);
                    await AsyncStorage.setItem('user_role', roleFromApi);
                }
            }
        } catch (error: any) {
            console.error("❌ Profile Load Error:", error.message);
            if (error.response?.status === 401) {
                await logout();
            }
        } finally {
            isFetchingProfile.current = false;
        }
    }, [token, userRole, logout]);

    /**
     * 🌓 تبديل الثيم (Dark/Light)
     */
    const toggleTheme = useCallback(() => {
        setIsDarkMode(prev => {
            const nextTheme = !prev;
            AsyncStorage.setItem('user_theme', nextTheme ? 'dark' : 'light').catch(() => {});
            return nextTheme;
        });
    }, []);

    /**
     * 🔑 حفظ التوكن
     */
    const saveToken = useCallback(async (newToken: string) => {
        setTokenState(newToken);
        const tokenKey = CONFIG.HEADERS.USER_TOKEN || 'token';
        try {
            if (newToken) {
                await AsyncStorage.setItem(tokenKey, newToken);
                isFetchingProfile.current = false; 
            } else {
                await logout();
            }
        } catch (e) {
            console.error("❌ Save Token Error:", e);
        }
    }, [logout]);

    /**
     * 🎖️ حفظ نوع المستخدم (Role)
     */
    const saveRole = useCallback(async (role: string | null) => {
        setUserRoleState(role);
        try {
            if (role) {
                await AsyncStorage.setItem('user_role', role);
            } else {
                await AsyncStorage.removeItem('user_role');
            }
        } catch (e) {
            console.error("❌ Save Role Error:", e);
        }
    }, []);

    /**
     * ⚙️ تهيئة التطبيق عند الفتح
     */
    useEffect(() => {
        const init = async () => {
            try {
                const tokenKey = CONFIG.HEADERS.USER_TOKEN || 'token';
                const [storedToken, storedTheme, storedRole] = await Promise.all([
                    AsyncStorage.getItem(tokenKey),
                    AsyncStorage.getItem('user_theme'),
                    AsyncStorage.getItem('user_role')
                ]);

                if (storedToken) setTokenState(storedToken);
                if (storedRole) setUserRoleState(storedRole);

                if (storedTheme !== null) {
                    setIsDarkMode(storedTheme === 'dark');
                } else {
                    setIsDarkMode(Appearance.getColorScheme() === 'dark');
                }
            } catch (e) {
                console.error("❌ Init Error:", e);
            } finally {
                setIsLoading(false);
            }
        };
        init();
        getDoctorsData();
    }, [getDoctorsData]);

    /**
     * 📱 مراقبة ثيم النظام
     */
    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            AsyncStorage.getItem('user_theme').then((storedTheme) => {
                if (!storedTheme) {
                    setIsDarkMode(colorScheme === 'dark');
                }
            });
        });
        return () => subscription.remove();
    }, []);

    /**
     * 🔄 تحديث البروفايل تلقائياً
     */
    useEffect(() => {
        if (token && !userData && !isLoading) {
            loadUserProfileData();
        }
    }, [token, userData, isLoading, loadUserProfileData]);

    /**
     * 🎂 حساب العمر
     */
    const calculateAge = useCallback((dob: string): number => {
        if (!dob) return 0;
        try {
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        } catch { return 0; }
    }, []);

    // --- تجميع القيم الممررة للمزود ---
    const value = useMemo(() => ({
        doctors,
        getDoctorsData,
        userData,
        setUserData,
        loadUserProfileData,
        currency,
        backendUrl,
        token,
        setToken: saveToken,
        userRole,
        setUserRole: saveRole,
        calculateAge,
        isDarkMode,
        setIsDarkMode,
        toggleTheme,
        logout,
        isLoading
    }), [
        doctors, getDoctorsData, userData, loadUserProfileData, currency, 
        backendUrl, token, saveToken, userRole, saveRole, calculateAge, 
        isDarkMode, toggleTheme, logout, isLoading
    ]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export default AppContextProvider;