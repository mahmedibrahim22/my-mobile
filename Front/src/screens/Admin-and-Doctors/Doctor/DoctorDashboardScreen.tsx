import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
    Platform
} from 'react-native';
import { DoctorContext } from '../../../context/DoctorContext';
import { AppContext } from '../../../context/AppContext';
import axiosInstance from '../../../api/axiosInstance';
import CONFIG from '../../../constants/Config';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// --- Interfaces ---
interface LatestAppointment {
    _id: string;
    userData: { name: string; image: string; };
    slotDate: string;
    slotTime: string;
    patientAge: number;
    illnessDescription: string;
    cancelled: boolean;
    isCompleted: boolean;
    amount?: number;
}

interface DashData {
    earnings: number;
    appointmentsCount: number;
    patientsCount: number;
    latestAppointments: LatestAppointment[];
    totalFeesToAwn: number;
    isSuspended: boolean;
    paymentStatus: 'none' | 'pending' | 'verified';
    nextAppointmentId: string | null;
}

const DoctorDashboard = () => {
    const doctorCtx = useContext(DoctorContext);
    const appCtx = useContext(AppContext);
    const navigation = useNavigation<any>();
    
    // ✅ تحديد وضع الإضاءة
    const isDarkMode = appCtx?.isDarkMode ?? true;

    const [dashData, setDashData] = useState<DashData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const dToken = doctorCtx?.dToken;
    const currency = appCtx?.currency || 'EGP';

    // ✅ الألوان الديناميكية
    const theme = {
        bg: isDarkMode ? '#050811' : '#f1f5f9',
        card: isDarkMode ? '#0F172A' : '#ffffff',
        textMain: isDarkMode ? '#ffffff' : '#0f172a',
        textSub: isDarkMode ? '#94a3b8' : '#64748b',
        border: isDarkMode ? '#1e293b' : '#e2e8f0',
        accent: '#00dfc4',
        headerBg: isDarkMode ? '#050811' : '#ffffff'
    };

    const getDashData = useCallback(async () => {
        if (!dToken) return;
        try {
            setLoading(true);
            const { data } = await axiosInstance.get('/doctor/dashboard', { 
                headers: { [CONFIG.HEADERS.DOCTOR_TOKEN]: dToken } 
            });
            
            if (data.success) {
                setDashData(data.dashData);
            }
        } catch (error: any) {
            console.error("Dashboard Fetch Error:", error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [dToken]);

    useEffect(() => {
        if (dToken) getDashData();
    }, [dToken, getDashData]);

    const onRefresh = () => {
        setRefreshing(true);
        getDashData();
    };

    const handleStatusUpdate = (id: string, action: 'cancel' | 'complete') => {
        const isCancel = action === 'cancel';
        Alert.alert(
            isCancel ? 'إلغاء الموعد؟' : 'إتمام الكشف بنجاح',
            isCancel ? 'هل تريد طلب إلغاء هذا الحجز؟' : 'تأكيد إتمام الكشف للانتقال للحجز التالي وحساب رسوم عون إن وجدت.',
            [
                { text: 'تراجع', style: 'cancel' },
                { 
                    text: isCancel ? 'طلب إلغاء' : 'تم الكشف بنجاح', 
                    onPress: async () => {
                        try {
                            const endpoint = isCancel ? '/doctor/cancel-appointment' : '/doctor/complete-appointment';
                            const { data } = await axiosInstance.post(endpoint, 
                                { appointmentId: id }, 
                                { headers: { [CONFIG.HEADERS.DOCTOR_TOKEN]: dToken } }
                            );
                            if (data.success) {
                                Alert.alert('تم', data.message);
                                getDashData();
                            }
                        } catch { 
                            Alert.alert('خطأ', 'فشل في تحديث الحالة'); 
                        }
                    }
                }
            ]
        );
    };

    const slotDateFormat = (slotDate: string) => {
        try {
            const dateArray = slotDate.split('_');
            const months = ["", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
            return `${dateArray[0]} ${months[Number(dateArray[1])]}`;
        } catch { return slotDate; }
    };

    const isLateTime = new Date().getHours() >= 23;
    const showDebtNotice = (dashData?.totalFeesToAwn ?? 0) > 0 || isLateTime;

    if (loading && !dashData) return (
        <View style={[styles.center, { backgroundColor: theme.bg }]}><ActivityIndicator size="large" color={theme.accent} /></View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
            {showDebtNotice && (
                <View style={styles.debtNotice}>
                    <Text style={styles.debtText}>
                        {dashData?.paymentStatus === 'pending' 
                            ? "جاري مراجعة إيصال السداد من قبل الإدارة..."
                            : "انتهى يوم عمل ولم يتم سداد رسوم عون. سدد الآن لتتمكن من متابعة عملك."}
                    </Text>
                    {dashData?.paymentStatus !== 'pending' && (
                        <TouchableOpacity 
                            style={styles.payNowBtn} 
                            onPress={() => navigation.navigate('SettleFees', { fees: dashData?.totalFeesToAwn })}
                        >
                            <Text style={styles.payNowText}>سدد الآن</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.accent]} tintColor={theme.accent} />}
            >
                {/* الهيدر */}
                <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
                    <Text style={[styles.headerTitle, { color: theme.textMain }]}>لوحة التحكم</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSub }]}>إحصائيات المواعيد والرسوم المستحقة</Text>
                </View>

                {/* قسم الإحصائيات */}
                <View style={styles.statsGrid}>
                    <StatCard 
                        label="أرباحك" 
                        val={`${dashData?.earnings || 0} ${currency}`} 
                        color="#10b981" 
                        bgColor={isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)'} 
                        icon="💰" 
                        theme={theme}
                    />
                    <StatCard 
                        label="رسوم عون" 
                        val={`${dashData?.totalFeesToAwn || 0} ${currency}`} 
                        color="#ef4444" 
                        bgColor={isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)'} 
                        icon="🏢" 
                        theme={theme}
                    />
                    <StatCard 
                        label="مرضى عون" 
                        val={dashData?.patientsCount || 0} 
                        color="#f59e0b" 
                        bgColor={isDarkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)'} 
                        icon="👤" 
                        theme={theme}
                    />
                </View>

                {/* الحجوزات الأخيرة */}
                <View style={styles.sectionHeader}>
                    <TouchableOpacity onPress={getDashData}><Text style={[styles.refreshBtn, { color: theme.accent }]}>تحديث القائمة</Text></TouchableOpacity>
                    <Text style={[styles.sectionTitle, { color: theme.textMain }]}>مواعيد اليوم</Text>
                </View>

                {!dashData || dashData.latestAppointments.length === 0 ? (
                    <View style={styles.emptyState}><Text style={[styles.emptyText, { color: theme.textSub }]}>لا توجد مواعيد حالياً</Text></View>
                ) : (
                    dashData.latestAppointments.map((item, index) => {
                        const isBlurred = dashData.nextAppointmentId !== null && item._id !== dashData.nextAppointmentId && !item.isCompleted && !item.cancelled;
                        
                        return (
                            <View key={item._id || index} style={[styles.appointmentCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                <View style={styles.rowReverse}>
                                    <Image source={{ uri: item.userData.image }} style={styles.patientImg} />
                                    <View style={styles.patientDetails}>
                                        <Text style={[styles.patientName, { color: theme.textMain }]}>{item.userData.name}</Text>
                                        <Text style={[styles.timeText, { color: theme.accent }]}>{item.slotTime} • {slotDateFormat(item.slotDate)}</Text>
                                    </View>
                                    
                                    <View style={styles.actionArea}>
                                        {item.cancelled ? (
                                            <Text style={[styles.statusTag, { color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>ملغي</Text>
                                        ) : item.isCompleted ? (
                                            <Text style={[styles.statusTag, { color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>مكتمل</Text>
                                        ) : (
                                            <View style={styles.btnRow}>
                                                <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'cancel')} style={[styles.iconBtn, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: theme.border }]}>
                                                    <Text style={{ fontSize: 14 }}>❌</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'complete')} style={[styles.iconBtn, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: theme.border }]}>
                                                    <Text style={{ fontSize: 14 }}>✅</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                </View>
                                
                                <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                                    <Text style={[styles.illnessText, { color: theme.textSub }]} numberOfLines={1}>{item.illnessDescription || 'لا يوجد وصف للحالة'}</Text>
                                    <View style={[styles.ageBadge, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}><Text style={[styles.ageText, { color: theme.textSub }]}>{item.patientAge} سنة</Text></View>
                                </View>

                                {isBlurred && (
                                    <View style={[styles.blurOverlay, { backgroundColor: isDarkMode ? 'rgba(5, 8, 17, 0.85)' : 'rgba(255,255,255,0.85)' }]}>
                                        <Text style={[styles.blurText, { color: theme.textSub }]}>أنهِ الحجز الحالي أولاً</Text>
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const StatCard = ({ label, val, color, bgColor, icon, theme }: any) => (
    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
        <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
            <Text style={styles.statIcon}>{icon}</Text>
        </View>
        <Text style={[styles.statVal, { color: color }]}>{val}</Text>
        <Text style={[styles.statLabel, { color: theme.textSub }]}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    debtNotice: { backgroundColor: '#ef4444', padding: 12, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 },
    debtText: { color: '#fff', fontSize: 11, fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 10 },
    payNowBtn: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    payNowText: { color: '#ef4444', fontSize: 10, fontWeight: '900' },
    header: { padding: 25, alignItems: 'flex-end', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 2, borderBottomWidth: 1 },
    headerTitle: { fontSize: 24, fontWeight: '900' },
    headerSubtitle: { fontSize: 12, marginTop: 4, fontWeight: '600' },
    statsGrid: { flexDirection: 'row-reverse', padding: 15, justifyContent: 'space-between', marginTop: -20 },
    statCard: { width: '31%', padding: 15, borderRadius: 24, alignItems: 'center', elevation: 4 },
    iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    statIcon: { fontSize: 18 },
    statVal: { fontSize: 11, fontWeight: '900', textAlign: 'center' },
    statLabel: { fontSize: 9, fontWeight: '800', marginTop: 2 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, marginTop: 15, alignItems: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: '900' },
    refreshBtn: { fontWeight: '900', fontSize: 11 },
    appointmentCard: { marginHorizontal: 20, marginTop: 12, padding: 18, borderRadius: 28, elevation: 1, overflow: 'hidden', borderWidth: 1 },
    rowReverse: { flexDirection: 'row-reverse', alignItems: 'center' },
    patientImg: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#f1f5f9' },
    patientDetails: { flex: 1, marginRight: 15, alignItems: 'flex-end' },
    patientName: { fontSize: 16, fontWeight: '900' },
    timeText: { fontSize: 11, fontWeight: '800', marginTop: 4 },
    actionArea: { minWidth: 70, alignItems: 'center' },
    btnRow: { flexDirection: 'row', gap: 8 },
    iconBtn: { padding: 10, borderRadius: 12, borderWidth: 1 },
    statusTag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, fontSize: 10, fontWeight: '900', overflow: 'hidden' },
    cardFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 15, paddingTop: 12, borderTopWidth: 1, alignItems: 'center' },
    illnessText: { fontSize: 11, flex: 1, textAlign: 'right', marginLeft: 15 },
    ageBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    ageText: { fontSize: 10, fontWeight: '900' },
    emptyState: { padding: 50, alignItems: 'center' },
    emptyText: { fontWeight: '700' },
    blurOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    blurText: { fontSize: 12, fontWeight: '900', opacity: 0.8 }
});

export default DoctorDashboard;