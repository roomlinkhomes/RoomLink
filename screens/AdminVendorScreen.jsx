// screens/AdminVendorScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useColorScheme } from "react-native";
import { Button, Card, Avatar, Divider } from "react-native-paper";

// Firebase imports
import { auth, db } from "../firebaseConfig";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function AdminVendorScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const theme = {
    background: isDark ? "#121212" : "#fafafa",
    card: isDark ? "#1e1e1e" : "#ffffff",
    text: isDark ? "#e0e0e0" : "#1a1a1a",
    textSecondary: isDark ? "#b0b0b0" : "#666",
    primary: isDark ? "#00ff7f" : "#017a6b",
    border: isDark ? "#333" : "#e0e6ed",
    danger: "#ff4444",
  };

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // 1. Check if user is admin (via custom claim)
  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Access Denied", "Please log in.");
        navigation.replace("Login");
        return;
      }

      try {
        const tokenResult = await user.getIdTokenResult();
        const admin = tokenResult.claims?.admin === true;

        if (!admin) {
          Alert.alert("Access Denied", "This area is for admins only.");
          navigation.goBack();
          return;
        }

        setIsAdmin(true);
      } catch (err) {
        console.error("Admin check error:", err);
        Alert.alert("Error", "Failed to verify admin status.");
        navigation.goBack();
      }
    };

    checkAdmin();
  }, [navigation]);

  // 2. Real-time listener for pending applications (only if admin)
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, "vendorApplications"), where("status", "==", "pending"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = [];
      snapshot.forEach((doc) => {
        apps.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setApplications(apps);
      setLoading(false);
    }, (err) => {
      console.error("Pending apps listener error:", err);
      setLoading(false);
      Alert.alert("Error", "Failed to load pending applications.");
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleApprove = async (appId) => {
    Alert.alert("Confirm", "Approve this application?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        style: "default",
        onPress: async () => {
          try {
            const appRef = doc(db, "vendorApplications", appId);
            await updateDoc(appRef, {
              status: "approved",
              approvedAt: new Date().toISOString(),
              approvedBy: auth.currentUser.uid,
            });
            Alert.alert("Success", "Application approved!");
          } catch (err) {
            console.error("Approve error:", err);
            Alert.alert("Error", "Failed to approve.");
          }
        },
      },
    ]);
  };

  const handleReject = async (appId) => {
    Alert.prompt(
      "Reject Application",
      "Enter reason (optional):",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async (reason = "No reason provided") => {
            try {
              const appRef = doc(db, "vendorApplications", appId);
              await updateDoc(appRef, {
                status: "rejected",
                rejectReason: reason,
                rejectedAt: new Date().toISOString(),
                rejectedBy: auth.currentUser.uid,
              });
              Alert.alert("Success", "Application rejected.");
            } catch (err) {
              console.error("Reject error:", err);
              Alert.alert("Error", "Failed to reject.");
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const renderApplication = ({ item }) => (
    <Card style={[styles.card, { backgroundColor: theme.card, marginBottom: 16 }]}>
      <Card.Title
        title={item.fullName || "Unknown"}
        subtitle={`${item.role || "N/A"} • ${item.email || "N/A"}`}
        left={(props) => <Avatar.Icon {...props} icon="account" />}
      />
      <Card.Content>
        <Text style={[styles.detailText, { color: theme.textSecondary }]}>
          Bank: {item.bankName || "N/A"}
        </Text>
        <Text style={[styles.detailText, { color: theme.textSecondary }]}>
          Account: {item.accountNumber || "N/A"} • {item.accountHolderName || "N/A"}
        </Text>
        {item.businessName && (
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>
            Business: {item.businessName}
          </Text>
        )}
        <Text style={[styles.detailText, { color: theme.textSecondary, fontSize: 12 }]}>
          Submitted: {new Date(item.submittedAt).toLocaleDateString()}
        </Text>
      </Card.Content>
      <Card.Actions style={styles.actions}>
        <Button
          mode="contained"
          buttonColor={theme.primary}
          onPress={() => handleApprove(item.id)}
          icon="check-circle"
        >
          Approve
        </Button>
        <Button
          mode="outlined"
          textColor={theme.danger}
          onPress={() => handleReject(item.id)}
          icon="close-circle"
        >
          Reject
        </Button>
      </Card.Actions>
    </Card>
  );

  if (!isAdmin) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Loading admin access...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.textSecondary, marginTop: 16 }}>Loading pending applications...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Pending Vendor Applications</Text>
        <View style={{ width: 48 }} />
      </View>

      {applications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="hourglass" size={80} color={theme.primary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No pending applications
          </Text>
        </View>
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          renderItem={renderApplication}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  pageTitle: { fontSize: 24, fontWeight: "800" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 6,
  },
  actions: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    textAlign: "center",
  },
});