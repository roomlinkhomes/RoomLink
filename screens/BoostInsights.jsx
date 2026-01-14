// screens/BoostInsights.jsx — Boost Insights screen
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { db } from "../firebaseConfig";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { BarChart } from "react-native-gifted-charts";

export default function BoostInsights() {
  const navigation = useNavigation();
  const route = useRoute();
  const { listing } = route.params;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [totalViews, setTotalViews] = useState(0);
  const [boostViews, setBoostViews] = useState(0);
  const [messages, setMessages] = useState(0);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (!listing?.id) return;

    // Total views on listing
    const viewsCol = collection(db, "listings", listing.id, "views");
    const unsubViews = onSnapshot(viewsCol, (snapshot) => {
      const count = snapshot.size;
      setTotalViews(count);

      // Estimate boost views (total - normal average, or store separately later)
      setBoostViews(Math.floor(count * 0.7)); // placeholder: 70% from boost
    });

    // Messages (count subcollection or field — placeholder for now)
    // In real app: count docs in "messages" subcollection linked to listing
    setMessages(Math.floor(Math.random() * 50) + 10); // fake for now

    // Chart data (last 7 days placeholder)
    const data = [
      { value: 120, label: "Mon" },
      { value: 180, label: "Tue" },
      { value: 250, label: "Wed" },
      { value: 300, label: "Thu" },
      { value: 420, label: "Fri" },
      { value: 380, label: "Sat" },
      { value: 500, label: "Sun" },
    ];
    setChartData(data);

    return () => unsubViews();
  }, [listing?.id]);

  const handleBoostAgain = () => {
    navigation.navigate("BoostPost", { listing });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>
          Boost Insights
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? "#aaa" : "#555" }]}>
          "{listing.title}"
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: isDark ? "#111" : "#f0f0f0" }]}>
          <Ionicons name="eye-outline" size={30} color="#FF9500" />
          <Text style={[styles.statNumber, { color: isDark ? "#fff" : "#000" }]}>
            {totalViews}
          </Text>
          <Text style={[styles.statLabel, { color: isDark ? "#aaa" : "#666" }]}>
            Total Views
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: isDark ? "#111" : "#f0f0f0" }]}>
          <Ionicons name="flame" size={30} color="#FF9500" />
          <Text style={[styles.statNumber, { color: isDark ? "#fff" : "#000" }]}>
            {boostViews}
          </Text>
          <Text style={[styles.statLabel, { color: isDark ? "#aaa" : "#666" }]}>
            From Boost
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: isDark ? "#111" : "#f0f0f0" }]}>
          <Ionicons name="chatbubble-outline" size={30} color="#017a6b" />
          <Text style={[styles.statNumber, { color: isDark ? "#fff" : "#000" }]}>
            {messages}
          </Text>
          <Text style={[styles.statLabel, { color: isDark ? "#aaa" : "#666" }]}>
            Messages
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: isDark ? "#fff" : "#000" }]}>
          Views This Week
        </Text>
        <BarChart
          data={chartData}
          barWidth={30}
          spacing={20}
          roundedTop
          frontColor="#FF9500"
          height={200}
          yAxisThickness={0}
          xAxisThickness={0}
          hideRules
        />
      </View>

      <TouchableOpacity style={styles.boostAgainButton} onPress={handleBoostAgain}>
        <Ionicons name="trending-up" size={20} color="#fff" />
        <Text style={styles.boostAgainText}>Boost Again</Text>
      </TouchableOpacity>

      <Text style={[styles.note, { color: isDark ? "#888" : "#777" }]}>
        Keep boosting to reach more people!
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 5,
    fontStyle: "italic",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
  },
  statCard: {
    alignItems: "center",
    padding: 15,
    borderRadius: 16,
    width: "30%",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
  },
  chartContainer: {
    padding: 20,
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  boostAgainButton: {
    flexDirection: "row",
    backgroundColor: "#FF9500",
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  boostAgainText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  note: {
    textAlign: "center",
    margin: 20,
    fontSize: 14,
  },
});