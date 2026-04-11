import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  Dimensions,
} from "react-native";
import { MotiView } from "moti";
import { useNavigation } from "@react-navigation/native";
import { AppContext } from "../../context/AppContext";

const { width } = Dimensions.get("window");
const DOCTOR_IMAGE = require("@assets/images/doctor_banner.png");

const Banner: React.FC = () => {
  const navigation = useNavigation<any>();
  const context = useContext(AppContext);
  
  // التأكد من قراءة الوضع الليلي بشكل صحيح
  const isDarkMode = context?.isDarkMode ?? false;

  // تعريف الثيم بناءً على حالة الـ Context
  const theme = {
    cardBg: isDarkMode ? "#0F172A" : "#FFFFFF",
    borderColor: isDarkMode ? "#1E293B" : "#F1F5F9",
    textColor: isDarkMode ? "#FFFFFF" : "#0F172A",
    descColor: isDarkMode ? "#94A3B8" : "#64748B",
    accent: "#14B8A6",
    secondaryBtn: isDarkMode ? "rgba(30, 41, 59, 0.7)" : "#F8FAFC",
  };

  return (
    <View style={styles.container}>
      {/* الكارت الرئيسي */}
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 15, stiffness: 100 }}
        style={[
          styles.bannerCard,
          { backgroundColor: theme.cardBg, borderColor: theme.borderColor }
        ]}
      >
        {/* إضاءات خلفية ناعمة */}
        <View style={[styles.glow, styles.topRightGlow, { backgroundColor: theme.accent, opacity: isDarkMode ? 0.1 : 0.15 }]} />
        <View style={[styles.glow, styles.bottomLeftGlow, { backgroundColor: '#3B82F6', opacity: isDarkMode ? 0.08 : 0.12 }]} />

        <View style={styles.contentWrapper}>
          
          {/* 1. الـ Badge العلوي - حل مشكلة الـ y باستخدام translateY */}
          <MotiView 
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 200 }}
            style={[styles.topBadge, { borderColor: theme.borderColor }]}
          >
            <View style={styles.liveDotWrapper}>
              <MotiView 
                from={{ opacity: 0.3, scale: 1 }}
                animate={{ opacity: 0.7, scale: 2 }}
                transition={{ loop: true, type: 'timing', duration: 2000 }}
                style={[styles.livePing, { backgroundColor: theme.accent }]} 
              />
              <View style={[styles.liveDot, { backgroundColor: theme.accent }]} />
            </View>
            <Text style={[styles.topBadgeText, { color: theme.textColor }]}>
              منصة عَوْن: رعاية صحية ذكية 🇪🇬
            </Text>
          </MotiView>

          {/* 2. المحتوى النصي - حل مشكلة الـ x باستخدام translateX */}
          <View style={styles.textContent}>
            <MotiView
              from={{ opacity: 0, translateX: 20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: 400 }}
            >
              <Text style={[styles.title, { color: theme.textColor }]}>
                رعايتك {"\n"}
                <Text style={{ color: theme.accent }}>تبدأ من هنا</Text>
              </Text>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateX: 20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: 500 }}
            >
              <Text style={[styles.description, { color: theme.descColor }]}>
                في <Text style={{ color: theme.textColor, fontWeight: '800' }}>عَوْن</Text>، نجمع لك أمهر الأطباء في مكان واحد. احجز موعدك الآن بكل سهولة وأمان.
              </Text>
            </MotiView>

            {/* أزرار التحكم */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate("AuthStack")}
                style={[styles.primaryButton, { backgroundColor: isDarkMode ? theme.accent : "#0F172A" }]}
              >
                <Text style={[styles.buttonText, { color: isDarkMode ? "#0F172A" : "#FFFFFF" }]}>احجز الآن</Text>
                <Text style={[styles.arrow, { color: isDarkMode ? "#0F172A" : "#FFFFFF" }]}>←</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate("AboutScreen")}
                style={[styles.secondaryButton, { backgroundColor: theme.secondaryBtn, borderColor: theme.borderColor }]}
              >
                <Text style={[styles.secondaryBtnText, { color: theme.textColor }]}>كيف نعمل؟</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. منطقة الصورة والكروت العائمة */}
          <View style={styles.imageSection}>
            {/* كارت الإحصائيات العائم */}
            <MotiView
              from={{ translateY: 0 }}
              animate={{ translateY: -12 }}
              transition={{ loop: true, type: 'timing', duration: 2500, repeatReverse: true }}
              style={[styles.floatingCard, styles.statsCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}
            >
              <View style={styles.iconCircle}><Text style={{fontSize: 14}}>👨‍⚕️</Text></View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.floatLabel}>نخبة الأطباء</Text>
                <Text style={[styles.floatValue, { color: theme.textColor }]}>+٥٠٠ طبيب</Text>
              </View>
            </MotiView>

            {/* صورة الطبيب */}
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", delay: 600 }}
              style={styles.imageWrapper}
            >
              <Image source={DOCTOR_IMAGE} style={styles.doctorImage} resizeMode="contain" />
            </MotiView>

            {/* كارت التقييم العائم */}
            <MotiView
              from={{ translateY: 0 }}
              animate={{ translateY: 12 }}
              transition={{ loop: true, type: 'timing', duration: 3000, repeatReverse: true }}
              style={[styles.floatingCard, styles.reviewCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}
            >
                <Text style={styles.stars}>⭐⭐⭐⭐⭐</Text>
                <Text style={[styles.reviewText, { color: theme.textColor }]}>أفضل خدمة في مصر</Text>
            </MotiView>
          </View>

        </View>
      </MotiView>

      {/* شريط الحالة السفلي */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 1000 }}
        style={[styles.statusBadge, { backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.4)" : "#F1F5F9" }]}
      >
        <Text style={[styles.statusText, { color: theme.descColor }]}>
          نظام الحجز الذكي متوفر الآن في كافة محافظات مصر
        </Text>
      </MotiView>
    </View>
  );
};

// الـ Styles كما هي مع تحسينات طفيفة للتناسق
const styles = StyleSheet.create({
  container: { marginHorizontal: 16, marginTop: 15, marginBottom: 10 },
  bannerCard: {
    borderRadius: 35,
    paddingTop: 25,
    position: "relative",
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 24 },
      android: { elevation: 8 }
    })
  },
  glow: { position: "absolute", width: 220, height: 220, borderRadius: 110 },
  topRightGlow: { top: -50, right: -50 },
  bottomLeftGlow: { bottom: -70, left: -70 },
  contentWrapper: { alignItems: "center", paddingHorizontal: 20 },
  
  topBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.03)'
  },
  topBadgeText: { fontSize: 11, fontWeight: '700', marginRight: 8, letterSpacing: 0.2 },
  liveDotWrapper: { justifyContent: 'center', alignItems: 'center', width: 12 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  livePing: { position: 'absolute', width: 7, height: 7, borderRadius: 4 },

  textContent: { width: "100%", alignItems: "flex-end" },
  title: { fontSize: 34, fontWeight: "900", textAlign: "right", lineHeight: 42 },
  description: { fontSize: 15, textAlign: "right", marginTop: 12, lineHeight: 24, fontWeight: "500" },

  buttonGroup: { flexDirection: 'row-reverse', marginTop: 25, gap: 12, width: '100%' },
  primaryButton: { flex: 1.6, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 15, borderRadius: 20, gap: 8 },
  secondaryButton: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 20, borderWidth: 1 },
  buttonText: { fontWeight: "900", fontSize: 15 },
  secondaryBtnText: { fontWeight: "700", fontSize: 13 },
  arrow: { fontSize: 20, marginBottom: 2 },

  imageSection: { width: '100%', height: 280, marginTop: 10, alignItems: 'center', justifyContent: 'flex-end' },
  imageWrapper: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  doctorImage: { width: width * 0.85, height: '100%' },
  
  floatingCard: {
    position: 'absolute',
    padding: 12,
    borderRadius: 22,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    ...Platform.select({ ios: { shadowOpacity: 0.15, shadowRadius: 12 }, android: { elevation: 5 } })
  },
  statsCard: { top: 10, right: -10, gap: 10 },
  reviewCard: { bottom: 40, left: -10, flexDirection: 'column', alignItems: 'flex-start' },
  iconCircle: { width: 34, height: 34, backgroundColor: '#14B8A6', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  floatLabel: { fontSize: 9, color: '#94A3B8', fontWeight: '800' },
  floatValue: { fontSize: 13, fontWeight: '900' },
  stars: { fontSize: 10, marginBottom: 4 },
  reviewText: { fontSize: 11, fontWeight: '700' },

  statusBadge: { marginTop: 15, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, alignSelf: "center", borderWidth: 0.5, borderColor: 'rgba(148, 163, 184, 0.1)' },
  statusText: { fontSize: 11, fontWeight: "700", textAlign: 'center' },
});

export default Banner;