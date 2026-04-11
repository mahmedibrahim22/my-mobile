import React from "react";
import {
  createStackNavigator,
  CardStyleInterpolators,
} from "@react-navigation/stack";

// ✅ استيراد الشاشات الفعلية من فولدر User
import HomeScreen from "../screens/User/HomeScreen";
import ContactScreen from "../screens/User/ContactScreen";
import MyProfileScreen from "../screens/User/MyProfileScreen";
import MyAppointmentsScreen from "../screens/User/MyAppointmentsScreen";
import AllDoctorsScreen from "../screens/User/AllDoctorsScreen";
import AppointmentScreen from "../screens/User/AppointmentScreen";
import MedicineScreen from "../screens/User/MedicineScreen";
import PharmacyScreen from "../screens/User/PharmacyScreen";
import DeliveryScreen from "../screens/User/DeliveryScreen";
import LabScreen from "../screens/User/LabScreen";
import SpecialityScreen from "../screens/User/SpecialityScreen";
import AboutScreen from "../screens/User/AboutScreen";
import NotFoundScreen from "../screens/User/NotFoundScreen";

/**
 * 📱 تعريف أنواع الـ Stack لضمان Type Safety
 */
export type UserStackParamList = {
  Home: undefined;
  Doctors: { speciality?: string };
  DoctorDetails: { docId: string };
  Appointment: { docId: string }; 
  Speciality: undefined;
  Medicine: undefined;
  Pharmacy: undefined;
  Delivery: undefined;
  Lab: undefined;
  MyProfile: undefined;
  MyAppointments: undefined;
  Contact: undefined;
  About: undefined;
  NotFound: undefined;
};

const Stack = createStackNavigator<UserStackParamList>();

const UserStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        // 🛠️ الهيدر يتم التحكم فيه يدوياً داخل الشاشات (مثل AppointmentScreen)
        headerShown: false,
        
        // 🎨 ضبط العرض ليكون شاشة كاملة (Card) وليس Modal عائم
        presentation: 'card', 
        
        // 📱 أنيميشن الانزلاق من اليمين لليسار (أو العكس) متوافق مع iOS/Android
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        
        // 🛠️ تفعيل الإيماءات (Gestures) للرجوع بالسحب
        gestureEnabled: true,
        gestureDirection: "horizontal",
        
        // منع شفافية الكارد لضمان عدم ظهور الشاشة السابقة خلف الحالية
        cardStyle: { backgroundColor: "transparent" },
      }}
    >
      {/* --- القسم الرئيسي --- */}
      <Stack.Screen name="Home" component={HomeScreen} />

      {/* --- قسم الأطباء والحجوزات --- */}
      <Stack.Screen
        name="Doctors"
        component={AllDoctorsScreen}
      />

      {/* شاشة تفاصيل الدكتور (تم توجيهها لـ AppointmentScreen) */}
      <Stack.Screen
        name="DoctorDetails"
        component={AppointmentScreen}
      />

      {/* ✅ شاشة الحجز الأساسية - الآن ستفتح كـ Full Screen Card */}
      <Stack.Screen
        name="Appointment"
        component={AppointmentScreen}
        options={{
          gestureEnabled: false, // تعطيل السحب للرجوع لإجبار المستخدم على استخدام زر الرجوع أو التأكيد
        }}
      />

      <Stack.Screen
        name="Speciality"
        component={SpecialityScreen}
      />

      <Stack.Screen
        name="MyAppointments"
        component={MyAppointmentsScreen}
      />

      {/* --- قسم الخدمات الطبية واللوجستية --- */}
      <Stack.Screen name="Medicine" component={MedicineScreen} />
      <Stack.Screen name="Pharmacy" component={PharmacyScreen} />
      <Stack.Screen name="Lab" component={LabScreen} />
      <Stack.Screen name="Delivery" component={DeliveryScreen} />

      {/* --- قسم المعلومات والبروفايل الشخصي --- */}
      <Stack.Screen name="MyProfile" component={MyProfileScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="About" component={AboutScreen} />

      {/* --- 🛡️ شاشة الخطأ العامة --- */}
      <Stack.Screen
        name="NotFound"
        component={NotFoundScreen}
      />
    </Stack.Navigator>
  );
};

export default UserStack;