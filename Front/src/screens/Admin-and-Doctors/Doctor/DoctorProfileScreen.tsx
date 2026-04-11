import React, { useState, useContext, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
  Modal,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { MotiView, AnimatePresence } from 'moti'; // تأكد من تثبيت moti
import { DoctorContext } from '../../../context/DoctorContext';
import { AppContext } from '../../../context/AppContext';

// دالة تنسيق الحجم (يمكنك وضعها في ملف utils)
const formatBytes = (bytes: number, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

interface Address {
  line1: string;
  line2?: string;
}

export interface ProfileData {
  _id: string;
  name: string;
  image: string;
  speciality: string;
  degree: string;
  experience: string;
  about: string;
  fees: string | number;
  address: Address;
  available: boolean;
  whatsapp?: string;
}

const DoctorProfileScreen = () => {
  const doctorCtx = useContext(DoctorContext);
  const appCtx = useContext(AppContext);

  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // حالة إشعار حجم الصورة
  const [sizeBadge, setSizeBadge] = useState<{ visible: boolean; size: string }>({
    visible: false,
    size: ""
  });

  const dToken = doctorCtx?.dToken;
  const profileData = doctorCtx?.profileData;
  const setProfileData = doctorCtx?.setProfileData;
  const getProfileData = doctorCtx?.getProfileData;
  const backendUrl = doctorCtx?.backendUrl;
  const currency = appCtx?.currency || 'EGP';

  const specialityTranslation: Record<string, string> = {
    'General physician': 'طبيب عام',
    'Gynecologist': 'أمراض نساء وتوليد',
    'Dermatologist': 'جلدية وتجميل',
    'Pediatricians': 'طب الأطفال',
    'Neurologist': 'مخ وأعصاب',
    'Gastroenterologist': 'باطنة وجهاز هضمي',
    'Cardiologist': 'أمراض القلب',
    'Orthopedic': 'عظام وجراحة مفاصل',
    'Dentist': 'أسنان',
    'Ophthalmologist': 'رمد وعيون',
    'Urologist': 'مسالك بولية',
    'Lab Consultant': 'تحاليل طبية',
    'Physiotherapist': 'علاج طبيعي',
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("خطأ", "نحتاج صلاحية الوصول للصور");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const MAX_SIZE = 1.5 * 1024 * 1024; // 1.5 MB
      const formattedSize = formatBytes(asset.fileSize || 0);

      // --- Console Logs (نفس منطقك المفضل) ---
      console.log("------ Image Selected (Doctor) ------");
      console.log("Name:", asset.fileName || "unknown");
      console.log("Size:", asset.fileSize, "Bytes");
      console.log("Size (Formatted):", formattedSize);
      console.log("Status:", asset.fileSize && asset.fileSize > MAX_SIZE ? "❌ TOO LARGE" : "✅ OK");
      console.log("-------------------------------------");

      // إظهار إشعار الحجم تحت الصورة
      setSizeBadge({ visible: true, size: formattedSize });
      setTimeout(() => setSizeBadge(prev => ({ ...prev, visible: false })), 4000);

      if (asset.fileSize && asset.fileSize > MAX_SIZE) {
        Alert.alert(
          "تنبيه",
          `حجم الصورة كبير جداً (${formattedSize}).\nالحد الأقصى المسموح به هو 1.5 ميجا.`
        );
        return;
      }

      setSelectedImage(asset);
    }
  };

  const updateProfile = async () => {
    if (!profileData || !setProfileData || !getProfileData) return;

    if (profileData.whatsapp && profileData.whatsapp.length !== 11) {
      return Alert.alert('تنبيه', 'رقم الواتساب يجب أن يكون 11 رقم');
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('docId', profileData._id);
      formData.append('name', profileData.name);
      formData.append('about', profileData.about);
      formData.append('fees', String(profileData.fees));
      formData.append('address', JSON.stringify(profileData.address));
      formData.append('whatsapp', profileData.whatsapp || '');
      formData.append('available', String(profileData.available));

      if (selectedImage) {
        const uri = selectedImage.uri;
        const filename = uri.split("/").pop() || "profile.jpg";
        const type = selectedImage.mimeType || "image/jpeg";

        formData.append('image', {
          uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
          name: filename,
          type: type,
        } as any);
      }

      const { data } = await axios.post(`${backendUrl}/api/doctor/update-profile`, formData, {
        headers: {
          dtoken: dToken,
          'Content-Type': 'multipart/form-data'
        },
      });

      if (data.success) {
        Alert.alert('نجاح', 'تم تحديث الملف بنجاح ✅');
        setIsEdit(false);
        setSelectedImage(null);
        await getProfileData();
      }
    } catch (error: any) {
      Alert.alert('خطأ', error.response?.data?.message || 'حدث خطأ أثناء حفظ التعديلات');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    if (!doctorCtx?.changeAvailability) return;
    try {
      setLoading(true);
      await doctorCtx.changeAvailability();
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تغيير الحالة');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (!doctorCtx) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d9488" />
        <Text style={styles.loadingText}>جاري تهيئة البيانات...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={isEdit ? updateProfile : () => setIsEdit(true)}
                  style={[styles.editBtn, isEdit && { backgroundColor: '#0d9488' }]}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                    <Text style={styles.editBtnText}>{isEdit ? 'حفظ التعديلات' : 'تعديل'}</Text>
                  )}
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                  <Text style={styles.headerTitle}>الملف الشخصي</Text>
                  <Text style={styles.headerSubtitle}>DOCTOR PROFILE SETTINGS</Text>
                </View>
              </View>

              <View style={styles.heroCard}>
                <View style={styles.rowReverse}>
                  <View style={{alignItems: 'center'}}>
                    <TouchableOpacity disabled={!isEdit} onPress={pickImage} style={styles.imageWrapper}>
                      <Image
                        source={{ uri: selectedImage?.uri || profileData?.image }}
                        style={[styles.profileImg, isEdit && { opacity: 0.8 }]}
                      />
                      {isEdit && (
                        <View style={styles.cameraIcon}>
                          <Ionicons name="camera" size={12} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* إشعار حجم الصورة الخافت */}
                    <AnimatePresence>
                      {sizeBadge.visible && (
                        <MotiView
                          from={{ opacity: 0, scale: 0.8, translateY: -5 }}
                          animate={{ opacity: 1, scale: 1, translateY: 0 }}
                          exit={{ opacity: 0 }}
                          style={styles.sizeBadge}
                        >
                          <Text style={styles.sizeBadgeText}>{sizeBadge.size}</Text>
                        </MotiView>
                      )}
                    </AnimatePresence>
                  </View>

                  <View style={styles.mainInfo}>
                    {isEdit ? (
                      <TextInput
                        style={styles.nameInput}
                        value={profileData?.name}
                        onChangeText={(val) => setProfileData?.({ ...profileData!, name: val })}
                        textAlign="right"
                      />
                    ) : (
                      <Text style={styles.docName}>{profileData?.name}</Text>
                    )}
                    <Text style={styles.specText}>
                      {profileData?.degree} — {specialityTranslation[profileData?.speciality || ''] || profileData?.speciality}
                    </Text>
                    <View style={styles.badgeRow}>
                      <View style={styles.badge}><Text style={styles.badgeText}>{profileData?.experience} خبرة</Text></View>
                      <View style={[styles.badge, { backgroundColor: 'rgba(45, 212, 191, 0.1)' }]}>
                        <Text style={[styles.badgeText, { color: '#0d9488' }]}>{profileData?.fees} {currency} / كشف</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.availabilityRow}>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.availText, { color: profileData?.available ? '#0d9488' : '#94a3b8' }]}>
                      {profileData?.available ? 'متاح الآن' : 'غير متاح'}
                    </Text>
                    <Text style={{ fontSize: 9, color: '#94a3b8' }}>ظهورك للمرضى في البحث</Text>
                  </View>
                  <Switch
                    value={profileData?.available || false}
                    onValueChange={() => setShowConfirm(true)}
                    trackColor={{ false: '#cbd5e1', true: '#0d9488' }}
                    thumbColor={Platform.OS === 'ios' ? undefined : '#fff'}
                  />
                </View>
              </View>

              <View style={styles.inputsSection}>
                <View style={styles.gridRow}>
                  <View style={styles.gridItem}>
                    <Text style={styles.label}>سعر الكشف ({currency})</Text>
                    <TextInput
                      editable={isEdit}
                      keyboardType="numeric"
                      style={[styles.input, !isEdit && styles.disabledInput]}
                      value={String(profileData?.fees || '')}
                      onChangeText={(val) => setProfileData?.({ ...profileData!, fees: val })}
                      textAlign="right"
                    />
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.label}>رقم الواتساب</Text>
                    <TextInput
                      editable={isEdit}
                      keyboardType="phone-pad"
                      maxLength={11}
                      style={[styles.input, !isEdit && styles.disabledInput]}
                      value={profileData?.whatsapp}
                      placeholder="01xxxxxxxxx"
                      onChangeText={(val) => {
                        let filtered = val.replace(/[^0-9]/g, '');
                        setProfileData?.({ ...profileData!, whatsapp: filtered });
                      }}
                      textAlign="right"
                    />
                  </View>
                </View>

                <Text style={styles.label}>العنوان</Text>
                <TextInput
                  editable={isEdit}
                  style={[styles.input, !isEdit && styles.disabledInput]}
                  value={profileData?.address.line1}
                  onChangeText={(val) => setProfileData?.({ ...profileData!, address: { ...profileData!.address, line1: val } })}
                  textAlign="right"
                />

                <Text style={styles.label}>نبذة عن الطبيب</Text>
                <TextInput
                  editable={isEdit}
                  multiline
                  numberOfLines={4}
                  style={[styles.input, styles.textArea, !isEdit && styles.disabledInput]}
                  value={profileData?.about}
                  onChangeText={(val) => setProfileData?.({ ...profileData!, about: val })}
                  textAlign="right"
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal التأكيد */}
      <Modal transparent visible={showConfirm} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>تغيير الحالة؟</Text>
            <Text style={styles.modalSub}>هل أنت متأكد من تغيير حالة تواجدك على المنصة حالياً؟</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setShowConfirm(false)} style={styles.modalBtnCancel}>
                <Text style={styles.modalBtnTextCancel}>تراجع</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleAvailability} style={styles.modalBtnConfirm}>
                <Text style={styles.modalBtnTextConfirm}>تأكيد</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 12, color: '#64748b', fontWeight: '700' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff'
  },
  headerInfo: { alignItems: 'flex-end' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  headerSubtitle: { fontSize: 10, color: '#94a3b8', fontWeight: '900', letterSpacing: 1 },
  editBtn: { backgroundColor: '#1e293b', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, minWidth: 100, alignItems: 'center' },
  editBtnText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  heroCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15
  },
  rowReverse: { flexDirection: 'row-reverse', alignItems: 'center' },
  imageWrapper: { position: 'relative' },
  profileImg: { width: 100, height: 100, borderRadius: 24, backgroundColor: '#f1f5f9', borderWidth: 2, borderColor: '#f1f5f9' },
  cameraIcon: {
    position: 'absolute', bottom: -4, right: -4,
    backgroundColor: '#0d9488', padding: 6, borderRadius: 10, borderWidth: 3, borderColor: '#fff'
  },
  
  // ستايل حجم الصورة المعدل
  sizeBadge: {
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(13, 148, 136, 0.2)',
  },
  sizeBadgeText: { color: "#64748b", fontSize: 9, fontWeight: "800" },

  mainInfo: { flex: 1, marginRight: 15, alignItems: 'flex-end' },
  docName: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  nameInput: { fontSize: 18, fontWeight: '900', color: '#0d9488', borderBottomWidth: 1, borderColor: '#0d9488', padding: 0, width: '100%' },
  specText: { fontSize: 13, color: '#0d9488', fontWeight: '800', marginTop: 4 },
  badgeRow: { flexDirection: 'row-reverse', gap: 6, marginTop: 12 },
  badge: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '900', color: '#475569' },
  availabilityRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1, borderTopColor: '#f1f5f9'
  },
  availText: { fontSize: 12, fontWeight: '900' },
  inputsSection: { paddingHorizontal: 20 },
  gridRow: { flexDirection: 'row-reverse', gap: 12 }, 
  gridItem: { flex: 1 },
  label: { fontSize: 11, fontWeight: '900', color: '#94a3b8', marginTop: 18, marginBottom: 8, textAlign: 'right', textTransform: 'uppercase' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    borderRadius: 12,
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700'
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  disabledInput: { backgroundColor: '#f8fafc', borderColor: '#f1f5f9', color: '#64748b' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '85%', borderRadius: 25, padding: 25, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 10 },
  modalSub: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 25 },
  modalButtons: { flexDirection: 'row', gap: 10, width: '100%' },
  modalBtnConfirm: { flex: 1, backgroundColor: '#0d9488', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalBtnTextConfirm: { color: '#fff', fontWeight: '900' },
  modalBtnTextCancel: { color: '#475569', fontWeight: '900' },
});

export default DoctorProfileScreen;