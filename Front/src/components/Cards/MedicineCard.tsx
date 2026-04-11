import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

// 1. تعريف الـ Interface لبيانات الدواء (نفس المنطق السابق)
interface MedicineCardProps {
    name: string;
    price: number | string;
    category?: string;
}

const { width } = Dimensions.get('window');

const MedicineCard: React.FC<MedicineCardProps> = ({ name, price, category }) => {
    
    const handleAddToCart = () => {
        console.log(`إضافة ${name} إلى السلة`);
        // هنا هتربط لاحقاً مع الـ Redux Cart Action
    };

    return (
        <View style={styles.cardContainer}>
            {/* أيقونة الدواء */}
            <View style={styles.iconWrapper}>
                <Text style={styles.emoji}>💊</Text>
            </View>

            {/* التصنيف */}
            <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                    {category || 'متوفر حالياً'}
                </Text>
            </View>

            {/* الاسم والسعر */}
            <View style={styles.detailsContainer}>
                <Text style={styles.medicineName} numberOfLines={1}>
                    {name}
                </Text>
                <View style={styles.priceRow}>
                    <Text style={styles.currency}>ج.م</Text>
                    <Text style={styles.priceValue}>{price}</Text>
                </View>
            </View>

            {/* زر الطلب */}
            <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleAddToCart}
                style={styles.orderButton}
            >
                <Text style={styles.buttonText}>أضف للسلة</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#FFFFFF',
        width: (width - 60) / 2, // كارتين في كل صف مع مراعاة المسافات
        padding: 16,
        borderRadius: 35,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        alignItems: 'center',
        marginBottom: 20,
        // Shadow for iOS
        shadowColor: '#14B8A6',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        // Elevation for Android
        elevation: 4,
    },
    iconWrapper: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    emoji: {
        fontSize: 40,
    },
    categoryBadge: {
        backgroundColor: '#F0FDFA', // teal-100
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 50,
        marginBottom: 10,
    },
    categoryText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#0D9488', // teal-600
        textTransform: 'uppercase',
    },
    detailsContainer: {
        alignItems: 'center',
        marginBottom: 15,
        width: '100%',
    },
    medicineName: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1E293B', // slate-800
        marginBottom: 4,
        textAlign: 'center',
    },
    priceRow: {
        flexDirection: 'row-reverse', // لضبط التنسيق العربي
        alignItems: 'center',
    },
    priceValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#14B8A6', // teal-600
    },
    currency: {
        fontSize: 10,
        color: '#94A3B8',
        marginRight: 4,
        fontWeight: '700',
    },
    orderButton: {
        backgroundColor: '#0D9488',
        width: '100%',
        paddingVertical: 12,
        borderRadius: 15,
        alignItems: 'center',
        shadowColor: '#0D9488',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
    },
});

export default MedicineCard;