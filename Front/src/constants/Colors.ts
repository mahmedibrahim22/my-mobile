import { useColorScheme } from 'react-native';

// 1. الألوان الثابتة للهوية (الأساسيات)
export const brandColors = {
  primary: "#007074",       // الـ Primary الأساسي
  brandTeal: "#14b8a6",     // الـ Brand Teal
  accent: "#00dfc4",        // لون التميز المستخدم في الـ Dashboard
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
};

// 2. ألوان الشفافية والبلور (Blur & Overlays)
// تم إضافة هذه القيم لتوحيد شكل الـ "المنع" و "البلور" في شاشات الطبيب
export const transparency = {
  blurDark: "rgba(15, 23, 42, 0.92)",    // بلور قوي للخلفية الداكنة
  blurLight: "rgba(241, 245, 249, 0.92)", // بلور قوي للخلفية الفاتحة
  overlayDark: "rgba(5, 8, 17, 0.85)",   // غطاء داكن جداً
  overlayLight: "rgba(255, 255, 255, 0.85)", // غطاء فاتح جداً
  glassTeal: "rgba(20, 184, 166, 0.15)", // تأثير زجاجي بلون البراند
  glassDanger: "rgba(239, 68, 68, 0.1)", // تأثير زجاجي للتحذيرات
};

// 3. تعريف الثيمات
export const Themes = {
  dark: {
    ...brandColors,
    ...transparency,
    background: "#050811", // تم التحديث ليطابق خلفية الـ Dashboard الداكنة جداً
    card: "#0F172A",
    text: "#F8FAFC",
    subtext: "#94A3B8",
    border: "#1E293B",
    tabIconDefault: "#475569",
    tabIconSelected: brandColors.brandTeal,
    skeleton: "#1e293b",
  },
  light: {
    ...brandColors,
    ...transparency,
    background: "#F1F5F9",
    card: "#FFFFFF",
    text: "#0F172A",
    subtext: "#64748B",
    border: "#E2E8F0",
    tabIconDefault: "#94A3B8",
    tabIconSelected: brandColors.primary,
    skeleton: "#e2e8f0",
  },
};

/**
 * 💡 التوافقية: 
 * تصدير Colors ككائن ثابت يحتوي على القيم الأساسية 
 * لضمان عمل الشاشات التي تعتمد على الاستيراد المباشر
 */
export const Colors = {
  ...brandColors,
  ...transparency,
  ...Themes.dark, // الافتراضي هو الدارك ثيم
  light: Themes.light,
  dark: Themes.dark,
};

/**
 * Hook مخصص للوصول للثيم الحالي برمجياً
 */
export const useAppTheme = (manualTheme?: 'light' | 'dark') => {
  const systemColorScheme = useColorScheme();
  const activeThemeName = manualTheme || systemColorScheme || 'dark';
  return Themes[activeThemeName as keyof typeof Themes] || Themes.dark;
};

// التصدير الافتراضي
export default Colors;