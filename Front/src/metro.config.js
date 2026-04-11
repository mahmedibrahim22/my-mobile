// @ts-ignore: metro-config doesn't always play nice with TS imports in JS files
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 1. تحسينات معالجة الامتدادات لضمان سرعة البحث عن الملفات
config.resolver.sourceExts = [...config.resolver.sourceExts, 'jsx', 'js', 'ts', 'tsx', 'json'];

// 2. تقييد العمال (Workers) لتقليل استهلاك الرام أثناء التشغيل والتطوير
// بما أن جهازك A16، فتقييدهم لـ 2 يمنع تجمد المترو (Metro Bundler)
config.maxWorkers = 2; 

// 3. تفعيل الـ Inline Requires لتقليل استهلاك الذاكرة وقت التشغيل (Runtime)
// هذه الخطوة جوهرية لأنها تجعل التطبيق يحمل الأكواد عند الحاجة فقط وليس دفعة واحدة
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true, // تفعيل هذا الخيار يقلل من احتمالية خروج الكاش (Crash)
  },
});

// 4. تحسين استهلاك الذاكرة للصور والأصول (Assets)
config.resolver.assetExts = [...config.resolver.assetExts, 'png', 'jpg', 'jpeg'];

// 5. مسح الكاش التلقائي لبعض العمليات لتقليل تراكم البيانات المؤقتة
config.resetCache = true; 

module.exports = config;