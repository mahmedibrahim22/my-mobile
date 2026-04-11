import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Linking, 
  Dimensions 
} from 'react-native';
import { MotiView, MotiText } from 'moti'; // مكتبة الأنميشن للموبايل
import { LinearGradient } from 'expo-linear-gradient'; // للخلفيات المتدرجة

const { width } = Dimensions.get('window');

const ContactScreen: React.FC = () => {

  const images = {
    contactMain: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800",
    locationIcon: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    phoneIcon: "https://cdn-icons-png.flaticon.com/512/3059/3059590.png"
  };

  // وظائف الاتصال
  const handlePhoneCall = () => Linking.openURL('tel:+20123456789');
  const handleEmail = () => Linking.openURL('mailto:support@aoun-egypt.com');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* العنوان الرئيسي */}
      <MotiView 
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 800 }}
        style={styles.header}
      >
        <Text style={styles.title}>تواصل مع <Text style={styles.highlight}>عَوْن</Text></Text>
        <Text style={styles.subtitle}>نحن هنا لتقديم المدد والرعاية على مدار الساعة</Text>
      </MotiView>

      {/* قسم الصورة مع تأثيرات بصرية */}
      <MotiView 
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', delay: 200 }}
        style={styles.imageContainer}
      >
        <View style={styles.imageWrapper}>
          <Image 
            source={{ uri: images.contactMain }} 
            style={styles.mainImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(15, 23, 42, 0.4)']}
            style={styles.gradientOverlay}
          />
        </View>
      </MotiView>

      {/* تفاصيل الاتصال */}
      <View style={styles.infoSection}>
        
        {/* كارت المقر الرئيسي */}
        <View style={styles.infoCard}>
          <View style={[styles.iconBox, { backgroundColor: '#0d9488' }]}>
            <Image source={{ uri: images.locationIcon }} style={styles.icon} />
          </View>
          <View style={styles.cardTextContent}>
            <Text style={styles.cardTitle}>مقر عَوْن الرئيسي</Text>
            <Text style={styles.cardDesc}>
              شارع التسعين الشمالي، التجمع الخامس{"\n"}
              <Text style={styles.locationHighlight}>القاهرة، جمهورية مصر العربية</Text>
            </Text>
          </View>
        </View>

        {/* كارت بيانات الاتصال */}
        <View style={styles.infoCard}>
          <View style={[styles.iconBox, { backgroundColor: '#0f172a' }]}>
            <Image source={{ uri: images.phoneIcon }} style={styles.icon} />
          </View>
          <View style={styles.cardTextContent}>
            <Text style={styles.cardTitle}>قنوات التواصل المباشر</Text>
            <TouchableOpacity onPress={handlePhoneCall}>
               <Text style={styles.contactText}>موبايل: <Text style={styles.boldText}>+20 123 456 789</Text></Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleEmail}>
               <Text style={styles.contactText}>إيميل: <Text style={styles.emailText}>support@aoun-egypt.com</Text></Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* كارت الوظائف المطور */}
        <MotiView 
          whileHover={{ scale: 0.98 }}
          style={styles.careerCard}
        >
          <LinearGradient
            colors={['#020617', '#1e293b']}
            style={styles.careerGradient}
          >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>انضم إلينا</Text>
            </View>
            <Text style={styles.careerTitle}>كن جزءاً من فريق عَوْن</Text>
            <Text style={styles.careerDesc}>
              هل أنت طبيب أو مبرمج تطمح للتغيير؟ ساهم معنا في عَوْن لإعادة تعريف جودة الحياة الصحية في مصر.
            </Text>
            <TouchableOpacity style={styles.careerButton}>
              <Text style={styles.buttonText}>استكشف فرص العمل</Text>
            </TouchableOpacity>
          </LinearGradient>
        </MotiView>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  contentContainer: { paddingVertical: 40, paddingHorizontal: 20 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '900', color: '#0f172a', textAlign: 'center' },
  highlight: { color: '#0d9488' },
  subtitle: { color: '#94a3b8', marginTop: 10, fontSize: 16, textAlign: 'center' },
  imageContainer: { alignItems: 'center', marginBottom: 40 },
  imageWrapper: {
    width: width * 0.85,
    height: 400,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 8,
    borderColor: '#fff',
    elevation: 20, // للظلال في أندرويد
    shadowColor: '#000', // للظلال في iOS
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  mainImage: { width: '100%', height: '100%' },
  gradientOverlay: { ...StyleSheet.absoluteFillObject },
  infoSection: { gap: 25 },
  infoCard: { flexDirection: 'row-reverse', alignItems: 'flex-start', padding: 15, borderRadius: 25 },
  iconBox: { padding: 12, borderRadius: 15, marginLeft: 15 },
  icon: { width: 24, height: 24, tintColor: '#fff' },
  cardTextContent: { flex: 1, alignItems: 'flex-end' },
  cardTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 5 },
  cardDesc: { color: '#64748b', fontSize: 16, lineHeight: 24, textAlign: 'right' },
  locationHighlight: { color: '#0f766e', fontWeight: '800' },
  contactText: { color: '#64748b', fontSize: 16, marginTop: 5 },
  boldText: { color: '#0f172a', fontWeight: '900' },
  emailText: { color: '#0d9488', fontWeight: '900', textDecorationLine: 'underline' },
  careerCard: { borderRadius: 35, overflow: 'hidden', marginTop: 20 },
  careerGradient: { padding: 30 },
  badge: { backgroundColor: 'rgba(20, 184, 166, 0.2)', alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 15 },
  badgeText: { color: '#2dd4bf', fontSize: 12, fontWeight: '900' },
  careerTitle: { color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'right', marginBottom: 10 },
  careerDesc: { color: '#94a3b8', fontSize: 16, textAlign: 'right', lineHeight: 24, marginBottom: 25 },
  careerButton: { backgroundColor: '#fff', paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
  buttonText: { color: '#020617', fontWeight: '900', fontSize: 16 },
});

export default ContactScreen;