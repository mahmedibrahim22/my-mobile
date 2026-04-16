import 'react-native-gesture-handler';
import React, { useContext } from 'react'; 
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { Platform, View, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';

// استيراد الـ Context الخاص بالطبيب لفحص حالة السداد والمديونية
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
  // سحب حالة المستخدم من Redux
  const { token, loading, role } = useSelector((state: any) => state.user);
  
  // الوصول لبيانات الطبيب لمعرفة حالة السداد والرسوم
  const doctorCtx = useContext(DoctorContext);
  
  // منطق التحقق من المديونية (يستخدم لاحقاً لتقييد الشاشات إذا لزم الأمر)
  const totalFees = doctorCtx?.dashData?.totalFeesToAwn || 0;
  const isSuspended = doctorCtx?.dashData?.isSuspended || false;
  const hasDebt = totalFees > 0 || isSuspended;

  // 📝 تسجيل حالة الملاحة والبيانات الحالية للديتيلز
  console.log("--- 🕵️ AppNavigator Trace ---");
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
      // التحديد الذكي: لو مفيش توكن يروح للوجين، لو فيه يروح للدراور
      initialRouteName={!token ? "AuthStack" : "MainDrawer"} 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        detachPreviousScreen: Platform.OS === 'ios' ? false : true, 
      }}
      // كونسول لمتابعة تغيير المسارات وحل مشكلة الـ Type e
      screenListeners={{
        state: (e: any) => {
          try {
            if (e.data.state.routes) {
              const currentRoute = e.data.state.routes[e.data.state.index].name;
              console.log("📍 Navigation Path:", currentRoute);
            }
          } catch (err) {
            console.error("🔴 Navigation Listener Error:", err);
          }
        }
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
          {/* ✅ المسار الأساسي الموحد (Drawer) */}
          <Stack.Screen 
            name="MainDrawer" 
            component={DrawerNavigator} 
          />

          {/* 🚀 الـ Stacks كمسارات مستقلة للسماح بالتحويل المباشر */}
          <Stack.Screen 
            name="DoctorStack" 
            component={DoctorStack} 
          />
          
          <Stack.Screen 
            name="AdminStack" 
            component={AdminStack} 
          />

          {/* 📁 شاشات المحتوى المشترك */}
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