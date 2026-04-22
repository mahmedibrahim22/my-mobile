import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

/**
 * 🎫 [AppointmentCard]
 * مكون عرض كارت الحجز - نسخة محسنة تدعم الطبيب والمريض.
 * تدعم دورة حياة الحجز: طلب إلغاء، قبول/رفض، وإتمام الكشف، وحالات الـ Backend الجديدة.
 */

interface AppointmentProps {
    doctorName: string;
    patientName?: string;
    speciality: string;
    date: string;
    time: string;
    address?: string; // العنوان المرسل من الـ Backend عند القبول
    status: 'Pending' | 'Accepted' | 'Rejected' | 'Completed' | 'Upcoming' | 'Cancelled' | 'PendingCancellation';
    isDarkMode?: boolean;
    isDoctorView?: boolean; // هل العرض في شاشة الدكتور؟
    onCancel?: () => Promise<void> | void; // للمريض: لطلب الإلغاء
    onApprove?: () => Promise<void> | void; // للدكتور: قبول حجز جديد
    onReject?: () => Promise<void> | void; // للدكتور: رفض حجز جديد
    onComplete?: () => Promise<void> | void; // للدكتور: إتمام الكشف
    onAcceptCancel?: () => Promise<void> | void; // للدكتور: قبول طلب إلغاء مريض
    onRejectCancel?: () => Promise<void> | void; // للدكتور: رفض طلب إلغاء مريض
}

const AppointmentCard: React.FC<AppointmentProps> = ({ 
    doctorName, 
    patientName,
    speciality, 
    date, 
    time, 
    address,
    status, 
    onCancel,
    onApprove,
    onReject,
    onComplete,
    onAcceptCancel,
    onRejectCancel,
    isDarkMode = false,
    isDoctorView = false 
}) => {
    const [loadingAction, setLoadingAction] = useState<'cancel' | 'complete' | 'accept' | 'reject' | 'approve' | null>(null);

    // 🛡️ معالج العمليات الموحد لإدارة الـ Loading والـ Callbacks
    const handleAction = async (action: any, callback?: () => Promise<void> | void) => {
        if (loadingAction || !callback) return;
        setLoadingAction(action);
        try {
            await callback();
        } catch (error) {
            console.error(`Action ${action} failed:`, error);
        } finally {
            setTimeout(() => setLoadingAction(null), 800);
        }
    };

    const themeStyles = {
        cardBg: isDarkMode ? '#1E293B' : '#FFF',
        cardBorder: isDarkMode ? '#334155' : '#F1F5F9',
        mainText: isDarkMode ? '#F8FAFC' : '#1E293B',
        subText: isDarkMode ? '#94A3B8' : '#475569',
        divider: isDarkMode ? '#334155' : '#F1F5F9',
    };

    return (
        <View style={[styles.card, { 
            backgroundColor: themeStyles.cardBg, 
            borderColor: themeStyles.cardBorder 
        }]}>
            
            {/* الجزء العلوي: بيانات الطبيب/المريض والحالة */}
            <View style={styles.header}>
                <View style={styles.infoArea}>
                    <Text style={[styles.name, { color: themeStyles.mainText }]}>
                        {isDoctorView ? `المريض: ${patientName}` : `د. ${doctorName}`}
                    </Text>
                    <Text style={styles.spec}>{speciality}</Text>
                </View>
                
                {/* شارة الحالة (Status Badge) */}
                <View style={[
                    styles.statusBadge, 
                    (status === 'Accepted' || status === 'Upcoming') ? styles.statusGreen : 
                    (status === 'Rejected' || status === 'Cancelled') ? styles.statusRed : 
                    (status === 'Pending' || status === 'PendingCancellation') ? styles.statusOrange :
                    styles.statusGray
                ]}>
                    <Text style={[
                        styles.statusText,
                        (status === 'Accepted' || status === 'Upcoming') ? {color: '#0D9488'} : 
                        (status === 'Rejected' || status === 'Cancelled') ? {color: '#E11D48'} : 
                        (status === 'Pending' || status === 'PendingCancellation') ? {color: '#D97706'} :
                        {color: isDarkMode ? '#94A3B8' : '#64748B'}
                    ]}>
                        {status === 'Pending' ? 'قيد الانتظار' : 
                         status === 'Accepted' ? 'مقبول' : 
                         status === 'Rejected' ? 'مرفوض' : 
                         status === 'Completed' ? 'مكتمل' : 
                         status === 'Cancelled' ? 'ملغي' : 
                         status === 'PendingCancellation' ? 'طلب إلغاء' : 'قادم'}
                    </Text>
                </View>
            </View>

            {/* بانر العنوان للمريض عند قبول الحجز */}
            {!isDoctorView && status === 'Accepted' && address && (
                <View style={styles.addressBanner}>
                    <Text style={styles.addressText}>📍 تم قبول حجزك - العنوان: {address}</Text>
                </View>
            )}

            <View style={[styles.divider, { backgroundColor: themeStyles.divider }]} />

            {/* الجزء السفلي: الوقت والأزرار التفاعلية */}
            <View style={styles.footer}>
                <View style={styles.dateTime}>
                    <Text style={[styles.dateText, { color: themeStyles.subText }]}>📅 {date}</Text>
                    <Text style={[styles.timeText, { color: themeStyles.subText }]}>⏰ {time}</Text>
                </View>
                
                <View style={styles.actionsContainer}>
                    {/* 1. واجهة الدكتور: حالة Pending (قبول أو رفض) */}
                    {isDoctorView && status === 'Pending' && (
                        <View style={styles.row}>
                            <TouchableOpacity onPress={() => handleAction('reject', onReject)} style={styles.rejectBtn}>
                                <Text style={styles.rejectText}>رفض</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleAction('approve', onApprove)} style={styles.approveBtn}>
                                <Text style={styles.approveText}>قبول</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* 2. واجهة الدكتور: حالة Accepted (إتمام الكشف) */}
                    {isDoctorView && status === 'Accepted' && (
                        <TouchableOpacity 
                            onPress={() => handleAction('complete', onComplete)} 
                            style={styles.completeBtn}
                        >
                            <Text style={styles.completeText}>إتمام الكشف</Text>
                        </TouchableOpacity>
                    )}

                    {/* 3. واجهة الدكتور: التعامل مع طلب الإلغاء */}
                    {isDoctorView && status === 'PendingCancellation' && (
                        <View style={styles.row}>
                            <TouchableOpacity onPress={() => handleAction('reject', onRejectCancel)} style={styles.rejectBtn}>
                                <Text style={styles.rejectText}>رفض الإلغاء</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleAction('accept', onAcceptCancel)} style={styles.acceptBtn}>
                                <Text style={styles.acceptText}>قبول الإلغاء</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* 4. واجهة المريض: إلغاء موعد قادم */}
                    {!isDoctorView && (status === 'Pending' || status === 'Accepted') && (
                        <TouchableOpacity onPress={() => handleAction('cancel', onCancel)} style={styles.cancelBtn}>
                            <Text style={styles.cancelText}>إلغاء</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: { borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
    header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start' },
    infoArea: { alignItems: 'flex-end', flex: 1, marginLeft: 10 },
    name: { fontSize: 16, fontWeight: 'bold' },
    spec: { fontSize: 12, color: '#14B8A6', fontWeight: '600', marginTop: 4 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusGreen: { backgroundColor: '#F0FDFA' },
    statusRed: { backgroundColor: '#FEF2F2' },
    statusOrange: { backgroundColor: '#FFFBEB' },
    statusGray: { backgroundColor: '#F8FAFC' },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    addressBanner: { backgroundColor: '#F0FDFA', padding: 8, borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: '#5EEAD4' },
    addressText: { color: '#0F766E', fontSize: 11, fontWeight: 'bold', textAlign: 'right' },
    divider: { height: 1, marginVertical: 12 },
    footer: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
    dateTime: { alignItems: 'flex-end' },
    dateText: { fontSize: 12, fontWeight: '600' },
    timeText: { fontSize: 12, fontWeight: '600', marginTop: 2 },
    actionsContainer: { flexDirection: 'row' },
    row: { flexDirection: 'row-reverse' },
    approveBtn: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10, backgroundColor: '#0D9488', marginLeft: 8 },
    approveText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
    rejectBtn: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1' },
    rejectText: { color: '#64748B', fontSize: 11, fontWeight: 'bold' },
    completeBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 12, backgroundColor: '#0D9488' },
    completeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
    acceptBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#EF4444', marginLeft: 8 },
    acceptText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    cancelBtn: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' },
    cancelText: { color: '#EF4444', fontSize: 11, fontWeight: 'bold' },
});

export default memo(AppointmentCard);