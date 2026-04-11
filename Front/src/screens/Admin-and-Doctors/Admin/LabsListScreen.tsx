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
import axiosInstance from '../../../api/axiosInstance'; // افترضنا وجوده في مشروعك

// تعريف واجهة بيانات المعمل (Interface)
interface Lab {
  _id: string;
  name: string;
  phone?: string;
  homeService: boolean;
}

const LabsListScreen = () => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const { token } = useSelector((state: any) => state.user);

  const getAllLabs = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get('/admin/all-labs');
      if (data.success) {
        setLabs(data.labsData || []);
      }
    } catch (error) {
      console.error("Fetch Labs Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "حذف معمل",
      "هل أنت متأكد من حذف هذا المعمل من النظام؟",
      [
        { text: "تراجع", style: "cancel" },
        { 
          text: "تأكيد الحذف", 
          style: "destructive", 
          onPress: async () => {
            try {
              const { data } = await axiosInstance.post('/admin/delete-lab', { id });
              if (data.success) getAllLabs();
            } catch (error) {
              Alert.alert("خطأ", "فشل في عملية الحذف");
            }
          } 
        }
      ]
    );
  };

  useEffect(() => {
    if (token) getAllLabs();
  }, [token]);

  const renderLabCard = ({ item }: { item: Lab }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrapper}>
          <Text style={{ fontSize: 22 }}>🔬</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.labName}>{item.name}</Text>
          <View style={[styles.badge, item.homeService ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={[styles.badgeText, { color: item.homeService ? '#059669' : '#64748b' }]}>
              {item.homeService ? 'خدمة منزلية متاحة' : 'لا يوجد خدمة منزلية'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardBody}>
        <TouchableOpacity 
          onPress={() => item.phone && Linking.openURL(`tel:${item.phone}`)}
          style={styles.infoRow}
        >
          <Text style={[styles.infoText, item.phone ? styles.linkText : null]}>
            {item.phone || "غير مسجل"}
          </Text>
          <Text style={styles.infoLabel}>الهاتف:</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.editBtn} 
          onPress={() => navigation.navigate('EditLab', { labId: item._id })}
        >
          <Text style={styles.editBtnText}>تعديل</Text>
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
      {/* Header المخصص للتطبيق */}
      <View style={styles.screenHeader}>
        <View style={styles.countTag}>
          <Text style={styles.countText}>{labs.length} سجل</Text>
        </View>
        <View>
          <Text style={styles.title}>معامل التحاليل</Text>
          <Text style={styles.subtitle}>شركاء الخدمة الطبية في عَوْن</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={styles.loadingText}>جاري جلب السجلات...</Text>
        </View>
      ) : (
        <FlatList
          data={labs}
          keyExtractor={(item) => item._id}
          renderItem={renderLabCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>لا توجد معامل حالياً</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfdfd' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  screenHeader: {
    padding: 24,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  title: { fontSize: 24, fontWeight: '900', color: '#1e293b', textAlign: 'right' },
  subtitle: { fontSize: 12, color: '#94a3b8', fontWeight: '700', textAlign: 'right' },
  countTag: { backgroundColor: '#f0fdfa', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  countText: { color: '#0d9488', fontSize: 12, fontWeight: '900' },
  listContainer: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 15 },
  iconWrapper: { 
    width: 50, 
    height: 50, 
    borderRadius: 15, 
    backgroundColor: '#f8fafc', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerInfo: { flex: 1, marginRight: 12, alignItems: 'flex-end' },
  labName: { fontSize: 17, fontWeight: '900', color: '#0f172a' },
  badge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  activeBadge: { backgroundColor: '#ecfdf5' },
  inactiveBadge: { backgroundColor: '#f1f5f9' },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  cardBody: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 16, marginBottom: 15 },
  infoRow: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  infoLabel: { fontSize: 12, color: '#94a3b8', fontWeight: 'bold' },
  infoText: { fontSize: 13, color: '#475569', fontWeight: '900' },
  linkText: { color: '#0d9488', textDecorationLine: 'underline' },
  actions: { flexDirection: 'row-reverse', gap: 10 },
  editBtn: { 
    flex: 1, 
    backgroundColor: '#0f172a', 
    paddingVertical: 12, 
    borderRadius: 14, 
    alignItems: 'center' 
  },
  editBtnText: { color: '#fff', fontWeight: '900' },
  deleteBtn: { 
    width: 50, 
    borderWidth: 1, 
    borderColor: '#fee2e2', 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { marginTop: 10, color: '#94a3b8', fontWeight: 'bold' },
  emptyState: { marginTop: 100, alignItems: 'center' },
  emptyTitle: { color: '#cbd5e1', fontSize: 16, fontWeight: 'bold' }
});

export default LabsListScreen;