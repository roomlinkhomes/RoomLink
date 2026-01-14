// components/ConversationHeader.jsx
import React, { useState, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Modal,
  TextInput,
  FlatList,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Text,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useMessageCount } from "../context/MessageProvider";

export default function ConversationHeader() {
  const navigation = useNavigation();
  const isDark = useColorScheme() === "dark";
  const { conversations = [], archivedCount = 0, archivedConversations = [] } = useMessageCount();

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [archivedVisible, setArchivedVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  const openSearch = () => {
    setSearchVisible(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeSearch = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 220,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setSearchVisible(false);
      setSearchQuery("");
    });
  };

  // Search filtering logic (memoized)
  const filteredConversations = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const nameParts = (c.otherUserName || "").toLowerCase().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      const lastMessage = (c.lastMessage || "").toLowerCase();

      const messageMatch = (c.messages || []).some((msg) => {
        const msgText = typeof msg === "string" ? msg : msg.text || "";
        return msgText.toLowerCase().includes(lowerQuery);
      });

      return (
        firstName.includes(lowerQuery) ||
        lastName.includes(lowerQuery) ||
        (c.otherUserName || "").toLowerCase().includes(lowerQuery) ||
        lastMessage.includes(lowerQuery) ||
        messageMatch
      );
    });
  }, [searchQuery, conversations]);

  // Render archived item
  const renderArchivedItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.archivedItem, { borderBottomColor: isDark ? "#333" : "#eee" }]}
      onPress={() => {
        setArchivedVisible(false);
        navigation.navigate("Message", {
          listingId: item.listingId,
          otherUserId: item.otherUserId,
        });
      }}
    >
      <Text style={[styles.archivedName, { color: isDark ? "#fff" : "#000" }]}>
        {item.otherUserName || "Unknown User"}
      </Text>
      <Text style={[styles.archivedMessage, { color: isDark ? "#888" : "#666" }]}>
        {item.lastMessage || "No message"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      {/* Main Header */}
      <View style={[styles.container, { backgroundColor: isDark ? "#1e1e1e" : "#ffffff" }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={openSearch}>
          <Ionicons name="search" size={19} color={isDark ? "#fff" : "#000"} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} onPress={() => setSettingsVisible(true)}>
          <Ionicons name="settings-outline" size={19} color={isDark ? "#fff" : "#000"} />
        </TouchableOpacity>
      </View>

      {/* Settings Modal */}
      <Modal visible={settingsVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={() => setSettingsVisible(false)}>
          <View style={styles.settingsOverlay}>
            <View style={[styles.settingsContent, { backgroundColor: isDark ? "#111" : "#fff" }]}>
              <View style={[styles.handle, { backgroundColor: isDark ? "#666" : "#ccc" }]} />

              <TouchableOpacity
                style={styles.settingsItem}
                onPress={() => {
                  setSettingsVisible(false);
                  setArchivedVisible(true);
                }}
              >
                <Ionicons name="archive-outline" size={22} color={isDark ? "#fff" : "#000"} />
                <Text style={[styles.archivedLabel, { color: isDark ? "#fff" : "#000" }]}>Archived</Text>
                {archivedCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: isDark ? "#333" : "#eee" }]}>
                    <Text style={[styles.badgeText, { color: isDark ? "#fff" : "#000" }]}>{archivedCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Archived Chats Modal */}
      <Modal visible={archivedVisible} animationType="slide" transparent>
        <View style={styles.archivedOverlay}>
          <View style={[styles.archivedContent, { backgroundColor: isDark ? "#111" : "#fff" }]}>
            <View style={styles.archivedHeader}>
              <Text style={[styles.archivedTitle, { color: isDark ? "#fff" : "#000" }]}>Archived Chats</Text>
              <TouchableOpacity onPress={() => setArchivedVisible(false)} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                <Ionicons name="close" size={26} color={isDark ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={archivedConversations}
              renderItem={renderArchivedItem}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              ListEmptyComponent={
                <Text
                  style={{
                    color: isDark ? "#888" : "#666",
                    textAlign: "center",
                    marginTop: 40,
                    fontSize: 16,
                  }}
                >
                  No archived chats
                </Text>
              }
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Full Screen Search Modal */}
      <Modal visible={searchVisible} animationType="none" transparent statusBarTranslucent>
        <Animated.View
          style={[
            styles.searchModalContainer,
            {
              backgroundColor: isDark ? "#000" : "#f8f8f8",
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [Platform.OS === "ios" ? -100 : -50, 0],
                  }),
                },
              ],
              opacity: slideAnim,
            },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{ flex: 1 }}>
                {/* Search Header */}
                <View style={[styles.searchHeader, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}>
                  <TouchableOpacity
                    onPress={closeSearch}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    style={styles.backBtn}
                  >
                    <Ionicons name="arrow-back" size={26} color={isDark ? "#fff" : "#000"} />
                  </TouchableOpacity>

                  <TextInput
                    style={[
                      styles.fullSearchInput,
                      {
                        backgroundColor: isDark ? "#222" : "#fff",
                        color: isDark ? "#fff" : "#000",
                        borderColor: isDark ? "#444" : "#ddd",
                      },
                    ]}
                    placeholder="Search messages and contacts..."
                    placeholderTextColor={isDark ? "#888" : "#999"}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                    returnKeyType="search"
                    autoCorrect={false}
                    autoCapitalize="none"
                  />

                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery("")}
                      style={styles.clearBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close-circle" size={24} color="#888" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Search Results */}
                <View style={styles.resultsContainer}>
                  {searchQuery ? (
                    filteredConversations.length > 0 ? (
                      <FlatList
                        data={filteredConversations}
                        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={[
                              styles.searchResultItem,
                              { backgroundColor: isDark ? "#222" : "#fff" },
                            ]}
                            onPress={() => {
                              navigation.navigate("Message", {
                                listingId: item.listingId,
                                otherUserId: item.otherUserId,
                              });
                              closeSearch();
                            }}
                          >
                            <Text style={[styles.searchResultName, { color: isDark ? "#fff" : "#000" }]}>
                              {item.otherUserName || "Unknown"}
                            </Text>
                            <Text
                              style={[styles.searchResultMessage, { color: isDark ? "#888" : "#666" }]}
                              numberOfLines={1}
                            >
                              {item.lastMessage || "No messages"}
                            </Text>
                          </TouchableOpacity>
                        )}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                      />
                    ) : (
                      <View style={styles.noResults}>
                        <Ionicons name="search-outline" size={48} color={isDark ? "#666" : "#999"} />
                        <Text style={[styles.noResultsText, { color: isDark ? "#888" : "#666" }]}>
                          No results found
                        </Text>
                        <Text style={[styles.noResultsSubtext, { color: isDark ? "#666" : "#999" }]}>
                          Try different keywords
                        </Text>
                      </View>
                    )
                  ) : (
                    <View style={styles.searchHint}>
                      <Ionicons name="search" size={64} color={isDark ? "#666" : "#999"} />
                      <Text style={[styles.searchHintTitle, { color: isDark ? "#fff" : "#000" }]}>
                        Search conversations
                      </Text>
                      <Text style={[styles.searchHintText, { color: isDark ? "#888" : "#666" }]}>
                        Search by name or message content
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Header Container
  container: {
    height: 60, // ← Fixed from 6
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },

  // Full Screen Search Modal
  searchModalContainer: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingTop: Platform.OS === "ios" ? 80 : 50,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  backBtn: {
    padding: 8,
    marginRight: 6,
  },
  fullSearchInput: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  clearBtn: {
    padding: 8,
    marginLeft: -12,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchResultItem: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: "transparent",
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  searchResultMessage: {
    fontSize: 14,
  },
  noResults: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
  },
  searchHint: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  searchHintTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  searchHintText: {
    fontSize: 16,
    textAlign: "center",
    maxWidth: 280,
  },

  // Settings Modal
  settingsOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  settingsContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "60%",
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 20,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  archivedLabel: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Archived Modal
  archivedOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  archivedContent: {
    height: "80%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  archivedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  archivedTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  archivedItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  archivedName: {
    fontSize: 16,
    fontWeight: "600",
  },
  archivedMessage: {
    fontSize: 14,
    marginTop: 4,
  },
});