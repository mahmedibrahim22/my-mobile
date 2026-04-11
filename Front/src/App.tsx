import 'react-native-reanimated'; 
import React, { useEffect, useContext, useRef, useCallback } from 'react';
import { View, Text, LogBox, StyleSheet, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// ✅ استيراد الـ Store والـ Actions
import { store, AppDispatch, RootState } from './store';
import { syncAuth, loadUserProfile } from './store/slices/UserSlice';
import { setDoctors, setLoading as setDocLoading } from './store/slices/DoctorSlice';

// ✅ استيراد الـ Context Providers
import { AppContextProvider, AppContext } from './context/AppContext';
import { AdminContextProvider, AdminContext } from './context/AdminContext'; 
import { DoctorContextProvider } from './context/DoctorContext';

// ✅ استيراد الـ Navigation والمكونات الأساسية
import AppNavigator from './navigation/AppNavigator';
import CONFIG from './constants/Config';

// 🔥 تعطيل التحذيرات المزعجة في البيئة التطويرية
LogBox.ignoreAllLogs();
LogBox.ignoreLogs(['ViewPropTypes', 'ColorPropType', 'Drawer', 'Remote debugger']);

/**
 * 🚀 AppContent: المكون الداخلي للتعامل مع الـ Hooks والـ Navigation
 */
const AppContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // اختيار الدور من Redux لمزامنة الواجهة
  const { role } = useSelector((state: RootState) => state.user);
  
  // مرجع لمنع تكرار الـ Initialization الأساسي فقط
  const isInitialized = useRef(false);

  const context = useContext(AppContext);
  const adminCtx = useContext(AdminContext); 
  const isDarkMode = context?.isDarkMode ?? false;

  // دالة مستقلة لجلب الدكاترة لضمان إمكانية استدعائها عند تغيير الحساب
  const fetchDoctors = useCallback(async () => {
    try {
      dispatch(setDocLoading(true));
      console.log("🏥 [Data] Fetching updated doctor list...");
      
      const response = await axios.get(`${CONFIG.BACKEND_URL}/api/doctor/list`, { timeout: 5000 })
        .catch((err) => {
          console.log("⚠️ [Network] Could not fetch doctor list. Check Server IP.");
          return null;
        });
      
      if (response && response.data && response.data.success) {
        dispatch(setDoctors(response.data.doctors));
      }
    } catch (error) {
      console.error("❌ [Data] Error fetching doctors:", error);
    } finally {
      dispatch(setDocLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    const initApp = async (): Promise<void> => {
      try {
        console.log("🔄 [System] App Sync Started...");
        
        const tokenKey = CONFIG.HEADERS.USER_TOKEN || 'token';
        
        // جلب البيانات المخزنة
        const [storedToken, storedRole, storedAToken] = await Promise.all([
          AsyncStorage.getItem(tokenKey),
          AsyncStorage.getItem('user_role'),
          AsyncStorage.getItem('atoken')
        ]);

        // 1️⃣ مزامنة حالة تسجيل الدخول (Redux)
        if (storedToken && !isInitialized.current) {
          console.log("👤 [Auth] Token found, syncing state...");
          dispatch(syncAuth({ token: storedToken, role: storedRole ?? 'user' }));
          dispatch(loadUserProfile());
        }

        // 2️⃣ إعداد سياق الإدارة (Admin Context)
        if (storedRole === 'admin' && storedAToken && adminCtx) {
          adminCtx.setAToken(storedAToken);
        }

        // 3️⃣ جلب قائمة الدكاترة (يتم استدعاؤها دائماً عند تغير الـ role لضمان تحديث المواعيد)
        await fetchDoctors();

        isInitialized.current = true; 
      } catch (error) {
        console.error("❌ [System] Startup Error:", error);
      }
    };

    initApp();
  }, [dispatch, adminCtx, role, fetchDoctors]); // إضافة role هنا هي مفتاح حل مشكلة "تحديث المواعيد عند تبديل الحساب"

  const navigationTheme = isDarkMode ? DarkTheme : DefaultTheme;
  const isAdminActive = !!(adminCtx?.aToken && role === 'admin');

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar 
        style={isDarkMode ? "light" : "dark"} 
        backgroundColor={isDarkMode ? "#060b18" : "#f8fafc"} 
        translucent={true} 
      />

      <View style={[
        styles.statusIndicator, 
        isDarkMode ? styles.darkStatusIndicator : styles.lightStatusIndicator
      ]}>
        <Text style={[styles.statusText, isDarkMode ? styles.darkText : styles.lightText]}>
          AWN SYSTEM: {isAdminActive ? "ADMIN ACTIVE ✅" : "USER MODE 👤"}
        </Text>
      </View>

      <AppNavigator />
    </NavigationContainer>
  );
};

/**
 * 🏠 Root App Component
 */
export default function App(): React.ReactElement {
  return (
    <GestureHandlerRootView style={styles.rootView}>
      <Provider store={store}>
        <SafeAreaProvider>
          {/* الترتيب الصحيح للـ Providers لضمان وصول البيانات لـ AppContent */}
          <DoctorContextProvider>
            <AppContextProvider>
              <AdminContextProvider> 
                  <AppContent />
              </AdminContextProvider>
            </AppContextProvider>
          </DoctorContextProvider>
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  rootView: { 
    flex: 1 
  },
  statusIndicator: { 
    height: Platform.OS === 'ios' ? 44 : 35, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingTop: Platform.OS === 'ios' ? 0 : 8,
    zIndex: 100,
  },
  lightStatusIndicator: { 
    backgroundColor: '#f8fafc', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e2e8f0' 
  },
  darkStatusIndicator: { 
    backgroundColor: '#060b18', 
    borderBottomWidth: 1, 
    borderBottomColor: '#1e293b' 
  },
  statusText: { 
    fontSize: 9, 
    fontWeight: 'bold', 
    letterSpacing: 1.2, 
    textTransform: 'uppercase' 
  },
  lightText: { 
    color: '#64748b' 
  },
  darkText: { 
    color: '#94a3b8' 
  },
});