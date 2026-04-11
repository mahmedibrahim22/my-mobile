import 'react-native-gesture-handler';
import React from 'react'; 
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { Platform, View, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';

import AuthStack from './AuthStack';
import DrawerNavigator from './DrawerNavigator'; 
import DoctorStack from './DoctorStack'; // استيراد ستاك الطبيب
import AdminStack from './AdminStack';   // استيراد ستاك المسؤول

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
  // سحب التوكن والدور من Redux للحكم على المسار الصحيح
  const { token, loading } = useSelector((state: any) => state.user);

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
      // التحديد الذكي: لو مفيش توكن يروح للوجين، لو فيه يروح للدراور أياً كان دوره
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
          {/* ✅ المسار الأساسي بعد تسجيل الدخول */}
          <Stack.Screen 
            name="MainDrawer" 
            component={DrawerNavigator} 
          />

          {/* 🚀 إضافة الـ Stacks كمسارات مستقلة للسماح بالـ Navigation.replace */}
          <Stack.Screen 
            name="DoctorStack" 
            component={DoctorStack} 
          />
          
          <Stack.Screen 
            name="AdminStack" 
            component={AdminStack} 
          />

          {/* 📁 شاشات المحتوى المشتركة أو التابعة للمستخدم */}
          <Stack.Screen name="AllDoctors" component={AllDoctorsScreen} />
          <Stack.Screen name="Appointment" component={AppointmentScreen} />
          <Stack.Screen name="MyProfile" component={MyProfileScreen} />
          <Stack.Screen name="MyAppointments" component={MyAppointmentsScreen} />
        </>
      )}

      {/* ⚠️ شاشة الخطأ العامة */}
      <Stack.Screen name="NotFound" component={NotFoundScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;