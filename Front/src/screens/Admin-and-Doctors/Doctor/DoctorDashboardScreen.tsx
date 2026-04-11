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
    RefreshControl
} from 'react-native';
import { DoctorContext } from '../../../context/DoctorContext';
import { AppContext } from '../../../context/AppContext';
import axiosInstance from '../../../api/axiosInstance';
import CONFIG from '../../../constants/Config';

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
    amount?: number; // إضافة مبلغ الحجز للحساب
}

interface DashData {
    earnings: number;
    appointments: number;
    patients: number;
    latestAppointments: LatestAppointment[];
}

const DoctorDashboard = () => {
    const doctorCtx = useContext(DoctorContext);
    const appCtx = useContext(AppContext);
    
    const [dashData, setDashData] = useState<DashData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const dToken = doctorCtx?.dToken;
    const currency = appCtx?.currency || 'EGP';

    // 🛠️ جلب البيانات ومعالجتها لتعرض فقط المكتمل
    const getDashData = useCallback(async () => {
        if (!dToken) return;
        try {
            setLoading(true);
            const { data } = await axiosInstance.get('/doctor/dashboard', { 
                headers: { [CONFIG.HEADERS.DOCTOR_TOKEN]: dToken } 
            });
            
            if (data.success) {
                const rawData: DashData = data.dashData;
                
                // تصفية المواعيد لعد الحجوزات المكتملة فقط والمرضى الذين أتموا الكشف
                const completedAppointments = rawData.latestAppointments.filter(app => app.isCompleted && !app.cancelled);
                
                setDashData({
                    ...rawData,
                    // نعتمد الأرباح كما هي من السيرفر (لأن السيرفر عادة يحسب المكتمل فقط)
                    earnings: rawData.earnings, 
                    // تعديل العدادات لتعرض المكتمل فقط بناءً على طلبك
                    appointments: completedAppointments.length,
                    patients: new Set(completedAppointments.map(a => a.userData.name)).size, // عد المرضى الفريدين المكتملين
                    latestAppointments: rawData.latestAppointments
                });
            }
        } catch (error: any) {
            console.error("Dashboard Fetch Error:", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [dToken]);

    const onRefresh = () => {
        setRefreshing(true);
        getDashData();
    };

    // ⚡ تحديث حالة الموعد
    const handleStatusUpdate = (id: string, action: 'cancel' | 'complete') => {
        const isCancel = action === 'cancel';
        Alert.alert(
            isCancel ? 'إلغاء الموعد؟' : 'تأكيد الإتمام',
            isCancel ? 'هل أنت متأكد من رغبتك في إلغاء هذا الحجز؟' : 'سيتم تسجيل الموعد كمكتمل وإضافة الأرباح للرصيد.',
            [
                { text: 'تراجع', style: 'cancel' },
                { 
                    text: isCancel ? 'نعم، إلغاء' : 'تأكيد', 
                    style: isCancel ? 'destructive' : 'default',
                    onPress: async () => {
                        try {
                            const endpoint = isCancel ? '/doctor/cancel-appointment' : '/doctor/complete-appointment';
                            const { data } = await axiosInstance.post(endpoint, 
                                { appointmentId: id }, 
                                { headers: { [CONFIG.HEADERS.DOCTOR_TOKEN]: dToken } }
                            );
                            if (data.success) {
                                getDashData();
                            }
                        } catch { 
                            Alert.alert('خطأ', 'فشل في تحديث الحالة، تأكد من اتصالك بالشبكة'); 
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        if (dToken) getDashData();
    }, [dToken, getDashData]);

    const slotDateFormat = (slotDate: string) => {
        try {
            const dateArray = slotDate.split('_');
            const months = ["", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
            return `${dateArray[0]} ${months[Number(dateArray[1])]}`;
        } catch {
            return slotDate;
        }
    };

    if (loading && !dashData) return (
        <View style={styles.center}><ActivityIndicator size="large" color="#0d9488" /></View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0d9488"]} tintColor="#0d9488" />}
            >
                {/* الهيدر */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>لوحة التحكم</Text>
                    <Text style={styles.headerSubtitle}>إحصائيات المواعيد المكتملة والأرباح</Text>
                </View>

                {/* قسم الإحصائيات - تم ضبط المنطق ليعرض البيانات الفعلية المكتملة */}
                <View style={styles.statsGrid}>
                    <StatCard 
                        label="الأرباح" 
                        val={`${dashData?.earnings || 0} ${currency}`} 
                        color="#10b981" 
                        bgColor="rgba(16, 185, 129, 0.1)" 
                        icon="💰" 
                    />
                    <StatCard 
                        label="حجوزات تمت" 
                        val={dashData?.appointments || 0} 
                        color="#3b82f6" 
                        bgColor="rgba(59, 130, 246, 0.1)" 
                        icon="✅" 
                    />
                    <StatCard 
                        label="مرضى عون" 
                        val={dashData?.patients || 0} 
                        color="#f59e0b" 
                        bgColor="rgba(245, 158, 11, 0.1)" 
                        icon="👤" 
                    />
                </View>

                {/* الحجوزات الأخيرة */}
                <View style={styles.sectionHeader}>
                    <TouchableOpacity onPress={getDashData}><Text style={styles.refreshBtn}>تحديث</Text></TouchableOpacity>
                    <Text style={styles.sectionTitle}>أحدث الحجوزات</Text>
                </View>

                {!dashData || dashData.latestAppointments.length === 0 ? (
                    <View style={styles.emptyState}><Text style={styles.emptyText}>لا توجد مواعيد حالياً</Text></View>
                ) : (
                    dashData.latestAppointments.map((item, index) => (
                        <View key={item._id || index} style={styles.appointmentCard}>
                            <View style={styles.rowReverse}>
                                <Image source={{ uri: item.userData.image }} style={styles.patientImg} />
                                <View style={styles.patientDetails}>
                                    <Text style={styles.patientName}>{item.userData.name}</Text>
                                    <Text style={styles.timeText}>{item.slotTime} • {slotDateFormat(item.slotDate)}</Text>
                                </View>
                                
                                <View style={styles.actionArea}>
                                    {item.cancelled ? (
                                        <Text style={[styles.statusTag, { color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>ملغي</Text>
                                    ) : item.isCompleted ? (
                                        <Text style={[styles.statusTag, { color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>مكتمل</Text>
                                    ) : (
                                        <View style={styles.btnRow}>
                                            <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'cancel')} style={styles.iconBtn}>
                                                <Text style={{ fontSize: 14 }}>❌</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'complete')} style={styles.iconBtn}>
                                                <Text style={{ fontSize: 14 }}>✅</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <View style={styles.cardFooter}>
                                <Text style={styles.illnessText} numberOfLines={1}>{item.illnessDescription || 'لا يوجد وصف للحالة'}</Text>
                                <View style={styles.ageBadge}><Text style={styles.ageText}>{item.patientAge} سنة</Text></View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

// Component الإحصائيات
const StatCard = ({ label, val, color, bgColor, icon }: any) => (
    <View style={[styles.statCard, { backgroundColor: '#fff' }]}>
        <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
            <Text style={styles.statIcon}>{icon}</Text>
        </View>
        <Text style={styles.statVal}>{val}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 25, alignItems: 'flex-end', backgroundColor: '#fff', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 2 },
    headerTitle: { fontSize: 26, fontWeight: '900', color: '#0f172a' },
    headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: '600' },
    statsGrid: { flexDirection: 'row-reverse', padding: 15, justifyContent: 'space-between', marginTop: -20 },
    statCard: { width: '31%', padding: 15, borderRadius: 24, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    statIcon: { fontSize: 18 },
    statVal: { fontSize: 14, fontWeight: '900', color: '#1e293b', textAlign: 'center' },
    statLabel: { fontSize: 9, color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginTop: 2 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, marginTop: 15, alignItems: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
    refreshBtn: { color: '#0d9488', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
    appointmentCard: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 12, padding: 18, borderRadius: 28, elevation: 1 },
    rowReverse: { flexDirection: 'row-reverse', alignItems: 'center' },
    patientImg: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#f1f5f9' },
    patientDetails: { flex: 1, marginRight: 15, alignItems: 'flex-end' },
    patientName: { fontSize: 16, fontWeight: '900', color: '#1e293b' },
    timeText: { fontSize: 11, color: '#0d9488', fontWeight: '800', marginTop: 4 },
    actionArea: { minWidth: 70, alignItems: 'center' },
    btnRow: { flexDirection: 'row', gap: 8 },
    iconBtn: { padding: 10, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#edf2f7' },
    statusTag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, fontSize: 10, fontWeight: '900', overflow: 'hidden' },
    cardFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f8fafc', alignItems: 'center' },
    illnessText: { fontSize: 11, color: '#94a3b8', flex: 1, textAlign: 'right', marginLeft: 15, fontStyle: 'italic' },
    ageBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    ageText: { fontSize: 10, fontWeight: '900', color: '#64748b' },
    emptyState: { padding: 50, alignItems: 'center' },
    emptyText: { color: '#94a3b8', fontWeight: '700' }
});

export default DoctorDashboard;