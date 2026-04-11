import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  StyleSheet, 
  SafeAreaView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

// استيراد الأصول (تأكد من وجود الصورة في ملف assets.ts)
import { assets } from '../../../assets/assets';

const AboutScreen: React.FC = () => {
  // استخدام الصورة من الأصول أو placeholder
  const displayImage = assets.About_img || "https://images.unsplash.com/photo-1576091160550-2173dad99901?q=80&w=1000";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* العنوان الرئيسي */}
        <MotiView 
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800 }}
          style={styles.headerContainer}
        >
          <Text style={styles.title}>
            عن منصة <Text style={styles.highlight}>عَوْن</Text>
          </Text>
          <Text style={styles.subtitle}>
            نحن نعيد تعريف مفهوم الرعاية الصحية الرقمية بلمسة مصرية أصيلة
          </Text>
        </MotiView>

        {/* قسم الصورة */}
        <View style={styles.imageWrapper}>
          <View style={styles.imageDecoration} />
          <Image 
            source={{ uri: typeof displayImage === 'string' ? displayImage : Image.resolveAssetSource(displayImage).uri }} 
            style={styles.mainImage}
            resizeMode="cover"
          />
        </View>

        {/* النص التعريفي */}
        <View style={styles.textSection}>
          {/* تم حل مشكلة علامات الاقتباس هنا */}
          <Text style={styles.sectionTitle}>رؤيتنا هي أن نكون {"\""}العَوْن{"\""} الحقيقي لكل مريض.</Text>
          <Text style={styles.paragraph}>
            منصة <Text style={styles.boldTeal}>عَوْن</Text> هي المبادرة الرائدة في مصر لتنظيم المواعيد الطبية، صُممت خصيصاً لتناسب احتياجات البيت المصري وتسهل وصولك لأكفأ الاستشاريين في كافة التخصصات.
          </Text>
          <Text style={styles.paragraph}>
            نحن نؤمن أن التكنولوجيا يجب أن تخدم الصحة وتوفر الطمأنينة، لذلك قمنا ببناء نظام ذكي يقلل فترات الانتظار ويوفر لك كافة تفاصيل الطبيب بكل شفافية قبل الحجز.
          </Text>
        </View>

        {/* إحصائيات */}
        <View style={styles.statsContainer}>
          <LinearGradient colors={['#0d9488', '#0f766e']} style={styles.statCardPrimary}>
            <Text style={styles.statNumber}>+100</Text>
            <Text style={styles.statLabel}>طبيب استشاري</Text>
          </LinearGradient>
          
          <View style={styles.statCardSecondary}>
            <Text style={styles.statNumberDark}>+10k</Text>
            <Text style={styles.statLabelDark}>مريض يثق فينا</Text>
          </View>
        </View>

        {/* لماذا تختار عون */}
        <View style={styles.featuresHeader}>
          <View style={styles.borderRight} />
          <Text style={styles.featuresTitle}>لماذا تختار <Text style={styles.highlight}>عَوْن؟</Text></Text>
        </View>

        {/* قائمة المميزات */}
        <View style={styles.featuresList}>
          {[
            {title: "الكفاءة العالية", desc: "نظام حجز سلس يحترم وقتك، ويوفر عليك عناء البحث والانتظار.", icon: "⚡", color: "#fffbeb"},
            {title: "سهولة الوصول", desc: "شبكة واسعة تغطي كافة المحافظات لتجد طبيبك المفضل بضغطة زر.", icon: "📍", color: "#f0fdfa"},
            {title: "أمانك أولاً", desc: "خصوصية بياناتك وسجلك الطبي خط أحمر؛ نستخدم أقوى تقنيات التشفير.", icon: "🔒", color: "#f8fafc"}
          ].map((item, index) => (
            <View key={index} style={[styles.featureCard, { backgroundColor: item.color }]}>
               <View style={styles.featureIconContainer}>
                  <Text style={styles.featureIcon}>{item.icon}</Text>
               </View>
               <View style={styles.featureTextContent}>
                  <Text style={styles.featureTitle}>{item.title}:</Text>
                  <Text style={styles.featureDesc}>{item.desc}</Text>
               </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 60 },
  headerContainer: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '900', color: '#1e293b', textAlign: 'center' },
  highlight: { color: '#0d9488' },
  subtitle: { color: '#94a3b8', fontSize: 16, textAlign: 'center', marginTop: 10, lineHeight: 24 },
  imageWrapper: { width: '100%', height: 350, borderRadius: 30, overflow: 'hidden', marginBottom: 30, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  mainImage: { width: '100%', height: '100%' },
  imageDecoration: { position: 'absolute', top: -10, right: -10, width: 80, height: 80, backgroundColor: '#f0fdfa', borderRadius: 40, zIndex: -1 },
  textSection: { marginBottom: 30 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', textAlign: 'right', marginBottom: 15, lineHeight: 32 },
  paragraph: { fontSize: 16, color: '#64748b', textAlign: 'right', lineHeight: 28, marginBottom: 15 },
  boldTeal: { color: '#0d9488', fontWeight: 'bold' },
  statsContainer: { flexDirection: 'row', gap: 15, marginBottom: 40 },
  statCardPrimary: { flex: 1, padding: 20, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  statCardSecondary: { flex: 1, padding: 20, borderRadius: 25, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  statNumber: { color: '#fff', fontSize: 28, fontWeight: '900' },
  statLabel: { color: '#f0fdfa', fontSize: 12, fontWeight: 'bold', marginTop: 5 },
  statNumberDark: { color: '#1e293b', fontSize: 28, fontWeight: '900' },
  statLabelDark: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginTop: 5 },
  featuresHeader: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 20 },
  borderRight: { width: 6, height: 35, backgroundColor: '#0d9488', borderRadius: 3, marginLeft: 10 },
  featuresTitle: { fontSize: 24, fontWeight: '900', color: '#1e293b' },
  featuresList: { gap: 15 },
  featureCard: { padding: 20, borderRadius: 25, flexDirection: 'row-reverse', alignItems: 'center' },
  featureIconContainer: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginLeft: 15, elevation: 2 },
  featureIcon: { fontSize: 24 },
  featureTextContent: { flex: 1 },
  featureTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', textAlign: 'right', marginBottom: 4 },
  featureDesc: { fontSize: 14, color: '#64748b', textAlign: 'right', lineHeight: 22 },
});

export default AboutScreen;