import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AdminContext } from '../../../context/AdminContext';
import { AdminStackParamList } from '../../../navigation/AdminStack';

// 1. تعريف أنواع البيانات للمواعيد
interface AppointmentItem {
  _id: string;
  docData: {
    name: string;
    image: string;
  };
  slotDate: string;
  cancelled: boolean;
  isCompleted?: boolean;
}

type NavigationProp = StackNavigationProp<AdminStackParamList>;

const AdminDashboardScreen = () => {
  const adminContext = useContext(AdminContext);
  const navigation = useNavigation<NavigationProp>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const aToken = adminContext?.aToken;
  const getDashData = adminContext?.getDashData;
  const dashData = adminContext?.dashData;
  const cancelAppointment = adminContext?.cancelAppointment;

  const loadData = useCallback(async (isQuiet = false) => {
    if (!isQuiet) setLoading(true);
    try {
      if (getDashData && aToken) {
        await getDashData();
      }
    } catch (error) {
      console.error("Dashboard Load Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getDashData, aToken]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

  useEffect(() => {
    if (aToken) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [aToken, loadData]);

  const handleCancel = (id: string) => {
    Alert.alert("تنبيه عون", "هل أنت متأكد من إلغاء هذا الموعد نهائياً؟", [
      { text: "تراجع", style: "cancel" },
      { 
        text: "إلغاء الموعد", 
        style: "destructive", 
        onPress: async () => {
          if (cancelAppointment) {
            await cancelAppointment(id);
            loadData(true);
          }
        } 
      }
    ]);
  };

  if (loading && !dashData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2dd4bf" />
        <Text style={styles.loadingText}>جاري مزامنة بيانات عون...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollPadding}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2dd4bf"
            colors={["#2dd4bf"]}
          />
        }
      >
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
             <View style={styles.headerTextGroup}>
                <Text style={styles.headerTitle}>لوحة التحكم</Text>
                <Text style={styles.headerSubtitle}>إحصائيات النظام اللحظية</Text>
             </View>
             <View style={styles.statusDot} />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="الأطباء"
            value={dashData?.doctors || 0}
            color="#0d9488"
            bg="#f0fdfa"
            onPress={() => navigation.navigate('DoctorListInternal')}
          />
          <StatCard
            label="إجمالي المواعيد"
            value={dashData?.appointments || 0}
            color="#f97316"
            bg="#fff7ed"
            onPress={() => navigation.navigate('AppointmentsInternal')}
          />
          <StatCard
            label="المرضى"
            value={dashData?.patients || 0}
            color="#3b82f6"
            bg="#eff6ff"
            onPress={() => { /* لا يوجد شاشة مرضى حالياً */ }} 
          />
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <TouchableOpacity 
               activeOpacity={0.6} 
               onPress={() => navigation.navigate('AppointmentsInternal')}
            >
              <Text style={styles.viewAllText}>عرض الكل</Text>
            </TouchableOpacity>
            <Text style={styles.tableHeaderText}>أحدث المواعيد المحجوزة</Text>
          </View>

          {dashData?.latestAppointments && dashData.latestAppointments.length > 0 ? (
            dashData.latestAppointments.map((item: AppointmentItem, index: number) => (
              <View key={item._id || index.toString()} style={styles.appointmentRow}>
                <Image
                  source={{
                    uri: item.docData?.image && item.docData.image !== ""
                      ? item.docData.image
                      : 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'
                  }}
                  style={styles.docImage}
                />
                <View style={styles.docInfo}>
                  <Text style={styles.docName}>د. {item.docData?.name}</Text>
                  <Text style={styles.slotDateText}>{item.slotDate}</Text>
                </View>
                <View style={styles.actionArea}>
                  {item.cancelled ? (
                    <View style={styles.cancelledBadge}>
                      <Text style={styles.cancelledText}>ملغي</Text>
                    </View>
                  ) : item.isCompleted ? (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedText}>مكتمل</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleCancel(item._id)}
                      style={styles.cancelBtn}
                    >
                      <View style={styles.cancelCircle}>
                        <Text style={styles.xIcon}>×</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>لا توجد حجوزات جديدة حالياً</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  bg: string;
  onPress: () => void;
}

const StatCard = ({ label, value, color, bg, onPress }: StatCardProps) => (
  <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.iconBox, { backgroundColor: bg }]}>
       <Text style={{ color: color, fontWeight: 'bold', fontSize: 20 }}>#</Text>
    </View>
    <View style={styles.statInfo}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollPadding: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 15, color: '#64748b', fontSize: 14, fontWeight: '600' },
  headerCard: {
    backgroundColor: '#0F172A',
    padding: 22,
    borderRadius: 24,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 8 }
    }),
  },
  headerRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  headerTextGroup: { alignItems: 'flex-end' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#2dd4bf' },
  headerSubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  statusDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2dd4bf', borderWidth: 2, borderColor: '#1e293b' },
  statsGrid: { gap: 12, marginBottom: 20 },
  statCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconBox: { width: 48, height: 48, borderRadius: 14, marginLeft: 16, justifyContent: 'center', alignItems: 'center' },
  statInfo: { alignItems: 'flex-end', flex: 1 },
  statValue: { fontSize: 26, fontWeight: 'bold', color: '#0F172A' },
  statLabel: { fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 2 },
  tableContainer: { backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden', marginBottom: 20 },
  tableHeader: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tableHeaderText: { fontWeight: 'bold', color: '#0F172A', fontSize: 16 },
  viewAllText: { color: '#2dd4bf', fontSize: 14, fontWeight: '800' },
  appointmentRow: { flexDirection: 'row-reverse', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  docImage: { width: 52, height: 52, borderRadius: 15, backgroundColor: '#F1F5F9' },
  docInfo: { flex: 1, marginRight: 14, alignItems: 'flex-end' },
  docName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  slotDateText: { fontSize: 12, color: '#64748b', marginTop: 4 },
  actionArea: { minWidth: 60, alignItems: 'center' },
  cancelledBadge: { backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  cancelledText: { color: '#EF4444', fontSize: 11, fontWeight: '800' },
  completedBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  completedText: { color: '#16A34A', fontSize: 11, fontWeight: '800' },
  cancelBtn: { padding: 4 },
  cancelCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF1F2', justifyContent: 'center', alignItems: 'center' },
  xIcon: { color: '#F43F5E', fontSize: 22, fontWeight: 'bold', lineHeight: 28 },
  emptyBox: { padding: 60, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' }
});

export default AdminDashboardScreen;