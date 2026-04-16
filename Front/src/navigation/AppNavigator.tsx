import 'react-native-gesture-handler';
import React, { useContext } from 'react'; 
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { Platform, View, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';

// استيراد الـ Context الخاص بالطبيب لفحص حالة السداد
import { DoctorContext } from '../context/DoctorContext';

import AuthStack from './AuthStack';
import DrawerNavigator from './DrawerNavigator'; 
import DoctorStack from './DoctorStack'; 
import AdminStack from './AdminStack'; 

import MyProfileScreen from '../screens/User/MyProfileScreen'; 
import NotFoundScreen from '../screens/User/NotFoundScreen';
import AllDoctorsScreen from '../screens/User/AllDoctorsScreen'; 
import AppointmentScreen from '../screens/User/AppointmentScreen';
import MyAppointmentsScreen from '../screens/User/MyAppointmentsScreen';

/**
 * ✅ تعريف أنواع التنقل (Params) لضمان النوع (Type Safety)
 */
export type RootStackParamList = {
  AuthStack: undefined;
  MainDrawer: undefined; 
  AdminStack: undefined; 
  DoctorStack: undefined; 
  MyProfile: undefined; 
  AllDoctors: { speciality?: string };
  Appointment: { docId: string };
  MyAppointments: undefined;
  NotFound: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { token, loading, role } = useSelector((state: any) => state.user);
  
  // الوصول لبيانات الطبيب لمعرفة حالة السداد من خلال الـ Context
  const doctorCtx = useContext(DoctorContext);
  
  // منطق التحقق: إذا كانت مديونية الطبيب أكبر من صفر أو الحساب معلق
  const totalFees = doctorCtx?.dashData?.totalFeesToAwn || 0;
  const isSuspended = doctorCtx?.dashData?.isSuspended || false;
  const hasDebt = totalFees > 0 || isSuspended;

  // 📝 تسجيل حالة التنقل في الكونسول لكشف أي تعارض
  console.log("--- AppNavigator Trace ---");
  console.log("Current User Role:", role);
  console.log("Authentication Token:", !!token);
  console.log("Doctor Debt Status:", totalFees);

  /**
   * 1️⃣ مرحلة التحميل (Spinner)
   */
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050811' }}>
        <ActivityIndicator size="large" color="#00dfc4" />
      </View>
    );
  }

  return (
    <Stack.Navigator 
      // ✅ التعديل الجوهري: طالما فيه توكن، البداية دائماً من MainDrawer 
      // عشان السايد بار والناف بار يفضلوا شغالين للدكتور والأدمن والمستخدم
      initialRouteName={!token ? "AuthStack" : "MainDrawer"}
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        detachPreviousScreen: Platform.OS === 'ios' ? false : true, 
      }}
    >
      {/* 🔐 مسار المصادقة: إذا لم يوجد توكن */}
      {!token ? (
        <Stack.Screen 
          name="AuthStack" 
          component={AuthStack} 
          options={{ 
            gestureEnabled: false, 
            animationTypeForReplace: 'push' 
          }}
        />
      ) : (
        <>
          {/* ✅ المسار الرئيسي الموحد (Drawer) */}
          <Stack.Screen 
            name="MainDrawer" 
            component={DrawerNavigator} 
          />

          {/* 1. مسار الطبيب (للاستخدام عند الحاجة للتوجيه المباشر) */}
          <Stack.Screen 
            name="DoctorStack" 
            component={DoctorStack}
            listeners={{
              focus: () => console.log("Navigation Success: DoctorStack is now active")
            }}
          />

          {/* 2. مسار الأدمن (للاستخدام عند الحاجة للتوجيه المباشر) */}
          <Stack.Screen 
            name="AdminStack" 
            component={AdminStack} 
            listeners={{
              focus: () => console.log("Navigation Success: AdminStack is now active")
            }}
          />

          {/* 📁 شاشات المحتوى المشتركة */}
          <Stack.Screen name="AllDoctors" component={AllDoctorsScreen} />
          <Stack.Screen name="Appointment" component={AppointmentScreen} />
          <Stack.Screen name="MyProfile" component={MyProfileScreen} />
          <Stack.Screen name="MyAppointments" component={MyAppointmentsScreen} />
        </>
      )}

      {/* ⚠️ شاشة الخطأ العامة */}
      <Stack.Screen 
        name="NotFound" 
        component={NotFoundScreen} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;