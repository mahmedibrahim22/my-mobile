import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView,
  Alert,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import * as ImagePicker from "expo-image-picker";
import { MotiView, AnimatePresence } from 'moti';

import axiosInstance from "../../api/axiosInstance"; 
import { loadUserProfile } from "../../store/slices/UserSlice";
import { AppContext } from "../../context/AppContext";
import { formatBytes } from '../../utils/formatters'; 

interface AppContextType {
  backendUrl: string;
  token: string | boolean;
  loadUserProfileData: () => Promise<void>;
}

const MyProfileScreen = () => {
  const dispatch = useDispatch<any>();
  const { userData, loading: reduxLoading } = useSelector((state: any) => state.user);
  
  const context = useContext(AppContext) as unknown as AppContextType;
  const { loadUserProfileData } = context || {};

  const [isEdit, setIsEdit] = useState(false);
  const [image, setImage] = useState<any>(null);
  const [localName, setLocalName] = useState("");
  const [loading, setLoading] = useState(false); 
  
  // حالة لإظهار حجم الصورة تحتها مؤقتاً
  const [sizeBadge, setSizeBadge] = useState<{ visible: boolean; size: string }>({
    visible: false,
    size: ""
  });

  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: "",
    type: 'success'
  });

  useEffect(() => {
    if (userData?.name) {
      setLocalName(userData.name);
    }
  }, [userData]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  const calculateAge = (dob: string | undefined): string | number => {
    if (!dob) return "—";
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      return age >= 0 ? age : "—";
    } catch (_e) {
      return "—";
    }
  };

  const pickImage = async () => {
    if (!isEdit) return;
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast("نحتاج صلاحية الوصول للصور", 'error');
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
        const MAX_SIZE = 1.5 * 1024 * 1024;
        const formattedSize = formatBytes(asset.fileSize || 0);

        // طباعة البيانات في الكونسول/الترمنال في كل الحالات
        console.log("------ Image Selected ------");
        console.log("Name:", asset.fileName || "unknown");
        console.log("Size:", asset.fileSize, "Bytes");
        console.log("Size (Formatted):", formattedSize);
        console.log("Status:", asset.fileSize && asset.fileSize > MAX_SIZE ? "❌ TOO LARGE" : "✅ OK");
        console.log("----------------------------");

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

        setImage(asset);
        showToast("تم اختيار الصورة بنجاح");
    }
  };

  const updateUserProfileData = async () => {
    if (!localName || localName.trim().length < 3) {
      return showToast("الاسم يجب أن يكون 3 أحرف على الأقل", 'error');
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", localName.trim());
      formData.append("phone", userData?.phone || "");
      
      formData.append("address", JSON.stringify({
        line1: userData?.address?.line1 || "",
        line2: userData?.address?.line2 || ""
      }));

      if (userData?.gender) formData.append("gender", userData.gender);
      if (userData?.dob) formData.append("dob", userData.dob);

      if (image) {
        const uri = image.uri;
        const filename = uri.split("/").pop() || "profile.jpg";
        const type = image.mimeType || "image/jpeg";

        formData.append("image", {
          uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
          name: filename,
          type: type,
        } as any);
      }

      const { data } = await axiosInstance.post(`user/update-profile`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        showToast("تم حفظ التغييرات بنجاح ✅");
        await dispatch(loadUserProfile());
        if (loadUserProfileData) await loadUserProfileData(); 
        setIsEdit(false);
        setImage(null);
      } else {
        showToast(data.message || "فشل التحديث", 'error');
      }
    } catch (error: any) {
      console.error(error);
      showToast("خطأ في الاتصال بالسيرفر", 'error');
    } finally {
      setLoading(false);
    }
  };

  const getImageSource = () => {
    if (image) return { uri: image.uri };
    if (userData?.image) return { uri: userData.image };
    return { uri: "https://static.vecteezy.com/system/resources/thumbnails/009/292/631/small/default-avatar-icon-of-social-media-user-vector.jpg" };
  };

  if (reduxLoading && !userData) return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#2dd4bf" />
    </View>
  );

  return (
    <SafeAreaView style={styles.mainWrapper}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        
        <AnimatePresence>
          {toast.visible && (
            <MotiView
              from={{ opacity: 0, translateY: -50 }}
              animate={{ opacity: 1, translateY: 60 }}
              exit={{ opacity: 0, translateY: -50 }}
              style={styles.toastContainer}
            >
                <View style={[styles.toastContent, toast.type === 'error' && { borderColor: '#ef4444' }]}>
                   <Text style={styles.toastIcon}>{toast.type === 'success' ? '✔️' : '❌'}</Text>
                   <Text style={styles.toastText}>{toast.message}</Text>
                </View>
            </MotiView>
          )}
        </AnimatePresence>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
              
              <MotiView 
                from={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                style={styles.profileHeaderCard}
              >
                <TouchableOpacity onPress={pickImage} activeOpacity={isEdit ? 0.7 : 1}>
                  <View style={styles.imageWrapper}>
                    <Image source={getImageSource()} style={[styles.profileImage, isEdit && { opacity: 0.6 }]} />
                    {isEdit && (
                      <View style={styles.uploadOverlay}>
                         <Text style={styles.uploadText}>{image ? "تغيير" : "اختر وقص"}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* إشعار حجم الصورة تحتها مباشرة */}
                <AnimatePresence>
                  {sizeBadge.visible && (
                    <MotiView
                      from={{ opacity: 0, scale: 0.8, translateY: -10 }}
                      animate={{ opacity: 1, scale: 1, translateY: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      style={styles.sizeBadge}
                    >
                      <Text style={styles.sizeBadgeText}>حجم الصورة: {sizeBadge.size}</Text>
                    </MotiView>
                  )}
                </AnimatePresence>

                <View style={styles.headerInfo}>
                  <Text style={styles.userNameText}>{userData?.name || "مستخدم عون"}</Text>
                  {isEdit && image && (
                     <TouchableOpacity style={styles.reCropBtn} onPress={pickImage}>
                        <Text style={styles.reCropText}>إعادة القص ✂️</Text>
                     </TouchableOpacity>
                  )}
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>عضو عون الموثق</Text>
                  </View>
                </View>
              </MotiView>

              <MotiView 
                from={{ opacity: 0, translateY: 20 }} 
                animate={{ opacity: 1, translateY: 0 }} 
                style={styles.dataCard}
              >
                <SectionHeader title="بيانات الحساب" icon="📱" />
                
                <View style={styles.infoGrid}>
                  <InfoBox
                    label="الاسم الكامل"
                    value={isEdit ? localName : userData?.name}
                    isEdit={isEdit}
                    onChange={(v: string) => setLocalName(v)}
                  />
                  <InfoBox label="رقم الهاتف" value={userData?.phone} readOnly />
                  <InfoBox label="البريد الإلكتروني" value={userData?.email} readOnly />
                  
                  <View style={styles.locationRow}>
                    <View style={styles.flex1}>
                       <InfoBox label="المحافظة" value={userData?.address?.line1} readOnly />
                    </View>
                    <View style={{ width: 15 }} />
                    <View style={styles.flex1}>
                       <InfoBox label="المدينة" value={userData?.address?.line2} readOnly />
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                <SectionHeader title="المعلومات الشخصية" icon="👤" />
                <View style={styles.infoGrid}>
                  <View style={styles.locationRow}>
                     <View style={styles.flex1}>
                         <InfoBox label="الجنس" value={userData?.gender === "Male" ? "ذكر" : "أنثى"} readOnly />
                     </View>
                     <View style={{ width: 15 }} />
                     <View style={styles.flex1}>
                         <InfoBox label="تاريخ الميلاد" value={userData?.dob} readOnly />
                     </View>
                  </View>
                  
                  <View style={styles.ageBadgeContainer}>
                    <Text style={styles.infoLabel}>العمر الحالي</Text>
                    <View style={styles.ageBadge}>
                      <Text style={styles.ageValue}>{calculateAge(userData?.dob)}</Text>
                      <Text style={styles.ageUnit}>سنة</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.actionsContainer}>
                  {isEdit ? (
                    <View style={styles.editActions}>
                      <TouchableOpacity 
                        onPress={() => { 
                          setIsEdit(false); 
                          setImage(null); 
                          setLocalName(userData?.name || "");
                          Keyboard.dismiss();
                        }} 
                        style={styles.cancelBtn}
                        disabled={loading}
                      >
                        <Text style={styles.cancelBtnText}>إلغاء</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={updateUserProfileData} 
                        style={styles.saveBtn}
                        disabled={loading}
                      >
                        {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>حفظ التغييرات</Text>}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => setIsEdit(true)} style={styles.editBtn}>
                      <Text style={styles.editBtnText}>تعديل بيانات الحساب</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </MotiView>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const SectionHeader = ({ title, icon }: { title: string; icon: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionIcon}>{icon}</Text>
  </View>
);

const InfoBox = ({ label, value, isEdit, onChange, readOnly }: any) => (
  <View style={styles.infoBox}>
    <Text style={styles.infoLabel}>{label}</Text>
    {isEdit && !readOnly ? (
      <TextInput
        style={styles.infoInput}
        value={value || ""}
        onChangeText={onChange}
        textAlign="right"
        placeholderTextColor="#94a3b8"
        autoCorrect={false}
        selectionColor="#2dd4bf"
      />
    ) : (
      <View style={styles.infoValueWrapper}>
        <Text style={[styles.infoValue, readOnly && { color: "#94a3b8" }]}>
          {value || "—"}
        </Text>
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: "#0b1120" },
  container: { width: "100%", paddingHorizontal: 15, paddingBottom: 30 },
  scrollView: { flex: 1 },
  scrollContent: { paddingVertical: 10 },
  centerContainer: { flex: 1, backgroundColor: "#0b1120", justifyContent: "center", alignItems: "center" },
  
  toastContainer: { position: 'absolute', top: 0, left: 20, right: 20, zIndex: 999, alignItems: 'center' },
  toastContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2dd4bf',
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  toastIcon: { marginLeft: 10, fontSize: 16 },
  toastText: { color: '#fff', fontSize: 14, fontWeight: 'bold', textAlign: 'right', flex: 1 },

  profileHeaderCard: {
    backgroundColor: "#161d2f",
    padding: 25,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#1e293b",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 10
  },
  imageWrapper: { width: 110, height: 110, borderRadius: 55, overflow: "hidden", borderWidth: 3, borderColor: "#2dd4bf" },
  profileImage: { width: "100%", height: "100%" },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  uploadText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  
  // ستايل إشعار الحجم الخافت
  sizeBadge: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  sizeBadgeText: { color: "#94a3b8", fontSize: 11, fontWeight: "600" },

  headerInfo: { marginTop: 12, alignItems: "center" },
  userNameText: { fontSize: 20, fontWeight: "bold", color: "#ffffff" },
  reCropBtn: { marginTop: 8, backgroundColor: "#1e293b", paddingHorizontal: 15, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: "#2dd4bf" },
  reCropText: { color: "#2dd4bf", fontSize: 12, fontWeight: "bold" },
  verifiedBadge: { backgroundColor: "rgba(45, 212, 191, 0.1)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  verifiedText: { color: "#2dd4bf", fontSize: 12, fontWeight: "bold" },

  dataCard: { backgroundColor: "#161d2f", padding: 20, borderRadius: 30, borderWidth: 1, borderColor: "#1e293b" },
  sectionHeader: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginBottom: 18 },
  sectionIcon: { fontSize: 16, marginLeft: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#ffffff" },
  infoGrid: { width: "100%" },
  infoBox: { marginBottom: 15 },
  infoLabel: { color: "#64748b", fontSize: 11, fontWeight: "bold", textAlign: "right", marginBottom: 6 },
  infoInput: { 
    backgroundColor: "#0f172a", 
    padding: 12, 
    borderRadius: 15, 
    color: "#ffffff", 
    fontSize: 15, 
    borderWidth: 1, 
    borderColor: "#2dd4bf" 
  },
  infoValueWrapper: { minHeight: 40, justifyContent: "center" },
  infoValue: { color: "#f1f5f9", fontSize: 15, fontWeight: "bold", textAlign: "right" },
  locationRow: { flexDirection: "row-reverse", width: "100%" },
  flex1: { flex: 1 },
  divider: { height: 1, backgroundColor: "#1e293b", marginVertical: 20 },
  ageBadgeContainer: { marginTop: 5 },
  ageBadge: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", backgroundColor: "#0f172a", paddingHorizontal: 15, height: 45, borderRadius: 15 },
  ageValue: { color: "#2dd4bf", fontSize: 18, fontWeight: "bold" },
  ageUnit: { color: "#64748b", fontSize: 12 },

  actionsContainer: { marginTop: 25 },
  editBtn: { backgroundColor: "#ffffff", paddingVertical: 15, borderRadius: 18, alignItems: "center" },
  editBtnText: { color: "#0f172a", fontWeight: "bold", fontSize: 15 },
  editActions: { flexDirection: "row-reverse", alignItems: "center" },
  saveBtn: { backgroundColor: "#0d9488", paddingVertical: 14, borderRadius: 18, flex: 2, alignItems: "center", minHeight: 52, justifyContent: 'center' },
  saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  cancelBtn: { flex: 1, alignItems: "center" },
  cancelBtnText: { color: "#94a3b8", fontWeight: "bold", fontSize: 15 },
});

export default MyProfileScreen;