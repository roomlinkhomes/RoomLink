// screens/Wallet.jsx — Header matches EditProfile height + back button
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Clipboard,
  ToastAndroid,
} from "react-native";
import { getAuth } from "firebase/auth";
import { doc, onSnapshot, collection, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native"; // ← Added for back button

export default function Wallet() {
  const navigation = useNavigation(); // ← For back navigation
  const user = getAuth().currentUser;
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubWallet = onSnapshot(doc(db, "wallets", user.uid), snap => {
      setWallet(snap.data());
    });

    const q = query(
      collection(db, "wallet_logs"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubTx = onSnapshot(q, snap => {
      const list = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setTransactions(list.filter(tx => tx.userId === user.uid));
    });

    return () => {
      unsubWallet();
      unsubTx();
    };
  }, []);

  function copyAccount() {
    if (!wallet?.accountNumber) return;
    Clipboard.setString(wallet.accountNumber);
    ToastAndroid.show("Account number copied", ToastAndroid.SHORT);
  }

  const deposit = wallet?.depositBalance || 0;
  const earnings = wallet?.earningsBalance || 0;
  const total = deposit + earnings;

  return (
    <View style={styles.container}>
      {/* ========== HEADER - SAME HEIGHT AS EDITPROFILE ========== */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingHorizontal: 20,
        paddingTop: 50,           // ← Matches EditProfile exactly
        paddingBottom: 32,
      }}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={28} color="#000000" />
        </TouchableOpacity>

        {/* Title */}
        <View style={{ flex: 1, alignItems: "center", marginRight: 48 }}>
          <Text style={styles.pageTitle}>Wallet</Text>
        </View>
      </View>
      {/* ========== END HEADER ========== */}

      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} />
        }
        ListHeaderComponent={
          <>
            {/* WALLET SUMMARY */}
            <View style={styles.card}>
              <Text style={styles.title}>Wallet</Text>

              <View style={styles.row}>
                <Text>Deposit Balance</Text>
                <Text style={styles.amount}>₦{deposit.toLocaleString()}</Text>
              </View>

              <View style={styles.row}>
                <Text>Earnings Balance</Text>
                <Text style={styles.amount}>₦{earnings.toLocaleString()}</Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.total}>Total Balance</Text>
                <Text style={styles.totalValue}>₦{total.toLocaleString()}</Text>
              </View>
            </View>

            {/* VIRTUAL ACCOUNT */}
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
                  Send money from any Nigerian bank to fund your Roomlink wallet.
                </Text>
              </View>
            )}

            {/* HISTORY HEADER */}
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.tx}>
            <View>
              <Text style={styles.txTitle}>{item.type}</Text>
              <Text style={styles.txDate}>
                {new Date(item.createdAt?.toDate()).toDateString()}
              </Text>
            </View>

            <Text
              style={[
                styles.txAmount,
                { color: item.amount > 0 ? "green" : "red" },
              ]}
            >
              ₦{Math.abs(item.amount).toLocaleString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No transactions yet</Text>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  card: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 18,
    borderRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 15,
    marginTop: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    borderTopWidth: 1,
    paddingTop: 10,
    borderColor: "#eee",
  },
  amount: {
    fontWeight: "600",
  },
  total: {
    fontWeight: "bold",
  },
  totalValue: {
    fontWeight: "bold",
    color: "#0a7",
  },
  accountBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  acc: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  bank: {
    fontWeight: "600",
    marginBottom: 2,
  },
  note: {
    color: "#666",
    marginTop: 6,
    fontSize: 12,
  },
  tx: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  txTitle: {
    fontWeight: "500",
  },
  txDate: {
    fontSize: 11,
    color: "#888",
  },
  txAmount: {
    fontWeight: "600",
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#888",
  },
});