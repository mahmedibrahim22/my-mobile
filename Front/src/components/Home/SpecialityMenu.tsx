import React, { useMemo, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Platform
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MotiView } from "moti";
import { AppContext } from "../../context/AppContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.34; 

interface SpecialityItem {
  value: string;
  label: string;
  image: any;
}

const SpecialityMenu: React.FC = () => {
  const navigation = useNavigation<any>();
  const context = useContext(AppContext);
  const isDark = context?.isDarkMode ?? true;

  const specialityData: SpecialityItem[] = useMemo(() => [
    { value: "General-physician", label: "طبيب عام", image: require("@assets/icons/general.png") },
    { value: "Gynecologist", label: "نساء وتوليد", image: require("@assets/icons/gynecology.png") },
    { value: "Dermatologist", label: "جلدية وتجميل", image: require("@assets/icons/dermatology.png") },
    { value: "Pediatricians", label: "طب الأطفال", image: require("@assets/icons/pediatrics.png") },
    { value: "Neurologist", label: "مخ وأعصاب", image: require("@assets/icons/neurology.png") },
    { value: "Gastroenterologist", label: "باطنة", image: require("@assets/icons/gastroenterology.png") },
    { value: "Cardiologist", label: "أمراض القلب", image: require("@assets/icons/cardiology.png") },
    { value: "Orthopedic", label: "عظام ومفاصل", image: require("@assets/icons/orthopedic.png") },
    { value: "Dentist", label: "أسنان", image: require("@assets/icons/dentist.png") },
    { value: "Ophthalmologist", label: "رمد وعيون", image: require("@assets/icons/ophthalmology.png") },
    { value: "Urologist", label: "مسالك بولية", image: require("@assets/icons/urology.png") },
    { value: "Lab-Consultant", label: "تحاليل طبية", image: require("@assets/icons/laboratory.png") },
    { value: "Physiotherapist", label: "علاج طبيعي", image: require("@assets/icons/physiotherapy.png") },
  ], []);

  const renderItem = ({ item, index }: { item: SpecialityItem; index: number }) => (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        delay: index * 30, 
        type: 'timing',
        duration: 300 
      }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        // منع انتشار حدث اللمس للخلفية أثناء التفاعل
        delayPressIn={50}
        onPress={() => navigation.navigate("Doctors", { speciality: item.value })}
        style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
      >
        <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
          <Image source={item.image} style={styles.iconFull} resizeMode="contain" />
        </View>
        <Text style={[styles.cardText, isDark ? styles.textWhite : styles.textDark]} numberOfLines={1}>
          {item.label}
        </Text>
      </TouchableOpacity>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <View style={[styles.badge, { backgroundColor: isDark ? "rgba(20, 184, 166, 0.15)" : "#f0fdfa" }]}>
          <View style={styles.pulseDot} />
          <Text style={[styles.badgeText, { color: "#14b8a6" }]}>التصنيفات الطبية</Text>
        </View>
        <Text style={[styles.title, isDark ? styles.textWhite : styles.textDark]}>
          اختر <Text style={styles.tealText}>التخصص</Text> المطلوب
        </Text>
      </View>

      <FlatList
        data={specialityData}
        renderItem={renderItem}
        keyExtractor={(item) => item.value}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        decelerationRate="fast"
        snapToAlignment="start"
        // إعدادات جوهرية لمنع تداخل السحب مع الشاشة الرئيسية
        nestedScrollEnabled={true} 
        scrollEventThrottle={16}
        directionalLockEnabled={true}
        disableScrollViewPanResponder={true} // يمنع الـ ScrollView الأب من أخذ الأولوية
        overScrollMode="never"
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={5}
        windowSize={5}
      />

      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.footerButton, isDark ? styles.btnDark : styles.btnLight]}
        onPress={() => navigation.navigate("Doctors", { speciality: null })} 
      >
        <Text style={styles.footerButtonText}>مشاهدة جميع الأطباء</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: 15 },
  headerSection: { alignItems: "flex-end", paddingHorizontal: 25, marginBottom: 15 },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 8 },
  pulseDot: { width: 8, height: 8, backgroundColor: "#14B8A6", borderRadius: 4, marginRight: 8 },
  badgeText: { fontSize: 11, fontWeight: "800" },
  title: { fontSize: 24, fontWeight: "900" },
  tealText: { color: "#14B8A6" },
  textWhite: { color: "#FFFFFF" },
  textDark: { color: "#0f172a" },
  listContent: { 
    paddingHorizontal: 15, 
    paddingBottom: 10,
    // row-reverse لضبط الاتجاه العربي بدون مشاكل الـ Inverted
    flexDirection: 'row-reverse' 
  },
  card: {
    width: CARD_WIDTH,
    marginLeft: 12, 
    borderRadius: 24,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'transparent',
    ...Platform.select({
        android: { elevation: 3 },
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }
    })
  },
  cardDark: { backgroundColor: "#1e293b", borderColor: "#334155" },
  cardLight: { backgroundColor: "#ffffff", borderColor: "#f1f5f9" },
  iconContainer: { width: 70, height: 70, borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  iconFull: { width: '70%', height: '70%' },
  cardText: { fontSize: 13, fontWeight: "900", textAlign: "center" },
  footerButton: { 
    alignSelf: "center", 
    marginTop: 20, 
    width: '90%', 
    paddingVertical: 14, 
    borderRadius: 18, 
    backgroundColor: '#14b8a6',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#14b8a6',
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  btnDark: { backgroundColor: "#14b8a6" },
  btnLight: { backgroundColor: "#0f172a" }, 
  footerButtonText: { fontSize: 16, fontWeight: "900", color: '#fff' },
});

export default React.memo(SpecialityMenu);