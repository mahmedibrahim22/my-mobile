import 'react-native-gesture-handler';
import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';

/**
 * 🔐 المايسترو المصغر - AuthStack (منصة عَوْن)
 * الموقع: src/navigation/AuthStack.tsx
 * الهدف: إدارة رحلة الدخول للأدمن والأطباء بسلاسة تامة.
 */

// ✅ استيراد الشاشات من المسارات المعتمدة
import LoginScreen from '../screens/Admin-and-Doctors/Auth/LoginScreen';
import RoleSelectionScreen from '../screens/Admin-and-Doctors/Auth/RoleSelectionScreen';

/**
 * 🔐 تعريف أنواع الـ Stack لضمان دقة الـ Navigation وسلامة الـ Types
 */
export type AuthStackParamList = {
    RoleSelection: undefined; 
    Login: { role: string } | undefined;   
    Register: { role: string } | undefined;      
};

const Stack = createStackNavigator<AuthStackParamList>();

const AuthStack = () => {
    return (
        <Stack.Navigator
            // 🚀 البداية دائماً من شاشة اختيار نوع الحساب (أدمن أم طبيب)
            initialRouteName="RoleSelection" 
            screenOptions={{
                headerShown: false, 
                // 🎨 توحيد الخلفية مع باقي أجزاء النظام (Deep Navy Black)
                cardStyle: { backgroundColor: '#0f172a' }, 
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                // 🚀 أنيميشن "Horizontal" كأنه جزء أصيل من نظام iOS/Android
                cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                // تحسين الأداء عبر إزالة الشاشات السابقة من الذاكرة (Memory Optimization)
                detachPreviousScreen: true,
            }}
        >
            {/* 1️⃣ شاشة اختيار الصلاحية (المدخل الرئيسي) */}
            <Stack.Screen 
                name="RoleSelection" 
                component={RoleSelectionScreen} 
                options={{ 
                    title: 'مرحباً بك في عَوْن',
                    /**
                     * ✅ تفعيل الـ gesture للسماح للمستخدم بالسحب لليمين 
                     * والعودة لشاشة "الهوم" (Home) في الـ Main App.
                     */
                    gestureEnabled: true,
                }}
            />

            {/* 2️⃣ شاشة تسجيل الدخول: تستقبل الـ Role المختار */}
            <Stack.Screen 
                name="Login" 
                component={LoginScreen} 
                options={{ 
                    title: 'تسجيل الدخول للنظام',
                    gestureEnabled: true,
                    // منع الأنيميشن العكسي المفاجئ عند التحقق من البيانات
                    animationEnabled: true,
                }}
            />
            
        </Stack.Navigator>
    );
};

export default AuthStack;