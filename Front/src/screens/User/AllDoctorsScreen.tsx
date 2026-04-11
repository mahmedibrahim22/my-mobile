import React, { useMemo, useContext, useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar,
  Dimensions,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MotiView } from 'moti';
import { AppContext } from "../../context/AppContext";

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width / 2) - 15;

// تحديث الواجهة لتشمل الحقول الجديدة من الباك إند
interface Doctor {
  _id: string;
  name: string;
  speciality: string;
  image: string;
  isAvailableNow: boolean; // الحقل الجديد بدلاً من available
}

const AllDoctorsScreen = () => {
  const { doctors, status } = useSelector((state: any) => state.doctors || { doctors: [], status: 'idle' });
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const context = useContext(AppContext);
  const isDark = context?.isDarkMode ?? true;
  
  const lastPressTime = useRef(0);

  const [selectedSpec, setSelectedSpec] = useState<string | null>(route.params?.speciality || null);

  const specialityTranslate: Record<string, string> = useMemo(() => ({
    "General physician": "طبيب عام",
    "Gynecologist": "نساء وتوليد",
    "Dermatologist": "جلدية",
    "Pediatricians": "أطفال",
    "Neurologist": "مخ وأعصاب",
    "Gastroenterologist": "باطنة",
    "Cardiologist": "قلب",
    "Orthopedic": "عظام",
    "Dentist": "أسنان",
    "Ophthalmologist": "رمد",
    "Urologist": "مسالك",
    "Lab Consultant": "تحاليل",
    "Physiotherapist": "علاج طبيعي"
  }), []);

  const availableSpecs = useMemo(() => Object.keys(specialityTranslate), [specialityTranslate]);

  const filteredDoctors = useMemo(() => {
    let list = doctors || [];
    if (selectedSpec) {
      list = list.filter((doc: Doctor) => 
        doc.speciality.trim().toLowerCase() === selectedSpec.trim().toLowerCase()
      );
    }
    // الترتيب بناءً على المتاح الآن أولاً
    return [...list].sort((a, b) => Number(b.isAvailableNow) - Number(a.isAvailableNow));
  }, [doctors, selectedSpec]);

  const handleNavigate = useCallback((docId: string) => {
    const now = Date.now();
    if (now - lastPressTime.current < 500) return; 
    lastPressTime.current = now;
    
    navigation.navigate('Appointment', { docId });
  }, [navigation]);

  const renderDoctorCard = ({ item, index }: { item: Doctor, index: number }) => (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 30, type: 'timing', duration: 250 }}
      style={styles.cardWrapper}
    >
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => handleNavigate(item._id)}
        style={[
          styles.card, 
          isDark ? styles.cardDark : styles.cardLight,
          !item.isAvailableNow && { opacity: 0.8 }
        ]}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.doctorImage} resizeMode="cover" />
          {/* تحديث لون الحالة بناءً على isAvailableNow */}
          <View style={[styles.miniStatus, { backgroundColor: item.isAvailableNow ? '#14b8a6' : '#ef4444' }]} />
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.docName, isDark ? styles.textWhite : styles.textDark]} numberOfLines={1}>
            د. {item.name.split(' ').slice(0, 2).join(' ')}
          </Text>
          <Text style={styles.docSpeciality} numberOfLines={1}>
            {specialityTranslate[item.speciality] || item.speciality}
          </Text>
          
          <View style={[styles.actionBtn, item.isAvailableNow ? styles.btnActive : styles.btnDisabled]}>
            <Text style={styles.btnText}>
              {item.isAvailableNow ? 'احجز الآن' : 'غير متاح حالياً'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </MotiView>
  );

  return (
    <SafeAreaView style={[styles.mainContainer, isDark ? styles.bgDark : styles.bgLight]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
        <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => setSelectedSpec(null)} style={styles.showAllBadge}>
                <Text style={styles.showAllBadgeText}>الكل</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, isDark ? styles.textWhite : styles.textDark]}>
            نخبة أطباء <Text style={styles.tealText}>عَوْن</Text>
            </Text>
        </View>
        
        <View style={styles.specListWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.specScrollContainer}
          >
            {availableSpecs.map((item) => (
              <TouchableOpacity 
                key={item}
                activeOpacity={0.7}
                onPress={() => setSelectedSpec(item)}
                style={[
                  styles.specBadge, 
                  selectedSpec === item ? styles.specBadgeActive : (isDark ? styles.specBadgeDark : styles.specBadgeLight)
                ]}
              >
                <Text style={[
                  styles.specBadgeText, 
                  selectedSpec === item ? styles.textWhite : (isDark ? styles.textWhite : styles.textDark)
                ]}>
                  {specialityTranslate[item]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {status === 'loading' ? (
          <ActivityIndicator color="#14b8a6" size="large" style={{marginTop: 50}} />
      ) : (
        <FlatList
            data={filteredDoctors}
            keyExtractor={(item) => item._id}
            renderItem={renderDoctorCard}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listPadding}
            initialNumToRender={6}
            maxToRenderPerBatch={10}
            windowSize={5}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>لا يوجد أطباء حالياً</Text>
              </View>
            }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  bgDark: { backgroundColor: '#060b18' },
  bgLight: { backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  headerDark: { backgroundColor: '#0f172a' },
  headerLight: { backgroundColor: '#fff' },
  headerTopRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 12 
  },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  showAllBadge: { 
    backgroundColor: 'rgba(20, 184, 166, 0.1)', 
    paddingHorizontal: 15, 
    paddingVertical: 5, 
    borderRadius: 8 
  },
  showAllBadgeText: { color: '#14b8a6', fontSize: 12, fontWeight: 'bold' },
  tealText: { color: '#14b8a6' },
  textWhite: { color: '#fff' },
  textDark: { color: '#0f172a' },
  specListWrapper: {
    width: '100%',
    maxHeight: 150,
  },
  specScrollContainer: { 
    paddingHorizontal: 15,
    flexDirection: 'column',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  specBadge: { 
    paddingHorizontal: 16, 
    height: 36,
    borderRadius: 10, 
    marginRight: 8, 
    marginBottom: 8, 
    borderWidth: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  specBadgeDark: { backgroundColor: '#1e293b', borderColor: '#334155' },
  specBadgeLight: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
  specBadgeActive: { backgroundColor: '#14b8a6', borderColor: '#14b8a6' },
  specBadgeText: { fontSize: 11, fontWeight: 'bold' },
  listPadding: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 30 },
  row: { justifyContent: 'space-between' },
  cardWrapper: { width: CARD_WIDTH, marginBottom: 15 },
  card: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, elevation: 3 },
  cardDark: { backgroundColor: '#1e293b', borderColor: '#334155' },
  cardLight: { backgroundColor: '#fff', borderColor: '#f1f5f9' },
  imageContainer: { width: '100%', height: 130, backgroundColor: '#f1f5f9' },
  doctorImage: { width: '100%', height: '100%' },
  miniStatus: { 
    position: 'absolute', 
    top: 10, 
    right: 10, 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    borderWidth: 2, 
    borderColor: '#fff' 
  },
  cardContent: { padding: 12, alignItems: 'center' },
  docName: { fontSize: 14, fontWeight: '900', textAlign: 'center', marginBottom: 2 },
  docSpeciality: { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginBottom: 12 },
  actionBtn: { width: '100%', paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  btnActive: { backgroundColor: '#14b8a6' },
  btnDisabled: { backgroundColor: '#475569' },
  btnText: { fontSize: 11, fontWeight: '900', color: '#fff' },
  emptyContainer: { marginTop: 100, alignItems: 'center' },
  emptyTitle: { color: '#94a3b8', fontSize: 16, fontWeight: '900' }
});

export default AllDoctorsScreen;