import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";

// 1. تعريف واجهة بيانات الدواء (TypeScript Interface)
interface MedicineProps {
  category?: string;
  name?: string;
  description?: string;
  price?: number;
  image?: string; // يمكن استخدامه لاحقاً مع مكون Image من react-native
}

const { width } = Dimensions.get("window");

const MedicineDetailsScreen = ({
  category = "قسم المسكنات",
  name = "بانادول إكسترا",
  description = "يستخدم لتسكين الآلام الخفيفة والمتوسطة بفعالية سريعة وقوية.",
  price = 45.0,
}: MedicineProps) => {
  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        
        {/* منطقة الصورة / الأيقونة */}
        <View style={styles.imageContainer}>
          <Text style={styles.emojiIcon}>💊</Text>
        </View>

        {/* تفاصيل المنتج */}
        <View style={styles.detailsContainer}>
          <Text style={styles.categoryText}>{category}</Text>
          
          <Text style={styles.nameText}>{name}</Text>
          
          <Text style={styles.descriptionText}>{description}</Text>

          {/* بوكس السعر */}
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>السعر النهائي</Text>
            <View style={styles.priceWrapper}>
              <Text style={styles.currencyText}>ج.م</Text>
              <Text style={styles.priceText}>{price.toFixed(2)}</Text>
            </View>
          </View>

          {/* زر الإضافة للسلة */}
          <TouchableOpacity 
            style={styles.addToCartButton} 
            activeOpacity={0.8}
          >
            <Text style={styles.cartIcon}>🛒</Text>
            <Text style={styles.buttonText}>إضافة إلى سلة الطلبات</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            * يرجى استشارة الطبيب أو الصيدلي قبل تناول أي دواء.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff", // bg-white
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
  },
  card: {
    backgroundColor: "#f8fafc", // slate-50
    borderRadius: 50, // rounded-[3.5rem]
    padding: 25,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#ffffff",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 30,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  emojiIcon: {
    fontSize: 80,
  },
  detailsContainer: {
    width: "100%",
    alignItems: "flex-end", // dir="rtl"
  },
  categoryText: {
    color: "#0d9488", // teal-600
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8,
    letterSpacing: 1,
    textAlign: "right",
  },
  nameText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1e293b", // slate-800
    marginBottom: 15,
    textAlign: "right",
  },
  descriptionText: {
    fontSize: 16,
    color: "#64748b", // slate-500
    lineHeight: 26,
    fontWeight: "500",
    marginBottom: 30,
    textAlign: "right",
  },
  priceCard: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    alignSelf: "flex-end",
    marginBottom: 30,
    minWidth: 120,
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "bold",
    marginBottom: 5,
  },
  priceWrapper: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0d9488",
  },
  currencyText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#64748b",
    marginRight: 4,
  },
  addToCartButton: {
    backgroundColor: "#0d9488",
    width: "100%",
    height: 65,
    borderRadius: 20,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginRight: 10,
  },
  cartIcon: {
    fontSize: 20,
  },
  disclaimer: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "bold",
    width: "100%",
  },
});

export default MedicineDetailsScreen;