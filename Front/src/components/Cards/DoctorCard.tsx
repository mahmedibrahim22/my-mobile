import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

interface DoctorCardProps {
  doctor: {
    _id: string;
    name: string;
    speciality: string;
    image: any;
    experience?: string;
    slots_available?: Record<string, string[]>; // المواعيد المتاحة
  };
  onPress: () => void;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onPress }) => {
  // ✅ تحسين منطق التحقق: التأكد من أن المصفوفات موجودة وبها عناصر فعلياً
  const hasSlots = useMemo(() => {
    if (!doctor.slots_available) return false;
    
    // بنلف على كل الأيام ونتأكد إن فيه يوم واحد على الأقل فيه مواعيد (طول المصفوفة أكبر من 0)
    return Object.values(doctor.slots_available).some(
      (daySlots) => Array.isArray(daySlots) && daySlots.length > 0
    );
  }, [doctor.slots_available]);

  // دالة لتحديد مصدر الصورة
  const renderImageSource = () => {
    if (!doctor.image) return null;
    if (typeof doctor.image === 'string') return { uri: doctor.image };
    return doctor.image;
  };

  const imageSource = renderImageSource();

  return (
    <TouchableOpacity 
      style={[styles.card, !hasSlots && styles.disabledCard]} 
      onPress={hasSlots ? onPress : undefined} // تعطيل الضغط لو غير متاح
      activeOpacity={hasSlots ? 0.9 : 1}
    >
      <View style={styles.imageContainer}>
        {imageSource ? (
          <Image 
            source={imageSource} 
            style={[styles.image, !hasSlots && styles.grayscale]} 
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholderContainer]}>
            <Text style={styles.placeholderText}>عَوْن</Text>
          </View>
        )}
        
        {/* نقطة الحالة: خضراء لو متاح، رمادية لو غير متاح */}
        <View style={[styles.statusBadge, { backgroundColor: hasSlots ? '#10B981' : '#CBD5E1' }]} />
      </View>

      <View style={styles.info}>
        <View style={styles.headerRow}>
           {!hasSlots && <Text style={styles.offlineTag}>غير متاح حالياً</Text>}
           <Text style={styles.specialityText}>{doctor.speciality}</Text>
        </View>
        <Text style={styles.nameText}>{doctor.name}</Text>
        <Text style={styles.expText}>{doctor.experience || 'خبرة +10 سنوات'}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row-reverse', 
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 3,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  disabledCard: {
    opacity: 0.6, // إطفاء البطاقة بصرياً
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    elevation: 0,
  },
  grayscale: {
    tintColor: 'gray', // جعل الصورة باهتة قليلاً
    opacity: 0.8,
  },
  imageContainer: { position: 'relative' },
  image: { 
    width: 80, 
    height: 80, 
    borderRadius: 18, 
    backgroundColor: '#F8FAFC' 
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
  },
  placeholderText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '900',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff',
  },
  info: { 
    flex: 1, 
    marginRight: 15, 
    alignItems: 'flex-end' 
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8
  },
  offlineTag: {
    fontSize: 9,
    color: '#64748B',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    fontWeight: '700'
  },
  specialityText: { 
    color: '#14B8A6', 
    fontSize: 11, 
    fontWeight: '900' 
  },
  nameText: { 
    color: '#1E293B', 
    fontSize: 17, 
    fontWeight: '900', 
    marginTop: 2 
  },
  expText: { 
    color: '#64748B', 
    fontSize: 12, 
    fontWeight: '600',
    marginTop: 4
  },
});

export default DoctorCard;