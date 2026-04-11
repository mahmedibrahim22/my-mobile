import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Platform,
} from "react-native";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import axiosInstance from "../../../api/axiosInstance";

interface Doctor {
  _id: string;
  name: string;
  image: string;
  speciality: string;
  available: boolean;
}

const DoctorsListScreen = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation<any>();
  const { token } = useSelector((state: any) => state.auth || state.user);

  /**
   * ✅ جلب الأطباء - دالة مركزية لجلب البيانات
   */
  const getAllDoctors = async () => {
    try {
      const { data } = await axiosInstance.get("admin/all-doctors", {
        headers: { atoken: token } 
      });

      if (data.success) {
        setDoctors(data.doctors);
      }
    } catch (error: any) {
      console.error("❌ Fetch Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * ✅ تحديث القائمة عند السحب (Pull to Refresh)
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getAllDoctors();
  }, [token]);

  /**
   * ✅ حل مشكلة عدم التحديث عند العودة من التعديل
   * نستخدم navigation.addListener('focus') لضمان جلب البيانات في كل مرة تظهر الشاشة
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (token) {
        getAllDoctors();
      }
    });

    return unsubscribe; // تنظيف الـ listener عند مسح الشاشة من الذاكرة
  }, [navigation, token]);

  /**
   * ✅ تغيير التوفر
   */
  const changeAvailability = async (docId: string) => {
    try {
      const { data } = await axiosInstance.post(
        "admin/change-availability",
        { docId },
        { headers: { atoken: token } }
      );
      if (data.success) {
        setDoctors((prev) =>
          prev.map((doc) =>
            doc._id === docId ? { ...doc, available: !doc.available } : doc,
          )
        );
      }
    } catch (error) {
      Alert.alert("خطأ", "فشل في تغيير حالة التوفر");
    }
  };

  /**
   * ✅ حذف طبيب
   */
  const handleDelete = (docId: string) => {
    Alert.alert("حذف طبيب", "هل أنت متأكد من حذف هذا الطبيب نهائياً؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          try {
            const { data } = await axiosInstance.post(
              "admin/delete-doctor",
              { docId },
              { headers: { atoken: token } }
            );
            if (data.success) {
              Alert.alert("نجاح", "تم حذف الطبيب بنجاح");
              getAllDoctors();
            }
          } catch (error) {
            Alert.alert("خطأ", "فشل في عملية الحذف");
          }
        },
      },
    ]);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  const renderDoctorCard = ({ item }: { item: Doctor }) => (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image
          source={
            item.image && item.image !== "" 
              ? { uri: item.image } 
              : require("../../../../assets/images/default_doctor.png") 
          }
          style={styles.docImage}
        />
        <View style={[styles.statusDot, { backgroundColor: item.available ? "#10b981" : "#f43f5e" }]} />
      </View>

      <Text style={styles.specialityText}>{item.speciality}</Text>
      <Text style={styles.nameText} numberOfLines={1}>د. {item.name}</Text>

      <View style={styles.availabilityRow}>
        <Switch
          value={item.available}
          onValueChange={() => changeAvailability(item._id)}
          trackColor={{ false: "#e2e8f0", true: "#ccfbf1" }}
          thumbColor={item.available ? "#0d9488" : "#94a3b8"}
        />
        <Text style={[styles.availabilityLabel, { color: item.available ? "#0d9488" : "#94a3b8" }]}>
          {item.available ? "متاح" : "غير متاح"}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate("EditDoctor", { docId: item._id })}>
          <Text style={styles.editBtnText}>تعديل</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
          <Text style={styles.deleteBtnText}>حذف</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.countBadge}><Text style={styles.countText}>الإجمالي: {doctors.length}</Text></View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.headerTitle}>طاقم الأطباء</Text>
          <Text style={styles.headerSubtitle}>إدارة سجلات النظام</Text>
        </View>
      </View>

      <FlatList
        data={doctors}
        keyExtractor={(item) => item._id}
        renderItem={renderDoctorCard}
        numColumns={2}
        columnWrapperStyle={styles.flatListRow}
        contentContainerStyle={styles.listPadding}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0d9488"]} />}
        ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>لا يوجد أطباء مسجلين</Text></View>}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", marginTop: Platform.OS === 'android' ? 10 : 0 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#0f172a" },
  headerSubtitle: { fontSize: 12, color: "#64748b" },
  countBadge: { backgroundColor: "#f1f5f9", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  countText: { fontSize: 12, color: "#334155", fontWeight: "bold" },
  listPadding: { padding: 10, paddingBottom: 100 },
  flatListRow: { justifyContent: "space-between" },
  card: { backgroundColor: "#fff", width: "48%", borderRadius: 20, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: "#f1f5f9", alignItems: "center", elevation: 3 },
  imageContainer: { position: "relative", marginBottom: 10 },
  docImage: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#f8fafc" },
  statusDot: { position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: "#fff" },
  specialityText: { fontSize: 10, color: "#0d9488", fontWeight: "bold", marginBottom: 4 },
  nameText: { fontSize: 14, fontWeight: "bold", color: "#1e293b", marginBottom: 10 },
  availabilityRow: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: "#f8fafc", padding: 5, borderRadius: 10, marginBottom: 10, gap: 5 },
  availabilityLabel: { fontSize: 10 },
  actionsRow: { flexDirection: "row-reverse", width: "100%", gap: 5 },
  editBtn: { flex: 1, backgroundColor: "#0f172a", paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  editBtnText: { color: "#fff", fontSize: 10, fontWeight: 'bold' },
  deleteBtn: { flex: 1, borderWidth: 1, borderColor: "#fee2e2", paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  deleteBtnText: { color: "#ef4444", fontSize: 10, fontWeight: 'bold' },
  emptyContainer: { alignItems: "center", marginTop: 50 },
  emptyText: { color: "#94a3b8" },
});

export default DoctorsListScreen;