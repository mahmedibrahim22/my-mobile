import 'react-native-gesture-handler';
import React from 'react';
import { TouchableOpacity, Text, View, Platform } from 'react-native';
import { 
  createStackNavigator, 
  CardStyleInterpolators, 
  StackNavigationProp 
} from '@react-navigation/stack';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';

// ✅ استيراد الشاشات
import AdminDashboardScreen from '../screens/Admin-and-Doctors/Admin/AdminDashboardScreen';
import AddDoctorScreen from '../screens/Admin-and-Doctors/Admin/AddDoctorScreen';
import EditDoctorScreen from '../screens/Admin-and-Doctors/Admin/EditDoctorScreen';
import DoctorListScreen from '../screens/Admin-and-Doctors/Admin/DoctorListScreen';
import AllAppointmentsScreen from '../screens/Admin-and-Doctors/Admin/AllAppointmentsScreen';
import LabsListScreen from '../screens/Admin-and-Doctors/Admin/LabsListScreen';
import PharmacyListScreen from '../screens/Admin-and-Doctors/Admin/PharmacyListScreen';
import DeliveryListScreen from '../screens/Admin-and-Doctors/Admin/DeliveryListScreen';

// ✅ توحيد الأسماء لضمان التوافق مع DrawerNavigator
export type AdminStackParamList = {
  AdminDashRoot: undefined;
  DoctorListInternal: undefined; 
  AddDoctor: undefined; // تم تغيير المسمى ليتوافق مع نداء الدراور
  EditDoctor: { docId: string }; 
  AppointmentsInternal: undefined; 
  DeliveryInternal: undefined;
  LabsInternal: undefined;
  PharmaciesInternal: undefined;
};

type NavigationProp = StackNavigationProp<AdminStackParamList> & DrawerNavigationProp<any>;

const Stack = createStackNavigator<AdminStackParamList>();

const AdminStack = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <Stack.Navigator
      initialRouteName="AdminDashRoot"
      screenOptions={{
        headerShown: true,
        headerStyle: { 
          backgroundColor: '#0F172A', 
          height: Platform.OS === 'ios' ? 110 : 90, 
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#2dd4bf', 
        headerTitleStyle: { 
          fontWeight: 'bold',
          fontSize: 18,
          fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
        },
        headerTitleAlign: 'center',
        headerBackTitleVisible: false,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}
    >
      <Stack.Screen 
        name="AdminDashRoot" 
        component={AdminDashboardScreen} 
        options={{ 
          title: 'لوحة تحكم عَوْن',
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              style={{ marginRight: 15 }}
              activeOpacity={0.7}
            >
              <View style={{ padding: 5 }}>
                 <Text style={{ color: '#2dd4bf', fontSize: 28, lineHeight: 32 }}>☰</Text>
              </View>
            </TouchableOpacity>
          ),
        }} 
      />

      <Stack.Screen name="DoctorListInternal" component={DoctorListScreen} options={{ title: 'طاقم الأطباء' }} />
      
      {/* ✅ تعديل الاسم هنا ليتطابق مع الـ Drawer ويحل مشكلة التوجيه */}
      <Stack.Screen 
        name="AddDoctor" 
        component={AddDoctorScreen} 
        options={{ title: 'إضافة طبيب للمنظومة' }} 
      />

      <Stack.Screen 
        name="EditDoctor" 
        component={EditDoctorScreen} 
        options={{ title: 'تعديل الملف الطبي' }} 
      />

      <Stack.Screen name="AppointmentsInternal" component={AllAppointmentsScreen} options={{ title: 'سجل الحجوزات المركزي' }} />
      <Stack.Screen name="LabsInternal" component={LabsListScreen} options={{ title: 'إدارة المعامل' }} />
      <Stack.Screen name="PharmaciesInternal" component={PharmacyListScreen} options={{ title: 'منظومة الصيدليات' }} />
      <Stack.Screen name="DeliveryInternal" component={DeliveryListScreen} options={{ title: 'كابتن التوصيل' }} />
      
    </Stack.Navigator>
  );
};

export default AdminStack;