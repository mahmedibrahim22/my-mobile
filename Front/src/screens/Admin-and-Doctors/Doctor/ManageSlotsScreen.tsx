import React, { useState, useContext, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Modal,
  Dimensions,
  TextInput,
  Switch,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppContext } from '../../../context/AppContext';
import { DoctorContext } from '../../../context/DoctorContext';
import { DoctorStackParamList } from '../../../navigation/DoctorStack';

type NavigationProp = StackNavigationProp<DoctorStackParamList, 'MySchedule'>;

const { width } = Dimensions.get('window');

const ManageSlotsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const context = useContext(AppContext);
  const doctorCtx = useContext(DoctorContext);
  const isDarkMode = context?.isDarkMode ?? true;

  const dayNamesArabic = useMemo(() => ['الأحد', 'الأثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'], []);

  // --- حالات الإعدادات ---
  const [examDuration, setExamDuration] = useState(doctorCtx?.profileData?.duration?.toString() || '30');
  const [breakDuration, setBreakDuration] = useState(doctorCtx?.profileData?.breakTime?.toString() || '60');
  const [breakStartTime, setBreakStartTime] = useState(doctorCtx?.profileData?.breakStart || '04:00 PM');
  const [startTime, setStartTime] = useState(doctorCtx?.profileData?.startTime || '09:00 AM');
  const [endTime, setEndTime] = useState(doctorCtx?.profileData?.endTime || '11:00 PM');
  const [isAvailableNow, setIsAvailableNow] = useState(doctorCtx?.profileData?.isAvailableNow ?? true);
  
  const [offDays, setOffDays] = useState<string[]>(doctorCtx?.profileData?.offDays || []);
  
  const [inputModalVisible, setInputModalVisible] = useState(false);
  const [periodModalVisible, setPeriodModalVisible] = useState(false);
  const [warningModalVisible, setWarningModalVisible] = useState(false);
  const [hasAppointments, setHasAppointments] = useState(false); 
  
  const [tempValue, setTempValue] = useState('');
  const [activeTarget, setActiveTarget] = useState<'start' | 'end' | 'break' | null>(null);

  const timeToMinutes = useCallback((timeStr: string) => {
    if (!timeStr) return 0;
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + (minutes || 0);
  }, []);

  const minutesToTime = (totalMinutes: number) => {
    let normalizedMinutes = totalMinutes % 1440;
    const h = Math.floor(normalizedMinutes / 60);
    const m = normalizedMinutes % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const handleTimeInput = (target: 'start' | 'end' | 'break') => {
    setActiveTarget(target);
    const currentVal = target === 'start' ? startTime : target === 'end' ? endTime : breakStartTime;
    setTempValue(currentVal.split(' ')[0]);
    setInputModalVisible(true);
  };

  const handlePeriodChange = (target: 'start' | 'end' | 'break') => {
    setActiveTarget(target);
    setPeriodModalVisible(true);
  };

  const saveTimeValue = () => {
    let formatted = tempValue;
    if (!tempValue.includes(':')) {
        formatted = `${tempValue.padStart(2, '0')}:00`;
    } else {
        const [h, m] = tempValue.split(':');
        formatted = `${h.padStart(2, '0')}:${(m || '00').padStart(2, '0')}`;
    }

    if (activeTarget === 'start') setStartTime(`${formatted} ${startTime.split(' ')[1]}`);
    if (activeTarget === 'end') setEndTime(`${formatted} ${endTime.split(' ')[1]}`);
    if (activeTarget === 'break') setBreakStartTime(`${formatted} ${breakStartTime.split(' ')[1]}`);
    setInputModalVisible(false);
  };

  const savePeriodValue = (period: string) => {
    if (activeTarget === 'start') setStartTime(`${startTime.split(' ')[0]} ${period}`);
    if (activeTarget === 'end') setEndTime(`${endTime.split(' ')[0]} ${period}`);
    if (activeTarget === 'break') setBreakStartTime(`${breakStartTime.split(' ')[0]} ${period}`);
    setPeriodModalVisible(false);
  };

  // ✅ التحقق المطور: جلب البيانات من السيرفر أولاً ثم الفحص
  const checkAppointmentsBeforeSave = async () => {
    // 1. تحديث قائمة المواعيد من السيرفر فوراً لضمان الدقة
    if (doctorCtx?.getAppointments) {
        await doctorCtx.getAppointments();
    }

    const bookings = doctorCtx?.appointments || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const hasActiveBookings = bookings.some(app => {
        // تحويل التاريخ من format "DD_MM_YYYY"
        const dateParts = app.slotDate.split('_').map(Number);
        const appointmentDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
        appointmentDate.setHours(0, 0, 0, 0);

        // الشرط: لم يلغى ولم يكتمل (نشط) والتاريخ اليوم أو مستقبلاً
        const isActiveStatus = app.status !== 'cancelled' && app.isCompleted === false;
        const isNotExpired = appointmentDate >= today;

        return isActiveStatus && isNotExpired;
    });

    setHasAppointments(hasActiveBookings);
    setWarningModalVisible(true);
  };

  const handleGenerateSchedule = async () => {
    setWarningModalVisible(false);
    
    if (!examDuration || examDuration === '0') {
      Alert.alert('تنبيه', 'يرجى تحديد مدة الكشف بشكل صحيح.');
      return;
    }

    const startMins = timeToMinutes(startTime);
    let endMins = timeToMinutes(endTime);
    if (endMins <= startMins) endMins += 1440; 

    const breakStartMins = timeToMinutes(breakStartTime);
    const breakEndMins = breakStartMins + (parseInt(breakDuration) || 0);
    const duration = parseInt(examDuration);

    const generatedSlots: string[] = [];
    let current = startMins;

    while (current + duration <= endMins) {
      const isInBreak = current >= breakStartMins && current < breakEndMins;
      if (!isInBreak) {
        generatedSlots.push(minutesToTime(current));
      }
      current += duration;
    }

    const newSlotsData: Record<string, string[]> = {};
    dayNamesArabic.forEach(day => {
      newSlotsData[day] = offDays.includes(day) ? [] : generatedSlots;
    });

    if (doctorCtx?.updateSlots) {
      const success = await doctorCtx.updateSlots(
        newSlotsData, 
        parseInt(examDuration), 
        parseInt(breakDuration) || 0,
        { 
            offDays, 
            breakStart: breakStartTime,
            startTime,
            endTime,
            isAvailableNow
        }
      );
      
      if (success) {
        doctorCtx.setProfileData?.({ 
            ...doctorCtx.profileData, 
            slots_available: newSlotsData, 
            duration: parseInt(examDuration), 
            breakTime: parseInt(breakDuration) || 0, 
            breakStart: breakStartTime,
            startTime, 
            endTime, 
            isAvailableNow, 
            offDays 
        } as any);
        navigation.navigate('MySchedule');
      } else {
          Alert.alert('خطأ', 'فشل التحديث، تأكد من عدم وجود حجوزات قائمة من السيرفر.');
      }
    }
  };

  const bgColor = isDarkMode ? '#0F172A' : '#F8FAFC';
  const cardColor = isDarkMode ? '#1E293B' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#1E293B';

  const TimeInputGroup = ({ label, value, onTimePress, onPeriodPress }: any) => (
    <View style={{ flex: 1, marginRight: 5 }}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      <View style={[styles.customInputContainer, { backgroundColor: cardColor }]}>
        <TouchableOpacity onPress={onPeriodPress} style={styles.periodSelector}>
          <Text style={styles.periodText}>{value.split(' ')[1]}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onTimePress} style={styles.timeDisplay}>
          <Text style={[styles.timeText, { color: textColor }]}>{value.split(' ')[0]}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor, paddingHorizontal: 20 }]}>
      <Text style={[styles.title, { color: textColor, marginTop: 40, textAlign: 'right' }]}>إعدادات العيادة</Text>
      <Text style={[styles.subtitle, { textAlign: 'right', marginBottom: 20 }]}>حدد تفاصيل وقتك قبل تنظيم الجدول</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.availabilityCard, { backgroundColor: cardColor }]}>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.label, { color: textColor, marginBottom: 2 }]}>متاح الآن للمرضى</Text>
            <Text style={{ color: '#64748b', fontSize: 10 }}>إغلاقه سيخفي حسابك من البحث مؤقتاً</Text>
          </View>
          <Switch value={isAvailableNow} onValueChange={setIsAvailableNow} trackColor={{ false: '#475569', true: '#2dd4bf' }} />
        </View>

        <View style={styles.rowInputs}>
            <TimeInputGroup label="إلى ساعة:" value={endTime} onTimePress={() => handleTimeInput('end')} onPeriodPress={() => handlePeriodChange('end')} />
            <TimeInputGroup label="بداية الكشوفات:" value={startTime} onTimePress={() => handleTimeInput('start')} onPeriodPress={() => handlePeriodChange('start')} />
        </View>

        <View style={styles.rowInputs}>
            <TimeInputGroup label="بداية الراحة:" value={breakStartTime} onTimePress={() => handleTimeInput('break')} onPeriodPress={() => handlePeriodChange('break')} />
            <View style={{ flex: 1, marginRight: 5 }}>
              <Text style={[styles.label, { color: textColor }]}>مدة الراحة (د):</Text>
              <TextInput style={[styles.input, { backgroundColor: cardColor, color: textColor }]} keyboardType="numeric" value={breakDuration} onChangeText={setBreakDuration} />
            </View>
        </View>

        <Text style={[styles.label, { color: textColor }]}>مدة الكشف الواحد (بالدقائق):</Text>
        <TextInput style={[styles.input, { backgroundColor: cardColor, color: textColor }]} keyboardType="numeric" value={examDuration} onChangeText={setExamDuration} />

        <Text style={[styles.label, { color: textColor }]}>أيام الإجازة الثابتة:</Text>
        <View style={styles.offDaysContainer}>
          {dayNamesArabic.map(day => (
            <TouchableOpacity 
              key={day} 
              onPress={() => setOffDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])} 
              style={[styles.offDayBtn, { backgroundColor: offDays.includes(day) ? '#f87171' : cardColor }]}
            >
              <Text style={{ color: offDays.includes(day) ? '#fff' : textColor, fontSize: 11, fontWeight: 'bold' }}>{day}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={checkAppointmentsBeforeSave}>
          <Text style={styles.saveButtonText}>تحديث الجدول</Text>
          <Ionicons name="calendar-outline" size={20} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.viewScheduleBtn, { borderColor: '#2dd4bf' }]} 
          onPress={() => navigation.navigate('MySchedule')}
        >
          <Text style={[styles.viewScheduleText, { color: '#2dd4bf' }]}>عرض جدول مواعيدي</Text>
          <Ionicons name="list-outline" size={20} color="#2dd4bf" />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* مودال التحذير المطور */}
      <Modal visible={warningModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.warningContent, { backgroundColor: isDarkMode ? '#1e293b' : '#fff' }]}>
            <Ionicons 
              name={hasAppointments ? "alert-circle" : "help-circle-outline"} 
              size={60} 
              color={hasAppointments ? "#f87171" : "#2dd4bf"} 
            />
            <Text style={[styles.warningTitle, { color: textColor }]}>
              {hasAppointments ? "تنبيه: تحديث محظور" : "تأكيد التحديث"}
            </Text>
            <Text style={styles.warningDesc}>
              {hasAppointments 
                ? "يوجد حجوزات نشطة حالياً لم تنتهِ بعد. حفاظاً على حقوق المرضى، يجب إنهاء جميع الحجوزات الحالية بالإتمام أو الإلغاء قبل تغيير الإعدادات." 
                : "هل أنت متأكد من رغبتك في تحديث الجدول؟ سيؤدي ذلك لإعادة توزيع المواعيد المتاحة بناءً على الإعدادات الجديدة."}
            </Text>
            
            <View style={styles.warningActionRow}>
              {!hasAppointments && (
                <TouchableOpacity style={styles.confirmBtn} onPress={handleGenerateSchedule}>
                  <Text style={styles.confirmBtnText}>تحديث الآن</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.closeBtn, { flex: hasAppointments ? 1 : 0.5 }]} 
                onPress={() => setWarningModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>{hasAppointments ? "فهمت" : "إلغاء"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* مودال كتابة الوقت */}
      <Modal visible={inputModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>ادخل الساعة</Text>
            <TextInput style={[styles.modalInput, { color: textColor }]} keyboardType="numeric" autoFocus value={tempValue} onChangeText={setTempValue} placeholder="10:30" placeholderTextColor="#64748b" />
            <TouchableOpacity style={[styles.confirmBtn, { width: '100%' }]} onPress={saveTimeValue}>
              <Text style={styles.confirmBtnText}>تم</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* مودال اختيار AM/PM */}
      <Modal visible={periodModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#1e293b' }]}>
            <TouchableOpacity style={styles.periodOption} onPress={() => savePeriodValue('AM')}>
              <Text style={styles.periodOptionText}>AM (صباحاً)</Text>
            </TouchableOpacity>
            <View style={{ height: 1, backgroundColor: '#475569', width: '100%' }} />
            <TouchableOpacity style={styles.periodOption} onPress={() => savePeriodValue('PM')}>
              <Text style={styles.periodOptionText}>PM (مساءً)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 10 },
  title: { fontSize: 22, fontWeight: '900' },
  subtitle: { color: '#64748b', fontSize: 12, marginTop: 4 },
  label: { textAlign: 'right', fontWeight: 'bold', marginBottom: 8, fontSize: 14 },
  input: { padding: 15, borderRadius: 12, marginBottom: 20, textAlign: 'right' },
  rowInputs: { flexDirection: 'row-reverse', width: '100%', marginBottom: 10 },
  customInputContainer: { flexDirection: 'row', height: 55, borderRadius: 12, overflow: 'hidden', alignItems: 'center' },
  periodSelector: { backgroundColor: 'rgba(45, 212, 191, 0.2)', height: '100%', paddingHorizontal: 15, justifyContent: 'center' },
  periodText: { color: '#2dd4bf', fontWeight: 'bold' },
  timeDisplay: { flex: 1, paddingHorizontal: 15, alignItems: 'flex-end' },
  timeText: { fontSize: 16, fontWeight: 'bold' },
  availabilityCard: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(45, 212, 191, 0.3)' },
  offDaysContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  offDayBtn: { padding: 10, borderRadius: 10, minWidth: 65, alignItems: 'center' },
  saveButton: { backgroundColor: '#2dd4bf', marginTop: 25, padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  saveButtonText: { color: '#000', fontSize: 15, fontWeight: '900', marginRight: 8 },
  viewScheduleBtn: { marginTop: 15, padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  viewScheduleText: { fontSize: 15, fontWeight: '900', marginRight: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: width * 0.85, borderRadius: 20, padding: 25, alignItems: 'center' },
  warningContent: { width: width * 0.85, borderRadius: 25, padding: 30, alignItems: 'center' },
  warningTitle: { fontSize: 20, fontWeight: '900', marginTop: 15, textAlign: 'center' },
  warningDesc: { color: '#94a3b8', textAlign: 'center', marginTop: 10, lineHeight: 22, fontSize: 14 },
  warningActionRow: { width: '100%', marginTop: 25, flexDirection: 'row-reverse', gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalInput: { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 10, textAlign: 'center', fontSize: 20, marginBottom: 20 },
  periodOption: { width: '100%', padding: 20, alignItems: 'center' },
  periodOptionText: { color: '#2dd4bf', fontSize: 18, fontWeight: 'bold' },
  confirmBtn: { backgroundColor: '#2dd4bf', flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { fontWeight: 'bold', color: '#000' },
  closeBtn: { padding: 15, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  closeBtnText: { color: '#94a3b8', fontWeight: 'bold' }
});

export default ManageSlotsScreen;