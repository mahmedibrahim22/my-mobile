import React, { useContext, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppContext } from '../../../context/AppContext';
import { DoctorContext } from '../../../context/DoctorContext';
import { DoctorStackParamList } from '../../../navigation/DoctorStack';

type NavigationProp = StackNavigationProp<DoctorStackParamList, 'ManageSlots'>;

const MyScheduleScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const context = useContext(AppContext);
  const doctorCtx = useContext(DoctorContext);
  const isDarkMode = context?.isDarkMode ?? true;

  // ✅ جلب البيانات الحقيقية من الـ Context المحدثة من شاشة الإعدادات
  const slotsAvailable = doctorCtx?.profileData?.slots_available || {};
  const offDays = doctorCtx?.profileData?.offDays || [];
  
  // إحضار القيم المحدثة (بداية العمل، النهاية، بداية الراحة، مدتها)
  const startTime = doctorCtx?.profileData?.startTime || "09:00 AM";
  const endTime = doctorCtx?.profileData?.endTime || "11:00 PM";
  const breakStart = doctorCtx?.profileData?.breakStart || "04:00 PM";
  const breakDuration = doctorCtx?.profileData?.breakTime || "60";

  const dayNamesArabic = ['الأحد', 'الأثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  // ✅ حساب الأيام والتواريخ ديناميكياً للأسبوع الحالي
  const { scheduleData } = useMemo(() => {
    const data = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = dayNamesArabic[date.getDay()];
      const dateString = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      
      const isOffDay = offDays.includes(dayName);
      const daySlots = Array.isArray(slotsAvailable[dayName]) ? slotsAvailable[dayName] : [];

      data.push({
        day: dayName,
        date: dateString,
        slots: daySlots,
        // اليوم متاح إذا لم يكن في قائمة الإجازات وكان يحتوي على فترات مولدة
        isAvailable: daySlots.length > 0 && !isOffDay
      });
    }

    return { scheduleData: data };
  }, [slotsAvailable, offDays]);

  const bgColor = isDarkMode ? '#050811' : '#F8FAFC';
  const cardColor = isDarkMode ? '#0F172A' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#1E293B';
  const borderColor = isDarkMode ? '#1E293B' : '#E2E8F0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="calendar-number" size={32} color="#00dfc4" />
          </View>
          <Text style={[styles.title, { color: textColor }]}>جدول مواعيدي الأسبوعي</Text>
          <Text style={styles.subtitle}>تظهر هنا فترات العمل الرسمية وأوقات الراحة لكل يوم بناءً على إعداداتك</Text>
        </View>

        {/* تصميم الجدول المطور */}
        <View style={[styles.table, { borderColor: borderColor, backgroundColor: cardColor }]}>
          {scheduleData.map((item, index) => (
            <View 
              key={index} 
              style={[
                styles.tableRow, 
                { 
                  borderBottomWidth: index === scheduleData.length - 1 ? 0 : 1, 
                  borderBottomColor: borderColor,
                  backgroundColor: item.isAvailable 
                    ? (isDarkMode ? '#0f1c2e' : '#f0fdfa') 
                    : (isDarkMode ? 'rgba(30, 41, 59, 0.5)' : '#f1f5f9'),
                  opacity: item.isAvailable ? 1 : 0.8 
                }
              ]}
            >
              {/* تفاصيل ساعات العمل والراحة - الجانب الأيسر (محتوى الجدول) */}
              <View style={styles.slotsColumn}>
                {item.isAvailable ? (
                  <View style={styles.infoContainer}>
                    {/* عرض فترة العمل الكلية */}
                    <View style={styles.workingHoursInfo}>
                       <Ionicons name="time" size={18} color="#00dfc4" />
                       <Text style={[styles.workTimeText, { color: isDarkMode ? '#00dfc4' : '#0d9488' }]}>
                         من {startTime} إلى {endTime}
                       </Text>
                    </View>

                    {/* عرض وقت الراحة بشكل منظم */}
                    <View style={styles.breakInfo}>
                       <Text style={styles.breakTitle}>وقت الراحة:</Text>
                       <Text style={[styles.breakDetails, { color: textColor }]}>
                         {breakStart} (لمدة {breakDuration} دقيقة)
                       </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="moon-outline" size={16} color="#94a3b8" />
                    <Text style={[styles.noSlotsText, { color: '#94a3b8' }]}>يوم إجازة رسمي</Text>
                  </View>
                )}
              </View>

              {/* اسم اليوم والتاريخ - الجانب الأيمن (العمود الثابت) */}
              <View style={[styles.dayColumn, { borderLeftWidth: 1, borderLeftColor: borderColor }]}>
                <Text style={[
                  styles.dayText, 
                  { color: item.isAvailable ? '#00dfc4' : '#94a3b8' }
                ]}>
                  {item.day}
                </Text>
                <Text style={styles.dateLabel}>{item.date}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* زر التعديل المطور */}
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('ManageSlots')}
        >
          <Ionicons name="settings-outline" size={22} color="#000" />
          <Text style={styles.editButtonText}>تعديل توقيتات الجدول</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0, 223, 196, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 30,
    lineHeight: 18,
  },
  table: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  tableRow: {
    flexDirection: 'row',
    minHeight: 100, 
  },
  dayColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  dayText: {
    fontWeight: '900',
    fontSize: 15,
  },
  dateLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '700',
  },
  slotsColumn: {
    flex: 2.8,
    padding: 15,
    justifyContent: 'center',
  },
  infoContainer: {
    alignItems: 'flex-end',
  },
  workingHoursInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 6,
  },
  workTimeText: {
    fontSize: 15,
    fontWeight: '900',
    marginRight: 8,
  },
  breakInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingRight: 26, 
  },
  breakTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
  breakDetails: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSlotsText: {
    fontSize: 14,
    marginRight: 8,
    fontWeight: '700',
  },
  editButton: {
    backgroundColor: '#00dfc4',
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 15,
    marginTop: 25,
    elevation: 8,
    shadowColor: '#00dfc4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  editButtonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 16,
    marginLeft: 10,
  },
});

export default MyScheduleScreen;