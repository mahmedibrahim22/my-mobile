import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';

// 1. تعريف نوع بيانات المعمل (TypeScript Interface)
interface Laboratory {
  id: number;
  name: string;
  description: string;
  icon: string;
  isHomeService: boolean;
  color: string;
}

const { width } = Dimensions.get('window');

const LabsScreen: React.FC = () => {
  // 2. مصفوفة البيانات
  const laboratories: Laboratory[] = [
    {
      id: 1,
      name: "معامل البرج",
      description: "أحدث الأجهزة العالمية لنتائج دقيقة وسريعة مع خدمة سحب العينات من المنزل.",
      icon: "🧪",
      isHomeService: true,
      color: "#2563eb", // blue-600
    },
    {
      id: 2,
      name: "معامل المختبر",
      description: "دقة نعتز بها، نوفر لك كافة أنواع التحاليل الطبية بأعلى معايير الجودة العالمية.",
      icon: "🔬",
      isHomeService: true,
      color: "#0d9488", // teal-600
    }
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>معامل التحاليل والخدمة المنزلية</Text>
          <Text style={styles.subtitle}>
            اختر المعمل المناسب واحجز زيارتك المنزلية بكل سهولة من خلال عَوْن
          </Text>
        </View>

        {/* Labs List */}
        <View style={styles.listContainer}>
          {laboratories.map((lab) => (
            <View key={lab.id} style={styles.labCard}>
              {/* زخرفة خلفية بسيطة (دائرة علوية) */}
              <View style={styles.decorationCircle} />

              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: lab.color }]}>
                  <Text style={styles.iconText}>{lab.icon}</Text>
                </View>
                {lab.isHomeService && (
                  <View style={styles.homeServiceBadge}>
                    <Text style={styles.homeServiceText}>متاح زيارة منزلية</Text>
                  </View>
                )}
              </View>

              <Text style={styles.labName}>{lab.name}</Text>
              <Text style={styles.labDescription}>{lab.description}</Text>

              <View style={styles.buttonGroup}>
                <TouchableOpacity 
                  style={[styles.primaryButton, { backgroundColor: lab.color }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>حجز زيارة منزلية</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7}>
                  <Text style={styles.secondaryButtonText}>الأسعار</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* قسم التنبيه السفلي */}
        <View style={styles.alertBox}>
          <Text style={styles.alertText}>
            ⚠️ ملحوظة: نتائج التحاليل تظهر في حسابك مباشرة فور صدورها من المعمل.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
    fontWeight: '500',
    paddingHorizontal: 20,
  },
  listContainer: {
    gap: 25,
  },
  labCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 40,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    // Shadow for Android
    elevation: 2,
  },
  decorationCircle: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(37, 99, 235, 0.03)',
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  iconText: {
    fontSize: 30,
  },
  homeServiceBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  homeServiceText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '900',
  },
  labName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1e293b',
    textAlign: 'right',
    marginBottom: 8,
  },
  labDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'right',
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 25,
  },
  buttonGroup: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  primaryButton: {
    flex: 2,
    height: 55,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButton: {
    flex: 1,
    height: 55,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  secondaryButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  alertBox: {
    marginTop: 30,
    backgroundColor: '#fffbeb',
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  alertText: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
});

export default LabsScreen;