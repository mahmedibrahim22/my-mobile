import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

/**
 * 🎫 [AppointmentCard]
 * مكون عرض كارت الحجز - نسخة الأدمن المحسنة.
 * تم إضافة دعم عرض بيانات المريض (Patient) بجانب بيانات الطبيب.
 */

interface AppointmentProps {
    doctorName: string;
    patientName?: string; // أضفنا اسم المريض لأنه ضروري للأدمن
    speciality: string;
    date: string;
    time: string;
    status: 'Upcoming' | 'Completed' | 'Cancelled';
    onCancel?: () => Promise<void> | void;
    isDarkMode?: boolean;
}

const AppointmentCard: React.FC<AppointmentProps> = ({ 
    doctorName, 
    patientName,
    speciality, 
    date, 
    time, 
    status, 
    onCancel,
    isDarkMode = false 
}) => {
    const [isCancelling, setIsCancelling] = useState(false);

    // 🛡️ دالة معالجة الإلغاء مع منع الـ Spam
    const handleCancelPress = async () => {
        if (isCancelling || !onCancel) return;
        
        setIsCancelling(true);
        try {
            await onCancel();
        } finally {
            // نترك حالة التحميل قليلاً لمنع الضغط المتكرر السريع
            setTimeout(() => setIsCancelling(false), 1000);
        }
    };

    // 🎨 تنسيقات الألوان بناءً على الثيم
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
            
            {/* الجزء العلوي: اسم الدكتور والمريض والحالة */}
            <View style={styles.header}>
                <View style={styles.infoArea}>
                    <Text style={[styles.name, { color: themeStyles.mainText }]}>د. {doctorName}</Text>
                    {patientName && (
                        <Text style={[styles.patientName, { color: themeStyles.subText }]}>
                            المريض: {patientName}
                        </Text>
                    )}
                    <Text style={styles.spec}>{speciality}</Text>
                </View>
                
                <View style={[
                    styles.statusBadge, 
                    status === 'Upcoming' ? styles.statusGreen : 
                    status === 'Cancelled' ? styles.statusRed : 
                    styles.statusGray
                ]}>
                    <Text style={[
                        styles.statusText,
                        status === 'Upcoming' ? {color: '#0D9488'} : 
                        status === 'Cancelled' ? {color: '#E11D48'} : 
                        {color: isDarkMode ? '#94A3B8' : '#64748B'}
                    ]}>
                        {status === 'Upcoming' ? 'قادم' : status === 'Cancelled' ? 'ملغي' : 'مكتمل'}
                    </Text>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: themeStyles.divider }]} />

            {/* الجزء السفلي: التاريخ والوقت وزر الإلغاء */}
            <View style={styles.footer}>
                <View style={styles.dateTime}>
                    <Text style={[styles.dateText, { color: themeStyles.subText }]}>📅 {date}</Text>
                    <Text style={[styles.timeText, { color: themeStyles.subText }]}>⏰ {time}</Text>
                </View>
                
                {status === 'Upcoming' && (
                    <TouchableOpacity 
                        activeOpacity={0.7} 
                        onPress={handleCancelPress} 
                        disabled={isCancelling}
                        style={[
                            styles.cancelBtn, 
                            { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#FFF' },
                            isCancelling && { opacity: 0.5 }
                        ]}
                    >
                        {isCancelling ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                            <Text style={styles.cancelText}>إلغاء الموعد</Text>
                        )}
                    </TouchableOpacity>
                )}
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
        shadowRadius: 5,
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
        fontWeight: 'bold', 
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
        fontWeight: '600', 
    },
    timeText: { 
        fontSize: 12, 
        fontWeight: '600', 
        marginTop: 2 
    },
    cancelBtn: { 
        paddingVertical: 8, 
        paddingHorizontal: 15, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: '#FECACA',
        minWidth: 110,
        alignItems: 'center',
        justifyContent: 'center'
    },
    cancelText: { 
        color: '#EF4444', 
        fontSize: 11, 
        fontWeight: 'bold' 
    }
});

export default memo(AppointmentCard);