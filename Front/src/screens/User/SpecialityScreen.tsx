import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar,
  Platform
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import TopDoctors from '../../components/Home/TopDoctors';

const SpecialityScreen: React.FC = () => {
    const route = useRoute<any>();
    const speciality = route.params?.speciality || "";

    const formattedSpeciality = typeof speciality === 'string' 
        ? speciality.replace(/-/g, ' ') 
        : '';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            {/* الهيدر ثابت ومفصول تماماً عن منطقة السكرول */}
            <View style={styles.header}>
                <Text style={styles.title}>
                    أطباء <Text style={styles.tealText}>{formattedSpeciality || 'عَوْن'}</Text>
                </Text>
                <Text style={styles.subtitle}>نخبة الكوادر الطبية المتخصصة في خدمتك</Text>
            </View>

            {/* منطقة المحتوى - تأكد أن مكون TopDoctors يستخدم FlatList داخلياً */}
            <View style={styles.content}>
                <TopDoctors 
                    speciality={formattedSpeciality} 
                    // تأكد من تمرير خصائص تمنع الـ Bounce المزعج لو المكون يدعم ذلك
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 10 : 25,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
        // ظل أقوى لتحديد الهيدر
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        zIndex: 999,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#0f172a',
        textAlign: 'right',
        lineHeight: 35,
    },
    tealText: {
        color: '#14b8a6',
    },
    subtitle: {
        fontSize: 15,
        color: '#64748b',
        marginTop: 6,
        fontWeight: '700',
        textAlign: 'right',
    },
    content: {
        flex: 1,
        marginTop: 5,
    }
});

export default SpecialityScreen;