// components/MessageScreenHeader.jsx — FIXED: Reporting without image/screenshot
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  StatusBar,
  Modal,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebase";
import { doc, updateDoc, arrayRemove, arrayUnion, onSnapshot, addDoc, serverTimestamp, collection } from "firebase/firestore";

// Import badges
import BlueBadge from "../assets/icons/blue.svg";
import YellowBadge from "../assets/icons/yellow.svg";
import RedBadge from "../assets/icons/red.svg";

export default function MessageScreenHeader({
  userId,
  name,
  photoURL,
  verificationType,
  onBack,
}) {
  const navigation = useNavigation();
  const isDark = useColorScheme() === "dark";
  const displayName = name || "User";

  // Theme object
  const theme = {
    background: isDark ? "#121212" : "#fff",
    card: isDark ? "#1e1e1e" : "#ffffff",
    text: isDark ? "#e0e0e0" : "#000",
    textSecondary: isDark ? "#b0b0b0" : "#666",
    primary: isDark ? "#00ff7f" : "#017a6b",
    border: isDark ? "#333" : "#e0e6ed",
    accent: isDark ? "#ffcc00" : "#ff9500",
    danger: "#ff3b30",
    success: "#34c759",
  };

  const avatarUri = photoURL
    ? { uri: photoURL }
    : {
        uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0df9a0&color=fff&bold=true&size=256`,
      };

  const [menuVisible, setMenuVisible] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [unblockModalVisible, setUnblockModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState("Spam");
  const [reportDetails, setReportDetails] = useState("");
  const [isCurrentlyBlocked, setIsCurrentlyBlocked] = useState(false);

  const currentUserId = auth.currentUser?.uid;

  // Real-time blocked check
  useEffect(() => {
    if (!currentUserId || !userId) return;

    const userRef = doc(db, "users", currentUserId);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const blocked = snap.data().blocked || [];
        setIsCurrentlyBlocked(blocked.includes(userId));
      } else {
        setIsCurrentlyBlocked(false);
      }
    });

    return unsub;
  }, [currentUserId, userId]);

  // Badge component
  const VerificationBadge = () => {
    if (!verificationType) return null;
    const badgeStyle = { marginLeft: 8, alignSelf: "center" };
    if (verificationType === "vendor") return <YellowBadge width={22} height={22} style={badgeStyle} />;
    if (verificationType === "studentLandlord") return <BlueBadge width={22} height={22} style={badgeStyle} />;
    if (verificationType === "realEstate") return <RedBadge width={22} height={22} style={badgeStyle} />;
    return null;
  };

  // Block user
  const handleBlockUser = async () => {
    setBlockModalVisible(false);
    setMenuVisible(false);

    try {
      if (!currentUserId) throw new Error("Not logged in");
      if (!userId) throw new Error("No user to block");
      if (currentUserId === userId) throw new Error("Cannot block yourself");

      await updateDoc(doc(db, "users", currentUserId), {
        blocked: arrayUnion(userId),
      });

      Alert.alert(
        "Blocked",
        `${displayName} has been blocked. You won't see their messages or listings anymore.`,
        [{ text: "OK" }]
      );

      navigation.goBack();
    } catch (error) {
      console.error("Block error:", error);
      Alert.alert("Error", error.message || "Failed to block user");
    }
  };

  // Unblock user
  const handleUnblockUser = async () => {
    setUnblockModalVisible(false);
    setMenuVisible(false);

    try {
      if (!currentUserId) throw new Error("Not logged in");
      if (!userId) throw new Error("No user to unblock");

      await updateDoc(doc(db, "users", currentUserId), {
        blocked: arrayRemove(userId),
      });

      Alert.alert(
        "Unblocked",
        `${displayName} has been unblocked. You can now message them again.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Unblock error:", error);
      Alert.alert("Error", error.message || "Failed to unblock user");
    }
  };

  // Submit report (no screenshot)
  const handleReportUser = async () => {
    setReportModalVisible(false);
    setMenuVisible(false);

    if (!reportReason.trim()) {
      Alert.alert("Error", "Please select or enter a reason");
      return;
    }

    try {
      if (!currentUserId) throw new Error("Not logged in");
      if (!userId) throw new Error("No user to report");

      await addDoc(collection(db, "reports"), {
        reporterId: currentUserId,
        reportedUserId: userId,
        reportedName: displayName,
        reason: reportReason.trim(),
        details: reportDetails.trim() || null,
        timestamp: serverTimestamp(),
        status: "pending",
      });

      Alert.alert(
        "Report Submitted",
        `Thank you for reporting ${displayName}. Our team will review this soon and take action if needed.`,
        [{ text: "OK" }]
      );

      // Reset form
      setReportReason("Spam");
      setReportDetails("");
    } catch (error) {
      console.error("Report error:", error);
      Alert.alert("Error", error.message || "Failed to submit report. Try again.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
        translucent={false}
      />

      <TouchableOpacity
        onPress={onBack || (() => navigation.goBack())}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={26} color={theme.text} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.profileContainer}
        onPress={() => userId && navigation.navigate("Profile", { userId })}
      >
        <Image source={avatarUri} style={styles.avatar} resizeMode="cover" />
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.text }]}>
              {displayName}
            </Text>
            <VerificationBadge />
          </View>
          <Text style={[styles.status, { color: theme.textSecondary }]}>
            Tap to view profile
          </Text>
        </View>
      </TouchableOpacity>

      {/* 3-dot menu */}
      <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
        <Ionicons name="ellipsis-vertical" size={24} color={theme.text} />
      </TouchableOpacity>

      {/* 3-dot menu popup */}
      <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menuContainer, { backgroundColor: isDark ? "#222" : "#fff" }]}>
            {/* Dynamic Block/Unblock */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                if (isCurrentlyBlocked) {
                  setUnblockModalVisible(true);
                } else {
                  setBlockModalVisible(true);
                }
              }}
            >
              <Ionicons
                name={isCurrentlyBlocked ? "lock-open-outline" : "ban-outline"}
                size={20}
                color={isCurrentlyBlocked ? theme.success : theme.danger}
              />
              <Text style={[styles.menuText, { color: isCurrentlyBlocked ? theme.success : theme.danger }]}>
                {isCurrentlyBlocked ? "Unblock User" : "Block User"}
              </Text>
            </TouchableOpacity>

            {/* Report User */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                setReportModalVisible(true);
              }}
            >
              <Ionicons name="flag-outline" size={20} color={theme.accent} />
              <Text style={[styles.menuText, { color: theme.accent }]}>Report User</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Block Confirmation */}
      <Modal transparent visible={blockModalVisible} animationType="fade" onRequestClose={() => setBlockModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmModal, { backgroundColor: theme.card }]}>
            <Text style={[styles.confirmTitle, { color: theme.text }]}>Block {displayName}?</Text>
            <Text style={[styles.confirmText, { color: theme.textSecondary }]}>
              They won't be able to message you, see your listings, or appear in your feed. You won't see theirs either.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setBlockModalVisible(false)}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBlock} onPress={handleBlockUser}>
                <Text style={styles.confirmBlockText}>Block</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Unblock Confirmation */}
      <Modal transparent visible={unblockModalVisible} animationType="fade" onRequestClose={() => setUnblockModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmModal, { backgroundColor: theme.card }]}>
            <Text style={[styles.confirmTitle, { color: theme.text }]}>Unblock {displayName}?</Text>
            <Text style={[styles.confirmText, { color: theme.textSecondary }]}>
              You will be able to message them again and see their listings.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setUnblockModalVisible(false)}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmUnblock} onPress={handleUnblockUser}>
                <Text style={styles.confirmUnblockText}>Unblock</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Modal – simplified (no screenshot) */}
      <Modal transparent visible={reportModalVisible} animationType="fade" onRequestClose={() => setReportModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmModal, { backgroundColor: theme.card }]}>
            <Text style={[styles.confirmTitle, { color: theme.text }]}>Report {displayName}?</Text>
            <Text style={[styles.confirmText, { color: theme.textSecondary }]}>
              Select a reason and add details if needed.
            </Text>

            {/* Reason Picker */}
            <View style={{ width: "100%", marginVertical: 16 }}>
              <Text style={{ color: theme.textSecondary, marginBottom: 8 }}>Reason</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {["Spam", "Harassment", "Fake account", "Other"].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.reasonChip,
                      {
                        backgroundColor: reportReason === opt ? theme.accent : isDark ? "#333" : "#f0f0f0",
                        borderColor: reportReason === opt ? theme.accent : theme.border,
                      },
                    ]}
                    onPress={() => setReportReason(opt)}
                  >
                    <Text style={{ color: reportReason === opt ? "#000" : theme.text }}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Details Input */}
            <TextInput
              style={{
                width: "100%",
                minHeight: 80,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                backgroundColor: isDark ? "#333" : "#f9f9f9",
                color: theme.text,
                textAlignVertical: "top",
              }}
              multiline
              placeholder="Additional details (optional)"
              placeholderTextColor={theme.textSecondary}
              value={reportDetails}
              onChangeText={setReportDetails}
            />

            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setReportModalVisible(false)}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmReport} onPress={handleReportUser}>
                <Text style={styles.confirmReportText}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    height: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  backButton: { padding: 6, marginRight: 6 },
  profileContainer: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: "#111" },
  infoContainer: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 17, fontWeight: "600" },
  status: { fontSize: 13, marginTop: 1 },
  menuButton: { padding: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    width: 200,
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: { fontSize: 16, marginLeft: 12 },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 12,
  },
  confirmModal: {
    width: "85%",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  confirmTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  confirmText: { fontSize: 16, textAlign: "center", marginBottom: 24 },
  confirmButtons: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  confirmCancel: {
    flex: 1,
    paddingVertical: 14,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: "#333",
    alignItems: "center",
  },
  confirmCancelText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  confirmBlock: {
    flex: 1,
    paddingVertical: 14,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: "#ff3b30",
    alignItems: "center",
  },
  confirmBlockText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  confirmUnblock: {
    flex: 1,
    paddingVertical: 14,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: "#34c759",
    alignItems: "center",
  },
  confirmUnblockText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  confirmReport: {
    flex: 1,
    paddingVertical: 14,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: "#ff9500",
    alignItems: "center",
  },
  confirmReportText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  reasonChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#444",
    marginRight: 8,
  },
});