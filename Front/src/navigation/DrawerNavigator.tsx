import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { 
  createDrawerNavigator, 
  DrawerContentComponentProps, 
  DrawerContentScrollView, 
  DrawerItemList 
} from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

// ✅ استيراد الـ Types والـ Actions
import { AppDispatch } from '../store/index';
import { logout as logoutRedux, loadUserProfile } from '../store/slices/UserSlice';

// ✅ استيراد الـ Contexts
import { AppContext } from '../context/AppContext';
import { AdminContext } from '../context/AdminContext';
import { DoctorContext } from '../context/DoctorContext';

// ✅ استيراد المكونات والستاكات
import CustomHeader from '../components/Layout/CustomHeader';
import UserStack from './UserStack';
import AdminStack from './AdminStack';
import DoctorStack from './DoctorStack'; 

const Drawer = createDrawerNavigator();

// 🎨 مكون محتوى الدراور الجانبي المطور (Sidebar)
const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const dispatch = useDispatch<AppDispatch>();
  
  const context = useContext(AppContext);
  const adminCtx = useContext(AdminContext);
  const doctorCtx = useContext(DoctorContext);
  
  const isDarkMode = context?.isDarkMode ?? true;
  const role = context?.userRole;

  const token = role === 'doctor' ? doctorCtx?.dToken : role === 'admin' ? adminCtx?.aToken : context?.token;
  const userData = role === 'doctor' ? doctorCtx?.profileData : context?.userData;

  useEffect(() => {
    const userToken = context?.token;
    const isDoctorActive = !!doctorCtx?.dToken;
    const isAdminActive = !!adminCtx?.aToken;

    if (userToken && !userData && role === 'user' && !isDoctorActive && !isAdminActive) {
      dispatch(loadUserProfile());
    }
  }, [context?.token, userData, role, dispatch, doctorCtx?.dToken, adminCtx?.aToken]);

  const handleLogout = async () => {
    if (context?.logout) {
      await context.logout();
    }
    if (doctorCtx?.logout) {
      await doctorCtx.logout();
    }
    dispatch(logoutRedux());
    if (adminCtx) adminCtx.setAToken(""); 
  };

  const bgColor = isDarkMode ? '#0F172A' : '#ffffff'; 
  const textColor = isDarkMode ? '#ffffff' : '#1e293b';
  const borderColor = isDarkMode ? '#1e293b' : '#e2e8f0';

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <DrawerContentScrollView {...props}>
        {/* هيدر الدراور */}
        <View style={[styles.drawerHeader, { borderBottomColor: borderColor }]}>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Text style={styles.drawerBrand}>عَوْن</Text>
              {(userData as any)?.image && (
                <Image 
                  source={{ uri: (userData as any).image }} 
                  style={{ width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#2dd4bf' }} 
                />
              )}
          </View>

          <View style={styles.roleBadge}>
              <Text style={styles.drawerUserRole}>
                 {role === 'admin' ? 'إدارة المنصة' : role === 'doctor' ? 'دكتور عون' : 'حساب مستخدم'}
              </Text>
          </View>
          
          <View style={styles.userInfoContainer}>
             <Text style={[styles.userName, { color: textColor }]}>
               {(userData as any)?.name || (role === 'admin' ? 'مدير النظام' : 'مستخدم عون')}
             </Text>
             <Text style={styles.userEmail}>{(userData as any)?.email || ''}</Text>
          </View>
        </View>

        <View style={styles.menuLabelContainer}>
            <Text style={styles.menuLabel}>القائمة الرئيسية</Text>
        </View>

        <DrawerItemList {...props} />

        <View style={{marginTop: 20}}>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />
        </View>
      </DrawerContentScrollView>

      {/* زر تسجيل الخروج */}
      {token ? (
        <TouchableOpacity 
          style={[styles.logoutButton, { borderTopColor: borderColor, backgroundColor: isDarkMode ? '#0B1222' : '#f9fafb' }]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#f87171" />
          <Text style={styles.logoutText}>خروج آمن</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const DrawerNavigator = () => {
  const context = useContext(AppContext);
  const doctorCtx = useContext(DoctorContext);
  const adminCtx = useContext(AdminContext);
  const navigation = useNavigation<any>();
  
  const isDarkMode = context?.isDarkMode ?? true;
  const toggleTheme = context?.toggleTheme ?? (() => {});
  const role = context?.userRole;

  const token = role === 'doctor' ? doctorCtx?.dToken : role === 'admin' ? adminCtx?.aToken : context?.token;

  // تحديد وجهة زر الهوم بناءً على الـ Role للعودة للداشبورد الأساسية
  const handleHomePress = () => {
    if (role === 'admin') navigation.navigate('AdminHome');
    else if (role === 'doctor') navigation.navigate('DoctorHome');
    else navigation.navigate('UserHome');
  };

  type IconProps = { color: string; size: number };

  const HeaderComponent = CustomHeader as any;

  return (
    <Drawer.Navigator
      drawerContent={(props: DrawerContentComponentProps) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerPosition: 'right', 
        headerShown: true,
        header: () => (
            <HeaderComponent 
                darkMode={isDarkMode} 
                setDarkMode={toggleTheme} 
                onHomePress={handleHomePress}
                showHome={!!token} 
            />
        ),
        drawerActiveBackgroundColor: 'rgba(45, 212, 191, 0.1)',
        drawerActiveTintColor: '#2dd4bf',
        drawerInactiveTintColor: isDarkMode ? '#94a3b8' : '#64748b',
        drawerLabelStyle: {
          fontSize: 14,
          fontWeight: '700',
          textAlign: 'right',
          marginRight: 5
        },
        drawerStyle: {
          backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
          width: 280,
        },
        headerStyle: {
          backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitle: "", 
      }}
    >
      {/* 🛠️ شاشات الأدمن */}
      {token && role === 'admin' ? (
        <>
          <Drawer.Screen 
            name="AdminHome" 
            component={AdminStack} 
            options={{ 
              drawerLabel: 'الرئيسية',
              drawerIcon: ({ color }: IconProps) => <Ionicons name="home-outline" size={20} color={color} />
            }}
          />
          <Drawer.Screen 
            name="AdminSection" 
            component={AdminStack} 
            options={{ 
              drawerLabel: 'لوحة التحكم',
              drawerIcon: ({ color }: IconProps) => <Ionicons name="grid-outline" size={20} color={color} />
            }}
          />
          <Drawer.Screen 
            name="AddDoctorDrawer" 
            component={AdminStack} 
            initialParams={{ screen: 'AddDoctor' }}
            options={{ 
              drawerLabel: 'إضافة طبيب جديد',
              drawerIcon: ({ color }: IconProps) => <Ionicons name="person-add-outline" size={20} color={color} />
            }}
          />
          <Drawer.Screen 
            name="DoctorListDrawer" 
            component={AdminStack} 
            initialParams={{ screen: 'DoctorListInternal' }}
            options={{ 
              drawerLabel: 'قائمة الأطباء',
              drawerIcon: ({ color }: IconProps) => <Ionicons name="people-outline" size={20} color={color} />
            }}
          />
          <Drawer.Screen 
            name="AppointmentsDrawer" 
            component={AdminStack} 
            initialParams={{ screen: 'AppointmentsInternal' }}
            options={{ 
              drawerLabel: 'سجل المواعيد',
              drawerIcon: ({ color }: IconProps) => <Ionicons name="calendar-outline" size={20} color={color} />
            }}
          />
          <Drawer.Screen 
            name="LabsDrawer" 
            component={AdminStack} 
            initialParams={{ screen: 'LabsInternal' }}
            options={{ 
              drawerLabel: 'إدارة المعامل',
              drawerIcon: ({ color }: IconProps) => <Ionicons name="flask-outline" size={20} color={color} />
            }}
          />
          <Drawer.Screen 
            name="PharmacyDrawer" 
            component={AdminStack} 
            initialParams={{ screen: 'PharmaciesInternal' }}
            options={{ 
              drawerLabel: 'إدارة الصيدليات',
              drawerIcon: ({ color }: IconProps) => <Ionicons name="medical-outline" size={20} color={color} />
            }}
          />
          <Drawer.Screen 
            name="DeliveryDrawer" 
            component={AdminStack} 
            initialParams={{ screen: 'DeliveryInternal' }}
            options={{ 
              drawerLabel: 'طلبات التوصيل',
              drawerIcon: ({ color }: IconProps) => <Ionicons name="bicycle-outline" size={20} color={color} />
            }}
          />
          <Drawer.Screen 
            name="UserSectionPreview" 
            component={UserStack} 
            options={{ 
              drawerLabel: 'عرض كـ مستخدم',
              headerShown: true, 
              drawerIcon: ({ color }: IconProps) => <Ionicons name="eye-outline" size={20} color={color} />
            }}
          />
        </>
      ) 
      
      /* 🩺 شاشات الطبيب */
      : token && role === 'doctor' ? (
        <>
          <Drawer.Screen 
            name="DoctorHome" 
            component={DoctorStack} 
            options={{ 
              drawerLabel: 'الرئيسية',
              drawerIcon: ({ color }: IconProps) => <Ionicons name="home-outline" size={20} color={color} />
            }}
          />
          <Drawer.Screen 
            name="DoctorDashboardDrawer" 
            component={DoctorStack} 
            options={{ 
              drawerLabel: 'لوحة التحكم',
              drawerIcon: ({ color }: IconProps) => <Ionicons name="grid-outline" size={20} color={color} />
            }}
          />
          <Drawer.Screen 
            name="SettleFeesDrawer" 
            component={DoctorStack} 
            initialParams={{ screen: 'SettleFees' }}
            options={{ 
              drawerLabel: 'تسوية الرسوم',
              drawerIcon: ({ color }: IconProps) => <Ionicons name="wallet-outline" size={20} color={color} />
            }}
          />
          <Drawer.Screen 
            name="MyScheduleDrawer" 
            component={DoctorStack} 
            initialParams={{ screen: 'MySchedule' }}
            options={{ 
              drawerLabel: 'جدول مواعيدي',
              drawerIcon: ({ color }: IconProps) => <Ionicons name="calendar-number-outline" size={20} color={color} />
            }}
          />
          <Drawer.Screen 
            name="DoctorManageSlotsDrawer" 
            component={DoctorStack} 
            initialParams={{ screen: 'ManageSlots' }}
            options={{ 
              drawerLabel: 'ترتيب المواعيد',
              drawerIcon: ({ color }: IconProps) => <Ionicons name="time-outline" size={20} color={color} />
            }}
          />
          <Drawer.Screen 
            name="DoctorAppointmentsDrawer" 
            component={DoctorStack} 
            initialParams={{ screen: 'DoctorAppointments' }}
            options={{ 
              drawerLabel: 'مواعيد المرضى',
              drawerIcon: ({ color }: IconProps) => <Ionicons name="people-outline" size={20} color={color} />
            }}
          />
          <Drawer.Screen 
            name="DoctorProfileDrawer" 
            component={DoctorStack} 
            initialParams={{ screen: 'DoctorProfile' }}
            options={{ 
              drawerLabel: 'الملف الشخصي',
              drawerIcon: ({ color }: IconProps) => <Ionicons name="person-circle-outline" size={20} color={color} />
            }}
          />
        </>
      ) 
      /* 👤 شاشات المستخدم */
      : (
        <>
          <Drawer.Screen 
            name="UserHome" 
            component={UserStack} 
            options={{ 
              drawerLabel: 'الرئيسية',
              drawerIcon: ({ color }: IconProps) => <Ionicons name="home-outline" size={20} color={color} />
            }}
          />
          <Drawer.Screen 
            name="UserSection" 
            component={UserStack} 
            options={{ 
              drawerLabel: 'استكشاف الخدمات',
              drawerIcon: ({ color }: IconProps) => <Ionicons name="apps-outline" size={20} color={color} />
            }}
          />
        </>
      )}
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 24,
    borderBottomWidth: 1,
    marginBottom: 10,
    alignItems: 'flex-end'
  },
  drawerBrand: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2dd4bf',
    letterSpacing: 1
  },
  roleBadge: {
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    marginTop: 4
  },
  drawerUserRole: {
    fontSize: 10,
    color: '#2dd4bf',
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  userInfoContainer: {
    marginTop: 15,
    alignItems: 'flex-end'
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  menuLabelContainer: {
    paddingHorizontal: 25,
    marginVertical: 10,
  },
  menuLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1.5
  },
  divider: {
    height: 1,
    marginHorizontal: 25,
    marginBottom: 15,
    opacity: 0.3
  },
  logoutButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    marginBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  logoutText: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '900',
    marginRight: 12,
    textTransform: 'uppercase'
  }
});

export default DrawerNavigator;