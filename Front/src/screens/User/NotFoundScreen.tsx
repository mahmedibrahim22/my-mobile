import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MotiView } from 'moti';

const NotFoundScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* أنيميشن بسيط للدائرة */}
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 1000 }}
          style={styles.iconCircle}
        >
          <Text style={styles.errorText}>404</Text>
        </MotiView>

        <MotiView
          from={{ translateY: 20, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ delay: 300 }}
        >
          <Text style={styles.title}>عذراً، الصفحة غير موجودة</Text>
          <Text style={styles.description}>
            يبدو أن الرابط الذي تحاول الوصول إليه غير متاح حالياً أو تم نقله.
          </Text>
        </MotiView>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>العودة للرئيسية</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Dark Theme (Slate 900)
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#334155',
  },
  errorText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#14B8A6', // Teal Color
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#14B8A6',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
});

export default NotFoundScreen;