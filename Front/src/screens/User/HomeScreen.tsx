import React, { useEffect, useCallback, useContext, useRef, useState } from "react";
import { 
  View, 
  StyleSheet, 
  StatusBar,
  Platform,
  Text,
  TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; 
import { useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { MotiView, AnimatePresence } from "moti";
import { Ionicons } from "@expo/vector-icons";

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
 * تم إضافة إشعار نجاح الحجز (Banner) لمدة 5 ثوانٍ
 */
const HomeScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  
  const scrollRef = useRef<ScrollView>(null);
  const lastActionTime = useRef<number>(0);

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const context = useContext(AppContext) as any;
  const adminCtx = useContext(AdminContext); 
  
  const isDarkMode = context?.isDarkMode ?? false;
  const token = context?.token;
  const userRole = context?.userRole; 
  const loadUserProfileData = context?.loadUserProfileData;

  // استخراج حالة الحجز من الـ Context
  const bookingSuccess = context?.bookingSuccess;
  const setBookingSuccess = context?.setBookingSuccess;

  /**
   * ⏳ إخفاء الإشعار تلقائياً بعد 5 ثوانٍ
   */
  useEffect(() => {
    if (bookingSuccess) {
      const timer = setTimeout(() => {
        if (setBookingSuccess) setBookingSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [bookingSuccess, setBookingSuccess]);

  /**
   * 🔄 دالة جلب بيانات الأطباء
   */
  const getDoctorsData = useCallback(async () => {
    try {
      dispatch(setLoading(true));
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

      {/* ✅ إشعار نجاح الحجز العلوي */}
      <AnimatePresence>
        {bookingSuccess && (
          <MotiView
            from={{ translateY: -100, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: -100, opacity: 0 }}
            style={[styles.successBanner, { backgroundColor: isDarkMode ? '#2dd4bf' : '#0d9488' }]}
          >
            <View style={styles.bannerRow}>
              <Ionicons name="checkmark-circle" size={22} color="#0F172A" />
              <Text style={styles.bannerText}>تم حجز ميعادك بنجاح!</Text>
            </View>
            <TouchableOpacity 
              onPress={() => {
                if (setBookingSuccess) setBookingSuccess(false);
                navigation.navigate('MyAppointments');
              }}
            >
              <Text style={styles.clickHere}>لعرض مواعيدك اضغط هنا</Text>
            </TouchableOpacity>
          </MotiView>
        )}
      </AnimatePresence>

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
  sectionFrame: { width: '100%' },
  
  // استايلات الإشعار
  successBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 10,
    left: 15,
    right: 15,
    zIndex: 999,
    padding: 15,
    borderRadius: 20,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  bannerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  bannerText: { color: '#0F172A', fontWeight: '800', fontSize: 14 },
  clickHere: { color: '#0F172A', fontWeight: 'bold', fontSize: 12, textDecorationLine: 'underline' }
});

export default HomeScreen;