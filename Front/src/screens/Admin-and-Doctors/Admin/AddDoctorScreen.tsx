import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import RNPickerSelect from 'react-native-picker-select';
import { useSelector } from 'react-redux';
import { MotiView, AnimatePresence } from 'moti';

import axiosInstance from '../../../api/axiosInstance';
import { formatBytes } from '../../../utils/formatters';

const UNIVERSITIES = [
  "جامعة القاهرة", "جامعة عين شمس", "جامعة الإسكندرية", "جامعة المنصورة", 
  "جامعة الزقازيق", "جامعة طنطا", "جامعة أسيوط", "جامعة الأزهر"
];

const SPECIALITIES_LIST = [
  { value: "General physician", label: "طبيب عام" },
  { value: "Gynecologist", label: "أمراض نساء وتوليد" },
  { value: "Dermatologist", label: "جلدية وتجميل" },
  { value: "Pediatricians", label: "طب الأطفال" },
  { value: "Neurologist", label: "مخ وأعصاب" },
  { value: "Gastroenterologist", label: "باطنة وجهاز هضمي" },
  { value: "Cardiologist", label: "أمراض القلب" },
  { value: "Orthopedic", label: "عظام وجراحة مفاصل" },
  { value: "Dentist", label: "أسنان" },
  { value: "Ophthalmologist", label: "رمد وعيون" },
  { value: "Urologist", label: " مسالك بولية" },
  { value: "Lab Consultant", label: "دكتور تحاليل طبية" },
  { value: "Physiotherapist", label: "أخصائي علاج طبيعي" }
];

const LOCATIONS: Record<string, string[]> = {
  "القاهرة": ["مصر الجديدة", "مدينة نصر", "المعادي", "حلوان", "شبرا"],
  "الجيزة": ["الدقي", "المهندسين", "الهرم", "فيصل", "أكتوبر"],
  "الشرقية": ["الزقازيق", "منيا القمح", "بلبيس", "مشتول السوق", "العاشر من رمضان"],
  "القليوبية": ["بنها", "قليوب", "شبرا الخيمة", "العبور", "الخانكة", "طوخ"],
  "الإسكندرية": ["سموحة", "المنتزه", "محرم بك", "سيدي جابر"]
};

interface CustomInputProps extends React.ComponentProps<typeof TextInput> {
  label: string;
  style?: any;
}

const CustomInput = React.memo(({ label, style, ...props }: CustomInputProps) => {
  return (
    <View style={[styles.inputGroup, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        textAlign="right"
        placeholderTextColor="#94a3b8"
        underlineColorAndroid="transparent"
        {...props}
      />
    </View>
  );
});

CustomInput.displayName = 'CustomInput';

const AddDoctorScreen = () => {
  const [docImg, setDocImg] = useState<any>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [sizeBadge, setSizeBadge] = useState<{ visible: boolean; size: string }>({ visible: false, size: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // دمج كافة الحقول في Object واحد لتقليل الـ Re-renders
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    age: '',
    experience: '1 Year',
    fees: '',
    about: '',
    speciality: 'General physician',
    governorate: '',
    city: '',
    detailedAddress: '',
    university: '',
  });

  const { token } = useSelector((state: any) => state.user);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const cleanCache = async (uri: string) => {
    try {
      if (uri) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
        console.log("[AWN Memory]: Cache cleaned ✅");
      }
    } catch (e) {
      console.log("[AWN Warning]: Cache clean failed", e);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("صلاحيات مرفوضة", "نحتاج الوصول للاستوديو");
        return;
      }

      setImageLoading(true);
      if (docImg?.uri) await cleanCache(docImg.uri);

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // التعديل الحديث لتقليل تحذيرات الذاكرة
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.2, // تقليل إضافي للجودة لتناسب رام الجهاز A16
        base64: false,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const formattedSize = formatBytes(asset.fileSize || 0);
        setSizeBadge({ visible: true, size: formattedSize });
        setTimeout(() => setSizeBadge(prev => ({ ...prev, visible: false })), 3000);
        setDocImg(asset);
      }
    } catch (error) {
      Alert.alert("خطأ", "مشكلة في الذاكرة أثناء اختيار الصورة");
    } finally {
      setImageLoading(false);
    }
  };

  const onSubmitHandler = async () => {
    const { name, email, password, phone, fees, age, university, governorate, city, speciality, experience, about, detailedAddress } = formData;

    if (!docImg) return Alert.alert("تنبيه", "يجب اختيار صورة الطبيب");
    if (!name || !email || !password || !phone || !fees || !age || !university || !governorate || !city) {
      return Alert.alert("بيانات ناقصة", "برجاء إكمال كافة الحقول");
    }

    setIsSubmitting(true);

    try {
      const data = new FormData();
      const uri = docImg.uri;
      const filename = uri.split("/").pop() || `doc_${Date.now()}.jpg`;
      
      data.append("image", {
        uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
        name: filename,
        type: docImg.mimeType || "image/jpeg",
      } as any);

      const specLabel = SPECIALITIES_LIST.find(s => s.value === speciality)?.label || "الطب";
      const degree = `دكتوراه في ${specLabel} - ${university}`;

      data.append('name', name.trim());
      data.append('email', email.trim().toLowerCase());
      data.append('password', password);
      data.append('phone', phone.trim());
      data.append('age', age);
      data.append('experience', experience);
      data.append('fees', fees);
      data.append('about', about.trim() || "طبيب متخصص في نظام عون");
      data.append('speciality', speciality);
      data.append('degree', degree);
      data.append('address', JSON.stringify({
        line1: `${governorate}, ${city}, ${detailedAddress.trim()}`,
        line2: ''
      }));

      const response = await axiosInstance.post('admin/add-doctor', data, {
        headers: { 'Content-Type': 'multipart/form-data', 'atoken': token },
        timeout: 45000 
      });

      if (response.data.success) {
        Alert.alert("تم بنجاح", "تمت إضافة الطبيب بنجاح ✅", [
          { text: "موافق", onPress: () => {
             if (docImg?.uri) cleanCache(docImg.uri);
             setDocImg(null);
             setFormData({
               name: '', email: '', password: '', phone: '', age: '', experience: '1 Year',
               fees: '', about: '', speciality: 'General physician', governorate: '',
               city: '', detailedAddress: '', university: ''
             });
          }}
        ]);
      } else {
        Alert.alert("فشل الإضافة", response.data.message);
      }
    } catch (error: any) {
      Alert.alert("خطأ", "حدث تعارض في الذاكرة أو اتصال الشبكة");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <Text style={styles.title}>إضافة طبيب جديد</Text>

          <View style={styles.imageSection}>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage} disabled={imageLoading || isSubmitting}>
              {imageLoading ? (
                <ActivityIndicator color="#2dd4bf" size="large" />
              ) : docImg ? (
                <Image source={{ uri: docImg.uri }} style={styles.previewImg} resizeMode="cover" />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Text style={styles.uploadText}>+</Text>
                  <Text style={styles.uploadSubText}>صورة الطبيب</Text>
                </View>
              )}
            </TouchableOpacity>

            <AnimatePresence>
              {sizeBadge.visible && (
                <MotiView from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={styles.sizeBadge}>
                  <Text style={styles.sizeBadgeText}>حجم الرفع: {sizeBadge.size}</Text>
                </MotiView>
              )}
            </AnimatePresence>
          </View>

          <View style={styles.form}>
            <CustomInput label="اسم الطبيب (ثلاثي)" value={formData.name} onChangeText={(v) => handleInputChange('name', v)} placeholder="مثال: د. محمد إبراهيم" />

            <View style={styles.row}>
              <CustomInput label="السن" value={formData.age} onChangeText={(v) => handleInputChange('age', v)} placeholder="40" keyboardType="numeric" style={{ flex: 1 }} />
              <View style={{ width: 15 }} />
              <CustomInput label="رقم الموبايل" value={formData.phone} onChangeText={(v) => handleInputChange('phone', v)} placeholder="010..." keyboardType="phone-pad" style={{ flex: 1 }} />
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>الجامعة</Text>
                <RNPickerSelect
                  onValueChange={(v) => handleInputChange('university', v)}
                  items={UNIVERSITIES.map(u => ({ label: u, value: u }))}
                  value={formData.university}
                  placeholder={{ label: "اختر الجامعة...", value: null }}
                  style={pickerStyles}
                  useNativeAndroidPickerStyle={false}
                />
              </View>
              <View style={{ width: 15 }} />
              <CustomInput label="سعر الكشف (ج.م)" value={formData.fees} onChangeText={(v) => handleInputChange('fees', v)} placeholder="250" keyboardType="numeric" style={{ flex: 1 }} />
            </View>

            <CustomInput label="البريد الإلكتروني" value={formData.email} onChangeText={(v) => handleInputChange('email', v)} placeholder="doctor@awn.com" keyboardType="email-address" autoCapitalize="none" />
            <CustomInput label="كلمة السر" value={formData.password} onChangeText={(v) => handleInputChange('password', v)} placeholder="••••••••" secureTextEntry />

            <Text style={styles.label}>التخصص المهني</Text>
            <RNPickerSelect
              onValueChange={(v) => handleInputChange('speciality', v)}
              items={SPECIALITIES_LIST}
              value={formData.speciality}
              style={pickerStyles}
              useNativeAndroidPickerStyle={false}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>المحافظة</Text>
                <RNPickerSelect
                  onValueChange={(v) => {
                    setFormData(prev => ({ ...prev, governorate: v, city: '' }));
                  }}
                  items={Object.keys(LOCATIONS).map(g => ({ label: g, value: g }))}
                  value={formData.governorate}
                  style={pickerStyles}
                  useNativeAndroidPickerStyle={false}
                  placeholder={{ label: "المحافظة", value: null }}
                />
              </View>
              <View style={{ width: 15 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>سنوات الخبرة</Text>
                <RNPickerSelect
                  onValueChange={(v) => handleInputChange('experience', v)}
                  items={[...Array(25)].map((_, i) => ({ label: `${i + 1} سنة`, value: `${i + 1} Year` }))}
                  value={formData.experience}
                  style={pickerStyles}
                  useNativeAndroidPickerStyle={false}
                />
              </View>
            </View>

            {formData.governorate && (
              <View>
                <Text style={styles.label}>المدينة / المركز</Text>
                <RNPickerSelect
                  onValueChange={(v) => handleInputChange('city', v)}
                  items={LOCATIONS[formData.governorate].map(c => ({ label: c, value: c }))}
                  value={formData.city}
                  style={pickerStyles}
                  useNativeAndroidPickerStyle={false}
                  placeholder={{ label: "اختر المدينة...", value: null }}
                />
              </View>
            )}

            <CustomInput label="العنوان التفصيلي" value={formData.detailedAddress} onChangeText={(v) => handleInputChange('detailedAddress', v)} placeholder="الشارع والبرج" />

            <Text style={styles.label}>عن الطبيب (نبذة)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.about}
              onChangeText={(v) => handleInputChange('about', v)}
              multiline
              numberOfLines={3}
              textAlign="right"
              placeholderTextColor="#94a3b8"
            />

            <TouchableOpacity style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]} onPress={onSubmitHandler} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>إضافة الطبيب للنظام</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollPadding: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'right', marginBottom: 25 },
  imageSection: { alignItems: 'center', marginBottom: 25 },
  imagePicker: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#2dd4bf', overflow: 'hidden' },
  previewImg: { width: '100%', height: '100%' },
  uploadPlaceholder: { alignItems: 'center' },
  uploadText: { color: '#2dd4bf', fontSize: 30, fontWeight: '300' },
  uploadSubText: { color: '#94a3b8', fontSize: 10, marginTop: 4 },
  sizeBadge: { backgroundColor: 'rgba(45, 212, 191, 0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: 'rgba(45, 212, 191, 0.3)' },
  sizeBadgeText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  form: { width: '100%' },
  inputGroup: { marginBottom: 15 },
  label: { color: '#f1f5f9', fontSize: 13, marginBottom: 8, textAlign: 'right', fontWeight: '600' },
  input: { backgroundColor: '#1e293b', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: '#334155' },
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row-reverse', marginBottom: 5 },
  submitBtn: { backgroundColor: '#0d9488', padding: 16, borderRadius: 15, alignItems: 'center', marginTop: 20, elevation: 5 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

const pickerStyles = {
  inputIOS: { backgroundColor: '#1e293b', borderRadius: 12, padding: 12, color: '#fff', textAlign: 'right' as const, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  inputAndroid: { backgroundColor: '#1e293b', borderRadius: 12, padding: 12, color: '#fff', textAlign: 'right' as const, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
};

export default AddDoctorScreen;