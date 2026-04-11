import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform
} from 'react-native';

// تعريف واجهة البيانات للصيدلية (TypeScript Interface)
interface Pharmacy {
  id: number;
  name: string;
  location: string;
  icon: string;
  isOpen: boolean;
}

const { width } = Dimensions.get('window');

const PharmacyScreen: React.FC = () => {
  // حالة البحث
  const [searchQuery, setSearchQuery] = useState<string>('');

  // بيانات تجريبية (نفس منطق الكود الأصلي)
  const pharmaciesData: Pharmacy[] = [
    { id: 1, name: "صيدلية عون المركزية", location: "شارع المحطة، الزقازيق", icon: "🏥", isOpen: true },
    { id: 2, name: "صيدلية النور", location: "حي الزهور، الزقازيق", icon: "💊", isOpen: true },
    { id: 3, name: "صيدلية الشفاء", location: "القومية، الزقازيق", icon: "⚕️", isOpen: false },
  ];

  // تصفية الصيدليات بناءً على البحث
  const filteredPharmacies = pharmaciesData.filter(pharmacy =>
    pharmacy.name.includes(searchQuery) || pharmacy.location.includes(searchQuery)
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>الصيدليات المتاحة</Text>
          <Text style={styles.subtitle}>ابحث عن الدواء أو الصيدلية الأقرب إليك</Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={(text) => setSearchQuery(text)}
              placeholder="ابحث عن اسم الصيدلية أو الموقع..."
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
              textAlign="right"
            />
          </View>
        </View>

        {/* Pharmacies List/Grid */}
        <View style={styles.listContainer}>
          {filteredPharmacies.map((pharmacy) => (
            <View key={pharmacy.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconWrapper}>
                  <Text style={styles.iconText}>{pharmacy.icon}</Text>
                </View>
                <View style={styles.infoWrapper}>
                  <Text style={styles.pharmacyName}>{pharmacy.name}</Text>
                  <Text style={styles.pharmacyLocation}>📍 {pharmacy.location}</Text>
                </View>
              </View>

              <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
                  <Text style={styles.primaryButtonText}>عرض الأدوية المتوفرة</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7}>
                  <Text style={styles.secondaryButtonText}>موقع الصيدلية على الخريطة</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* حالة عدم وجود نتائج */}
        {filteredPharmacies.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>عذراً، لم نجد صيدليات مطابقة لبحثك.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // لون قريب من bg-white/dark الخاص بك
  },
  scrollContainer: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1e293b',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  searchContainer: {
    marginBottom: 30,
  },
  searchWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 60,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 20,
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  listContainer: {
    gap: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    backgroundColor: '#f0fdfa',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 28,
  },
  infoWrapper: {
    flex: 1,
    marginRight: 15,
    alignItems: 'flex-end',
  },
  pharmacyName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 4,
  },
  pharmacyLocation: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '700',
  },
  actionsContainer: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#14b8a6', // teal-500
    paddingVertical: 14,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PharmacyScreen;