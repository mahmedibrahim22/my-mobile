import React, { useState, useContext } from 'react';
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'react-native-image-picker';
import { DoctorContext } from '../../../context/DoctorContext';
import axiosInstance from '../../../api/axiosInstance';
import CONFIG from '../../../constants/Config';

const SettleFeesScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const doctorCtx = useContext(DoctorContext);
    
    // حل مشكلة Property 'dToken' does not exist
    const dToken = doctorCtx?.dToken;
    
    const [image, setImage] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const fees = route.params?.fees || 0;

    const selectImage = () => {
        // حل مشكلة Parameter 'response' implicitly has an 'any' type
        ImagePicker.launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, (response: ImagePicker.ImagePickerResponse) => {
            if (response.assets && response.assets.length > 0) {
                setImage(response.assets[0]);
            }
        });
    };

    const handleSubmit = async () => {
        if (!image) {
            Alert.alert('تنبيه', 'يرجى إرفاق صورة إيصال التحويل أولاً');
            return;
        }

        if (!dToken) {
            Alert.alert('خطأ', 'جلسة العمل انتهت، يرجى تسجيل الدخول مرة أخرى');
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('image', {
                uri: image.uri,
                type: image.type,
                name: image.fileName || 'payment_receipt.jpg',
            } as any);

            const { data } = await axiosInstance.post('/doctor/upload-payment', formData, {
                headers: {
                    [CONFIG.HEADERS.DOCTOR_TOKEN]: dToken,
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (data.success) {
                Alert.alert('تم الإرسال', 'تم رفع الإيصال بنجاح. سيتم مراجعته من قبل الإدارة خلال ساعات.', [
                    { text: 'حسناً', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error: any) {
            // حل مشكلة 'error' is defined but never used
            const errorMsg = error.response?.data?.message || 'فشل رفع الصورة، يرجى المحاولة لاحقاً';
            Alert.alert('خطأ', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <Text style={styles.title}>تسوية مديونية عون</Text>
                    <Text style={styles.subtitle}>يرجى تحويل المبلغ المستحق عبر فودافون كاش</Text>

                    <View style={styles.amountBox}>
                        <Text style={styles.amountLabel}>المبلغ المطلوب سداده</Text>
                        <Text style={styles.amountVal}>{fees} EGP</Text>
                    </View>

                    <View style={styles.infoBox}>
                        <Text style={styles.infoTitle}>بيانات التحويل:</Text>
                        <Text style={styles.infoText}>رقم فودافون كاش: <Text style={styles.phone}>010XXXXXXXX</Text></Text>
                        <Text style={styles.infoNote}>* يرجى أخذ لقطة شاشة (Screenshot) بعد التحويل</Text>
                    </View>

                    <TouchableOpacity style={styles.uploadBox} onPress={selectImage}>
                        {image ? (
                            <Image source={{ uri: image.uri }} style={styles.previewImg} />
                        ) : (
                            <View style={styles.uploadPlaceholder}>
                                <Text style={styles.uploadIcon}>📸</Text>
                                <Text style={styles.uploadText}>اضغط لرفع إيصال الدفع</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.submitBtn, (!image || loading) && styles.disabledBtn]} 
                        onPress={handleSubmit}
                        disabled={loading || !image}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>تأكيد وإرسال للإدارة</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SettleFeesScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    scrollContent: { padding: 20 },
    card: { backgroundColor: '#fff', borderRadius: 30, padding: 25, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    title: { fontSize: 22, fontWeight: '900', color: '#1e293b', textAlign: 'center' },
    subtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 8, fontWeight: '600' },
    amountBox: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 20, marginTop: 25, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
    amountLabel: { fontSize: 12, color: '#64748b', fontWeight: '800' },
    amountVal: { fontSize: 32, fontWeight: '900', color: '#ef4444', marginTop: 5 },
    infoBox: { marginTop: 20, paddingHorizontal: 10 },
    infoTitle: { fontSize: 14, fontWeight: '900', color: '#0f172a', marginBottom: 5 },
    infoText: { fontSize: 15, color: '#334155', fontWeight: '700' },
    phone: { color: '#0d9488', fontSize: 18 },
    infoNote: { fontSize: 11, color: '#94a3b8', marginTop: 10, fontStyle: 'italic' },
    uploadBox: { height: 200, backgroundColor: '#f1f5f9', borderRadius: 20, marginTop: 25, borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', overflow: 'hidden' },
    uploadPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    uploadIcon: { fontSize: 40, marginBottom: 10 },
    uploadText: { fontSize: 12, fontWeight: '800', color: '#64748b' },
    previewImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    submitBtn: { backgroundColor: '#0d9488', padding: 18, borderRadius: 15, marginTop: 30, alignItems: 'center' },
    disabledBtn: { backgroundColor: '#94a3b8' },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});