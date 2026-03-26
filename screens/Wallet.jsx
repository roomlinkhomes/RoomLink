// screens/Wallet.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Clipboard,
  ToastAndroid,
  Alert,
} from "react-native";
import { getAuth } from "firebase/auth";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function Wallet() {
  const navigation = useNavigation();
  const user = getAuth().currentUser;

  const [wallet, setWallet] = useState(null);
  const [earnings, setEarnings] = useState(0);
  const [spent, setSpent] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingError, setLoadingError] = useState(null);

  // Virtual wallet listener
  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(doc(db, "wallets", user.uid), (snap) => {
      setWallet(snap.exists() ? snap.data() : null);
    });

    return () => unsub();
  }, [user]);

  const loadFinancials = useCallback(async () => {
    if (!user) return;

    setLoadingError(null);

    try {
      // Bookings (earnings)
      const bookingsQ = query(
        collection(db, "bookings"),
        where("hostId", "==", user.uid),
        where("status", "in", ["confirmed", "completed", "paid"]),
        orderBy("confirmedAt", "desc")
      );

      const bookingsSnap = await getDocs(bookingsQ);

      let totalEarnings = 0;
      const earningsTx = [];

      bookingsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const amount = Number(data.amountPaid ?? data.totalAmount ?? data.price ?? 0);

        totalEarnings += amount;

        earningsTx.push({
          id: `booking_${docSnap.id}`,
          type: "Booking Payment",
          amount,
          timestamp: data.confirmedAt ?? data.completedAt ?? data.createdAt ?? Timestamp.now(),
          direction: "in",
          refId: docSnap.id,
          status: data.status,
        });
      });

      // Ads (spent)
      const adsQ = query(
        collection(db, "ads"),
        where("userId", "==", user.uid),
        where("paymentStatus", "in", ["confirmed", "paid", "completed"]),
        orderBy("paidAt", "desc")
      );

      const adsSnap = await getDocs(adsQ);

      let totalSpent = 0;
      const spentTx = [];

      adsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const amount = Number(data.amountPaid ?? data.budget ?? data.paymentAmount ?? 0);

        totalSpent += amount;

        spentTx.push({
          id: `ad_${docSnap.id}`,
          type: "Ad Payment",
          amount: -amount,
          timestamp: data.paidAt ?? data.createdAt ?? Timestamp.now(),
          direction: "out",
          refId: docSnap.id,
          status: data.paymentStatus,
        });
      });

      // Merge & sort (newest first)
      const allTx = [...earningsTx, ...spentTx].sort((a, b) => {
        const ta = a.timestamp?.toMillis?.() ?? (a.timestamp?.seconds ?? 0) * 1000 ?? 0;
        const tb = b.timestamp?.toMillis?.() ?? (b.timestamp?.seconds ?? 0) * 1000 ?? 0;
        return tb - ta;
      });

      setEarnings(totalEarnings);
      setSpent(totalSpent);
      setTransactions(allTx.slice(0, 50));
    } catch (err) {
      console.error("Error loading wallet financials:", err);
      setLoadingError(err.message || "Unknown error");
      Alert.alert(
        "Wallet Load Failed",
        "Could not load financial data.\n\n" +
          (err.message?.includes("index")
            ? "Firestore is still setting up indexes – try refreshing in a minute."
            : err.message || "Please check connection and try again.")
      );
    }
  }, [user]);

  useEffect(() => {
    if (user) loadFinancials();
  }, [user, loadFinancials]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFinancials().finally(() => setRefreshing(false));
  }, [loadFinancials]);

  const copyAccount = () => {
    if (!wallet?.accountNumber) return;
    Clipboard.setString(wallet.accountNumber);
    ToastAndroid.show("Account number copied!", ToastAndroid.SHORT);
  };

  const deposit = wallet?.depositBalance || wallet?.balance || 0;
  const netBalance = deposit + earnings - spent;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10 }}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center", marginRight: 48 }}>
          <Text style={styles.pageTitle}>Wallet</Text>
        </View>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            {loadingError && (
              <View style={{ padding: 16, backgroundColor: "#ffebee", margin: 15, borderRadius: 12 }}>
                <Text style={{ color: "#c62828", fontWeight: "600" }}>
                  Load error: {loadingError}
                </Text>
                <Text style={{ color: "#555", marginTop: 4 }}>
                  Pull down to refresh or check your connection.
                </Text>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.title}>Wallet Overview</Text>

              <View style={styles.row}>
                <Text>Deposit Balance</Text>
                <Text style={styles.amount}>₦{deposit.toLocaleString()}</Text>
              </View>

              <View style={styles.row}>
                <Text>Earnings (Bookings)</Text>
                <Text style={[styles.amount, { color: "#0a7" }]}>
                  ₦{earnings.toLocaleString()}
                </Text>
              </View>

              <View style={styles.row}>
                <Text>Spent (Ads)</Text>
                <Text style={[styles.amount, { color: "#d32f2f" }]}>
                  ₦{spent.toLocaleString()}
                </Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.total}>Net Balance</Text>
                <Text
                  style={[
                    styles.totalValue,
                    { color: netBalance >= 0 ? "#0a7" : "#d32f2f" },
                  ]}
                >
                  ₦{netBalance.toLocaleString()}
                </Text>
              </View>
            </View>

            {wallet?.accountNumber && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Your Bank Account</Text>

                <View style={styles.accountBox}>
                  <Text style={styles.acc}>{wallet.accountNumber}</Text>
                  <TouchableOpacity onPress={copyAccount}>
                    <Ionicons name="copy-outline" size={20} color="#444" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.bank}>{wallet.bankName}</Text>
                <Text>{wallet.accountName}</Text>

                <Text style={styles.note}>
                  Transfer money from any Nigerian bank to top up your Roomlink wallet.
                </Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.tx}>
            <View>
              <Text style={styles.txTitle}>{item.type}</Text>
              <Text style={styles.txDate}>
                {item.timestamp
                  ? new Date(
                      item.timestamp?.toDate?.() ||
                        item.timestamp?.toMillis?.() ||
                        item.timestamp?.seconds * 1000 ||
                        item.timestamp
                    ).toLocaleString("en-NG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"}
              </Text>
            </View>

            <Text
              style={[
                styles.txAmount,
                { color: item.amount > 0 ? "#0a7" : "#d32f2f" },
              ]}
            >
              {item.amount > 0 ? "+" : ""}₦{Math.abs(item.amount).toLocaleString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No transactions yet</Text>
        }
        contentContainerStyle={{ paddingBottom: 140 }}
      />
    </View>
  );
}

// Styles remain the same as before
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 32,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  card: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  amount: { fontWeight: "600", fontSize: 15 },
  total: { fontWeight: "bold", fontSize: 16 },
  totalValue: { fontWeight: "bold", fontSize: 17 },
  accountBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 12,
  },
  acc: {
    fontSize: 19,
    fontWeight: "bold",
    letterSpacing: 1.1,
  },
  bank: { fontWeight: "600", marginBottom: 4, fontSize: 15 },
  note: {
    color: "#666",
    marginTop: 12,
    fontSize: 13,
    lineHeight: 18,
  },
  tx: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  txTitle: { fontWeight: "500", fontSize: 15 },
  txDate: { fontSize: 12, color: "#777", marginTop: 4 },
  txAmount: { fontWeight: "700", fontSize: 16 },
  empty: {
    textAlign: "center",
    marginTop: 60,
    color: "#888",
    fontSize: 15,
  },
});