// screens/OrderSummary.jsx — FINAL VERSION (RL Left + Smooth Hide/Show Pay Button)
import React, { useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { db, auth } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useCart } from "../context/CartContext";

export default function OrderSummary() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const navigation = useNavigation();
  const route = useRoute();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);

  const { cartItems } = useCart();
  const routeItems = route.params?.items;
  const items = routeItems?.length > 0 ? routeItems : cartItems;

  const deliveryInfo = route.params?.deliveryInfo || {
    firstName: route.params?.firstName || "",
    lastName: route.params?.lastName || "",
    phone: route.params?.phone || "",
    state: route.params?.state || "",
    city: route.params?.city || "",
    lga: route.params?.lga || "",
    address: route.params?.address || "",
  };

  const theme = {
    background: isDarkMode ? "#121212" : "#fafafa",
    card: isDarkMode ? "#1e1e1e" : "#ffffff",
    text: isDarkMode ? "#e0e0e0" : "#1a1a1a",
    textSecondary: isDarkMode ? "#b0b0b0" : "#666",
    primary: isDarkMode ? "#00ff7f" : "#017a6b",
    border: isDarkMode ? "#333" : "#e0e6ed",
  };

  const parseNumber = (v) => {
    if (v == null) return 0;
    const cleaned = String(v).replace(/[^0-9.-]+/g, "");
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  };

  const { itemTotal, deliveryFee, serviceFee, total } = useMemo(() => {
    const itemTotal = items.reduce((sum, item) => sum + parseNumber(item.price) * (item.quantity || 1), 0);
    const deliveryFee = items.reduce((sum, item) => sum + parseNumber(item.deliveryFee || 0) * (item.quantity || 1), 0);
    const serviceFee = parseFloat((itemTotal * 0.02).toFixed(2));
    const total = parseFloat((itemTotal + deliveryFee + serviceFee).toFixed(2));
    return { itemTotal, deliveryFee, serviceFee, total };
  }, [items]);

  // ✅ YOUR EXACT SAME PAYMENT FUNCTION - UNCHANGED
  const handlePayment = async () => {
    if (items.length === 0) return Alert.alert("Empty Cart", "Add items first");
    if (!deliveryInfo.address) return Alert.alert("Address Missing", "Please enter delivery address");

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        navigation.navigate("Login");
        return;
      }

      const orderRef = await addDoc(collection(db, "orders"), {
        buyerId: user.uid,
        buyerEmail: user.email,
        items: items.map((i) => ({
          id: i.id,
          name: i.name || i.title,
          price: parseNumber(i.price),
          quantity: i.quantity || 1,
          vendorId: i.vendorId || null,
          deliveryFee: parseNumber(i.deliveryFee || 0),
        })),
        deliveryInfo,
        itemTotal,
        deliveryFee,
        serviceFee,
        totalAmount: total,
        currency: "NGN",
        status: "pending_payment",
        createdAt: serverTimestamp(),
      });

      const res = await fetch(
        "https://us-central1-roomlink-homes.cloudfunctions.net/initializePaystack",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            amount: Math.round(total * 100),
            reference: `roomlink_${orderRef.id}_${Date.now()}`,
            orderId: orderRef.id,
            callback_url: "roomlink://payment-success",
          }),
        }
      );

      const data = await res.json();

      if (!data || !data.url) {
        throw new Error(data?.message || "Failed to start payment. Try again.");
      }

      setLoading(false);
      navigation.navigate("PaystackWebView", {
        url: data.url,
        orderId: orderRef.id,
      });
    } catch (error) {
      console.log("Payment Error:", error);
      setLoading(false);
      Alert.alert("Payment Error", error.message || "Please try again");
    }
  };

  // 🆗 SMOOTH BUTTON ANIMATION
  const buttonTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 120],
    extrapolate: "clamp",
  });

  const buttonOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", backgroundColor: theme.background }]}>
        <View style={[styles.loadingCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Preparing secure payment...
          </Text>
          <Text style={[styles.loadingSubtext, { color: theme.textSecondary }]}>
            Connecting to Paystack
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 🆗 RL ON LEFT - NO BACK BUTTON */}
      <View style={styles.pageHeader}>
        <View style={[
          styles.rlBadge,
          { 
            backgroundColor: isDarkMode ? 'rgba(0, 255, 127, 0.1)' : 'rgba(1, 122, 107, 0.08)',
            borderColor: theme.primary
          }
        ]}>
          <Text style={[styles.rlText, { color: theme.primary }]}>RL</Text>
        </View>
        
        <View style={styles.headerContent}>
          <Text style={[styles.pageTitle, { color: theme.text }]}>
            Order Summary
          </Text>
          <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
            Review & pay securely
          </Text>
        </View>
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* 🆗 Order Items */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cart-outline" size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Order Items ({items.length})
            </Text>
          </View>

          {items.map((item, idx) => {
            const price = parseNumber(item.price);
            const qty = item.quantity || 1;
            const subtotal = price * qty;
            return (
              <View
                key={idx}
                style={[
                  styles.itemCard,
                  { 
                    backgroundColor: theme.card, 
                    borderColor: theme.border 
                  },
                ]}
              >
                {item.image && (
                  <Image 
                    source={{ uri: item.image }} 
                    style={styles.image} 
                  />
                )}
                <View style={styles.itemDetails}>
                  <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={2}>
                    {item.name || item.title}
                  </Text>
                  <Text style={[styles.itemPrice, { color: theme.primary }]}>
                    ₦{price.toLocaleString()} × {qty}
                  </Text>
                  <Text style={[styles.itemSubtotal, { color: theme.text }]}>
                    = ₦{subtotal.toLocaleString()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* 🆗 Delivery Address */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Delivery Address
            </Text>
          </View>
          
          <View style={styles.deliveryInfo}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Recipient
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {deliveryInfo.firstName} {deliveryInfo.lastName}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Phone
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                🇳🇬 +234 {deliveryInfo.phone}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Address
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={2}>
                {deliveryInfo.address}
              </Text>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="map-outline" size={16} color={theme.primary} />
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {deliveryInfo.lga}, {deliveryInfo.city}, {deliveryInfo.state}
              </Text>
            </View>
          </View>
        </View>

        {/* 🆗 Payment Summary */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt-outline" size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Payment Summary
            </Text>
          </View>

          <View style={styles.summaryRows}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.text }]}>
                Items Total
              </Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                ₦{itemTotal.toLocaleString()}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Delivery Fee
              </Text>
              <Text style={[styles.summaryValue, { color: theme.textSecondary }]}>
                ₦{deliveryFee.toLocaleString()}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Service Fee (2%)
              </Text>
              <Text style={[styles.summaryValue, { color: theme.textSecondary }]}>
                ₦{serviceFee.toLocaleString()}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.text }]}>
                Total Amount
              </Text>
              <Text style={[styles.totalValue, { color: theme.primary }]}>
                ₦{total.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.securityBadge}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
            <Text style={[styles.securityText, { color: theme.textSecondary }]}>
              Secured by Paystack
            </Text>
          </View>
        </View>
      </Animated.ScrollView>

      {/* 🆗 SMOOTH HIDE/SHOW PAY BUTTON */}
      <Animated.View 
        style={[
          styles.actionFooter,
          {
            transform: [{ translateY: buttonTranslateY }],
            opacity: buttonOpacity,
          }
        ]}
      >
        <View style={[
          styles.actionFooterInner,
          { 
            backgroundColor: theme.card,
            borderColor: theme.border,
          }
        ]}>
          <TouchableOpacity 
            style={[
              styles.payButton,
              { backgroundColor: theme.primary }
            ]} 
            onPress={handlePayment} 
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="card-outline" size={20} color="#fff" />
                <Text style={styles.payText}>
                  Pay Securely ₦{total.toLocaleString()}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },

  // 🆗 RL ON LEFT - NO BACK BUTTON
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  rlBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    marginRight: 16,
  },
  rlText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  headerContent: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pageSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 4,
  },

  // 🆗 Scroll Content
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
  },

  // 🆗 Section Cards
  sectionCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 12,
    letterSpacing: 0.3,
  },

  // 🆗 Item Cards
  itemCard: { 
    flexDirection: "row", 
    alignItems: "center", 
    borderRadius: 16, 
    padding: 14, 
    borderWidth: 1, 
    marginBottom: 12 
  },
  image: { 
    width: 70, 
    height: 70, 
    borderRadius: 12, 
    marginRight: 14 
  },
  itemDetails: {
    flex: 1,
  },
  itemName: { 
    fontSize: 16, 
    fontWeight: "700", 
    marginBottom: 4 
  },
  itemPrice: { 
    fontSize: 15, 
    fontWeight: "600", 
    marginBottom: 2 
  },
  itemSubtotal: { 
    fontSize: 16, 
    fontWeight: "700" 
  },

  // 🆗 Delivery Info
  deliveryInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },

  // 🆗 Summary
  summaryRows: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // 🆗 Security Badge
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(1, 122, 107, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(1, 122, 107, 0.1)',
    marginTop: 16,
  },
  securityText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },

  // 🆗 Loading Screen
  loadingCard: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '700',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
  },

  // 🆗 SMOOTH ANIMATION BUTTON
  actionFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30,
  },
  actionFooterInner: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: 16,
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    minHeight: 62,
  },
  payText: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: '800',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
});