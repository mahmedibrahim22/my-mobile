import React, { useState, useContext } from 'react';
import { 
  View, Text, Image, StyleSheet, TouchableOpacity, 
  Platform, StatusBar, SafeAreaView, Modal, TouchableWithoutFeedback,
  ScrollView
} from 'react-native';
import { useNavigation, DrawerActions, CommonActions } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons'; 

// --- استيراد الـ Slices والـ Context لضمان الربط الشامل ---
import { logout } from '../../store/slices/UserSlice'; 
import { AdminContext } from '../../context/AdminContext';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import { AppDispatch, RootState } from '../../store';

interface CustomHeaderProps {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  onHomePress?: () => void; 
  showHome?: boolean;        
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ darkMode, setDarkMode, onHomePress, showHome = true }) => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  
  const [menuVisible, setMenuVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false); // ✅ حالة مودال الإشعارات
  
  // ✅ تم التعديل هنا: استخدام Type Assertion لتجاوز خطأ التايب سكريبت
  const { userData, token, role, notifications } = useSelector((state: RootState) => state.user as any);

  // استخراج الـ Context
  const adminCtx = useContext(AdminContext);
  const doctorCtx = useContext(DoctorContext);
  const appCtx = useContext(AppContext);

  const displayName = role === 'doctor' 
    ? (doctorCtx?.profileData as any)?.name 
    : userData?.name;

  const displayImage = role === 'doctor' 
    ? (doctorCtx?.profileData as any)?.image 
    : userData?.image;

  const handleHomeAction = () => {
    if (onHomePress) {
      onHomePress();
      return;
    }
    if (!token) {
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'AuthStack' }] }));
      return;
    }
    try {
        switch (role) {
            case 'admin': navigation.navigate('AdminStack'); break;
            case 'doctor': navigation.navigate('DoctorStack'); break;
            case 'user':
            default: navigation.navigate('MainDrawer'); break;
          }
    } catch (err) { console.error("Navigation Error:", err); }
  };

  const handleLogout = async () => {
    try {
      setLogoutModalVisible(false);
      setMenuVisible(false);
      dispatch(logout());
      if (adminCtx?.setAToken) adminCtx.setAToken("");
      if (doctorCtx?.setDToken) doctorCtx.setDToken("");
      if (appCtx?.setToken) appCtx.setToken("");
      await AsyncStorage.multiRemove(['token', 'atoken', 'dtoken', 'user_role']);
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'AuthStack' }] }));
    } catch (error) { console.error("Logout Error:", error); }
  };

  const getRoleLabel = () => {
    if (role === 'admin') return "إدارة المنصة";
    if (role === 'doctor') return "دكتور عون";
    return "حساب مستخدم";
  };

  const handleProfileNavigation = () => {
    setMenuVisible(false);
    if (role === 'doctor') { navigation.navigate('DoctorStack'); } 
    else { navigation.navigate('MyProfile'); }
  };

  return (
    <SafeAreaView style={[styles.safeArea, darkMode ? styles.darkBg : styles.lightBg]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      
      <View style={[styles.headerContainer, darkMode ? styles.darkBorder : styles.lightBorder]}>
        
        {/* القسم الأيسر: الأزرار (Home + Theme + Notifications + Profile) */}
        <View style={styles.leftSection}>
          
          {showHome && (
            <TouchableOpacity 
              onPress={handleHomeAction}
              style={[styles.themeBtn, darkMode ? styles.darkThemeBtn : styles.lightThemeBtn]}
            >
              <Ionicons name="home-outline" size={22} color={darkMode ? "#00dfc4" : "#0f172a"} />
            </TouchableOpacity>
          )}

          {/* ✅ زر الإشعارات (الجرس) للمريض */}
          {role === 'user' && token && (
            <TouchableOpacity 
              onPress={() => setNotifModalVisible(true)}
              style={[styles.themeBtn, darkMode ? styles.darkThemeBtn : styles.lightThemeBtn]}
            >
              <Ionicons name="notifications-outline" size={22} color={darkMode ? "#f8fafc" : "#475569"} />
              {notifications && notifications.length > 0 && <View style={styles.notifBadge} />}
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            onPress={() => setDarkMode(!darkMode)}
            style={[styles.themeBtn, darkMode ? styles.darkThemeBtn : styles.lightThemeBtn]}
          >
            <Ionicons name={darkMode ? "sunny-outline" : "moon-outline"} size={22} color={darkMode ? "#f8fafc" : "#475569"} />
          </TouchableOpacity>

          {token ? (
            <View>
              <TouchableOpacity 
                onPress={() => setMenuVisible(true)}
                style={[styles.profileWrapper, darkMode ? styles.darkProfileBox : styles.lightProfileBox]}
              >
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, darkMode ? styles.whiteText : styles.darkText]}>
                    {displayName?.split(' ')[0] || "الحساب"}
                  </Text>
                  <Text style={styles.roleBadge}>{getRoleLabel()}</Text>
                </View>
                <View style={styles.imageContainer}>
                  <Image source={displayImage ? { uri: displayImage } : require('../../../assets/images/logo.png')} style={styles.profileImg} />
                </View>
              </TouchableOpacity>

              {/* القائمة المنسدلة */}
              <Modal visible={menuVisible} transparent animationType="fade">
                <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
                  <View style={styles.modalOverlay}>
                    <View style={[styles.dropdownMenu, darkMode ? styles.darkDropdown : styles.lightDropdown]}>
                      <TouchableOpacity style={styles.menuItem} onPress={handleProfileNavigation}>
                        <Text style={[styles.menuText, darkMode ? styles.whiteText : styles.darkText]}>👤 الملف الشخصي</Text>
                      </TouchableOpacity>
                      <View style={[styles.separator, darkMode ? styles.darkSeparator : styles.lightSeparator]} />
                      <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); setLogoutModalVisible(true); }}>
                        <Text style={[styles.menuText, { color: '#ef4444', fontWeight: 'bold' }]}>🚪 تسجيل الخروج</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            </View>
          ) : (
            <TouchableOpacity onPress={() => navigation.navigate('AuthStack')} style={styles.loginBtn}>
              <Text style={styles.loginBtnText}>دخول</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* القسم الأيمن: اللوجو وزر الـ Drawer */}
        <View style={styles.rightSection}>
          <TouchableOpacity onPress={handleHomeAction}>
            <Image source={require('../../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} style={styles.menuBtn}>
            <View style={styles.menuLines}>
              <View style={[styles.line, { width: 22, backgroundColor: darkMode ? '#00dfc4' : '#2dd4bf' }]} />
              <View style={[styles.line, { width: 16, backgroundColor: darkMode ? '#ffffff' : '#0D9488' }]} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ مودال الإشعارات المبسط */}
      <Modal visible={notifModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setNotifModalVisible(false)}>
          <View style={styles.notifOverlay}>
            <View style={[styles.notifBox, darkMode ? styles.darkDropdown : styles.lightDropdown]}>
              <Text style={[styles.notifHeader, darkMode ? styles.whiteText : styles.darkText]}>التنبيهات</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {notifications && notifications.length > 0 ? (
                  notifications.map((item: any, index: number) => (
                    <View key={index} style={[styles.notifItem, { borderBottomColor: darkMode ? '#1e293b' : '#f1f5f9' }]}>
                      <Text style={[styles.notifText, darkMode ? styles.whiteText : styles.darkText]}>{item.message}</Text>
                      <Text style={styles.notifTime}>{item.date || 'الآن'}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.emptyNotif, darkMode ? styles.whiteText : styles.darkText]}>لا توجد تنبيهات جديدة</Text>
                )}
              </ScrollView>
              <TouchableOpacity onPress={() => setNotifModalVisible(false)} style={styles.closeNotifBtn}>
                <Text style={styles.closeNotifText}>إغلاق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* مودال تأكيد تسجيل الخروج */}
      <Modal visible={logoutModalVisible} transparent animationType="slide">
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmBox, darkMode ? styles.darkDropdown : styles.lightDropdown]}>
            <Ionicons name="alert-circle-outline" size={50} color="#ef4444" style={{ marginBottom: 15 }} />
            <Text style={[styles.confirmTitle, darkMode ? styles.whiteText : styles.darkText]}>تنبيه تسجيل الخروج</Text>
            <Text style={[styles.confirmSub, darkMode ? styles.whiteText : styles.darkText]}>هل أنت متأكد من رغبتك في تسجيل الخروج من نظام عون؟</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn, darkMode && {backgroundColor: '#334155'}]} onPress={() => setLogoutModalVisible(false)}>
                <Text style={[styles.actionBtnText, darkMode ? styles.whiteText : styles.darkText]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.logoutBtnConfirm]} onPress={handleLogout}>
                <Text style={[styles.actionBtnText, {color: '#fff'}]}>خروج</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, zIndex: 999 },
  headerContainer: { height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  lightBg: { backgroundColor: '#ffffff' },
  darkBg: { backgroundColor: '#050811' }, 
  lightBorder: { borderBottomColor: '#f1f5f9' },
  darkBorder: { borderBottomColor: '#1e293b' },
  leftSection: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rightSection: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  themeBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, position: 'relative' },
  lightThemeBtn: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
  darkThemeBtn: { backgroundColor: '#1e293b', borderColor: '#334155' },
  notifBadge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  logo: { width: 80, height: 35 },
  profileWrapper: { flexDirection: 'row', alignItems: 'center', paddingLeft: 10, paddingRight: 5, paddingVertical: 4, borderRadius: 14, borderWidth: 1 },
  lightProfileBox: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  darkProfileBox: { backgroundColor: '#1e293b', borderColor: '#334155' },
  userInfo: { alignItems: 'flex-end', marginRight: 8 },
  userName: { fontSize: 12, fontWeight: '700' },
  roleBadge: { fontSize: 8, color: '#00dfc4', fontWeight: 'bold', marginTop: -2 },
  imageContainer: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: '#00dfc4' },
  profileImg: { width: '100%', height: '100%' },
  modalOverlay: { flex: 1, backgroundColor: 'transparent' },
  dropdownMenu: { position: 'absolute', top: 75, left: 16, width: 200, borderRadius: 16, paddingVertical: 10, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, borderWidth: 1 },
  lightDropdown: { backgroundColor: '#fff', borderColor: '#f1f5f9' },
  darkDropdown: { backgroundColor: '#0f172a', borderColor: '#1e293b' },
  menuItem: { paddingVertical: 12, paddingHorizontal: 18 },
  menuText: { fontSize: 14, textAlign: 'right', fontWeight: '600' },
  separator: { height: 1, marginVertical: 6, marginHorizontal: 12 },
  lightSeparator: { backgroundColor: '#f1f5f9' },
  darkSeparator: { backgroundColor: '#1e293b' },
  menuBtn: { padding: 6 },
  menuLines: { gap: 6, alignItems: 'flex-end' },
  line: { height: 3, borderRadius: 2 },
  loginBtn: { backgroundColor: '#0D9488', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  whiteText: { color: '#f8fafc' },
  darkText: { color: '#0f172a' },
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.8)', justifyContent: 'center', alignItems: 'center' },
  confirmBox: { width: '85%', padding: 25, borderRadius: 24, alignItems: 'center', borderWidth: 1 },
  confirmTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  confirmSub: { fontSize: 14, textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  confirmButtons: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { backgroundColor: '#e2e8f0' },
  logoutBtnConfirm: { backgroundColor: '#ef4444' },
  actionBtnText: { fontWeight: '700', fontSize: 15 },
  // ✅ ستايلات مودال الإشعارات
  notifOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-start', alignItems: 'center', paddingTop: 80 },
  notifBox: { width: '90%', maxHeight: 400, borderRadius: 20, padding: 20, borderWidth: 1, elevation: 20 },
  notifHeader: { fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginBottom: 15 },
  notifItem: { paddingVertical: 12, borderBottomWidth: 1 },
  notifText: { fontSize: 14, textAlign: 'right', lineHeight: 20 },
  notifTime: { fontSize: 10, color: '#94A3B8', textAlign: 'right', marginTop: 4 },
  emptyNotif: { textAlign: 'center', paddingVertical: 30, opacity: 0.6 },
  closeNotifBtn: { marginTop: 15, paddingVertical: 10, backgroundColor: '#0D9488', borderRadius: 10, alignItems: 'center' },
  closeNotifText: { color: '#fff', fontWeight: 'bold' }
});

export default CustomHeader;