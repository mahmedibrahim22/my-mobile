import React, { useContext, memo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, Platform } from 'react-native';
import { AppContext } from '../../context/AppContext';
import { useNavigation } from '@react-navigation/native';

// استيراد اللوجو من المسار الصحيح بناءً على هيكلة المجلدات
const logoImg = require('../../../assets/images/logo.png'); 

interface FooterProps {
    onLogoPress?: () => void;
}

/**
 * 🛠️ تم استخدام memo لتحسين الأداء (Performance) 
 * وتم تعريف الاسم صراحةً لحل مشكلة ESLint "Component definition is missing display name"
 */
const Footer: React.FC<FooterProps> = memo(({ onLogoPress }) => {
    const navigation = useNavigation<any>();
    const context = useContext(AppContext);
    const isDarkMode = context?.isDarkMode ?? true;
    const currentYear = new Date().getFullYear();

    const handleNavigation = (screenName: string) => {
        if (screenName === 'Home') {
            onLogoPress?.(); // تنفيذ الطلوع لفوق فوراً
        } else {
            navigation.navigate(screenName);
        }
    };

    return (
        <View style={[styles.footer, isDarkMode ? styles.darkFooter : styles.lightFooter]}>
            {/* ✨ خط توهج علوي متدرج يعطي لمسة عصرية */}
            <View style={[styles.glowLine, { opacity: isDarkMode ? 0.6 : 0.3 }]} />

            <View style={styles.content}>
                {/* سكشن اللوجو - تفاعل سريع */}
                <View style={styles.logoSection}>
                    <TouchableOpacity 
                        activeOpacity={0.5} 
                        onPress={onLogoPress}
                    >
                        <Image 
                            source={logoImg} 
                            style={styles.logo} 
                            resizeMode="contain" 
                        />
                    </TouchableOpacity>
                    <Text style={[styles.description, isDarkMode ? styles.darkText : styles.lightText]}>
                        نحن في منصة <Text style={styles.tealText}>عَوْن</Text> نسعى لتسخير التكنولوجيا لخدمة صحة المريض المصري.
                    </Text>
                </View>

                {/* روابط سريعة - ترتيب Grid محسن للموبايل */}
                <View style={styles.linksSection}>
                    <View style={styles.titleWrapper}>
                        <Text style={[styles.title, isDarkMode ? styles.whiteText : styles.blackText]}>استكشف</Text>
                        <View style={styles.titleIndicator} />
                    </View>
                    
                    <View style={styles.linksGrid}>
                        {[
                            { name: 'الرئيسية', screen: 'Home' },
                            { name: 'كل الأطباء', screen: 'AllDoctors' },
                            { name: 'عن عَوْن', screen: 'About' },
                            { name: 'تواصل معنا', screen: 'Contact' }
                        ].map((item, idx) => (
                            <TouchableOpacity 
                                key={idx} 
                                onPress={() => handleNavigation(item.screen)}
                                style={styles.linkItem}
                            >
                                <Text style={styles.arrow}>←</Text>
                                <Text style={[styles.linkText, isDarkMode ? styles.darkText : styles.lightText]}>{item.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* سكشن التواصل الاجتماعي */}
                <View style={styles.socialSection}>
                     <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://facebook.com')}>
                        <Text style={{fontSize: 18}}>🌐</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://linkedin.com')}>
                        <Text style={{fontSize: 18}}>💼</Text>
                     </TouchableOpacity>
                </View>

                {/* تواصل سريع عبر البريد */}
                <View style={styles.contactSection}>
                    <TouchableOpacity 
                        style={[styles.contactCard, isDarkMode ? styles.darkCard : styles.lightCard]} 
                        onPress={() => Linking.openURL('mailto:support@aoun-egypt.com')}
                    >
                        <View style={styles.iconBox}><Text style={{fontSize: 14}}>📧</Text></View>
                        <Text style={[styles.contactValue, isDarkMode ? styles.darkText : styles.lightText]}>support@aoun-egypt.com</Text>
                    </TouchableOpacity>
                </View>

                {/* سطر الحقوق السفلي */}
                <View style={[styles.bottomBar, { borderTopColor: isDarkMode ? '#1e293b' : '#e2e8f0' }]}>
                    <Text style={styles.copyrightText}>
                        بكل فخر صُنع بواسطة <Text style={styles.tealText}>M. Ibrahim</Text> — {currentYear} ©
                    </Text>
                </View>
            </View>
        </View>
    );
});

// ✅ حل مشكلة ESLint: تحديد اسم المكون بشكل صريح
Footer.displayName = 'Footer';

const styles = StyleSheet.create({
    footer: {
        marginTop: 30,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingTop: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20, 
        overflow: 'hidden',
    },
    lightFooter: { backgroundColor: '#f1f5f9' },
    darkFooter: { backgroundColor: '#0f172a' },
    glowLine: {
        position: 'absolute',
        top: 0,
        left: '20%',
        width: '60%',
        height: 3,
        backgroundColor: '#14b8a6',
        borderRadius: 10,
        shadowColor: "#14b8a6",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
    },
    content: { paddingHorizontal: 25 },
    logoSection: { marginBottom: 25, alignItems: 'flex-end' },
    logo: { width: 160, height: 50, marginBottom: 12 },
    description: { textAlign: 'right', fontSize: 13, lineHeight: 20, fontWeight: '500', width: '90%' },
    tealText: { color: '#14b8a6', fontWeight: 'bold' },
    darkText: { color: '#94a3b8' },
    lightText: { color: '#64748b' },
    whiteText: { color: '#fff' },
    blackText: { color: '#000' },
    linksSection: { marginBottom: 20 },
    titleWrapper: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 15, gap: 8 },
    title: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
    titleIndicator: { width: 4, height: 16, backgroundColor: '#14b8a6', borderRadius: 10 },
    linksGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between' },
    linkItem: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 12, width: '45%', gap: 6 },
    arrow: { color: '#14b8a6', fontSize: 14, fontWeight: 'bold' },
    linkText: { fontSize: 14, fontWeight: '600' },
    socialSection: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 20 },
    socialIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(20,184,166,0.1)', justifyContent: 'center', alignItems: 'center' },
    contactSection: { marginBottom: 25 },
    contactCard: { 
        flexDirection: 'row-reverse', 
        alignItems: 'center', 
        gap: 12, 
        padding: 12, 
        borderRadius: 15, 
        borderWidth: 1 // ✅ تم تعديل borderHeight لـ borderWidth لحل خطأ TypeScript
    },
    lightCard: { backgroundColor: '#fff', borderColor: '#e2e8f0' },
    darkCard: { backgroundColor: '#1e293b', borderColor: '#334155' },
    iconBox: { width: 35, height: 35, borderRadius: 10, backgroundColor: 'rgba(20,184,166,0.1)', justifyContent: 'center', alignItems: 'center' },
    contactValue: { fontSize: 13, fontWeight: '700' },
    bottomBar: { borderTopWidth: 1, paddingTop: 20, alignItems: 'center' },
    copyrightText: { fontSize: 11, color: '#64748b', fontWeight: 'bold', letterSpacing: 0.2 },
});

export default Footer;