// screens/BoostPost.jsx — Header fixed + syntax error resolved
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useUser } from "../context/UserContext";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

const PLANS = [
  { id: "24h", duration: "24 Hours", price: 500, estimatedViews: "5,000+ extra views", days: 1 },
  { id: "3d", duration: "3 Days", price: 1200, estimatedViews: "15,000+ extra views", days: 3 },
  { id: "7d", duration: "7 Days", price: 2000, estimatedViews: "40,000+ extra views", days: 7 },
];

export default function BoostPost() {
  const navigation = useNavigation();
  const route = useRoute();
  const { listing: initialListing } = route.params;
  const { user } = useUser();

  const [listing, setListing] = useState(initialListing);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const selected = PLANS.find((p) => p.id === selectedPlan);

  useEffect(() => {
    if (!listing?.id) return;

    const unsub = onSnapshot(doc(db, "listings", listing.id), (snap) => {
      if (snap.exists()) {
        setListing({ id: snap.id, ...snap.data() });
      }
    });

    return () => unsub();
  }, [listing?.id]);

  const handleBoost = async () => {
    if (!selectedPlan) {
      Alert.alert("Select Plan", "Choose a boost duration first.");
      return;
    }
    if (!user?.email) {
      Alert.alert("Email Needed", "Add an email to your profile to pay.");
      return;
    }

    setLoading(true);

    try {
      const reference = `boost_${listing.id}_${Date.now()}`;

      const res = await fetch("https://us-central1-roomlink-homes.cloudfunctions.net/initializePaystack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          amount: selected.price * 100,
          reference,
          callback_url: "roomlink://payment-success",
          metadata: {
            type: "listing_boost",
            listingId: listing.id,
            planId: selected.id,
            userId: user.uid,
          },
        }),
      });

      const data = await res.json();

      if (!data.url) {
        throw new Error("Payment link failed");
      }

      navigation.navigate("PaystackWebView", { url: data.url });

      Alert.alert(
        "Payment Started",
        "Complete payment in the browser.\n\nYour listing will boost automatically in seconds after success.",
        [{ text: "OK" }]
      );
    } catch (err) {
      Alert.alert("Payment Error", "Couldn't start payment. Try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Already boosted screen
  if (listing?.boosted) {
    const planName = listing.boostPlan === "24h" ? "24 Hours" : listing.boostPlan === "3d" ? "3 Days" : "7 Days";
    const expires = listing.boostedUntil ? new Date(listing.boostedUntil).toLocaleDateString() : "soon";

    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ padding: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={28} color="#000000" />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: "center", marginRight: 48 }}>
            <Text style={styles.pageTitle}>Boost Active</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.activeBanner}>
            <Ionicons name="flame" size={60} color="#FF9500" />
            <Text style={styles.activeTitle}>BOOST ACTIVE 🔥</Text>
            <Text style={styles.activeText}>Plan: {planName}</Text>
            <Text style={styles.activeText}>Expires: {expires}</Text>
            <Text style={styles.activeSub}>Your listing is now at the top!</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ========== HEADER - SAME AS OTHER SCREENS ========== */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={28} color="#000000" />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: "center", marginRight: 48 }}>
          <Text style={styles.pageTitle}>Boost Your Listing</Text>
        </View>
      </View>
      {/* ========== END HEADER ========== */}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>"{listing.title}"</Text>
        <Text style={styles.info}>
          Get more views and messages — stand out in the feed.
        </Text>

        <View style={styles.plansContainer}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.selectedPlan,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
              disabled={loading}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planDuration}>{plan.duration}</Text>
                {selectedPlan === plan.id && <Ionicons name="checkmark-circle" size={28} color="#FF9500" />}
              </View>
              <Text style={styles.planPrice}>₦{plan.price.toLocaleString()}</Text>
              <Text style={styles.planViews}>{plan.estimatedViews}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.boostButton,
            (!selectedPlan || loading) && styles.disabledButton,
          ]}
          onPress={handleBoost}
          disabled={!selectedPlan || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="flame" size={24} color="#fff" />
              <Text style={styles.boostButtonText}>
                Pay & Boost • ₦{selected?.price?.toLocaleString() || "0"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>
          Secured by Paystack • Boost activates automatically
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 32,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000000",
  },
  scrollContent: { padding: 20 },
  subtitle: { fontSize: 17, textAlign: "center", marginBottom: 20, fontStyle: "italic", color: "#555" },
  info: { fontSize: 16, textAlign: "center", marginBottom: 30, lineHeight: 24, color: "#333" },
  plansContainer: { marginBottom: 30 },
  planCard: { padding: 20, borderRadius: 16, borderWidth: 2, marginBottom: 15, backgroundColor: "#f9f9f9", borderColor: "#ccc" },
  selectedPlan: { backgroundColor: "rgba(255,149,0,0.1)", borderColor: "#FF9500" },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  planDuration: { fontSize: 20, fontWeight: "bold" },
  planPrice: { fontSize: 34, fontWeight: "900", color: "#FF9500", marginVertical: 8 },
  planViews: { fontSize: 15, color: "#666" },
  boostButton: { flexDirection: "row", backgroundColor: "#FF9500", paddingVertical: 18, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  disabledButton: { backgroundColor: "#ccc" },
  boostButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold", marginLeft: 12 },
  note: { textAlign: "center", marginTop: 20, fontSize: 13, color: "#777" },
  activeBanner: { alignItems: "center", padding: 40, backgroundColor: "rgba(255,149,0,0.15)", borderRadius: 20, marginVertical: 50 },
  activeTitle: { fontSize: 28, fontWeight: "bold", color: "#FF9500", marginTop: 15 },
  activeText: { fontSize: 18, marginTop: 10, fontWeight: "600" },
  activeSub: { fontSize: 16, marginTop: 20, textAlign: "center", color: "#555", paddingHorizontal: 20 },
});