import React from 'react';
import { 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  Platform, 
  View 
} from 'react-native';

// الربط الصح حسب الفولدرات عندك: بنطلع لـ screens ثم لـ src ثم ندخل components
import Delivery from '../../components/User/Delivery'; 

const DeliveryScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'} 
        backgroundColor="#ffffff"
      />
      
      <View style={styles.content}>
        {/* استدعاء المكون اللي فيه التصميم */}
        <Delivery />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    // تعويض الـ pt-20 اللي كانت في الويب
    paddingTop: Platform.OS === 'android' ? 20 : 0, 
  },
});

export default DeliveryScreen;