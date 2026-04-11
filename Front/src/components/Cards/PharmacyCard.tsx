import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MotiView } from 'moti'; // للأنيميشن عند التفاعل

// 1. تعريف الـ Interface لبيانات الصيدلية (TypeScript)
interface PharmacyCardProps {
    name: string;
    address: string;
    phone?: string;
}

const { width } = Dimensions.get('window');

const PharmacyCard: React.FC<PharmacyCardProps> = ({ name, address, phone }) => {
    
    const handleBrowsePharmacy = () => {
        console.log(`تصفح أدوية صيدلية: ${name}`);
        // هنا يمكنك التوجيه لصفحة أدوية هذه الصيدلية تحديداً
    };

    return (
        <View style={styles.cardContainer}>
            <View style={styles.headerRow}>
                {/* أيقونة الصيدلية بتصميم مربع منحني */}
                <MotiView 
                    from={{ scale: 1 }}
                    animate={{ scale: 1 }}
                    style={styles.iconWrapper}
                >
                    <Text style={styles.emoji}>🏥</Text>
                </MotiView>
                
                <View style={styles.infoContent}>
                    <Text style={styles.pharmacyName} numberOfLines={1}>
                        {name}
                    </Text>
                    <Text style={styles.addressText} numberOfLines={2}>
                        📍 {address}
                    </Text>
                    {phone && (
                        <Text style={styles.phoneText}>
                            📞 {phone}
                        </Text>
                    )}
                </View>
            </View>

            {/* زر تصفح الأدوية */}
            <TouchableOpacity 
                activeOpacity={0.7}
                onPress={handleBrowsePharmacy}
                style={styles.browseButton}
            >
                <Text style={styles.buttonText}>تصفح الأدوية</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#FFFFFF',
        width: width - 40, // كارت بعرض الشاشة تقريباً
        padding: 20,
        borderRadius: 35,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 16,
        alignSelf: 'center',
        // Shadow for iOS
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        // Elevation for Android
        elevation: 3,
    },
    headerRow: {
        flexDirection: 'row-reverse', // RTL Layout
        alignItems: 'center',
        marginBottom: 20,
    },
    iconWrapper: {
        width: 65,
        height: 65,
        backgroundColor: '#F0FDFA', // teal-50
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 15, // مسافة من اليمين لأننا في وضع RTL
    },
    emoji: {
        fontSize: 30,
    },
    infoContent: {
        flex: 1,
        alignItems: 'flex-end', // محاذاة النص لليمين
    },
    pharmacyName: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 4,
    },
    addressText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '700',
        textAlign: 'right',
        lineHeight: 16,
    },
    phoneText: {
        fontSize: 10,
        color: '#14B8A6',
        fontWeight: '900',
        marginTop: 4,
    },
    browseButton: {
        backgroundColor: '#F8FAFC', // slate-50
        width: '100%',
        paddingVertical: 14,
        borderRadius: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    buttonText: {
        color: '#0D9488', // teal-600
        fontSize: 14,
        fontWeight: '900',
    },
});

export default PharmacyCard;