import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MotiView } from 'moti';

// 1. تعريف الـ Interface لضمان دعم TypeScript
interface LabCardProps {
    name: string;
    homeService?: boolean;
}

const { width } = Dimensions.get('window');

const LabCard: React.FC<LabCardProps> = ({ name, homeService }) => {
    
    return (
        <View style={styles.cardContainer}>
            {/* علامة الخدمة المنزلية - Absolute Position */}
            {homeService && (
                <View style={styles.homeServiceBadge}>
                    <Text style={styles.homeServiceText}>زيارة منزلية ✅</Text>
                </View>
            )}

            {/* الأيقونة بتأثير بصري بسيط */}
            <MotiView 
                from={{ rotate: '0deg' }}
                animate={{ rotate: '0deg' }}
                transition={{ type: 'timing', duration: 300 }}
                style={styles.iconWrapper}
            >
                <Text style={styles.emoji}>🧪</Text>
            </MotiView>

            {/* تفاصيل المعمل */}
            <View style={styles.content}>
                <Text style={styles.labName} numberOfLines={1}>
                    {name}
                </Text>
                <Text style={styles.description}>
                    نقدم أدق النتائج الطبية باستخدام أحدث الأجهزة والتقنيات العالمية.
                </Text>
            </View>

            {/* أزرار التفاعل */}
            <View style={styles.buttonGroup}>
                <TouchableOpacity 
                    activeOpacity={0.8}
                    style={styles.mainButton}
                    onPress={() => console.log(`حجز في معمل: ${name}`)}
                >
                    <Text style={styles.mainButtonText}>حجز زيارة</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    activeOpacity={0.8}
                    style={styles.secondaryButton}
                >
                    <Text style={styles.secondaryButtonText}>الأسعار</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#FFFFFF',
        width: width - 40,
        padding: 24,
        borderRadius: 35,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        position: 'relative',
        overflow: 'hidden',
        alignSelf: 'center',
        marginBottom: 16,
        // Shadows
        shadowColor: '#3B82F6', // Blue-600 shadow
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 3,
    },
    homeServiceBadge: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: '#DCFCE7', // green-100
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        zIndex: 10,
    },
    homeServiceText: {
        color: '#16A34A', // green-600
        fontSize: 9,
        fontWeight: '900',
    },
    iconWrapper: {
        width: 65,
        height: 65,
        backgroundColor: '#EFF6FF', // blue-50
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        alignSelf: 'flex-end', // ليكون متناسق مع RTL
    },
    emoji: {
        fontSize: 35,
    },
    content: {
        alignItems: 'flex-end', // محاذاة النص لليمين
        marginBottom: 25,
    },
    labName: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 8,
    },
    description: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '700',
        textAlign: 'right',
        lineHeight: 18,
    },
    buttonGroup: {
        flexDirection: 'row', // الأزرار بجانب بعضها
        gap: 10,
    },
    mainButton: {
        flex: 2, // الزر الأساسي يأخذ مساحة أكبر
        backgroundColor: '#2563EB', // blue-600
        paddingVertical: 14,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '900',
    },
    secondaryButton: {
        flex: 1, // زر الأسعار أصغر
        backgroundColor: '#F8FAFC',
        paddingVertical: 14,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    secondaryButtonText: {
        color: '#64748B',
        fontSize: 13,
        fontWeight: '900',
    },
});

export default LabCard;