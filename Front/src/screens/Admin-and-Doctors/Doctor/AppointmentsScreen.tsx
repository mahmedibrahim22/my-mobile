import React, { useContext, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Linking
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
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
  cancellationRequest?: boolean;
  ashaaFile?: string;
}

const DoctorAppointments = () => {
  const doctorCtx = useContext(DoctorContext);
  const appCtx = useContext(AppContext);

  const dToken = doctorCtx?.dToken || '';
  
  const appointments = useMemo(
    () => (doctorCtx?.appointments as Appointment[]) || [],
    [doctorCtx?.appointments]
  );

  const dashData = doctorCtx?.dashData;
  const getAppointments = doctorCtx?.getAppointments;
  const handleCancellationRequest = doctorCtx?.handleCancellationRequest;
  const completeAppointment = doctorCtx?.completeAppointment;
  const getDashData = doctorCtx?.getDashData;

  const calculateAge = appCtx?.calculateAge;

  const isLateTime = new Date().getHours() >= 23;
  const showDebtNotice = (dashData?.totalFeesToAwn ?? 0) > 0 || isLateTime;

  const activeAppointmentId = useMemo(() => {
    const active = appointments.find(
      (ap) => !ap.cancelled && !ap.isCompleted
    );
    return active ? active._id : null;
  }, [appointments]);

  useEffect(() => {
    if (dToken && getAppointments) getAppointments();
    if (dToken && getDashData) getDashData();
  }, [dToken, getAppointments, getDashData]);

  const localSlotDateFormat = (slotDate: string) => {
    try {
      if (!slotDate) return '';
      const dateArray = slotDate.split('_');
      const months = [
        '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];
      return `${dateArray[0]} ${months[Number(dateArray[1])]}`;
    } catch {
      return slotDate;
    }
  };

  // ✅ تحديث: دالة معالجة الرد على الإلغاء (قبول/رفض)
  const onHandleCancelResponse = async (id: string, accept: boolean) => {
    const action = accept ? 'accepted' : 'rejected';
    const msg = accept
      ? 'هل أنت موافق على إلغاء هذا الموعد؟'
      : 'هل تريد رفض طلب الإلغاء وإبقاء الموعد قائماً؟';

    Alert.alert(
      accept ? 'موافقة على الإلغاء' : 'رفض طلب الإلغاء',
      msg,
      [
        { text: 'تراجع', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: async () => {
            if (handleCancellationRequest) {
              await handleCancellationRequest(id, action);
              getDashData?.();
            }
          }
        }
      ]
    );
  };

  const handleComplete = async (id: string) => {
    Alert.alert('تأكيد الإتمام', 'هل تم الكشف على المريض بنجاح؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تأكيد',
        onPress: async () => {
          if (completeAppointment) {
            await completeAppointment(id);
            getDashData?.();
          }
        }
      }
    ]);
  };

  const renderAppointmentItem = ({ item }: { item: Appointment }) => {
    const isNext = item._id === activeAppointmentId;
    const isPast = item.cancelled || item.isCompleted;
    const shouldBlur = !isNext && !isPast;

    const age = item.patientAge || (item.userData?.dob && calculateAge ? calculateAge(item.userData.dob) : '24');

    return (
      <View style={styles.appointmentCard}>
        <View style={styles.cardHeader}>
          <View style={styles.actionContainer}>
            {/* ✅ تحديث اللوجيك: عرض أزرار القرار عند وجود طلب إلغاء */}
            {item.cancellationRequest && !item.cancelled && !item.isCompleted ? (
              <View style={styles.btnGroup}>
                <TouchableOpacity
                  onPress={() => onHandleCancelResponse(item._id, false)}
                  style={styles.rejectBtn}
                >
                  <Text style={styles.rejectBtnText}>رفض الإلغاء</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onHandleCancelResponse(item._id, true)}
                  style={styles.acceptBtn}
                >
                  <Text style={styles.acceptBtnText}>قبول الإلغاء</Text>
                </TouchableOpacity>
              </View>
            ) : !item.cancelled && !item.isCompleted ? (
              <TouchableOpacity
                onPress={() => handleComplete(item._id)}
                style={styles.completeBtn}
              >
                <Text style={styles.completeBtnText}>إتمام الكشف</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.statusBadge, item.cancelled ? styles.cancelledBadge : styles.completedBadge]}>
                <Text style={[styles.statusText, item.cancelled ? styles.cancelledText : styles.completedText]}>
                  {item.cancelled ? 'ملغي' : 'مكتمل'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.patientSection}>
            <View style={styles.textData}>
              <Text style={styles.patientName}>
                {item.patientName || item.userData?.name || 'مريض غير معروف'}
              </Text>
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.patientPhone}`)}>
                <Text style={styles.patientPhone}>{item.patientPhone}</Text>
              </TouchableOpacity>
            </View>
            <Image
              source={{ uri: item.userData?.image || 'https://via.placeholder.com/100' }}
              style={styles.patientImg}
            />
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.infoItem}>
            <Text style={styles.infoValue}>{age} سنة</Text>
            <Text style={styles.infoLabel}>العمر: </Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoValue}>{localSlotDateFormat(item.slotDate)}</Text>
            <View style={styles.timeTag}>
              <Text style={styles.timeTagText}>{item.slotTime}</Text>
            </View>
          </View>
        </View>

        {shouldBlur && (
          <BlurView
            style={styles.blurOverlay}
            blurType="dark"
            blurAmount={10}
            reducedTransparencyFallbackColor="rgba(15,23,42,0.9)"
          >
            <Ionicons name="hourglass-outline" size={24} color="#64748b" />
            <Text style={styles.blurText}>الموعد التالي</Text>
          </BlurView>
        )}

        {showDebtNotice && (
          <View style={[styles.blurOverlay, { backgroundColor: 'rgba(15,23,42,0.95)' }]}>
            <Ionicons name="lock-closed" size={20} color="#ef4444" />
            <Text style={[styles.blurText, { color: '#ef4444' }]}>يرجى تسديد الرسوم</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>إدارة الكشوفات</Text>
        <Text style={styles.subtitle}>سير العمل: كشف بـ كشف</Text>
      </View>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item._id}
        renderItem={renderAppointmentItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>لا توجد مواعيد اليوم</Text>
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
  subtitle: { fontSize: 12, color: '#2dd4bf', marginTop: 4, fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  appointmentCard: { backgroundColor: '#0f172a', borderRadius: 24, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#1e293b', overflow: 'hidden', position: 'relative' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  patientSection: { flexDirection: 'row', alignItems: 'center' },
  textData: { marginRight: 12, alignItems: 'flex-end' },
  patientName: { fontSize: 16, fontWeight: '800', color: '#f1f5f9' },
  patientPhone: { fontSize: 11, color: '#14b8a6', fontWeight: '700', marginTop: 2 },
  patientImg: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#1e293b' },
  actionContainer: { flexDirection: 'row' },
  btnGroup: { flexDirection: 'row', gap: 8 },
  completeBtn: { backgroundColor: '#14b8a6', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  completeBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  acceptBtn: { backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  acceptBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  rejectBtn: { backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  rejectBtnText: { color: '#cbd5e1', fontSize: 11, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  cancelledBadge: { backgroundColor: 'rgba(239, 68, 68, 0.05)' },
  completedBadge: { backgroundColor: 'rgba(20, 184, 166, 0.05)' },
  statusText: { fontSize: 10, fontWeight: '900' },
  cancelledText: { color: '#ef4444' },
  completedText: { color: '#14b8a6' },
  cardFooter: { marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1e293b', flexDirection: 'row-reverse', justifyContent: 'flex-start', alignItems: 'center' },
  infoItem: { flexDirection: 'row-reverse', alignItems: 'center' },
  infoLabel: { fontSize: 10, color: '#64748b', fontWeight: '700' },
  infoValue: { fontSize: 12, color: '#94a3b8', fontWeight: '800' },
  infoDivider: { width: 1, height: 12, backgroundColor: '#1e293b', marginHorizontal: 12 },
  timeTag: { backgroundColor: 'rgba(20, 184, 166, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginHorizontal: 6 },
  timeTagText: { color: '#14b8a6', fontSize: 10, fontWeight: '900' },
  blurOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  blurText: { color: '#64748b', fontSize: 11, fontWeight: '900', opacity: 0.8 },
  emptyState: { padding: 60, alignItems: 'center' },
  emptyText: { color: '#475569', fontSize: 14, fontWeight: '700' },
});

export default DoctorAppointments;