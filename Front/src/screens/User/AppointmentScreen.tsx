import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  BackHandler,
  Modal,
  Dimensions
} from 'react-native';
import { useSelector } from 'react-redux';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import { AppContext } from '../../context/AppContext';

const { width } = Dimensions.get('window');

const dayNamesArabic = ['الأحد', 'الأثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const specialityTranslate: Record<string, string> = {
  "General physician": "طبيب عام",
  "Gynecologist": "نساء وتوليد",
  "Dermatologist": "جلدية وتجميل",
  "Pediatricians": "أطفال",
  "Neurologist": "مخ وأعصاب",
  "Gastroenterologist": "باطنة",
  "Cardiologist": "قلب",
  "Orthopedic": "عظام",
  "Dentist": "أسنان",
  "Ophthalmologist": "رمد",
  "Urologist": "مسالك",
  "Lab Consultant": "تحاليل",
  "Physiotherapist": "علاج طيبعي",
};

const AppointmentScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { docId } = route.params;

  const context = useContext(AppContext) as any;
  const isDarkMode = context?.isDarkMode ?? true;
  const { currency, backendUrl, token, userData, setBookingSuccess } = context || {};
  const { doctors } = useSelector((state: any) => state.doctors);

  const [docInfo, setDocInfo] = useState<any | null>(null);
  const [docSlots, setDocSlots] = useState<any[]>([]); 
  const [slotIndex, setSlotIndex] = useState<number | null>(null);
  const [slotTime, setSlotTime] = useState("");

  const [isUserProfile, setIsUserProfile] = useState<boolean | null>(null);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("ذكر");
  const [illnessDescription, setIllnessDescription] = useState("");
  const [illnessImage, setIllnessImage] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // حالة التنبيه المخصص
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  const showAlert = (msg: string) => {
    setAlertMsg(msg);
    setAlertVisible(true);
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (slotTime || illnessDescription.length > 5) {
          Alert.alert("تنبيه", "هل تريد التراجع عن الحجز؟ سيتم فقدان البيانات المختارة.", [
            { text: "بقاء", style: "cancel" },
            { text: "خروج", onPress: () => navigation.goBack() }
          ]);
          return true;
        }
        return false;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove(); 
    }, [slotTime, illnessDescription, navigation])
  );

  const fetchDocInfo = useCallback(() => {
    if (doctors?.length > 0) {
      const foundDoc = doctors.find((doc: any) => String(doc._id) === String(docId));
      if (foundDoc) setDocInfo(foundDoc);
    }
  }, [doctors, docId]);

  const generateTimeSlots = (startTime: string, endTime: string, duration: number, breakStart: string, breakDuration: number) => {
    const slots = [];
    const parseTime = (timeStr: string) => {
      if (!timeStr) return null;
      const match = timeStr.match(/(\d+:\d+)\s*(AM|PM)/i);
      if (!match) return null;
      const time = match[1];
      const modifier = match[2].toUpperCase();
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours !== 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      const d = new Date();
      d.setHours(hours, minutes || 0, 0, 0);
      return d;
    };

    let current = parseTime(startTime);
    const end = parseTime(endTime);
    const bStart = breakStart ? parseTime(breakStart) : null;
    const bEnd = (bStart && breakDuration) ? new Date(bStart.getTime() + breakDuration * 60 * 1000) : null;

    if (!current || !end || duration <= 0) return [];
    if (end <= current) end.setDate(end.getDate() + 1);

    while (current < end) {
      const isInBreak = bStart && bEnd && current >= bStart && current < bEnd;
      if (!isInBreak) {
        slots.push(current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      }
      current.setMinutes(current.getMinutes() + duration);
    }
    return slots;
  };

  const getAvailableSlots = useCallback(() => {
    if (!docInfo) return;
    if (docInfo.isAvailableNow === false) {
       setDocSlots([]);
       return;
    }
    let now = new Date();
    let today = new Date();
    today.setHours(0, 0, 0, 0); 
    let activeDaysCount = 0;
    let allSlots = [];
    let dayOffset = 0;
    const duration = docInfo.duration || 30;
    const offDays = docInfo.offDays || [];
    const startTime = docInfo.startTime || "09:00 AM";
    const endTime = docInfo.endTime || "11:00 PM";
    const breakStart = docInfo.breakStart; 
    const breakDuration = docInfo.breakTime || 0; 

    while (activeDaysCount < 3 && dayOffset < 14) { 
      let currentDate = new Date(today);
      currentDate.setDate(today.getDate() + dayOffset);
      const dayName = dayNamesArabic[currentDate.getDay()];
      const isOffDay = offDays.includes(dayName);
      if (!isOffDay) {
        const slotDateKey = `${currentDate.getDate()}_${currentDate.getMonth() + 1}_${currentDate.getFullYear()}`;
        const bookedTimes = ((docInfo.slots_booked && docInfo.slots_booked[slotDateKey]) || []).map((t: string) => t.trim().toUpperCase().replace(/^0/, ''));
        let daySlots = generateTimeSlots(startTime, endTime, duration, breakStart, breakDuration);
        const filteredTimes = daySlots.filter((time: string) => {
          const cleanTime = time.trim().toUpperCase().replace(/^0/, '');
          const match = cleanTime.match(/(\d+:\d+)\s*(AM|PM)/i);
          if(!match) return false;
          let [hours, minutes] = match[1].split(':').map(Number);
          const modifier = match[2];
          if (modifier === 'PM' && hours !== 12) hours += 12;
          if (modifier === 'AM' && hours === 12) hours = 0;
          const slotDateTime = new Date(currentDate);
          slotDateTime.setHours(hours, minutes, 0, 0);
          return !bookedTimes.includes(cleanTime) && slotDateTime > now;
        }).map((time: string) => ({ time: time.trim(), datetime: new Date(currentDate) }));

        if (filteredTimes.length > 0) {
          allSlots.push({
            dayName,
            date: currentDate.getDate(),
            displayDate: `${currentDate.getDate()}/${currentDate.getMonth() + 1}`,
            fullDate: currentDate,
            times: filteredTimes,
            isAvailable: true 
          });
          activeDaysCount++;
        }
      }
      dayOffset++;
    }
    setDocSlots(allSlots);
  }, [docInfo]);

  useEffect(() => { fetchDocInfo(); }, [fetchDocInfo]);
  useEffect(() => { if (docInfo) { getAvailableSlots(); } }, [docInfo, getAvailableSlots]);

  const handleIdentifyUser = (isSelf: boolean) => {
    setIsUserProfile(isSelf);
    if (isSelf && userData) {
      setPatientName(userData.name || "");
      setPatientPhone(userData.phone || "");
      if (userData.dob) {
        const birthYear = new Date(userData.dob).getFullYear();
        setPatientAge(String(new Date().getFullYear() - birthYear));
      }
      setPatientGender(userData.gender === "أنثى" ? "أنثى" : "ذكر");
    } else {
      setPatientName(""); setPatientPhone(""); setPatientAge(""); setPatientGender("ذكر");
    }
  };

  const pickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
      if (!result.canceled) setIllnessImage(result.assets[0]);
    } catch { showAlert("فشل في اختيار الملف"); }
  };

  const bookAppointment = async () => {
    if (!token) return showAlert("سجل دخولك أولاً لإتمام الحجز");
    if (slotIndex === null) return showAlert("يرجى اختيار يوم الحجز أولاً");
    if (!slotTime) return showAlert("يرجى اختيار ميعاد الحجز");
    if (isUserProfile === null) return showAlert("يرجى تحديد هل الحجز لك أم لشخص آخر");
    if (!patientName.trim()) return showAlert("يرجى كتابة اسم المريض");
    if (!patientPhone.trim()) return showAlert("يرجى كتابة رقم الهاتف");
    if (!patientAge.trim()) return showAlert("يرجى كتابة سن المريض");
    
    setLoading(true);
    const date = docSlots[slotIndex].fullDate;
    const slotDate = `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`;

    try {
      const formData = new FormData();
      formData.append("docId", docId);
      formData.append("slotDate", slotDate);
      formData.append("slotTime", slotTime); 
      formData.append("patientName", patientName);
      formData.append("patientPhone", patientPhone);
      formData.append("patientAge", patientAge);
      formData.append("patientGender", patientGender);
      formData.append("illnessDescription", illnessDescription);
      
      if (illnessImage) {
        formData.append("image", { 
            uri: illnessImage.uri, 
            name: illnessImage.name, 
            type: illnessImage.mimeType || 'image/jpeg' 
        } as any);
      }

      const { data } = await axios.post(`${backendUrl}/api/user/book-appointment`, formData, {
        headers: { token, 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        if(setBookingSuccess) {
           setBookingSuccess(true);
        }
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        showAlert(data.message);
      }
    } catch (err: any) {
      showAlert("حدث خطأ في الاتصال بالخادم، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const bgColor = isDarkMode ? '#0F172A' : '#F8FAFC';
  const cardColor = isDarkMode ? '#1E293B' : '#FFFFFF';
  const textColor = isDarkMode ? '#F1F5F9' : '#1E293B';
  const subTextColor = isDarkMode ? '#94A3B8' : '#64748B';

  if (!docInfo) return <ActivityIndicator style={{ flex: 1, backgroundColor: bgColor }} color="#2dd4bf" />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      
      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <MotiView from={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={[styles.alertBox, { backgroundColor: cardColor }]}>
            <Ionicons name="warning" size={50} color="#f87171" style={{ marginBottom: 15 }} />
            <Text style={[styles.alertText, { color: textColor }]}>{alertMsg}</Text>
            <TouchableOpacity onPress={() => setAlertVisible(false)} style={styles.alertBtn}>
              <Text style={styles.alertBtnText}>حسناً</Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </Modal>

      <View style={[styles.header, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#e2e8f0' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-forward" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>تأكيد الحجز</Text>
          <View style={{ width: 40 }} /> 
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        <MotiView 
          from={{ opacity: 0, translateY: 20 }} 
          animate={{ opacity: 1, translateY: 0 }}
          style={[styles.docCard, { backgroundColor: cardColor }]}
        >
          <Image source={{ uri: docInfo.image }} style={styles.docImage} />
          <View style={styles.docDetails}>
            <Text style={[styles.docName, { color: textColor }]}>{docInfo.name}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.specBadge}><Text style={styles.specBadgeText}>{specialityTranslate[docInfo.speciality] || docInfo.speciality}</Text></View>
              <Text style={[styles.degreeText, { color: subTextColor }]}>{docInfo.degree}</Text>
            </View>
            <Text style={[styles.docAbout, { color: subTextColor }]} numberOfLines={3}>{docInfo.about}</Text>
            <Text style={styles.feeText}>قيمة الكشف: {docInfo.fees} {currency}</Text>
          </View>
        </MotiView>

        {docInfo.isAvailableNow === false ? (
          <View style={[styles.formCard, { backgroundColor: 'rgba(248,113,113,0.1)', alignItems: 'center' }]}>
              <Ionicons name="alert-circle" size={40} color="#f87171" />
              <Text style={[styles.noSlots, { textAlign: 'center', fontSize: 16, marginTop: 10 }]}>الطبيب غير متاح لاستقبال حجوزات حالياً</Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={22} color="#2dd4bf" />
                <Text style={[styles.sectionTitle, { color: textColor }]}>أولاً: موعد الكشف</Text>
            </View>

            <View style={{ height: 95, marginBottom: 15 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 5 }}>
                {docSlots.map((item, index) => { 
                  const isSelected = slotIndex === index;
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => { setSlotIndex(index); setSlotTime(""); }}
                      style={[
                        styles.dayButton,
                        { backgroundColor: isSelected ? '#2dd4bf' : cardColor, borderColor: '#2dd4bf', borderWidth: 1 }
                      ]}
                    >
                      <Text style={[styles.dayText, { color: isSelected ? '#0F172A' : textColor }]}>{item.dayName}</Text>
                      <Text style={[styles.dateText, { color: isSelected ? '#0F172A' : subTextColor }]}>{item.displayDate}</Text>
                    </TouchableOpacity>
                  );
                })}
                {docSlots.length === 0 && <Text style={[styles.noSlots, { textAlign: 'center' }]}>لا توجد مواعيد متاحة قريباً</Text>}
              </ScrollView>
            </View>

            <AnimatePresence>
              {slotIndex !== null && docSlots[slotIndex] && (
                <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={styles.timeContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timesScroll}>
                    {docSlots[slotIndex].times.length > 0 ? (
                      docSlots[slotIndex].times.map((item: any, idx: number) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => setSlotTime(item.time)}
                          style={[styles.timeItem, { backgroundColor: slotTime === item.time ? 'rgba(45, 212, 191, 0.2)' : cardColor, borderColor: slotTime === item.time ? '#2dd4bf' : 'rgba(148,163,184,0.1)' }]}
                        >
                          <Text style={[styles.timeText, { color: slotTime === item.time ? '#2dd4bf' : subTextColor }]}>{item.time}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noSlots}>تم حجز جميع مواعيد هذا اليوم</Text>
                    )}
                  </ScrollView>
                </MotiView>
              )}
            </AnimatePresence>

            <View style={[styles.formCard, { backgroundColor: cardColor }]}>
              <Text style={[styles.questionText, { color: textColor }]}>ثانياً: بيانات المريض</Text>
              
              <View style={styles.choiceRow}>
                <TouchableOpacity onPress={() => handleIdentifyUser(true)} style={[styles.choiceBtn, isUserProfile === true && styles.choiceActive]}>
                  <Text style={[styles.choiceText, { color: isUserProfile === true ? '#0F172A' : subTextColor }]}>لي شخصياً</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleIdentifyUser(false)} style={[styles.choiceBtn, isUserProfile === false && styles.choiceActive]}>
                  <Text style={[styles.choiceText, { color: isUserProfile === false ? '#0F172A' : subTextColor }]}>لمريض آخر</Text>
                </TouchableOpacity>
              </View>

              {isUserProfile !== null && (
                <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.formInputs}>
                  <TextInput placeholder="اسم المريض بالكامل" placeholderTextColor={subTextColor} value={patientName} editable={!isUserProfile} onChangeText={setPatientName} style={[styles.input, { backgroundColor: bgColor, color: textColor }]} />
                  <TextInput placeholder="رقم الموبايل" placeholderTextColor={subTextColor} value={patientPhone} editable={!isUserProfile} onChangeText={setPatientPhone} keyboardType="phone-pad" style={[styles.input, { backgroundColor: bgColor, color: textColor }]} />
                  
                  <View style={styles.row}>
                     <TextInput placeholder="السن" placeholderTextColor={subTextColor} value={patientAge} editable={!isUserProfile} onChangeText={setPatientAge} keyboardType="numeric" style={[styles.input, { flex: 0.8, backgroundColor: bgColor, color: textColor }]} />
                     <View style={styles.genderBox}>
                        <TouchableOpacity onPress={() => !isUserProfile && setPatientGender("ذكر")} style={[styles.gBtn, patientGender === "ذكر" && styles.choiceActive]}>
                            <Text style={[styles.gText, { color: patientGender === "ذكر" ? '#0F172A' : subTextColor }]}>ذكر</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => !isUserProfile && setPatientGender("أنثى")} style={[styles.gBtn, patientGender === "أنثى" && styles.choiceActive]}>
                            <Text style={[styles.gText, { color: patientGender === "أنثى" ? '#0F172A' : subTextColor }]}>أنثى</Text>
                        </TouchableOpacity>
                     </View>
                  </View>

                  <TextInput placeholder="اكتب شكواك أو أعراض الحالة (اختياري)..." placeholderTextColor={subTextColor} value={illnessDescription} onChangeText={setIllnessDescription} multiline style={[styles.input, { height: 100, textAlignVertical: 'top', backgroundColor: bgColor, color: textColor }]} />
                  
                  <TouchableOpacity onPress={pickImage} style={styles.uploadBtn}>
                    <Ionicons name="image-outline" size={22} color="#2dd4bf" />
                    <Text style={styles.uploadText}>{illnessImage ? "تم اختيار الصورة " : "إرفاق صورة أشعة أو تحاليل"}</Text>
                  </TouchableOpacity>
                </MotiView>
              )}
            </View>

            <TouchableOpacity onPress={bookAppointment} disabled={loading} style={[styles.submitBtn]}>
              {loading ? <ActivityIndicator color="#0F172A" /> : (
                <>
                  <Text style={styles.submitBtnText}>إتمام عملية الحجز</Text>
                  <Ionicons name="chevron-back" size={20} color="#0F172A" />
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backButton: { padding: 8 },
  scrollPadding: { padding: 16 },
  docCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 25, borderWidth: 1, borderColor: 'rgba(148,163,184,0.1)' },
  docImage: { width: '100%', height: 240, resizeMode: 'cover' },
  docDetails: { padding: 20 },
  docName: { fontSize: 22, fontWeight: '700', textAlign: 'right', marginBottom: 6 },
  badgeRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 12 },
  specBadge: { backgroundColor: 'rgba(45, 212, 191, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  specBadgeText: { color: '#2dd4bf', fontSize: 13, fontWeight: '700' },
  degreeText: { fontSize: 12, fontWeight: '500' },
  docAbout: { textAlign: 'right', fontSize: 14, lineHeight: 22 },
  feeText: { textAlign: 'right', marginTop: 15, fontSize: 18, fontWeight: '800', color: '#2dd4bf' },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 15, paddingHorizontal: 5 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  dayButton: { padding: 12, borderRadius: 18, marginHorizontal: 6, height: 85, minWidth: 95, justifyContent: 'center', alignItems: 'center' },
  dayText: { fontWeight: '800', fontSize: 15 },
  dateText: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  timeContainer: { marginBottom: 25, marginTop: 5 },
  timesScroll: { flexDirection: 'row', gap: 12, paddingVertical: 5 },
  timeItem: { paddingHorizontal: 20, paddingVertical: 15, borderRadius: 16, borderWidth: 1.5, minWidth: 110, alignItems: 'center' },
  timeText: { fontSize: 14, fontWeight: '700' },
  noSlots: { color: '#f87171', fontSize: 14, textAlign: 'right', width: '100%', fontWeight: '600', paddingHorizontal: 10 },
  formCard: { borderRadius: 24, padding: 22, marginBottom: 25 },
  questionText: { textAlign: 'right', fontWeight: '800', fontSize: 17, marginBottom: 18 },
  choiceRow: { flexDirection: 'row-reverse', gap: 12, marginBottom: 20 },
  choiceBtn: { flex: 1, padding: 15, borderRadius: 15, backgroundColor: 'rgba(148,163,184,0.1)', alignItems: 'center' },
  choiceActive: { backgroundColor: '#2dd4bf' },
  choiceText: { fontWeight: '700', fontSize: 14 },
  formInputs: { gap: 14 },
  input: { padding: 18, borderRadius: 16, textAlign: 'right', fontSize: 15, fontWeight: '600' },
  row: { flexDirection: 'row-reverse', gap: 12 },
  genderBox: { flex: 1.2, flexDirection: 'row-reverse', gap: 8 },
  gBtn: { flex: 1, backgroundColor: 'rgba(148,163,184,0.1)', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  gText: { fontSize: 14, fontWeight: '700' },
  uploadBtn: { borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#2dd4bf', borderRadius: 16, padding: 20, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 10 },
  uploadText: { color: '#2dd4bf', fontSize: 14, fontWeight: '700' },
  submitBtn: { backgroundColor: '#2dd4bf', padding: 22, borderRadius: 22, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 50, elevation: 5 },
  submitBtnText: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { width: width * 0.85, borderRadius: 30, padding: 30, alignItems: 'center', elevation: 10 },
  alertText: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 25, lineHeight: 26 },
  alertBtn: { backgroundColor: '#2dd4bf', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 15 },
  alertBtnText: { color: '#0F172A', fontSize: 16, fontWeight: '800' }
});

export default AppointmentScreen;