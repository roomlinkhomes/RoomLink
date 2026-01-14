import React, { useState, useRef } from "react"; 
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCart } from "../context/CartContext";
import { useNavigation } from "@react-navigation/native";

export default function Cart() {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const isDark = useColorScheme() === "dark";
  const navigation = useNavigation();
  const [showFooter, setShowFooter] = useState(true);
  const flatListRef = useRef(null);

  // ✅ Calculate total price
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0),
    0
  );

  // ✅ Handle scroll events
  const handleScroll = (event) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const isScrollingUp = scrollY < 20; // Show footer when near top or stopped
    
    setShowFooter(isScrollingUp);
  };

  // ✅ Navigate to Checkout with cart items & total amount
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert("Cart is empty", "Add some items before checking out.");
      return;
    }

    navigation.navigate("Checkout", {
      cartItems,
      totalAmount: totalPrice,
    });
  };

  // ✅ Render each cart item
  const renderCartItem = ({ item, index }) => (
    <View
      style={[
        styles.cartItemCard,
        {
          backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
          shadowColor: isDark ? "#000" : "#000",
          borderColor: isDark ? "#333" : "#e0e6ed",
        }
      ]}
    >
      {/* Item Image */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.images?.[0] || 'https://via.placeholder.com/120x120/017a6b/ffffff?text=No+Image' }} 
          style={styles.itemImage}
          defaultSource={{ uri: 'https://via.placeholder.com/120x120/017a6b/ffffff?text=No+Image' }}
        />
      </View>

      {/* Item Details */}
      <View style={styles.itemDetails}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemTitle, { color: isDark ? "#e0e0e0" : "#1a1a1a" }]} numberOfLines={2}>
            {item.title}
          </Text>
          <TouchableOpacity
            onPress={() => removeFromCart(item.id)}
            style={[
              styles.removeButton,
              { backgroundColor: isDark ? 'rgba(237, 83, 83, 0.1)' : 'rgba(237, 83, 83, 0.08)' }
            ]}
          >
            <MaterialCommunityIcons name="close-circle" size={20} color="#ed5e5e" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.itemPrice, { color: isDark ? "#00ff7f" : "#017a6b" }]}>
          ₦{Number(item.price).toLocaleString()}
        </Text>

        <Text style={[styles.itemLocation, { color: isDark ? "#b0b0b0" : "#666" }]} numberOfLines={1}>
          📍 {item.location}
        </Text>

        {/* Vendor Badge */}
        <View style={[
          styles.vendorBadge,
          { backgroundColor: isDark ? 'rgba(1, 122, 107, 0.1)' : 'rgba(1, 122, 107, 0.08)' }
        ]}>
          <Ionicons name="storefront-outline" size={14} color={isDark ? "#00ff7f" : "#017a6b"} />
          <Text style={[styles.vendorText, { color: isDark ? "#00ff7f" : "#017a6b" }]}>
            RLMARKET Verified
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#121212" : "#fafafa" }]}>
      {/* 🆕 RLMARKET Header */}
      <View style={styles.pageHeader}>
        <View style={[
          styles.rlBadge,
          { backgroundColor: isDark ? 'rgba(0, 255, 127, 0.1)' : 'rgba(1, 122, 107, 0.08)' }
        ]}>
          <Text style={[styles.rlText, { color: isDark ? "#00ff7f" : "#017a6b" }]}>RL</Text>
        </View>
        <View style={styles.headerContent}>
          <Text style={[styles.pageTitle, { color: isDark ? "#e0e0e0" : "#1a1a1a" }]}>
            My Cart
          </Text>
          <Text style={[styles.itemCount, { color: isDark ? "#b0b0b0" : "#666" }]}>
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[
            styles.emptyRlBadge,
            { backgroundColor: isDark ? 'rgba(0, 255, 127, 0.1)' : 'rgba(1, 122, 107, 0.08)' }
          ]}>
            <Text style={[styles.emptyRlText, { color: isDark ? "#00ff7f" : "#017a6b" }]}>
              RL
            </Text>
          </View>
          
          <Ionicons 
            name="cart-outline" 
            size={80} 
            color={isDark ? "#666" : "#999"} 
            style={styles.emptyIcon}
          />
          
          <Text style={[styles.emptyTitle, { color: isDark ? "#e0e0e0" : "#333" }]}>
            Your Cart is Empty
          </Text>
          
          <Text style={[styles.emptySubtitle, { color: isDark ? "#999" : "#666" }]}>
            Start shopping to add items to your cart
          </Text>
          
          <TouchableOpacity
            style={[
              styles.shopNowButton,
              { backgroundColor: isDark ? "#00ff7f" : "#017a6b" }
            ]}
            onPress={() => navigation.navigate('Vendor')}
          >
            <Ionicons name="storefront-outline" size={18} color="#fff" />
            <Text style={styles.shopNowText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={cartItems}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            renderItem={renderCartItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            scrollIndicatorInsets={{ right: 1 }}
          />

          {/* 🆕 Scroll-Aware Footer */}
          <View 
            style={[
              styles.footer,
              { 
                backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
                shadowColor: isDark ? "#000" : "#000",
                borderColor: isDark ? "#333" : "#e0e6ed",
                transform: [{ translateY: showFooter ? 0 : 100 }],
              }
            ]}
          >
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.clearButton,
                  { 
                    backgroundColor: isDark ? 'rgba(237, 83, 83, 0.1)' : 'rgba(237, 83, 83, 0.08)',
                    borderColor: isDark ? 'rgba(237, 83, 83, 0.3)' : 'rgba(237, 83, 83, 0.2)',
                  }
                ]}
                onPress={clearCart}
              >
                <MaterialCommunityIcons name="cart-off" size={18} color="#ed5e5e" />
                <Text style={[styles.clearButtonText, { color: "#ed5e5e" }]}>
                  Clear Cart
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.checkoutButton,
                  { backgroundColor: isDark ? "#00ff7f" : "#017a6b" }
                ]}
                onPress={handleCheckout}
              >
                <Ionicons name="cash-outline" size={18} color="#fff" />
                <Text style={styles.checkoutButtonText} numberOfLines={1}>
                  Checkout ₦{totalPrice.toLocaleString()}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },

  // 🆕 Page Header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  rlBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(1, 122, 107, 0.2)',
  },
  rlText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -1,
  },
  headerContent: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  itemCount: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyRlBadge: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(1, 122, 107, 0.2)',
  },
  emptyRlText: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -2,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
    marginBottom: 32,
  },
  shopNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  shopNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  // Cart Items
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  cartItemCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  imageContainer: {
    marginRight: 16,
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  itemDetails: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    flex: 1,
    marginRight: 12,
  },
  removeButton: {
    padding: 6,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  itemLocation: {
    fontSize: 14,
    fontWeight: '500',
  },
  vendorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    maxWidth: '70%',
  },
  vendorText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // 🆕 Scroll-Aware Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 1000,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
    textAlign: 'center',
  },
  checkoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 52,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});