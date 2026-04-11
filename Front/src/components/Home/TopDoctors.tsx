import React, { useMemo, memo, useContext, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Dimensions,
  Alert
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { MotiView } from 'moti';
import { AppContext } from '../../context/AppContext';

// تحديث الواجهة لتشمل الحقل الجديد المحسوب من الباك إند
interface Doctor {
    _id: string;
    name: string;
    image: string; 
    speciality: string;
    available: boolean; // التبديل اليدوي من الدكتور
    isAvailableNow: boolean; // الحقل الذكي الجديد (الإجازات + الفترات + الضغط)
    slots_available?: Record<string, string[]>;
}

interface TopDoctorsProps {
    speciality?: string;
}

const { width } = Dimensions.get("window");

const TopDoctors: React.FC<TopDoctorsProps> = memo(({ speciality }) => {
    const navigation = useNavigation<any>();
    const context = useContext(AppContext);
    const isDarkMode = context?.isDarkMode ?? true;
    
    const lastPressTime = useRef(0);

    const specialityTranslate: Record<string, string> = useMemo(() => ({
        "General physician": "طبيب عام",
        "Gynecologist": "أمراض نساء وتوليد",
        "Dermatologist": "جلدية وتجميل",
        "Pediatricians": "طب الأطفال",
        "Neurologist": "مخ وأعصاب",
        "Gastroenterologist": "باطنة وجهاز هضمي",
        "Cardiologist": "أمراض القلب",
        "Orthopedic": "عظام وجراحة مفاصل",
        "Dentist": "أسنان",
        "Ophthalmologist": "رمد وعيون",
        "Urologist": "مسالك بولية",
        "Lab Consultant": "دكتور تحاليل طبية",
        "Physiotherapist": "أخصائي علاج طبيعي"
    }), []);

    const { doctors, status } = useSelector((state: any) => state.doctors || { doctors: [], status: 'idle' });

    /**
     * 🧠 منطق العرض المحدث:
     * نعتمد الآن على isAvailableNow كأولوية قصوى للفرز والعرض
     */
    const displayDoctors = useMemo(() => {
        if (!Array.isArray(doctors)) return [];
        let filtered = [...doctors];

        if (speciality) {
            filtered = filtered.filter(doc => 
                doc.speciality.toLowerCase().replace(/\s+/g, '-') === speciality.toLowerCase().replace(/\s+/g, '-')
            );
        }

        return filtered
            .sort((a, b) => {
                // ترتيب الأطباء المتاحين "حالياً" في البداية
                return Number(b.isAvailableNow) - Number(a.isAvailableNow);
            })
            .slice(0, speciality ? 50 : 2); 
    }, [doctors, speciality]);

    const safeNavigate = useCallback((routeName: string, params?: object) => {
        const now = Date.now();
        if (now - lastPressTime.current < 1000) return; 
        lastPressTime.current = now;
        navigation.navigate(routeName, params);
    }, [navigation]);

    const handleDoctorClick = useCallback((item: Doctor) => {
        // نستخدم isAvailableNow لتحديد إمكانية الدخول لصفحة الحجز
        if (item.isAvailableNow) {
            safeNavigate('Appointment', { docId: item._id });
        } else {
            Alert.alert(
                "غير متاح حالياً", 
                `دكتور ${item.name.split(' ')[0]} غير متاح لاستقبال حجوزات الآن (قد يكون في وقت إجازة أو اكتمل عدد الحجوزات اليومية).`
            );
        }
    }, [safeNavigate]);

    const renderDoctorCard = useCallback(({ item, index }: { item: Doctor, index: number }) => {
        const isAvailable = item.isAvailableNow; // الربط مع الحقل الجديد

        return (
            <MotiView
                from={{ opacity: 0, scale: 0.9, translateY: 20 }}
                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                transition={{ delay: index * 100, type: 'timing', duration: 500 }}
                style={styles.cardWrapper}
            >
                <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={() => handleDoctorClick(item)}
                    style={[
                        styles.card, 
                        isDarkMode ? styles.darkCard : styles.lightCard,
                        !isAvailable && { opacity: 0.75 }
                    ]}
                >
                    <View style={[styles.imageContainer, isDarkMode ? styles.darkImgBg : styles.lightImgBg]}>
                        <Image source={{ uri: item.image }} style={styles.docImage} resizeMode="cover" />
                        
                        {/* الشارة المحدثة */}
                        <View style={[styles.statusBadge, isDarkMode ? styles.darkBadge : styles.lightBadge]}>
                            <View style={[styles.statusDot, { backgroundColor: isAvailable ? '#14b8a6' : '#ef4444' }]} />
                            <Text style={[styles.statusText, isDarkMode ? styles.whiteText : styles.blackText]}>
                                {isAvailable ? 'متاح الآن' : 'غير متاح'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoContainer}>
                        <View style={styles.infoTop}>
                            <Text style={styles.specialityText} numberOfLines={1}>
                                {specialityTranslate[item.speciality] || item.speciality}
                            </Text>
                            <Text style={styles.ratingText}>⭐ 4.9</Text>
                        </View>
                        <Text style={[styles.docName, isDarkMode ? styles.whiteText : styles.blackText]} numberOfLines={1}>
                            د. {item.name}
                        </Text>
                        
                        <View style={[
                            styles.bookingBtn, 
                            isAvailable 
                                ? (isDarkMode ? styles.btnActiveDark : styles.btnActiveLight) 
                                : styles.btnDisabled
                        ]}>
                            <Text style={[
                                styles.btnText, 
                                isAvailable 
                                    ? (isDarkMode ? styles.blackText : styles.whiteText) 
                                    : styles.btnTextDisabled
                            ]}>
                                {isAvailable ? 'حجز موعد ←' : 'الجدول ممتلئ'}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </MotiView>
        );
    }, [isDarkMode, specialityTranslate, handleDoctorClick]);

    if (status === 'loading' && doctors.length === 0) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#14b8a6" />
                <Text style={styles.loaderText}>جاري استدعاء النخبة...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, isDarkMode ? styles.darkBg : styles.lightBg]}>
            {!speciality && (
                <View style={styles.headerSection}>
                    <View style={styles.topBadge}>
                        <Text style={styles.topBadgeText}>المجتمع الطبي المتميز</Text>
                    </View>
                    <Text style={[styles.headerTitle, isDarkMode ? styles.whiteText : styles.blackText]}>
                        نخبة <Text style={styles.tealText}>عَوْن</Text> المختارة
                    </Text>
                    <Text style={styles.headerDesc}>
                        تصفح الأطباء المتاحين الآن بناءً على جداول العمل الفعلية وضغط الحجوزات.
                    </Text>
                </View>
            )}

            <FlatList
                data={displayDoctors}
                renderItem={renderDoctorCard}
                keyExtractor={(item) => item._id}
                numColumns={2}
                scrollEnabled={false} 
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.listContent}
            />

            {!speciality && (
                <View style={styles.btnContainer}>
                    <TouchableOpacity 
                        activeOpacity={0.7}
                        style={[styles.viewMoreBtn, isDarkMode ? styles.darkBtnBorder : styles.lightBtnBorder]}
                        onPress={() => safeNavigate('Doctors')}
                    >
                        <Text style={[styles.viewMoreText, isDarkMode ? styles.whiteText : styles.blackText]}>
                              عرض جميع أطباء النخبة
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
});

TopDoctors.displayName = 'TopDoctors';

const styles = StyleSheet.create({
    container: { paddingVertical: 20, zIndex: 1 },
    darkBg: { backgroundColor: '#0f172a' },
    lightBg: { backgroundColor: '#FCFCFD' },
    loaderContainer: { padding: 80, alignItems: 'center' },
    loaderText: { marginTop: 15, color: '#94a3b8', fontWeight: 'bold', fontSize: 12 },
    headerSection: { alignItems: 'center', marginBottom: 25, paddingHorizontal: 20 },
    topBadge: { backgroundColor: 'rgba(20, 184, 166, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    topBadgeText: { color: '#14b8a6', fontSize: 10, fontWeight: '900' },
    headerTitle: { fontSize: 24, fontWeight: '900', marginTop: 10, textAlign: 'center' },
    tealText: { color: '#14b8a6' },
    headerDesc: { color: '#64748B', textAlign: 'center', marginTop: 8, fontSize: 13, lineHeight: 20 },
    listContent: { paddingHorizontal: 15 },
    row: { justifyContent: 'space-between' },
    cardWrapper: { width: (width / 2) - 22, marginBottom: 15 },
    card: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    lightCard: { backgroundColor: '#fff', borderColor: '#F1F5F9' },
    darkCard: { backgroundColor: '#1e293b', borderColor: '#334155' },
    imageContainer: { height: 160 },
    lightImgBg: { backgroundColor: '#F8FAFC' },
    darkImgBg: { backgroundColor: '#0f172a' },
    docImage: { width: '100%', height: '100%' },
    statusBadge: { position: 'absolute', top: 10, right: 10, flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    lightBadge: { backgroundColor: 'rgba(255,255,255,0.9)' },
    darkBadge: { backgroundColor: 'rgba(15,23,42,0.8)' },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 5 },
    statusText: { fontSize: 8, fontWeight: '800' },
    infoContainer: { padding: 12 },
    infoTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 6 },
    specialityText: { fontSize: 9, color: '#14b8a6', fontWeight: '900', flex: 1, textAlign: 'right' },
    ratingText: { fontSize: 10, color: '#FACC15', fontWeight: 'bold', marginLeft: 4 },
    docName: { fontSize: 15, fontWeight: '900', textAlign: 'right', marginBottom: 12 },
    bookingBtn: { paddingVertical: 10, borderRadius: 15, alignItems: 'center' },
    btnActiveDark: { backgroundColor: '#fff' },
    btnActiveLight: { backgroundColor: '#0f172a' },
    btnDisabled: { backgroundColor: '#f1f5f9' },
    btnText: { fontSize: 10, fontWeight: '900' },
    btnTextDisabled: { color: '#94a3b8' },
    whiteText: { color: '#fff' },
    blackText: { color: '#0f172a' },
    btnContainer: { width: '100%', alignItems: 'center', marginTop: 10, paddingBottom: 20 },
    viewMoreBtn: { 
        width: width * 0.75, 
        padding: 16, 
        borderRadius: 18, 
        borderWidth: 1, 
        alignItems: 'center', 
        justifyContent: 'center',
        elevation: 5, 
        zIndex: 10,
    },
    lightBtnBorder: { borderColor: '#E2E8F0', backgroundColor: '#FFF' },
    darkBtnBorder: { borderColor: '#334155', backgroundColor: '#1e293b' },
    viewMoreText: { fontWeight: '900', fontSize: 14 }
});

export default TopDoctors;