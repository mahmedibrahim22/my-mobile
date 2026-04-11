import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';

const Delivery: React.FC = () => {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* أيقونة الدليفري */}
      <View style={styles.iconContainer}>
        <Text style={styles.emoji}>🚚</Text>
      </View>

      {/* المحتوى النصي */}
      <View style={styles.textSection}>
        <Text style={styles.title}>خدمة التوصيل السريع</Text>
        <Text style={styles.description}>
          مع تطبيق "عَوْن"، طلباتك هتوصل لحد باب البيت في أسرع وقت وبأمان تام.
        </Text>
      </View>

      {/* كارت المعلومات */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>لماذا تختار خدمة التوصيل لدينا؟</Text>
        <Text style={styles.infoItem}>• توصيل آمن للمستلزمات الطبية</Text>
        <Text style={styles.infoItem}>• تتبع مباشر لحالة طلبك</Text>
        <Text style={styles.infoItem}>• طاقم توصيل مدرب ومحترف</Text>
      </View>

      {/* زر الإجراء */}
      <TouchableOpacity style={styles.button} activeOpacity={0.8}>
        <Text style={styles.buttonText}>اطلب الآن</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  iconContainer: {
    width: 140,
    height: 140,
    backgroundColor: '#f0fdfa',
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  emoji: {
    fontSize: 70,
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1e293b',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
    fontWeight: '500',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0d9488',
    marginBottom: 10,
    textAlign: 'right',
  },
  infoItem: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'right',
    marginBottom: 5,
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#0d9488',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
});

export default Delivery;