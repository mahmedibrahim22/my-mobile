import { useColorScheme } from 'react-native';

// 1. الألوان الثابتة للهوية (تصدير مباشر عشان نضمن الوصول لها)
export const brandColors = {
  primary: "#007074",       // الـ Primary الأساسي
  brandTeal: "#14b8a6",     // الـ Brand Teal
  accent: "#0d9488",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
};

// 2. تعريف الثيمات
export const Themes = {
  dark: {
    ...brandColors,
    background: "#0F172A",
    card: "#1E293B",
    text: "#F8FAFC",
    subtext: "#94A3B8",
    border: "#334155",
    tabIconDefault: "#475569",
    tabIconSelected: brandColors.brandTeal,
  },
  light: {
    ...brandColors,
    background: "#F1F5F9",
    card: "#FFFFFF",
    text: "#0F172A",
    subtext: "#64748B",
    border: "#E2E8F0",
    tabIconDefault: "#94A3B8",
    tabIconSelected: brandColors.primary,
  },
};

/**
 * 💡 السر هنا: 
 * بنعمل Export لـ Colors ككائن ثابت بيحتوي على الـ primary مباشرة 
 * عشان الشاشات القديمة اللي بتستخدم Colors.primary تشتغل فوراً
 */
export const Colors = {
  ...brandColors, // ده بيضمن إن Colors.primary متبقاش undefined أبدًا
  ...Themes.dark, // الافتراضي دارك
  light: Themes.light,
  dark: Themes.dark,
};

/**
 * Hook مخصص للاستخدام الجديد
 */
export const useAppTheme = (manualTheme?: 'light' | 'dark') => {
  const systemColorScheme = useColorScheme();
  const activeThemeName = manualTheme || systemColorScheme || 'dark';
  return Themes[activeThemeName as keyof typeof Themes] || Themes.dark;
};

// التصدير الافتراضي
export default Colors;