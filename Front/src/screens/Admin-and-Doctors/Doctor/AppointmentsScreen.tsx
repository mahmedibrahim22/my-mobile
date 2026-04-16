import React, { useContext, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Linking,
  Platform
} from 'react-native';

import { DoctorContext } from '../../../context/DoctorContext';
import { AppContext } from '../../../context/AppContext';
import { Ionicons } from '@expo/vector-icons';

// --- Interfaces ---
interface UserData {
  name: string;
  image: string;
  dob: string;
}

interface Appointment {
  _id: string;
  patientName?: string;
  userData?: UserData;
  patientPhone: string;
  patientAge?: number;
  slotDate: string;
  slotTime: string;
  amount: number;
  cancelled: boolean;
  isCompleted: boolean;
  ashaaFile?: string; 
}

const DoctorAppointments = () => {
  const doctorCtx = useContext(DoctorContext);
  const appCtx = useContext(AppContext);

  const dToken = doctorCtx?.dToken || '';
  const appointments = (doctorCtx?.appointments as Appointment[]) || [];
  const dashData = doctorCtx?.dashData; // استدعاء بيانات الداشبورد للتحقق من المديونية
  
  const getAppointments = doctorCtx?.getAppointments;
  const cancelAppointment = doctorCtx?.cancelAppointment;
  const completeAppointment = doctorCtx?.completeAppointment;
  const getDashData = doctorCtx?.getDashData; 

  const calculateAge = appCtx?.calculateAge;
  const isDarkMode = appCtx?.isDarkMode ?? true;

  // منطق التحقق من المديونية (نفس المطبق في الداشبورد)
  const isLateTime = new Date().getHours() >= 23;
  const showDebtNotice = (dashData?.totalFeesToAwn ?? 0) > 0 || isLateTime;

  useEffect(() => {
    if (dToken && getAppointments) {
      getAppointments();
    }
    if (dToken && getDashData) {
      getDashData();
    }
  }, [dToken, getAppointments, getDashData]);

  const localSlotDateFormat = (slotDate: string) => {
    try {
      if (!slotDate) return '';
      const dateArray = slotDate.split('_');
      const months = ["", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
      return `${dateArray[0]} ${months[Number(dateArray[1])]}`;
    } catch (error) {
      return slotDate;
    }
  };

  const handleCancel = async (id: string) => {
    Alert.alert(
      'إلغاء الموعد؟',
      'هل أنت متأكد من رغبتك في إلغاء هذا الموعد؟',
      [
        { text: 'تراجع', style: 'cancel' },
        { 
          text: 'نعم، إلغاء', 
          onPress: async () => {
            if (cancelAppointment) {
              await cancelAppointment(id);
              if (getDashData) getDashData();
            }
          },
          style: 'destructive' 
        },
      ]
    );
  };

  const handleComplete = async (id: string) => {
    Alert.alert(
      'تأكيد الإتمام',
      'هل تم الكشف على المريض بنجاح؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'تأكيد', 
          onPress: async () => {
            if (completeAppointment) {
              await completeAppointment(id);
              if (getDashData) getDashData();
            }
          }
        },
      ]
    );
  };

  const openAshaa = (url?: string) => {
    if (showDebtNotice) return; // منع الفتح في حال المديونية
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('خطأ', 'لا يمكن فتح الرابط');
      });
    }
  };

  const renderAppointmentItem = ({ item }: { item: Appointment }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.cardHeader}>
        
        {/* اليسار: الأزرار أو حالة الموعد */}
        <View style={styles.actionContainer}>
          {!item.cancelled && !item.isCompleted ? (
            <View style={styles.btnGroup}>
              <TouchableOpacity onPress={() => handleCancel(item._id)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>✕</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleComplete(item._id)} style={styles.completeBtn}>
                <Text style={styles.completeBtnText}>إتمام</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.statusBadge, item.cancelled ? styles.cancelledBadge : styles.completedBadge]}>
              <Text style={[styles.statusText, item.cancelled ? styles.cancelledText : styles.completedText]}>
                {item.cancelled ? 'ملغي' : 'مكتمل'}
              </Text>
            </View>
          )}
        </View>

        {/* اليمين: بيانات المريض وصورة الأشعة */}
        <View style={styles.patientSection}>
           {item.ashaaFile ? (
            <TouchableOpacity 
              onPress={() => openAshaa(item.ashaaFile)} 
              style={[styles.ashaaContainer, showDebtNotice && styles.lightBlurEffect]}
              activeOpacity={0.7}
            >
                <Image source={{ uri: item.ashaaFile }} style={styles.ashaaThumb} />
                <View style={styles.ashaaOverlay}>
                    <Text style={styles.ashaaText}>الأشعة</Text>
                </View>
            </TouchableOpacity>
          ) : (
            <View style={[styles.ashaaContainer, { borderColor: '#1e293b', backgroundColor: '#1e293b' }]}>
               <Text style={[styles.ashaaText, { color: '#475569' }]}>لا يوجد</Text>
            </View>
          )}

          <View style={styles.textData}>
            <Text style={[styles.patientName, showDebtNotice && styles.lightBlurEffect]}>
              {item.patientName || item.userData?.name || 'مريض غير معروف'}
            </Text>
            <Text style={[styles.patientPhone, showDebtNotice && styles.lightBlurEffect]}>{item.patientPhone}</Text>
          </View>
          
          <Image 
            source={{ uri: item.userData?.image || 'https://via.placeholder.com/100' }} 
            style={[styles.patientImg, showDebtNotice && styles.lightBlurEffect]} 
          />
        </View>
      </View>

      {/* سطر المعلومات السفلي */}
      <View style={styles.cardFooter}>
        <View style={[styles.infoItem, showDebtNotice && styles.lightBlurEffect]}>
          <Text style={styles.infoValue}>{item.patientAge || (calculateAge && item.userData?.dob ? calculateAge(item.userData.dob) : '24')} سنة</Text>
          <Text style={styles.infoLabel}>العمر: </Text>
        </View>

        <View style={styles.infoDivider} />

        <View style={styles.infoItem}>
          <Text style={styles.infoValue}>{localSlotDateFormat(item.slotDate)}</Text>
          <View style={styles.timeTag}>
            <Text style={styles.timeTagText}>{item.slotTime}</Text>
          </View>
          <Text style={styles.infoLabel}>الموعد: </Text>
        </View>
      </View>

      {/* البلور القوي Overlay عند المديونية */}
      {showDebtNotice && (
        <View style={[styles.blurOverlay, { backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.92)' }]}>
           <Ionicons name="lock-closed" size={18} color="#64748b" style={{ marginBottom: 4, opacity: 0.6 }} />
           <Text style={styles.blurText}>سدد المديونية لرؤية التفاصيل</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>سجل المواعيد</Text>
        <Text style={styles.subtitle}>لديك {appointments.length} حالة مسجلة</Text>
      </View>

      <FlatList
        data={appointments}
        keyExtractor={(item, index) => item._id || index.toString()}
        renderItem={renderAppointmentItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>لا توجد مواعيد حالياً</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1224' },
  header: { padding: 25, alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  title: { fontSize: 24, fontWeight: '900', color: '#fff' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  
  appointmentCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#1e293b',
    elevation: 4,
    overflow: 'hidden' // مهم جداً لمنع خروج طبقة البلور عن حدود الكارت
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  patientSection: { flexDirection: 'row', alignItems: 'center' },
  textData: { marginRight: 12, alignItems: 'flex-end' },
  patientName: { fontSize: 16, fontWeight: '800', color: '#f1f5f9' },
  patientPhone: { fontSize: 11, color: '#14b8a6', fontWeight: '700', marginTop: 2 },
  patientImg: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  
  ashaaContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#14b8a6',
    position: 'relative',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3
  },
  ashaaThumb: { width: '100%', height: '100%', opacity: 0.8 },
  ashaaOverlay: { 
    position: 'absolute', 
    bottom: 0, width: '100%', 
    backgroundColor: 'rgba(20, 184, 166, 0.7)',
    alignItems: 'center',
    paddingVertical: 1
  },
  ashaaText: { color: '#fff', fontSize: 7, fontWeight: 'bold' },

  actionContainer: { flexDirection: 'row' },
  btnGroup: { flexDirection: 'row', gap: 8 },
  completeBtn: { backgroundColor: '#14b8a6', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  completeBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  cancelBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', width: 35, height: 35, justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  cancelBtnText: { color: '#ef4444', fontWeight: '900' },
  
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  cancelledBadge: { backgroundColor: 'rgba(239, 68, 68, 0.05)' },
  completedBadge: { backgroundColor: 'rgba(20, 184, 166, 0.05)' },
  statusText: { fontSize: 10, fontWeight: '900' },
  cancelledText: { color: '#ef4444' },
  completedText: { color: '#14b8a6' },

  cardFooter: { 
    marginTop: 15, 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#1e293b',
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  infoItem: { flexDirection: 'row-reverse', alignItems: 'center' },
  infoLabel: { fontSize: 10, color: '#64748b', fontWeight: '700' },
  infoValue: { fontSize: 12, color: '#94a3b8', fontWeight: '800' },
  infoDivider: { width: 1, height: 12, backgroundColor: '#1e293b', marginHorizontal: 12 },
  timeTag: { backgroundColor: 'rgba(20, 184, 166, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginHorizontal: 6 },
  timeTagText: { color: '#14b8a6', fontSize: 10, fontWeight: '900' },
  
  emptyState: { padding: 60, alignItems: 'center' },
  emptyText: { color: '#475569', fontSize: 14, fontWeight: '700' },

  // التأثيرات الخاصة بالـ Blur
  blurOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 10,
  },
  blurText: { color: '#64748b', fontSize: 11, fontWeight: '900', opacity: 0.8 },
  lightBlurEffect: {
    opacity: 0.1,
    ...(Platform.OS === 'ios' ? { filter: 'blur(5px)' } : {}),
  }
});

export default DoctorAppointments;