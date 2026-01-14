// screens/Payments.jsx — FIXED & WORKING (no more 'styles' error)
import React, { useContext } from "react";
import { View, ScrollView, StyleSheet, Text, Platform } from "react-native";
import { List, Divider } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeContext } from "../context/ThemeContext";

export default function Payments() {
  const { darkMode } = useContext(ThemeContext);
  const isDark = darkMode;

  const textColor = isDark ? "#fff" : "#000";
  const secondaryText = isDark ? "#aaa" : "#666";
  const iconColor = isDark ? "#999" : "#666";
  const background = isDark ? "#000" : "#fff";
  const dividerColor = isDark ? "#333" : "#eee";

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.header, { color: textColor }]}>Payments</Text>

        <View style={styles.list}>
          <List.Item
            title="Payment methods"
            description="Cards, bank accounts, mobile money"
            titleStyle={[styles.title, { color: textColor }]}
            descriptionStyle={{ color: secondaryText }}
            left={() => <Icon name="credit-card-outline" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => {}}
          />

          <List.Item
            title="Payouts"
            description="Withdraw earnings to your bank"
            titleStyle={[styles.title, { color: textColor }]}
            descriptionStyle={{ color: secondaryText }}
            left={() => <Icon name="bank-transfer" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => {}}
          />

          <List.Item
            title="Transaction history"
            description="View all payments and refunds"
            titleStyle={[styles.title, { color: textColor }]}
            descriptionStyle={{ color: secondaryText }}
            left={() => <Icon name="history" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => {}}
          />

          <List.Item
            title="Currency"
            description="Nigerian Naira (₦)"
            titleStyle={[styles.title, { color: textColor }]}
            descriptionStyle={{ color: secondaryText }}
            left={() => <Icon name="currency-ngn" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => {}}
          />

          <List.Item
            title="Taxes"
            description="VAT, withholding tax info"
            titleStyle={[styles.title, { color: textColor }]}
            descriptionStyle={{ color: secondaryText }}
            left={() => <Icon name="receipt" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => {}}
          />

          <Divider style={{ backgroundColor: dividerColor, marginVertical: 24 }} />

          <List.Item
            title="Need help with a payment?"
            titleStyle={{ color: "#017a6b", fontWeight: "600" }}
            left={() => <Icon name="help-circle-outline" size={24} color="#017a6b" />}
            onPress={() => {}}
          />
        </View>

        <Text style={styles.footer}>All transactions secured with 256-bit encryption</Text>
      </ScrollView>
    </View>
  );
}

// THIS WAS MISSING — NOW ADDED
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    fontSize: 34,
    fontWeight: "bold",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
  },
  list: {
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "400",
  },
  footer: {
    textAlign: "center",
    color: "#8e8e93",
    fontSize: 13,
    paddingVertical: 40,
    paddingBottom: Platform.OS === "ios" ? 60 : 40,
  },
});