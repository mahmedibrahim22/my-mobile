import React, { useEffect, useCallback, useContext, useRef, useState } from "react";
import { 
  View, 
  StyleSheet, 
  StatusBar,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; 
import { useDispatch } from "react-redux";

// ✅ استخدام المكونات من gesture-handler لضمان استجابة اللمس السريعة
import { ScrollView, RefreshControl } from "react-native-gesture-handler";

import { setDoctors, setLoading } from "../../store/slices/DoctorSlice";
import { AppContext } from "../../context/AppContext"; 
import { AdminContext } from "../../context/AdminContext"; 
import axiosInstance from "../../api/axiosInstance";

import Banner from "../../components/Home/Banner"; 
import SpecialityMenu from "../../components/Home/SpecialityMenu";
import TopDoctors from "../../components/Home/TopDoctors";
import Footer from "../../components/Layout/Footer";

/**
 * 🏠 HomeScreen: الشاشة الرئيسية للنظام
 * تم حل مشكلة تكرار المسار (Double /api)
 */
const HomeScreen: React.FC = () => {
  const dispatch = useDispatch();
  
  const scrollRef = useRef<ScrollView>(null);
  const lastActionTime = useRef<number>(0);

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const context = useContext(AppContext);
  const adminCtx = useContext(AdminContext); 
  
  const isDarkMode = context?.isDarkMode ?? false;
  const token = context?.token;
  const userRole = context?.userRole; 
  const loadUserProfileData = context?.loadUserProfileData;

  /**
   * 🔄 دالة جلب بيانات الأطباء
   * ✅ تم الإصلاح: حذف /api/ لأن الـ axiosInstance يضيفها تلقائياً
   */
  const getDoctorsData = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      // تم تغيير المسار من /api/doctor/list إلى doctor/list
      const { data } = await axiosInstance.get(`doctor/list`);
      
      if (data && data.success) {
        dispatch(setDoctors(data.doctors));
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error("❌ Home Fetch Error:", error.message);
      }
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  /**
   * 🛡️ وظيفة تأمين الحالة وجلب البيانات
   */
  useEffect(() => {
    if (token && userRole === 'user') {
        if (adminCtx?.aToken) {
            adminCtx.setAToken(""); 
        }
        if (loadUserProfileData) {
            console.log("🚀 [Home] Fetching User Profile...");
            loadUserProfileData();
        }
    }
    
    getDoctorsData();

  }, [token, userRole, adminCtx, getDoctorsData, loadUserProfileData]); 

  const scrollToTop = useCallback(() => {
    const now = Date.now();
    if (now - lastActionTime.current < 1000) return; 
    lastActionTime.current = now;
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        getDoctorsData(),
        loadUserProfileData ? loadUserProfileData() : Promise.resolve()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [getDoctorsData, loadUserProfileData]);

  const statusBarStyle = isDarkMode ? "light-content" : "dark-content";
  const statusBarColor = isDarkMode ? "#060b18" : "#f8fafc";

  return (
    <SafeAreaView style={[styles.container, isDarkMode ? styles.darkBg : styles.lightBg]}>
      <StatusBar 
        barStyle={statusBarStyle} 
        backgroundColor={statusBarColor} 
        translucent={Platform.OS === 'android'}
      />

      <ScrollView 
        ref={scrollRef} 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16} 
        removeClippedSubviews={Platform.OS === 'android'} 
        keyboardShouldPersistTaps="handled" 
        contentContainerStyle={styles.scrollContent} 
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing}
            onRefresh={onRefresh} 
            tintColor={isDarkMode ? "#ffffff" : "#0d9488"} 
            colors={["#0d9488"]} 
            progressBackgroundColor={isDarkMode ? "#1f2937" : "#ffffff"}
          />
        }
      >
        <View style={styles.sectionFrame}>
            <Banner />
        </View>
        
        <View style={styles.componentsContainer}>
          <View style={styles.sectionFrame}>
              <SpecialityMenu />
          </View>
          
          <View style={styles.sectionFrame}>
              <TopDoctors />
          </View>
          
          <Footer onLogoPress={scrollToTop} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  lightBg: { backgroundColor: '#f8fafc' },
  darkBg: { backgroundColor: '#060b18' },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  componentsContainer: { marginTop: 10, width: '100%', gap: 25 },
  sectionFrame: { width: '100%' }
});

export default HomeScreen;