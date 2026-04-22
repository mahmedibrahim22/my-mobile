import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
    View,
    Text,
    Image,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    RefreshControl
} from 'react-native';
import axios from 'axios';
import { MotiView } from 'moti';
import { AppContext } from '../../context/AppContext';

// --- الثوابت ---
const SPECIALITY_TRANSLATE: Record<string, string> = {
    "General physician": "طبيب عام",
    "Gynecologist": "أمراض نساء",
    "Dermatologist": "جلدية",
    "Pediatricians": "أطفال",
    "Neurologist": "مخ وأعصاب",
    "Gastroenterologist": "باطنة وجهاز هضمي",
    "Cardiologist": "قلب",
    "Orthopedic": "عظام",
    "Dentist": "أسنان",
    "Ophthalmologist": "رمد",
    "Urologist": "مسالك",
    "Lab Consultant": "تحاليل",
    "Physiotherapist": "علاج طبيعي",
};

const MONTHS = [" ", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

interface AppointmentItem {
    _id: string;
    docData: {
        _id: string;
        name: string;
        image: string;
        speciality: string;
    };
    slotDate: string;
    slotTime: string;
    cancelled: boolean;
    isCompleted: boolean;
    cancellationRequest?: boolean; // الحالة الجديدة للطلب المعلق
    cancellationStatus?: 'none' | 'pending' | 'accepted' | 'rejected'; // حالة الرد
}

const MyAppointments = () => {
    const appCtx = useContext(AppContext);
    const token = appCtx?.token;
    const backendUrl = appCtx?.backendUrl;
    const doctors = appCtx?.doctors || [];

    const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // دالة جلب الصورة مع التصحيح التلقائي
    const getDocImage = useCallback((item: AppointmentItem) => {
        if (item.docData?.image) return { uri: item.docData.image };
        
        const doctor = doctors.find(d => d._id === item.docData?._id);
        if (doctor?.image) return { uri: doctor.image };

        return require('../../../assets/images/default_doctor.png');
    }, [doctors]);

    const formatSlotDate = useCallback((slotDate: string) => {
        const dateArray = slotDate.split('_');
        if (dateArray.length !== 3) return slotDate;
        const [day, month, year] = dateArray;
        return `${day} ${MONTHS[Number(month)]} ${year}`;
    }, []);

    const getUserAppointments = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const { data } = await axios.get(`${backendUrl}/api/user/appointments`, {
                headers: { token }
            });
            if (data.success) {
                setAppointments(data.appointments.reverse());
            }
        } catch (err: any) {
            console.error("Fetch Error:", err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token, backendUrl]);

    useEffect(() => {
        getUserAppointments();
    }, [getUserAppointments]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getUserAppointments();
    }, [getUserAppointments]);

    // ✅ تحديث دالة الإلغاء لترسل طلب انتظار موافقة الدكتور
    const requestCancelAppointment = async (appointmentId: string) => {
        if (loadingId) return;

        Alert.alert("طلب إلغاء", "سيتم إرسال طلب إلغاء للطبيب للموافقة عليه، هل أنت متأكد؟", [
            { text: "تراجع", style: "cancel" },
            {
                text: "إرسال الطلب",
                style: "destructive",
                onPress: async () => {
                    setLoadingId(appointmentId);
                    try {
                        const { data } = await axios.post(
                            `${backendUrl}/api/user/cancel-appointment`,
                            { appointmentId },
                            { headers: { token } }
                        );
                        if (data.success) {
                            // تحديث الحالة محلياً لتظهر "بانتظار الموافقة"
                            setAppointments(prev => 
                                prev.map(item => item._id === appointmentId 
                                    ? { ...item, cancellationRequest: true, cancellationStatus: 'pending' } 
                                    : item
                                )
                            );
                            Alert.alert("تم الإرسال", "تم إرسال طلبك للطبيب، يرجى انتظار الرد.");
                        } else {
                            Alert.alert("تنبيه", data.message || "لا يمكن طلب الإلغاء حالياً");
                        }
                    } catch (err) {
                        Alert.alert("خطأ", "فشل الاتصال بالسيرفر");
                    } finally {
                        setLoadingId(null);
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item, index }: { item: AppointmentItem, index: number }) => (
        <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: index * 30 }}
            style={styles.card}
        >
            <View style={styles.cardContent}>
                <Image
                    source={getDocImage(item)}
                    style={[styles.docImage, item.cancelled && styles.cancelledImage]}
                    resizeMode="cover"
                />

                <View style={styles.infoWrapper}>
                    <Text style={styles.docName} numberOfLines={1}>{item.docData.name}</Text>
                    <Text style={styles.speciality}>
                        {SPECIALITY_TRANSLATE[item.docData.speciality] || item.docData.speciality}
                    </Text>
                    <View style={styles.dateTimeRow}>
                        <Text style={styles.tagText}>{formatSlotDate(item.slotDate)} | {item.slotTime}</Text>
                    </View>
                </View>

                <View style={styles.actionWrapper}>
                    {item.cancelled ? (
                        <View style={styles.badgeCancelled}><Text style={styles.statusTextRed}>ملغي</Text></View>
                    ) : item.isCompleted ? (
                        <View style={styles.badgeCompleted}><Text style={styles.statusTextGreen}>مكتمل</Text></View>
                    ) : item.cancellationRequest ? (
                        <View style={styles.badgePending}><Text style={styles.statusTextOrange}>بانتظار الموافقة</Text></View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => requestCancelAppointment(item._id)}
                            style={[styles.cancelBtn, loadingId === item._id && { opacity: 0.5 }]}
                            disabled={!!loadingId}
                        >
                            {loadingId === item._id ? (
                                <ActivityIndicator size="small" color="#f87171" />
                            ) : (
                                <Text style={styles.cancelBtnText}>إلغاء</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </MotiView>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
            
            <View style={styles.headerArea}>
                <Text style={styles.title}>مواعيدي <Text style={styles.highlight}>الطبية</Text></Text>
                <Text style={styles.subtitle}>إدارة حجوزاتك بسرعة وسهولة</Text>
            </View>

            {loading ? (
                <View style={styles.loader}><ActivityIndicator size="large" color="#2dd4bf" /></View>
            ) : (
                <FlatList
                    data={appointments}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listPadding}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2dd4bf" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>لا توجد مواعيد مسجلة</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    headerArea: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 10, alignItems: 'flex-end' },
    listPadding: { paddingHorizontal: 20, paddingBottom: 30 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc' },
    highlight: { color: '#2dd4bf' },
    subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: {
        backgroundColor: '#1e293b',
        borderRadius: 18,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    cardContent: { flexDirection: 'row-reverse', alignItems: 'center' },
    docImage: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#334155' },
    cancelledImage: { opacity: 0.4 },
    infoWrapper: { flex: 1, marginRight: 12, alignItems: 'flex-end' },
    docName: { fontSize: 16, fontWeight: 'bold', color: '#f1f5f9' },
    speciality: { fontSize: 12, color: '#2dd4bf', marginTop: 2, fontWeight: '600' },
    dateTimeRow: { marginTop: 6, backgroundColor: '#334155', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    tagText: { fontSize: 11, color: '#cbd5e1' },
    actionWrapper: { minWidth: 90, alignItems: 'center' },
    badgeCancelled: { backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    badgeCompleted: { backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    badgePending: { backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
    statusTextRed: { color: '#f87171', fontSize: 11, fontWeight: 'bold' },
    statusTextGreen: { color: '#34d399', fontSize: 11, fontWeight: 'bold' },
    statusTextOrange: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
    cancelBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: '#450a0a', borderWidth: 1, borderColor: '#991b1b', minWidth: 65, alignItems: 'center' },
    cancelBtnText: { color: '#f87171', fontSize: 12, fontWeight: 'bold' },
    emptyContainer: { marginTop: 100, alignItems: 'center' },
    emptyText: { color: '#64748b', fontSize: 15 }
});

export default MyAppointments;