import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// 1. تعريف أنواع الملاحة
type RootStackParamList = {
  Login: { roleType: 'admin' | 'doctor' | 'user' }; // ✅ إضافة الـ Role كباراميتر
  RoleSelection: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'RoleSelection'>;

const { width } = Dimensions.get('window');

const RoleSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  // ✅ دالة ملاحة ذكية تبعت نوع الدور لصفحة اللوجين
  const handleNavigateToLogin = (role: 'admin' | 'doctor' | 'user') => {
    navigation.navigate('Login', { roleType: role });
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowBottom]} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>مرحباً بك في <Text style={styles.brandText}>عَوْن</Text></Text>
          <Text style={styles.subtitle}>اختر نوع الحساب لبدء تجربة رعاية صحية ذكية ومتكاملة</Text>
        </View>

        <View style={styles.grid}>
          
          {/* بطاقة الطبيب */}
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => handleNavigateToLogin('doctor')} // ✅ تحديد النوع
            activeOpacity={0.85}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <Text style={styles.icon}>👨‍⚕️</Text>
            </View>
            <Text style={styles.cardTitle}>بوابة الطبيب</Text>
            <Text style={styles.cardDescription}>إدارة العيادة والمواعيد والسجلات الطبية لمرضاك بكل سهولة واحترافية.</Text>
            <View style={styles.buttonOutline}>
              <Text style={styles.doctorButtonText}>دخول الأطباء</Text>
            </View>
          </TouchableOpacity>

          {/* بطاقة المستفيد / الأدمن (ممكن تضيف زر تالت للأدمن أو تخليها ذكية من اللوجين) */}
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => handleNavigateToLogin('user')} // ✅ تحديد النوع
            activeOpacity={0.85}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(20, 184, 166, 0.15)' }]}>
              <Text style={styles.icon}>👤</Text>
            </View>
            <Text style={styles.cardTitle}>حساب مستفيد</Text>
            <Text style={styles.cardDescription}>احجز مواعيدك وتابع استشاراتك الطبية مع أفضل المتخصصين بضغطة زر.</Text>
            <View style={styles.buttonSolid}>
              <Text style={styles.userButtonText}>دخول المستخدمين</Text>
            </View>
          </TouchableOpacity>

          {/* 💡 نصيحة: لو عاوز زرار سري للأدمن ممكن تلمسه في اللوجو أو تضيف كارت تالت */}
        </View>
      </ScrollView>
    </View>
  );
};

// ... (باقي الـ styles كما هي عندك)
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 60, alignItems: 'center' },
  glow: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.15 },
  glowTop: { top: -80, left: -80, backgroundColor: '#14b8a6' },
  glowBottom: { bottom: -80, right: -80, backgroundColor: '#6366f1' },
  header: { alignItems: 'center', marginBottom: 45 },
  welcomeText: { fontSize: 34, fontWeight: '900', color: '#f8fafc', textAlign: 'center' },
  brandText: { color: '#2dd4bf' },
  subtitle: { fontSize: 16, color: '#94a3b8', textAlign: 'center', marginTop: 12, lineHeight: 24 },
  grid: { width: '100%', gap: 20 },
  card: { backgroundColor: '#1e293b', borderRadius: 30, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  iconBox: { width: 75, height: 75, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  icon: { fontSize: 38 },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 8 },
  cardDescription: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 24 },
  buttonOutline: { paddingVertical: 14, width: '100%', borderRadius: 16, borderWidth: 1.5, borderColor: '#6366f1', alignItems: 'center' },
  doctorButtonText: { color: '#818cf8', fontWeight: 'bold', fontSize: 16 },
  buttonSolid: { paddingVertical: 14, width: '100%', borderRadius: 16, backgroundColor: '#0d9488', alignItems: 'center' },
  userButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
});

export default RoleSelectionScreen;