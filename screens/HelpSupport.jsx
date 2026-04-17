// screens/HelpSupport.jsx — Fixed: Report a Problem now works properly

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

export default function HelpSupport() {
  const navigation = useNavigation();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const theme = {
    background: isDark ? "#121212" : "#fafafa",
    card: isDark ? "#1e1e1e" : "#ffffff",
    text: isDark ? "#e0e0e0" : "#1a1a1a",
    textSecondary: isDark ? "#b0b0b0" : "#666",
    primary: isDark ? "#00ff7f" : "#000",
    border: isDark ? "#333" : "#e0e6ed",
    accent: isDark ? "#ffcc00" : "#ff9500",
  };

  const supportUID = "lhtmGCryMfNNA9suQct1l5PeBSI3";

  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      question: "How do I post my first listing?",
      answer:
        "Tap the big '+' button in the List tab → Choose category → Add photos, title, description, price, location → Tap 'Create Listing'.",
    },
    {
      question: "Why can't I see my listing?",
      answer:
        "It may be under review, missing info, or removed. Check 'My Listings' or contact support.",
    },
    {
      question: "How do I get verified (blue tick)?",
      answer:
        "Go to Profile → Go Premium → Choose subscription → Pay.",
    },
    {
      question: "Payment issues or refunds?",
      answer:
        "Payments are held in escrow. For disputes, use the Report button in chat or contact support.",
    },
    {
      question: "How do I chat with a tenant/landlord?",
      answer:
        "Open any listing → Tap 'Message' button. All chats stay in-app.",
    },
  ];

  const quickActions = [
    {
      icon: "add-circle-outline",
      text: "Post a New Listing",
      action: () => navigation.navigate("HomeTabs", { screen: "ListingTab" }),
    },
    {
      icon: "chatbubbles-outline",
      text: "Live Chat with Support",
      action: () =>
        navigation.navigate("HomeTabs", {
          screen: "Messages",
          params: {
            screen: "Message",
            params: { recipientUID: supportUID, otherUserName: "RoomLink Support" },
          },
        }),
    },
    {
      icon: "shield-checkmark-outline",
      text: "Get Verified",
      action: () => navigation.navigate("BecomeVendor"),
    },
    {
      icon: "alert-circle-outline",
      text: "Report a Problem",
      action: () => navigation.navigate("ReportScreen"),   // General report (no listing required)
    },
  ];

  const contactOptions = [
    {
      title: "Live Chat (Fastest)",
      icon: "chatbubbles-outline",
      color: "#fff",
      bg: theme.primary,
      action: () =>
        navigation.navigate("HomeTabs", {
          screen: "Messages",
          params: {
            screen: "Message",
            params: { recipientUID: supportUID, otherUserName: "RoomLink Support" },
          },
        }),
    },
    {
      title: "Call Support",
      icon: "call-outline",
      color: theme.primary,
      bg: "transparent",
      action: () => Linking.openURL("tel:+2348039836030"),
    },
    {
      title: "Email Us",
      icon: "mail-outline",
      color: theme.primary,
      bg: "transparent",
      action: () =>
        Linking.openURL("mailto:roomlinkapp@gmail.com?subject=Help Request"),
    },
  ];

  // Filter logic
  const lowerSearch = search.toLowerCase().trim();

  const filteredQuickActions = quickActions.filter((item) =>
    item.text.toLowerCase().includes(lowerSearch)
  );

  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(lowerSearch)
  );

  const filteredContacts = contactOptions.filter((item) =>
    item.title.toLowerCase().includes(lowerSearch)
  );

  const hasResults =
    filteredQuickActions.length > 0 ||
    filteredFaqs.length > 0 ||
    filteredContacts.length > 0 ||
    !search;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={isDark ? "#fff" : "#000"} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>
          Help & Support
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }} stickyHeaderIndices={[1]}>
        {/* Hero */}
        <View style={[styles.heroBanner, { backgroundColor: theme.primary }]}>
          <Ionicons name="help-buoy" size={48} color="#fff" style={{ marginBottom: 12 }} />
          <Text style={styles.heroTitle}>We're here to help! 💚</Text>
          <Text style={styles.heroSubtitle}>
            Got questions or issues? Tap any option below.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={{ backgroundColor: theme.background }}>
          <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="search" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search help topics..."
              placeholderTextColor={theme.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {!hasResults && search && (
            <Text style={{ color: theme.textSecondary, textAlign: "center", marginTop: 40, fontSize: 16 }}>
              No results found — try Live Chat!
            </Text>
          )}

          {/* Quick Actions */}
          {filteredQuickActions.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>
                Quick Actions
              </Text>
              <View style={styles.quickActions}>
                {filteredQuickActions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.quickCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={item.action}
                  >
                    <Ionicons name={item.icon} size={32} color={theme.primary} />
                    <Text style={[styles.quickText, { color: theme.text }]}>{item.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* FAQ */}
          {filteredFaqs.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 32 }]}>
                Frequently Asked Questions
              </Text>
              {filteredFaqs.map((faq, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.faqItem, { backgroundColor: theme.card }]}
                  onPress={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <View style={styles.faqHeader}>
                    <Ionicons name="help-circle" size={24} color={theme.primary} style={{ marginRight: 12 }} />
                    <Text style={[styles.faqQuestion, { color: theme.text, flex: 1 }]}>{faq.question}</Text>
                    <Ionicons
                      name={openFaq === index ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={theme.textSecondary}
                    />
                  </View>
                  {openFaq === index && (
                    <Text style={[styles.faqAnswer, { color: theme.textSecondary, marginTop: 12 }]}>
                      {faq.answer}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Contact Support */}
          {filteredContacts.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 32 }]}>
                Contact Support
              </Text>
              {filteredContacts.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.contactButton,
                    item.bg !== "transparent" ? { backgroundColor: item.bg } : { borderColor: theme.border },
                  ]}
                  onPress={item.action}
                >
                  <Ionicons name={item.icon} size={24} color={item.color} />
                  <Text style={[styles.contactText, { color: item.color }]}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.version, { color: theme.textSecondary }]}>
            RoomLink v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: { padding: 8 },
  title: { fontSize: 24, fontWeight: "800", flex: 1, textAlign: "center" },

  heroBanner: {
    padding: 32,
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTitle: { fontSize: 28, fontWeight: "800", color: "#fff", marginBottom: 12 },
  heroSubtitle: { fontSize: 16, color: "#fff", opacity: 0.9, textAlign: "center" },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 28,
    borderWidth: 1,
    marginHorizontal: 20,
    marginVertical: 16,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16 },

  sectionTitle: { fontSize: 20, fontWeight: "700", marginBottom: 16, marginTop: 24 },
  quickActions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  quickCard: {
    width: "48%",
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    padding: 12,
  },
  quickText: { marginTop: 12, fontWeight: "600", textAlign: "center" },

  faqItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  faqQuestion: { fontSize: 16, fontWeight: "600", flex: 1 },
  faqAnswer: { fontSize: 14, lineHeight: 20, marginTop: 12 },

  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  contactText: { fontSize: 16, fontWeight: "600", marginLeft: 12 },

  footer: { alignItems: "center", marginTop: 40, marginBottom: 30 },
  version: { fontSize: 13 },
});