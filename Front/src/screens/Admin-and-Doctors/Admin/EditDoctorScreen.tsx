import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView,
  Image, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import RNPickerSelect from 'react-native-picker-select';
import { useSelector } from 'react-redux';
import axiosInstance from '../../../api/axiosInstance';
import { useNavigation, useRoute } from '@react-navigation/native';

// ✅ تحديث الأنواع لتشمل السن
interface DoctorData {
  name: string;
  fees: string;
  degree: string;
  experience: string;
  about: string;
  speciality: string;
  address: string;
  image: string;
  age: string;
}

const EditDoctorScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { docId } = route.params; 
  const { token } = useSelector((state: any) => state.auth || state.user);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [docImg, setDocImg] = useState<any>(null);
  
  const [docData, setDocData] = useState<DoctorData>({
    name: '',
    fees: '',
    degree: '',
    experience: '1 Year',
    about: '',
    speciality: 'General Physician',
    address: '',
    image: '',
    age: '' 
  });

  const specialitiesList = [
    { value: "General Physician", label: "طبيب عام" },
    { value: "Internal Medicine", label: "باطنة" },
    { value: "Psychiatrist", label: "نفسية وعصبية" },
    { value: "Gynecologist", label: "نساء وتوليد" },
    { value: "Dermatologist", label: "جلدية" },
    { value: "Pediatricians", label: "أطفال" },
    { value: "Neurologist", label: "مخ وأعصاب" },
    { value: "Gastroenterologist", label: "جهاز هضمي" },
    { value: "Ophthalmology", label: "عيون" },
    { value: "Urology", label: "مسالك بولية" },
    { value: "Orthopedic", label: "عظام" },
    { value: "Cardiology", label: "أمراض القلب" },
    { value: "ENT", label: "أنف وأذن" },
    { value: "Dentist", label: "أسنان" }
  ];

  const getDoctorData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.post('admin/get-doctor-info', { docId }, {
        headers: { atoken: token }
      });
      if (data.success) {
        const d = data.docData;
        setDocData({
          name: d.name || '',
          fees: String(d.fees) || '',
          degree: d.degree || '',
          experience: d.experience || '1 Year',
          about: d.about || '',
          speciality: d.speciality || 'General Physician',
          image: d.image || '',
          address: d.address?.line1 || (typeof d.address === 'string' ? d.address : ''),
          age: String(d.age) || ''
        });
      }
    } catch (err: any) {
      console.log("❌ Error fetching doctor:", err.message);
      Alert.alert("خطأ", "فشل جلب بيانات الطبيب");
    } finally {
      setLoading(false);
    }
    // ✅ تم إضافة token و docId كمصفوفة Dependencies لحل خطأ ESLint
  }, [docId, token]);

  useEffect(() => {
    if (token && docId) getDoctorData();
  }, [getDoctorData, token, docId]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert("صلاحيات مرفوضة");
    
    let result = await ImagePicker.launchImageLibraryAsync({
      // ✅ حل مشكلة النوع: نستخدم الـ String المباشر 'images' لضمان التوافق مع كل النسخ
      mediaTypes: 'images' as any, 
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4, 
    });

    if (!result.canceled) {
        setDocImg(result.assets[0]);
    }
  };

  const handleUpdate = async () => {
    if (!docData.name || !docData.fees || !docData.degree || !docData.age) {
        return Alert.alert("تنبيه", "برجاء ملء الحقول الأساسية بما فيها السن");
    }

    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('docId', docId);
      formData.append('name', docData.name);
      formData.append('fees', docData.fees);
      formData.append('degree', docData.degree);
      formData.append('experience', docData.experience);
      formData.append('about', docData.about);
      formData.append('speciality', docData.speciality);
      formData.append('address', JSON.stringify({ line1: docData.address, line2: '' }));
      formData.append('age', docData.age); 

      if (docImg) {
        const uri = Platform.OS === 'android' ? docImg.uri : docImg.uri.replace('file://', '');
        const filename = docImg.uri.split('/').pop() || 'image.jpg';
        const type = `image/${filename.split('.').pop() || 'jpeg'}`;
        formData.append('image', { uri, name: filename, type } as any);
      }

      const { data } = await axiosInstance.post('admin/update-doctor', formData, {
        headers: { 
            'Content-Type': 'multipart/form-data', 
            'atoken': token 
        }
      });

      if (data.success) {
        Alert.alert("نجاح", "تم تحديث البيانات ✅", [
          { text: "موافق", onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert("تنبيه", data.message || "لم يتم التعديل");
      }
    } catch (err: any) {
      console.log("❌ Update Error:", err.message);
      Alert.alert("فشل", "حدث خطأ أثناء التحديث");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2dd4bf" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollPadding} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>تعديل الملف الشخصي</Text>
            <Text style={styles.subtitle}>تحديث بيانات: {docData.name}</Text>
          </View>

          <View style={styles.imageSection}>
            <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
              <Image 
                source={{ uri: docImg ? docImg.uri : (docData.image || "https://via.placeholder.com/150") }} 
                style={styles.previewImg} 
              />
              <View style={styles.cameraIcon}><Text style={{color: '#fff', fontSize: 10}}>📷</Text></View>
            </TouchableOpacity>
            <View style={{ alignItems: 'flex-end', flex: 1 }}>
              <Text style={styles.imageLabel}>الصورة الشخصية</Text>
              <Text style={styles.imageSubLabel}>اضغط لتغيير الصورة</Text>
            </View>
          </View>

          <View style={styles.form}>
            <CustomInput label="الاسم الكامل" value={docData.name} onChangeText={(val: string) => setDocData(prev => ({ ...prev, name: val }))} />
            
            <Text style={styles.label}>التخصص</Text>
            <View style={styles.pickerWrapper}>
                <RNPickerSelect
                    onValueChange={(val) => setDocData(prev => ({ ...prev, speciality: val }))}
                    items={specialitiesList}
                    value={docData.speciality}
                    style={pickerStyles}
                    useNativeAndroidPickerStyle={false}
                    placeholder={{}}
                />
            </View>

            <CustomInput label="المؤهل العلمي" value={docData.degree} onChangeText={(val: string) => setDocData(prev => ({ ...prev, degree: val }))} />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                 <Text style={styles.label}>الخبرة</Text>
                 <View style={styles.pickerWrapper}>
                    <RNPickerSelect
                        onValueChange={(val) => setDocData(prev => ({ ...prev, experience: val }))}
                        items={[...Array(20)].map((_, i) => ({ label: `${i+1} سنة`, value: `${i+1} Year` }))}
                        value={docData.experience}
                        style={pickerStyles}
                        useNativeAndroidPickerStyle={false}
                        placeholder={{}}
                    />
                 </View>
              </View>
              <View style={{ width: 15 }} />
              <CustomInput label="السعر" value={docData.fees} keyboardType="numeric" style={{ flex: 1 }} onChangeText={(val: string) => setDocData(prev => ({ ...prev, fees: val }))} />
            </View>

            <View style={styles.row}>
              <CustomInput label="العنوان" value={docData.address} style={{ flex: 2 }} onChangeText={(val: string) => setDocData(prev => ({ ...prev, address: val }))} />
              <View style={{ width: 15 }} />
              <CustomInput label="السن" value={docData.age} keyboardType="numeric" style={{ flex: 1 }} onChangeText={(val: string) => setDocData(prev => ({ ...prev, age: val }))} />
            </View>

            <Text style={styles.label}>نبذة تعريفية</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={docData.about}
              onChangeText={(val) => setDocData(prev => ({ ...prev, about: val }))}
              multiline textAlign="right"
            />

            <TouchableOpacity 
              style={[styles.submitBtn, { opacity: updating ? 0.7 : 1 }]} 
              onPress={handleUpdate} 
              disabled={updating}
            >
              {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>حفظ التغييرات</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const CustomInput = ({ label, style, ...props }: any) => (
  <View style={[styles.inputGroup, style]}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} textAlign="right" {...props} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollPadding: { padding: 20, paddingBottom: 50 },
  header: { marginBottom: 20, alignItems: 'flex-end' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b' },
  imageSection: { flexDirection: 'row-reverse', alignItems: 'center', padding: 15, backgroundColor: '#f8fafc', borderRadius: 20, marginBottom: 20, gap: 15 },
  imagePicker: { position: 'relative' },
  previewImg: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#eee' },
  cameraIcon: { position: 'absolute', bottom: -2, left: -2, backgroundColor: '#2dd4bf', padding: 5, borderRadius: 8 },
  imageLabel: { fontSize: 16, fontWeight: 'bold' },
  imageSubLabel: { fontSize: 11, color: '#94a3b8' },
  form: { gap: 12 },
  inputGroup: { width: '100%' },
  label: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 5, textAlign: 'right' },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#000' },
  pickerWrapper: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, backgroundColor: '#f8fafc' },
  row: { flexDirection: 'row-reverse' },
  textArea: { height: 100, textAlignVertical: 'top', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12 },
  submitBtn: { backgroundColor: '#0f172a', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

const pickerStyles = {
  inputIOS: { padding: 12, textAlign: 'right' as const, color: '#000' },
  inputAndroid: { padding: 12, textAlign: 'right' as const, color: '#000' },
};

export default EditDoctorScreen;