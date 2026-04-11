import 'react-native-gesture-handler'; // ⚠️ لازم يفضل أول سطر هنا كمان لضمان عمل الـ Navigation
import { registerRootComponent } from 'expo';
import App from './App'; 

// تسجيل المكون الأساسي "App" ليعمل في بيئة الـ Native والـ Expo Go
// registerRootComponent بيعوضنا عن AppRegistry.registerComponent التقليدي في React Native
registerRootComponent(App);