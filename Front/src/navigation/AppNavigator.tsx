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
  
  // الوصول لبيانات الطبيب لمعرفة حالة السداد
  const doctorCtx = useContext(DoctorContext);
  const profileData = doctorCtx?.profileData;
  const fees = profileData?.fees || 0;
  const hasFees = fees > 0;

  // 📝 تسجيل حالة التنقل في الكونسول لكشف أي تعارض
  console.log("--- AppNavigator Trace ---");
  console.log("Current User Role:", role);
  console.log("Authentication Token:", !!token);
  console.log("Doctor Fees Status:", fees);

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
      // تحديد شاشة البداية بذكاء بناءً على التوكن والدور والديون
      initialRouteName={
        !token ? "AuthStack" : 
        (role === 'doctor' && hasFees) ? "DoctorStack" : "MainDrawer"
      }
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
          {/* ✅ تم دمج شاشات الـ Stacks هنا لمنع تكرار الأسماء Duplicate Screen Error */}

          {/* 1. مسار الطبيب: يتم توجيهه إليه في البداية إذا كان عليه مديونية */}
          <Stack.Screen 
            name="DoctorStack" 
            component={DoctorStack}
            listeners={{
              focus: () => console.log("Navigation Success: DoctorStack is now active")
            }}
          />

          {/* 2. مسار الأدمن */}
          <Stack.Screen 
            name="AdminStack" 
            component={AdminStack} 
            listeners={{
              focus: () => console.log("Navigation Success: AdminStack is now active")
            }}
          />

          {/* 3. المسار الرئيسي للمستخدم (Drawer) */}
          <Stack.Screen 
            name="MainDrawer" 
            component={DrawerNavigator} 
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