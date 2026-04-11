import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import axiosInstance from '../../../api/axiosInstance'; // تأكد من المسار حسب مشروعك

// تعريف الواجهة (Interface) لضبط الأنواع
interface DeliveryPersonnel {
  _id: string;
  name: string;
  phone: string;
  isAvailable: boolean;
}

const DeliveryListScreen = () => {
  const [deliveryData, setDeliveryData] = useState<DeliveryPersonnel[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useSelector((state: any) => state.user);

  const getAllDelivery = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get('/admin/all-delivery');
      if (data.success) {
        setDeliveryData(data.deliveryData || []);
      }
    } catch (error) {
      console.error("Fetch Delivery Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const changeAvailability = async (id: string) => {
    try {
      const { data } = await axiosInstance.post('/admin/change-availability-delivery', { id });
      if (data.success) {
        // تحديث محلي سريع لتحسين تجربة المستخدم (Optimistic Update)
        setDeliveryData(prev => 
          prev.map(item => item._id === id ? { ...item, isAvailable: !item.isAvailable } : item)
        );
      }
    } catch (error) {
      Alert.alert("خطأ", "فشل في تغيير حالة التوافر");
    }
  };

  useEffect(() => {
    if (token) getAllDelivery();
  }, [token]);

  const renderDeliveryCard = ({ item }: { item: DeliveryPersonnel }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.iconBox}>
          <Text style={{ fontSize: 28 }}>🚴‍♂️</Text>
        </View>
        <View style={styles.switchBox}>
          <Switch
            value={item.isAvailable}
            onValueChange={() => changeAvailability(item._id)}
            trackColor={{ false: "#cbd5e1", true: "#0d9488" }}
            thumbColor={item.isAvailable ? "#fff" : "#f4f3f4"}
          />
          <Text style={[styles.statusMini, { color: item.isAvailable ? '#0d9488' : '#94a3b8' }]}>
            {item.isAvailable ? 'متاح' : 'مغلق'}
          </Text>
        </View>
      </View>

      <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.phoneText}>{item.phone}</Text>

      <View style={[styles.statusBadge, { backgroundColor: item.isAvailable ? '#f0fdfa' : '#f8fafc' }]}>
        <View style={[styles.dot, { backgroundColor: item.isAvailable ? '#0d9488' : '#cbd5e1' }]} />
        <Text style={[styles.badgeText, { color: item.isAvailable ? '#0d9488' : '#64748b' }]}>
          {item.isAvailable ? 'نشط الآن' : 'خارج الخدمة'}
        </Text>
      </View>

      <TouchableOpacity style={styles.freezeBtn}>
        <Text style={styles.freezeText}>تجميد الحساب</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{deliveryData.length} مندوب</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.headerTitle}>مناديب التوصيل</Text>
          <Text style={styles.headerSubtitle}>متابعة حالة شبكة عون</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : (
        <FlatList
          data={deliveryData}
          keyExtractor={(item) => item._id}
          renderItem={renderDeliveryCard}
          numColumns={2}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ color: '#94a3b8', fontWeight: 'bold' }}>لا يوجد مناديب مسجلين</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    padding: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  headerSubtitle: { fontSize: 12, color: '#94a3b8', fontWeight: '700' },
  badge: { backgroundColor: '#fff7ed', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeLabel: { color: '#f97316', fontSize: 12, fontWeight: '900' },
  list: { padding: 10 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 8,
    padding: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 15 },
  iconBox: { width: 50, height: 50, backgroundColor: '#fff7ed', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  switchBox: { alignItems: 'center' },
  statusMini: { fontSize: 9, fontWeight: '900', marginTop: 2 },
  nameText: { fontSize: 15, fontWeight: '900', color: '#1e293b', textAlign: 'right', marginBottom: 2 },
  phoneText: { fontSize: 11, color: '#94a3b8', fontWeight: '700', textAlign: 'right', marginBottom: 12 },
  statusBadge: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    alignSelf: 'flex-end', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 10,
    gap: 6
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 10, fontWeight: '900' },
  freezeBtn: { 
    marginTop: 15, 
    backgroundColor: '#f8fafc', 
    paddingVertical: 10, 
    borderRadius: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  freezeText: { color: '#ef4444', fontSize: 11, fontWeight: '900' },
  loader: { flex: 1, justifyContent: 'center' },
  empty: { marginTop: 100, alignItems: 'center' }
});

export default DeliveryListScreen;