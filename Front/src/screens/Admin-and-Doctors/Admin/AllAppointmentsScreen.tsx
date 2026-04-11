import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import axiosInstance from '../../../api/axiosInstance';

// تعاريف الـ TypeScript لضمان استقرار البيانات
interface Appointment {
  _id: string;
  userData: { name: string; image: string; phone: string; };
  docData: { name: string; image: string; };
  slotDate: string;
  slotTime: string;
  cancelled: boolean;
  isCompleted: boolean;
}

const AllAppointmentsScreen = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // سحب التوكن من الريدكس
  const { token } = useSelector((state: any) => state.user);

  // دالة جلب المواعيد من السيرفر
  const fetchAppointments = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      console.log("🚀 [System] Requesting Appointments...");
      
      // ✅ تم التصحيح: حذف '/api' من البداية لأنها موجودة في الـ axiosInstance
      // تم استخدام 'admin/appointments' مباشرة
      const { data } = await axiosInstance.get('admin/appointments', {
        headers: { atoken: token }
      });

      if (data.success) {
        // ترتيب المواعيد لعرض الأحدث أولاً
        setAppointments(data.appointments.reverse());
        console.log("✅ [System] Data Fetched Successfully");
      } else {
        console.warn("⚠️ فشل جلب المواعيد:", data.message);
        Alert.alert("تنبيه", data.message || "فشل جلب البيانات");
      }
    } catch (error: any) {
      console.error("❌ Fetch Error Log:", error.response?.data || error.message);
      // التحقق من نوع الخطأ 404 تحديداً لإرشاد المطور
      if (error.response?.status === 404) {
         console.error("🚨 خطأ 404: المسار غير موجود. تأكد من الـ Endpoint في الباك إند.");
      }
      Alert.alert("خطأ في الاتصال", "تعذر تحديث سجل المواعيد من نظام عَوْن");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { 
    if (token) {
      fetchAppointments(); 
    }
  }, [token, fetchAppointments]);

  // إدارة الاختيار المتعدد
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    Alert.alert(
      "تأكيد الحذف الجماعي", 
      `هل تريد حقاً مسح ${selectedIds.length} موعد مختار من السجل؟`, 
      [
        { text: "تراجع", style: 'cancel' },
        { 
          text: "تأكيد", 
          style: 'destructive', 
          onPress: async () => {
            // تنفيذ منطق الحذف هنا مستقبلاً
            setSelectedIds([]);
            fetchAppointments();
          } 
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Appointment }) => {
    const isSelected = selectedIds.includes(item._id);
    
    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onLongPress={() => toggleSelect(item._id)}
        onPress={() => (selectedIds.length > 0 ? toggleSelect(item._id) : null)}
        style={[styles.card, isSelected && styles.selectedCard]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.doctorInfo}>
            <Image 
                source={item.docData?.image ? { uri: item.docData.image } : require('../../../../assets/images/default_doctor.png')} 
                style={styles.miniAvatar}
            />
            <Text style={styles.docName}>د. {item.docData?.name || 'غير معروف'}</Text>
          </View>
          <View style={[styles.statusBadge, 
            item.cancelled ? styles.bgRed : item.isCompleted ? styles.bgGreen : styles.bgBlue]}>
            <Text style={[styles.statusText, { color: item.cancelled ? '#ef4444' : item.isCompleted ? '#10b981' : '#3b82f6' }]}>
              {item.cancelled ? 'ملغي' : item.isCompleted ? 'مكتمل' : 'نشط'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBody}>
          <View style={styles.patientRow}>
            <Image 
              source={item.userData?.image ? { uri: item.userData.image } : require('../../../../assets/images/default_doctor.png')} 
              style={styles.avatar} 
            />
            <View style={{ marginRight: 12 }}>
              <Text style={styles.patientName}>{item.userData?.name || 'مريض'}</Text>
              <Text style={styles.patientPhone}>{item.userData?.phone || 'بدون هاتف'}</Text>
            </View>
          </View>
          <View style={styles.timeBox}>
            <Text style={styles.dateText}>{item.slotDate}</Text>
            <Text style={styles.timeText}>{item.slotTime}</Text>
          </View>
        </View>

        {isSelected && <View style={styles.selectionIndicator} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenHeader}>
        <View style={styles.headerContent}>
          {selectedIds.length > 0 ? (
            <TouchableOpacity style={styles.bulkDeleteBtn} onPress={handleBulkDelete}>
              <Text style={styles.bulkDeleteText}>حذف المختار ({selectedIds.length})</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerInfo}>
              <Text style={styles.title}>سجل المواعيد</Text>
              <Text style={styles.subtitle}>متابعة كافة حجوزات منصة عَوْن</Text>
            </View>
          )}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#2dd4bf" />
          <Text style={{ marginTop: 10, color: '#64748b' }}>جاري تحميل البيانات...</Text>
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
                refreshing={refreshing} 
                onRefresh={() => fetchAppointments(true)} 
                colors={["#2dd4bf"]} 
                tintColor="#2dd4bf" 
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.empty}>لا توجد مواعيد مسجلة حالياً</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  screenHeader: { 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e2e8f0',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    zIndex: 10,
  },
  headerContent: {
    height: 90,
    paddingHorizontal: 20,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 0 : 10
  },
  headerInfo: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#0f172a',
  },
  subtitle: { 
    fontSize: 12, 
    color: '#64748b', 
    fontWeight: '600' 
  },
  list: { padding: 16, paddingBottom: 40 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 15,
    borderWidth: 1, 
    borderColor: '#f1f5f9', 
    elevation: 3, 
    shadowColor: '#64748b',
    shadowOpacity: 0.08, 
    shadowRadius: 12, 
    overflow: 'hidden',
  },
  selectedCard: { 
    borderColor: '#2dd4bf', 
    backgroundColor: '#f0fdfa' 
  },
  cardHeader: { 
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  doctorInfo: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center' 
  },
  miniAvatar: { 
    width: 32, 
    height: 32, 
    borderRadius: 10, 
    marginLeft: 10,
    backgroundColor: '#f1f5f9'
  },
  docName: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#334155' 
  },
  statusBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8 
  },
  statusText: { 
    fontSize: 11, 
    fontWeight: 'bold' 
  },
  bgRed: { backgroundColor: '#fef2f2' }, 
  bgGreen: { backgroundColor: '#ecfdf5' }, 
  bgBlue: { backgroundColor: '#eff6ff' },
  divider: { 
    height: 1, 
    backgroundColor: '#f1f5f9', 
    marginVertical: 12 
  },
  cardBody: { 
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  patientRow: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center',
    flex: 1
  },
  avatar: { 
    width: 45, 
    height: 45, 
    borderRadius: 12,
    backgroundColor: '#f1f5f9'
  },
  patientName: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: '#0f172a', 
    textAlign: 'right' 
  },
  patientPhone: { 
    fontSize: 12, 
    color: '#2dd4bf', 
    fontWeight: '700',
    marginTop: 2
  },
  timeBox: { 
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  dateText: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#1e293b' 
  },
  timeText: { 
    fontSize: 11, 
    color: '#64748b', 
    fontWeight: '600' 
  },
  bulkDeleteBtn: { 
    backgroundColor: '#ef4444', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 12,
  },
  bulkDeleteText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  selectionIndicator: { 
    position: 'absolute', 
    right: 0, 
    top: 0, 
    bottom: 0, 
    width: 4, 
    backgroundColor: '#2dd4bf' 
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100
  },
  empty: { 
    color: '#94a3b8', 
    fontWeight: '700',
    fontSize: 16
  }
});

export default AllAppointmentsScreen;