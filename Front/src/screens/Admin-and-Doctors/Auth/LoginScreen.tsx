import React, { useState, useContext } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  Image,
  ActivityIndicator
} from "react-native";
import { useDispatch } from "react-redux";
import { useNavigation, useRoute } from "@react-navigation/native"; 
import AsyncStorage from '@react-native-async-storage/async-storage';

import { setToken as setReduxAuth } from "../../../store/slices/UserSlice";
import axiosInstance from "../../../api/axiosInstance";
import { AppContext } from "../../../context/AppContext";
import { AdminContext } from "../../../context/AdminContext"; 
import { DoctorContext } from "../../../context/DoctorContext"; 

const LOGO_LOCAL = require("../../../../assets/images/logo.png");

const LoginScreen = () => {
  const [state, setState] = useState<"Sign Up" | "Login">("Login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  
  const dispatch = useDispatch();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  // استقبال الدور المختار من الشاشة السابقة
  const selectedRole = route.params?.roleType || 'user'; 

  const context = useContext(AppContext);
  const adminCtx = useContext(AdminContext); 
  const doctorCtx = useContext(DoctorContext);

  const onSubmitHandler = async () => {
    if (!context) return;
    const { setToken: setContextToken, setUserRole } = context;

    setLoading(true);
    try {
      const lowerEmail = email.trim().toLowerCase();
      
      let endpoint = "";
      let currentRole = selectedRole;

      if (state === "Sign Up") {
        endpoint = "/user/register";
        currentRole = 'user';
      } else {
        if (selectedRole === 'admin' || lowerEmail.includes('admin')) {
          endpoint = "/admin/login";
          currentRole = 'admin';
        } else if (selectedRole === 'doctor' || lowerEmail.includes('doctor')) {
          endpoint = "/doctor/login";
          currentRole = 'doctor';
        } else {
          endpoint = "/user/login";
          currentRole = 'user';
        }
      }
      
      const payload = state === "Sign Up" 
        ? { 
            name: `${firstName} ${lastName}`, 
            username: username || lowerEmail.split('@')[0],
            password, 
            email: lowerEmail, 
            phone, 
          }
        : { email: lowerEmail, password };

      const { data } = await axiosInstance.post(endpoint, payload);

      if (data.success) {
        const tokenKey = currentRole === 'admin' ? 'atoken' : currentRole === 'doctor' ? 'dtoken' : 'token';

        // 1. التخزين المحلي
        await AsyncStorage.multiSet([
          [tokenKey, data.token],
          ['user_role', currentRole]
        ]);

        // 2. تحديث الـ Contexts الخاصة بكل دور (بشكل صامت)
        if (currentRole === 'admin' && adminCtx?.setAToken) {
          adminCtx.setAToken(data.token);
        }
        
        if (currentRole === 'doctor' && doctorCtx?.setDToken) {
          // دالة setDToken في DoctorContext تقوم بجلب البيانات فوراً
          doctorCtx.setDToken(data.token);
        }

        // 3. تحديث الحالة العامة للتطبيق
        // ملاحظة: بمجرد تحديث الـ Token والـ Role في AppContext، 
        // سيقوم AppNavigator تلقائياً بتبديل الـ Stack دون الحاجة لـ navigation.replace
        await setUserRole(currentRole); 
        setContextToken(data.token); 
        dispatch(setReduxAuth({ token: data.token, role: currentRole }));

      } else {
        Alert.alert("خطأ", data.message || "بيانات الدخول غير صحيحة");
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "فشل الاتصال بالسيرفر، تأكد من الشبكة";
      Alert.alert("فشل العملية", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.logoContainer}>
             <View style={styles.tealBar} />
             <Image source={LOGO_LOCAL} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>
              تسجيل دخول <Text style={styles.tealText}>
                {selectedRole === 'admin' ? 'الأدمن' : selectedRole === 'doctor' ? 'الطبيب' : 'المستخدم'}
              </Text>
            </Text>
            <Text style={styles.subtitle}>مرحباً بك مجدداً في عَوْن</Text>
          </View>

          <View style={styles.form}>
            {state === "Sign Up" && (
              <>
                <View style={styles.row}>
                  <InputGroup label="الاسم الأخير" value={lastName} onChange={setLastName} placeholder="الكنية" />
                  <InputGroup label="الاسم الأول" value={firstName} onChange={setFirstName} placeholder="الاسم" />
                </View>
                <InputGroup label="اسم المستخدم" value={username} onChange={setUsername} placeholder="username" />
                <InputGroup label="الهاتف" value={phone} onChange={setPhone} keyboardType="phone-pad" placeholder="01XXXXXXXXX" />
              </>
            )}

            <InputGroup 
              label="البريد الإلكتروني" 
              value={email} 
              onChange={setEmail} 
              keyboardType="email-address" 
              placeholder="name@gmail.com" 
            />
            
            <InputGroup 
              label="كلمة المرور" 
              value={password} 
              onChange={setPassword} 
              secureTextEntry 
              placeholder="••••••••" 
            />

            <TouchableOpacity 
              style={[styles.button, loading && { opacity: 0.7 }]} 
              onPress={onSubmitHandler} 
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#050811" />
              ) : (
                <Text style={styles.buttonText}>
                    {state === "Login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setState(state === "Login" ? "Sign Up" : "Login")}
              style={styles.toggleBtn}
            >
              <Text style={styles.toggleText}>
                {state === "Login" ? "هل أنت جديد؟ سجل الآن" : "لديك حساب؟ سجل دخول"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// مكون الحقول الفرعي
const InputGroup = ({ label, value, onChange, secureTextEntry, keyboardType, placeholder }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      placeholder={placeholder}
      textAlign="center"
      placeholderTextColor="#475569"
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050811" },
  glowTop: {
    position: 'absolute', top: -100, right: -100,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(0, 223, 196, 0.07)',
  },
  glowBottom: {
    position: 'absolute', bottom: -100, left: -100,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(0, 223, 196, 0.07)',
  },
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    padding: 20 
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 45,
    padding: 30,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: "#00dfc4",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  logoContainer: { alignItems: 'center', marginBottom: 20 },
  tealBar: {
    width: 40, height: 5,
    backgroundColor: '#00dfc4',
    borderRadius: 10,
    marginBottom: 15,
  },
  logo: { width: 80, height: 80 },
  header: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 26, fontWeight: "900", color: "#fff", textAlign: 'center' },
  tealText: { color: "#00dfc4" },
  subtitle: { fontSize: 14, color: "#94a3b8", marginTop: 5, fontWeight: '700' },
  form: { gap: 18 },
  row: { flexDirection: "row", gap: 10 },
  inputGroup: { flex: 1, marginBottom: 5 },
  label: { color: "#64748b", marginBottom: 8, textAlign: 'right', fontSize: 12, fontWeight: "800" },
  input: { 
    backgroundColor: "#1e293b", 
    borderRadius: 18, 
    paddingVertical: 14, 
    color: "#fff", 
    fontSize: 16,
    fontWeight: 'bold'
  },
  button: { 
    backgroundColor: "#00dfc4", 
    paddingVertical: 18, 
    borderRadius: 20, 
    alignItems: "center", 
    marginTop: 15,
    elevation: 8
  },
  buttonText: { color: "#050811", fontWeight: "900", fontSize: 18 },
  toggleBtn: { marginTop: 10 },
  toggleText: { color: "#94a3b8", textAlign: "center", fontSize: 14, fontWeight: '600' }
});

export default LoginScreen;