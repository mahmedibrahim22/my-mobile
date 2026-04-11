import React from 'react';
import { Platform } from 'react-native'; 
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';

// ✅ استيراد الشاشات بناءً على هيكل "عون موبايل" الجديد
import DoctorDashboardScreen from '../screens/Admin-and-Doctors/Doctor/DoctorDashboardScreen';
import AppointmentsScreen from '../screens/Admin-and-Doctors/Doctor/AppointmentsScreen';
import DoctorProfileScreen from '../screens/Admin-and-Doctors/Doctor/DoctorProfileScreen';
import ManageSlotsScreen from '../screens/Admin-and-Doctors/Doctor/ManageSlotsScreen';
import MyScheduleScreen from '../screens/Admin-and-Doctors/Doctor/MyScheduleScreen'; // استيراد شاشة الجدول الجديدة

/**
 * ✅ تعريف أنواع التنقل الخاصة بالطبيب
 * تم إضافة MySchedule لتتوافق مع العرض المباشر للجدول
 */
export type DoctorStackParamList = {
  DoctorDashRoot: undefined; 
  DoctorAppointments: undefined;
  DoctorProfile: undefined;
  ManageSlots: undefined; 
  MySchedule: undefined; // إضافة المسار الجديد للجدول هنا
};

const Stack = createStackNavigator<DoctorStackParamList>();

const DoctorStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="DoctorDashRoot"
      screenOptions={{
        // 🎨 تصميم الهيدر الداكن ليتماشى مع هوية عون (Modern Dark Mode)
        headerStyle: {
          backgroundColor: '#050811', 
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#1e293b',
        },
        headerTintColor: '#00dfc4', 
        headerTitleStyle: {
          fontWeight: '900',
          fontSize: 18,
          fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        },
        headerTitleAlign: 'center',
        
        // 📱 إعدادات الشاشة والأنيميشن
        cardStyle: { backgroundColor: '#050811' },
        headerBackTitleVisible: false, 
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS, 
      }}
    >
      {/* 1️⃣ لوحة تحكم الطبيب - الشاشة الرئيسية */}
      <Stack.Screen 
        name="DoctorDashRoot" 
        component={DoctorDashboardScreen} 
        options={{ 
          headerShown: false,
          title: 'لوحة التحكم',
        }} 
      />

      {/* 2️⃣ شاشة عرض جدول المواعيد (الجدول الاحترافي) */}
      <Stack.Screen 
        name="MySchedule" 
        component={MyScheduleScreen} 
        options={{ 
          title: 'جدول مواعيدي',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#0f172a',
          }
        }} 
      />

      {/* 3️⃣ شاشة ترتيب وتعديل المواعيد */}
      <Stack.Screen 
        name="ManageSlots" 
        component={ManageSlotsScreen} 
        options={{ 
          title: 'ترتيب مواعيدي',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#0f172a',
          }
        }} 
      />

      {/* 4️⃣ مواعيد الكشوفات */}
      <Stack.Screen 
        name="DoctorAppointments" 
        component={AppointmentsScreen} 
        options={{ 
          title: 'قائمة المواعيد',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#0f172a', 
          }
        }} 
      />

      {/* 5️⃣ الملف الشخصي للطبيب */}
      <Stack.Screen 
        name="DoctorProfile" 
        component={DoctorProfileScreen} 
        options={{ 
          title: 'الملف الشخصي',
          headerShown: true
        }} 
      />
      
    </Stack.Navigator>
  );
};

export default DoctorStack;