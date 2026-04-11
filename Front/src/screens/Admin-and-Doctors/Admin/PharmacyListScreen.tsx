import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Linking,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import axiosInstance from '../../../api/axiosInstance';

// تعريف واجهة بيانات الصيدلية
interface Pharmacy {
  _id: string;
  name: string;
  address: string;
  phone: string;
  active: boolean;
}

const PharmaciesListScreen = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const { token } = useSelector((state: any) => state.user);

  const getAllPharmacies = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get('/admin/all-pharmacies');
      if (data.success) {
        setPharmacies(data.pharmacies);
      }
    } catch (error) {
      console.error("Fetch Pharmacies Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "حذف صيدلية",
      "هل أنت متأكد من حذف هذه الصيدلية نهائياً من شبكة عون؟",
      [
        { text: "إلغاء", style: "cancel" },
        { 
          text: "حذف", 
          style: "destructive", 
          onPress: async () => {
            try {
              const { data } = await axiosInstance.post('/admin/delete-pharmacy', { id });
              if (data.success) getAllPharmacies();
            } catch (error) {
              Alert.alert("خطأ", "فشل في عملية الحذف");
            }
          } 
        }
      ]
    );
  };

  const makeCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  useEffect(() => {
    if (token) getAllPharmacies();
  }, [token]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  const renderPharmacyCard = ({ item }: { item: Pharmacy }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Text style={{ fontSize: 24 }}>💊</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.pharmacyName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.active ? '#ecfdf5' : '#fff1f2' }]}>
             <Text style={[styles.statusText, { color: item.active ? '#059669' : '#e11d48' }]}>
                {item.active ? 'نشط' : 'متوقف'}
             </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoValue}>{item.address}</Text>
          <Text style={styles.infoLabel}>📍 العنوان:</Text>
        </View>
        <TouchableOpacity onPress={() => makeCall(item.phone)} style={styles.infoRow}>
          <Text style={[styles.infoValue, styles.phoneText]}>{item.phone}</Text>
          <Text style={styles.infoLabel}>📞 التواصل:</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={styles.editBtn} 
          onPress={() => navigation.navigate('EditPharmacy', { id: item._id })}
        >
          <Text style={styles.editBtnText}>تعديل البيانات</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteBtn} 
          onPress={() => handleDelete(item._id)}
        >
          <Text style={{ color: '#ef4444' }}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>الإجمالي: {pharmacies.length}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.headerTitle}>الصيدليات المتعاقدة</Text>
          <Text style={styles.headerSubtitle}>إدارة وتتبع شبكة عون</Text>
        </View>
      </View>

      <FlatList
        data={pharmacies}
        keyExtractor={(item) => item._id}
        renderItem={renderPharmacyCard}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>لا توجد صيدليات مسجلة حالياً</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  headerSubtitle: { fontSize: 13, color: '#64748b', fontWeight: '500', marginTop: 2 },
  countBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  countText: { fontSize: 11, color: '#334155', fontWeight: 'bold' },
  listPadding: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 20 },
  iconContainer: { 
    width: 54, 
    height: 54, 
    borderRadius: 18, 
    backgroundColor: '#f0fdfa', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  titleContainer: { flex: 1, marginRight: 15, alignItems: 'flex-end' },
  pharmacyName: { fontSize: 18, fontWeight: '900', color: '#1e293b', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '900' },
  infoSection: { 
    backgroundColor: '#f8fafc', 
    padding: 15, 
    borderRadius: 20, 
    marginBottom: 20,
    gap: 12
  },
  infoRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  infoValue: { fontSize: 12, fontWeight: '800', color: '#475569', flex: 1, textAlign: 'right', marginLeft: 10 },
  phoneText: { color: '#0d9488', textDecorationLine: 'underline' },
  actionsRow: { flexDirection: 'row-reverse', gap: 10 },
  editBtn: { 
    flex: 1, 
    backgroundColor: '#0f172a', 
    paddingVertical: 14, 
    borderRadius: 15, 
    alignItems: 'center' 
  },
  editBtnText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  deleteBtn: { 
    width: 50, 
    borderWidth: 1, 
    borderColor: '#fee2e2', 
    borderRadius: 15, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94a3b8', fontWeight: 'bold' }
});

export default PharmaciesListScreen;