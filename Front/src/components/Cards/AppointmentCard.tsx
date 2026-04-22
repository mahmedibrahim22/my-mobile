import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

/**
 * 🎫 [AppointmentCard]
 * مكون عرض كارت الحجز - نسخة محسنة تدعم الطبيب والمريض.
 * تدعم دورة حياة الحجز: طلب إلغاء، قبول/رفض، وإتمام الكشف.
 */

interface AppointmentProps {
    doctorName: string;
    patientName?: string;
    speciality: string;
    date: string;
    time: string;
    status: 'Upcoming' | 'Completed' | 'Cancelled' | 'PendingCancellation';
    isDarkMode?: boolean;
    isDoctorView?: boolean; // هل العرض في شاشة الدكتور؟
    onCancel?: () => Promise<void> | void; // للمريض: لطلب الإلغاء
    onComplete?: () => Promise<void> | void; // للدكتور: إتمام الكشف
    onAcceptCancel?: () => Promise<void> | void; // للدكتور: قبول الإلغاء (حذف نهائي)
    onRejectCancel?: () => Promise<void> | void; // للدكتور: رفض الإلغاء (تثبيت الموعد)
}

const AppointmentCard: React.FC<AppointmentProps> = ({ 
    doctorName, 
    patientName,
    speciality, 
    date, 
    time, 
    status, 
    onCancel,
    onComplete,
    onAcceptCancel,
    onRejectCancel,
    isDarkMode = false,
    isDoctorView = false 
}) => {
    const [loadingAction, setLoadingAction] = useState<'cancel' | 'complete' | 'accept' | 'reject' | null>(null);

    // 🛡️ معالج العمليات الموحد لإدارة الـ Loading والـ Callbacks
    const handleAction = async (action: 'cancel' | 'complete' | 'accept' | 'reject', callback?: () => Promise<void> | void) => {
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
                    {!isDoctorView && patientName && (
                        <Text style={[styles.patientName, { color: themeStyles.subText }]}>
                            المريض: {patientName}
                        </Text>
                    )}
                    <Text style={styles.spec}>{speciality}</Text>
                </View>
                
                {/* شارة الحالة (Status Badge) */}
                <View style={[
                    styles.statusBadge, 
                    status === 'Upcoming' ? styles.statusGreen : 
                    status === 'Cancelled' ? styles.statusRed : 
                    status === 'PendingCancellation' ? styles.statusOrange :
                    styles.statusGray
                ]}>
                    <Text style={[
                        styles.statusText,
                        status === 'Upcoming' ? {color: '#0D9488'} : 
                        status === 'Cancelled' ? {color: '#E11D48'} : 
                        status === 'PendingCancellation' ? {color: '#D97706'} :
                        {color: isDarkMode ? '#94A3B8' : '#64748B'}
                    ]}>
                        {status === 'Upcoming' ? 'قادم' : 
                         status === 'Cancelled' ? 'ملغي' : 
                         status === 'PendingCancellation' ? 'طلب إلغاء' : 'مكتمل'}
                    </Text>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: themeStyles.divider }]} />

            {/* الجزء السفلي: الوقت والأزرار التفاعلية */}
            <View style={styles.footer}>
                <View style={styles.dateTime}>
                    <Text style={[styles.dateText, { color: themeStyles.subText }]}>📅 {date}</Text>
                    <Text style={[styles.timeText, { color: themeStyles.subText }]}>⏰ {time}</Text>
                </View>
                
                <View style={styles.actionsContainer}>
                    {/* 1. واجهة المريض: زر طلب الإلغاء */}
                    {!isDoctorView && status === 'Upcoming' && (
                        <TouchableOpacity 
                            onPress={() => handleAction('cancel', onCancel)} 
                            disabled={!!loadingAction}
                            style={styles.cancelBtn}
                        >
                            {loadingAction === 'cancel' ? (
                                <ActivityIndicator size="small" color="#EF4444" />
                            ) : (
                                <Text style={styles.cancelText}>إلغاء الموعد</Text>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* 2. واجهة المريض: عرض حالة الانتظار */}
                    {!isDoctorView && status === 'PendingCancellation' && (
                        <View style={styles.pendingBadge}>
                            <Text style={styles.pendingText}>في انتظار رد الطبيب</Text>
                        </View>
                    )}

                    {/* 3. واجهة الدكتور: زر إتمام الكشف */}
                    {isDoctorView && status === 'Upcoming' && (
                        <TouchableOpacity 
                            onPress={() => handleAction('complete', onComplete)} 
                            style={styles.completeBtn}
                            disabled={!!loadingAction}
                        >
                            {loadingAction === 'complete' ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Text style={styles.completeText}>تم الكشف</Text>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* 4. واجهة الدكتور: التعامل مع طلب الإلغاء (قبول/رفض) */}
                    {isDoctorView && status === 'PendingCancellation' && (
                        <View style={styles.row}>
                            <TouchableOpacity 
                                onPress={() => handleAction('reject', onRejectCancel)} 
                                style={styles.rejectBtn}
                                disabled={!!loadingAction}
                            >
                                {loadingAction === 'reject' ? (
                                    <ActivityIndicator size="small" color="#64748B" />
                                ) : (
                                    <Text style={styles.rejectText}>رفض</Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => handleAction('accept', onAcceptCancel)} 
                                style={styles.acceptBtn}
                                disabled={!!loadingAction}
                            >
                                {loadingAction === 'accept' ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={styles.acceptText}>قبول الإلغاء</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: { 
        borderRadius: 20, 
        padding: 16, 
        marginBottom: 12, 
        borderWidth: 1, 
        elevation: 3, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 5 
    },
    header: { 
        flexDirection: 'row-reverse', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start' 
    },
    infoArea: { 
        alignItems: 'flex-end', 
        flex: 1, 
        marginLeft: 10 
    },
    name: { 
        fontSize: 16, 
        fontWeight: 'bold' 
    },
    patientName: { 
        fontSize: 13, 
        marginTop: 2, 
        fontWeight: '500' 
    },
    spec: { 
        fontSize: 12, 
        color: '#14B8A6', 
        fontWeight: '600', 
        marginTop: 4 
    },
    statusBadge: { 
        paddingHorizontal: 10, 
        paddingVertical: 4, 
        borderRadius: 8 
    },
    statusGreen: { backgroundColor: '#F0FDFA' },
    statusRed: { backgroundColor: '#FEF2F2' },
    statusOrange: { backgroundColor: '#FFFBEB' },
    statusGray: { backgroundColor: '#F8FAFC' },
    statusText: { 
        fontSize: 10, 
        fontWeight: 'bold' 
    },
    divider: { 
        height: 1, 
        marginVertical: 12 
    },
    footer: { 
        flexDirection: 'row-reverse', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
    },
    dateTime: { 
        alignItems: 'flex-end' 
    },
    dateText: { 
        fontSize: 12, 
        fontWeight: '600' 
    },
    timeText: { 
        fontSize: 12, 
        fontWeight: '600', 
        marginTop: 2 
    },
    actionsContainer: { 
        flexDirection: 'row' 
    },
    row: { 
        flexDirection: 'row-reverse' 
    },
    cancelBtn: { 
        paddingVertical: 8, 
        paddingHorizontal: 15, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: '#FECACA', 
        minWidth: 100, 
        alignItems: 'center' 
    },
    cancelText: { 
        color: '#EF4444', 
        fontSize: 11, 
        fontWeight: 'bold' 
    },
    completeBtn: { 
        paddingVertical: 8, 
        paddingHorizontal: 15, 
        borderRadius: 12, 
        backgroundColor: '#0D9488', 
        minWidth: 100, 
        alignItems: 'center' 
    },
    completeText: { 
        color: '#FFF', 
        fontSize: 11, 
        fontWeight: 'bold' 
    },
    acceptBtn: { 
        paddingVertical: 8, 
        paddingHorizontal: 12, 
        borderRadius: 10, 
        backgroundColor: '#EF4444', 
        marginLeft: 8 
    },
    acceptText: { 
        color: '#FFF', 
        fontSize: 10, 
        fontWeight: 'bold' 
    },
    rejectBtn: { 
        paddingVertical: 8, 
        paddingHorizontal: 12, 
        borderRadius: 10, 
        borderWidth: 1, 
        borderColor: '#CBD5E1' 
    },
    rejectText: { 
        color: '#64748B', 
        fontSize: 10, 
        fontWeight: 'bold' 
    },
    pendingBadge: { 
        paddingVertical: 6, 
        paddingHorizontal: 12, 
        borderRadius: 8, 
        backgroundColor: 'rgba(217, 119, 6, 0.1)' 
    },
    pendingText: { 
        color: '#D97706', 
        fontSize: 10, 
        fontWeight: '700' 
    }
});

export default memo(AppointmentCard);