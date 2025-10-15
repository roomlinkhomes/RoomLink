// ListingDetails.jsx
import React, { useContext, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  TextInput,
  Keyboard,
  Modal,
  Platform,
  useColorScheme,
  KeyboardAvoidingView,
  SafeAreaView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { UserContext } from "../context/UserContext";
import Avatar from "../component/avatar";
import * as ImagePicker from "expo-image-picker";
import { timeAgo } from "../utils/timeAgo";

const { width, height } = Dimensions.get("window");

export default function ListingDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { listing } = route.params || {};
  const { user, getUserById, getListingComments, postListingComment } = useContext(UserContext);

  const [poster, setPoster] = useState({ name: "Unknown", avatar: null });
  const [comments, setComments] = useState([]);
  const [bookmarked, setBookmarked] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyToUser, setReplyToUser] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [attachedImage, setAttachedImage] = useState(null);

  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerUri, setImageViewerUri] = useState(null);

  const [mainImageIndex, setMainImageIndex] = useState(0);
  const mainScrollRef = useRef(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const bgColor = isDark ? "#121212" : "#fff";
  const textColor = isDark ? "#fff" : "#000";
  const secondaryText = isDark ? "#aaa" : "#555";
  const borderColor = isDark ? "#333" : "#eee";
  const starColor = isDark ? "#fff" : "#000";
  const shieldBg = isDark ? "#222" : "#eee"; // adaptive shield color
  const commentCloseColor = isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.45)"; // lighter X for comment modal
  const viewerCloseColor = "#fff"; // always white for image viewer so it's visible on dark overlay

  useEffect(() => {
    (async () => {
      if (!listing?.posterId) return;
      try {
        const data = await getUserById?.(listing.posterId);
        setPoster({ name: data?.name || "Unknown", avatar: data?.profileImage });
      } catch {}
    })();
  }, [listing]);

  useEffect(() => {
    (async () => {
      try {
        const data = (await getListingComments?.(listing?.id)) || [];
        const normalized = data.map((c) => ({ ...(c || {}), replies: c?.replies || [] }));

        // Sort: most replies first, then newest
        normalized.sort((a, b) => {
          const repliesDiff = (b.replies?.length || 0) - (a.replies?.length || 0);
          if (repliesDiff !== 0) return repliesDiff;
          // fallback to newest first
          return new Date(b.date) - new Date(a.date);
        });

        setComments(normalized);
      } catch {
        setComments([]);
      }
    })();
  }, [listing]);

  const toggleRepliesVisibility = (id) => {
    setExpandedComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const pickCommentImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      if (!res.canceled) {
        setAttachedImage(res.assets[0].uri);
      }
    } catch (err) {
      console.log("pick image err", err);
    }
  };

  const addReplyRecursive = (items, targetId, replyObj) =>
    items.map((item) => {
      if (item.id === targetId) return { ...item, replies: [replyObj, ...(item.replies || [])] };
      else if (item.replies?.length) return { ...item, replies: addReplyRecursive(item.replies, targetId, replyObj) };
      return item;
    });

  const handleSendComment = async () => {
    const text = (newComment || "").trim();
    if (!text && !attachedImage) return;

    const commentData = {
      id: Date.now().toString(),
      userId: user?.id,
      userName: user?.name || "You",
      userAvatar: user?.profileImage || null,
      text,
      date: new Date().toISOString(),
      replies: [],
      replyToUser,
      image: attachedImage || null,
    };

    if (replyTo) {
      setComments((prev) => addReplyRecursive(prev, replyTo, commentData));
    } else {
      setComments((prev) => [commentData, ...prev]);
    }

    try {
      await postListingComment?.(listing?.id, commentData);
    } catch {}

    setNewComment("");
    setReplyTo(null);
    setReplyToUser(null);
    setAttachedImage(null);
    Keyboard.dismiss();
  };

  const onStartReply = (targetId, username) => {
    setReplyTo(targetId);
    setReplyToUser(username);
    if (!showCommentModal) setShowCommentModal(true);
  };

  const averageRating = comments.length
    ? comments.reduce((sum, c) => sum + (c.rating || 0), 0) / comments.length
    : 0;

  const openImageViewer = (uri) => {
    setImageViewerUri(uri);
    setImageViewerVisible(true);
  };

  const renderReplies = (replies, level = 1) => {
    if (!replies || replies.length === 0) return null;
    return replies.map((r) => (
      <View key={r.id} style={{ marginLeft: level * 18, marginTop: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View style={{ width: 2, backgroundColor: "#ccc", marginRight: 8, marginTop: 4 }} />
          {/* clickable replied person's avatar */}
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Profile", {
                vendor: { id: r.userId, name: r.userName, avatar: r.userAvatar },
              })
            }
          >
            <Avatar uri={r.userAvatar} size={30} />
          </TouchableOpacity>
          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text style={{ fontWeight: "600", color: textColor, flexWrap: "wrap" }}>
              {r.userName} {r.replyToUser ? `(replied to ${r.replyToUser})` : ""}
            </Text>
            {r.text && <Text style={{ color: secondaryText, marginTop: 4, flexWrap: "wrap" }}>{r.text}</Text>}
            {r.image && (
              <TouchableOpacity onPress={() => openImageViewer(r.image)}>
                <Image source={{ uri: r.image }} style={{ width: 120, height: 120, borderRadius: 10, marginTop: 6 }} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => onStartReply(r.id, r.userName)} style={{ marginTop: 4 }}>
              <Text style={{ color: "#036DD6", fontSize: 12 }}>Reply</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 11, color: "#999" }}>{timeAgo(r.date)}</Text>
        </View>
        {r.replies && r.replies.length > 0 && renderReplies(r.replies, level + 1)}
      </View>
    ));
  };

  const onMainMomentumScroll = (e) => {
    const x = e.nativeEvent.contentOffset.x || 0;
    const idx = Math.round(x / width);
    setMainImageIndex(idx);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
        {/* Image area */}
        <View style={styles.imageWrapper}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMainMomentumScroll}
            ref={mainScrollRef}
          >
            {(listing?.images || []).map((img, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.95}
                onPress={() => navigation.navigate("GalleryScreen", { images: listing?.images, startIndex: idx })}
              >
                <Image source={{ uri: img }} style={styles.image} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* image counter overlay */}
          {(listing?.images?.length || 0) > 1 && (
            <View style={styles.imageCounterContainer}>
              <Text style={styles.imageCounterText}>
                {mainImageIndex + 1} / {listing.images.length}
              </Text>
            </View>
          )}
        </View>

        {/* Details */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Text style={[styles.title, { color: textColor }]}>{listing?.title || "No title"}</Text>
          {listing?.price && <Text style={styles.price}>{`₦${Number(listing.price).toLocaleString()}`}</Text>}
          {listing?.category && (
            <Text style={[styles.category, { color: secondaryText }]}>Category: {listing.category}</Text>
          )}
          {listing?.description && (
            <Text style={[styles.description, { color: secondaryText }]}>{listing.description}</Text>
          )}
        </View>

        {/* Poster — only avatar clickable now */}
        <View style={[styles.vendorBox, { borderColor }]}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Profile", {
                vendor: { id: listing?.posterId, name: poster.name, avatar: poster.avatar },
              })
            }
          >
            <Avatar uri={poster.avatar} size={50} />
          </TouchableOpacity>
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.vendorName, { color: textColor }]}>{poster.name}</Text>
            <Text style={{ color: secondaryText }}>Tap profile image to view</Text>
          </View>
        </View>

        {/* Inline stats */}
        <View style={[styles.inlineStats, { paddingHorizontal: 16, justifyContent: "space-between" }]}>
          {/* Left: comments */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="chatbubble-outline" size={16} color={textColor} style={{ marginRight: 6 }} />
            <Text style={{ color: textColor }}>{comments.length} Comments</Text>
          </View>

          {/* Right: rating number + 3 stars */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontWeight: "600", marginRight: 6, color: textColor }}>{averageRating.toFixed(1)}</Text>
            {[...Array(3)].map((_, i) => (
              <Ionicons key={i} name="star" size={16} color={starColor} style={{ marginRight: 3 }} />
            ))}
          </View>
        </View>

        {/* Comment preview */}
        <View style={{ paddingHorizontal: 16 }}>
          {comments.slice(0, 2).map((c) => (
            <View key={c.id} style={{ marginBottom: 10 }}>
              <View style={styles.commentShield}>
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("Profile", {
                        vendor: { id: c.userId, name: c.userName, avatar: c.userAvatar },
                      })
                    }
                  >
                    <Avatar uri={c.userAvatar} size={36} />
                  </TouchableOpacity>
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={{ fontWeight: "600", color: textColor }}>{c.userName}</Text>
                    {c.text && <Text style={{ color: secondaryText, marginTop: 4 }}>{c.text}</Text>}
                    {c.image && (
                      <TouchableOpacity onPress={() => openImageViewer(c.image)}>
                        <Image source={{ uri: c.image }} style={{ width: 120, height: 120, borderRadius: 10, marginTop: 6 }} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={{ fontSize: 12, color: "#999" }}>{timeAgo(c.date)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Action row (shields + remove bookmark) */}
        <View style={[styles.actionRow, { borderColor }]}>
          {/* Rating pill */}
          <TouchableOpacity
            onPress={() => navigation.navigate("RatingScreen", { listingId: listing?.id })}
            activeOpacity={0.8}
          >
            <View style={[styles.shieldPill, { backgroundColor: shieldBg }]}>
              <Ionicons name="star" size={20} color={textColor} style={{ marginRight: 8 }} />
              <Text style={[styles.actionLabel, { color: textColor }]}>Rating</Text>
            </View>
          </TouchableOpacity>

          {/* Comment pill */}
          <TouchableOpacity onPress={() => setShowCommentModal(true)} activeOpacity={0.8}>
            <View style={[styles.shieldPill, { backgroundColor: shieldBg }]}>
              <Ionicons name="chatbubble-outline" size={20} color={textColor} style={{ marginRight: 8 }} />
              <Text style={[styles.actionLabel, { color: textColor }]}>Comment</Text>
            </View>
          </TouchableOpacity>

          {/* Report pill */}
          <TouchableOpacity onPress={() => navigation.navigate("ReportScreen", { listingId: listing?.id })} activeOpacity={0.8}>
            <View style={[styles.shieldPill, { backgroundColor: shieldBg }]}>
              <Ionicons name="flag-outline" size={20} color="#e74c3c" style={{ marginRight: 8 }} />
              <Text style={[styles.actionLabel, { color: "#e74c3c" }]}>Report</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* COMMENT MODAL */}
      <Modal visible={showCommentModal} transparent animationType="slide">
        <TouchableOpacity
          activeOpacity={1}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={() => setShowCommentModal(false)}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
          style={[
            styles.commentModalContainer,
            {
              backgroundColor: bgColor,
              borderTopColor: borderColor,
              height: height * 0.6,
            },
          ]}
        >
          <View style={styles.commentHeader}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Comments</Text>
            <TouchableOpacity onPress={() => setShowCommentModal(false)} style={{ padding: 6 }}>
              <Ionicons name="close" size={26} color={commentCloseColor} />
            </TouchableOpacity>
          </View>

          <KeyboardAwareScrollView
            enableOnAndroid
            extraScrollHeight={Platform.OS === "ios" ? 80 : 60}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10 }}
            showsVerticalScrollIndicator={false}
          >
            {comments.length === 0 ? (
              <View style={{ paddingVertical: 12 }}>
                <Text style={{ color: secondaryText }}>No comments yet. Be the first to comment.</Text>
              </View>
            ) : (
              comments.map((c) => (
                <View key={c.id} style={styles.commentShield}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("Profile", {
                          vendor: { id: c.userId, name: c.userName, avatar: c.userAvatar },
                        })
                      }
                    >
                      <Avatar uri={c.userAvatar} size={36} />
                    </TouchableOpacity>
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={{ fontWeight: "600", color: textColor }}>{c.userName}</Text>
                      {c.text && <Text style={{ color: secondaryText, marginTop: 4 }}>{c.text}</Text>}
                      {c.image && (
                        <TouchableOpacity onPress={() => openImageViewer(c.image)}>
                          <Image source={{ uri: c.image }} style={{ width: 120, height: 120, borderRadius: 10, marginTop: 6 }} />
                        </TouchableOpacity>
                      )}
                      {c.replies?.length > 0 && (
                        <TouchableOpacity onPress={() => toggleRepliesVisibility(c.id)} style={{ marginTop: 8 }}>
                          <Text style={{ color: "#036DD6", fontSize: 13 }}>
                            {expandedComments[c.id] ? "Hide replies" : `View ${c.replies.length} replies`}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {expandedComments[c.id] && renderReplies(c.replies)}
                    </View>
                    <Text style={{ fontSize: 11, color: "#999" }}>{timeAgo(c.date)}</Text>
                  </View>

                  <View style={{ flexDirection: "row", marginTop: 8, marginLeft: 46 }}>
                    <TouchableOpacity onPress={() => onStartReply(c.id, c.userName)}>
                      <Text style={{ color: "#036DD6", fontSize: 12 }}>Reply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </KeyboardAwareScrollView>

          {/* Comment Input */}
          <View style={[styles.commentInputRow, { borderColor }]}>
            <TouchableOpacity onPress={pickCommentImage} style={{ marginRight: 8 }}>
              <Ionicons name="image-outline" size={22} color="#1A237E" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              {replyToUser && (
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: "#036DD6" }}>Replying to {replyToUser}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setReplyTo(null);
                      setReplyToUser(null);
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    <Text style={{ fontSize: 12, color: "#999" }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
              {attachedImage && (
                <View style={{ marginBottom: 6, flexDirection: "row", alignItems: "center" }}>
                  <Image source={{ uri: attachedImage }} style={{ width: 70, height: 70, borderRadius: 8 }} />
                  <TouchableOpacity
                    onPress={() => setAttachedImage(null)}
                    style={{ marginLeft: 8, padding: 6 }}
                  >
                    <Ionicons name="close" size={18} color={secondaryText} />
                  </TouchableOpacity>
                </View>
              )}
              <TextInput
                style={[
                  styles.commentInput,
                  {
                    color: textColor,
                    backgroundColor: isDark ? "#1E1E1E" : "#f0f0f0",
                  },
                ]}
                placeholder={replyToUser ? `Replying to ${replyToUser}...` : "Write a comment..."}
                placeholderTextColor={secondaryText}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                scrollEnabled={false}
                textAlignVertical="top"
              />
            </View>
            <TouchableOpacity onPress={handleSendComment} style={{ marginLeft: 8 }}>
              <Ionicons name="send" size={22} color={newComment.trim() || attachedImage ? "#036dd6" : "#ccc"} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Image viewer modal (popup with zoom support using ScrollView zoom props) */}
      <Modal visible={imageViewerVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" }}>
          {/* tappable top area to close viewer (user requested) */}
          <TouchableOpacity
            style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", zIndex: 10 }}
            activeOpacity={1}
            onPress={() => setImageViewerVisible(false)}
          />

          {/* close icon always white and above the overlay */}
          <TouchableOpacity
            style={{ position: "absolute", top: Platform.OS === "ios" ? 50 : 30, right: 20, zIndex: 20 }}
            onPress={() => setImageViewerVisible(false)}
          >
            <Ionicons name="close" size={30} color={viewerCloseColor} />
          </TouchableOpacity>

          {/* ScrollView with zoom enabled (works natively on iOS; provides pinch/zoom experience where supported) */}
          <ScrollView
            style={{ width: "100%", height: "100%" }}
            contentContainerStyle={{ flex: 1, justifyContent: "center", alignItems: "center" }}
            maximumZoomScale={3}
            minimumZoomScale={1}
            pinchGestureEnabled
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            {imageViewerUri && (
              <Image
                source={{ uri: imageViewerUri }}
                style={{ width: width, height: height * 0.75, resizeMode: "contain" }}
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageWrapper: {
    width,
    height: height * 0.5,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  image: { width, height: height * 0.5, resizeMode: "cover" },
  imageCounterContainer: {
    position: "absolute",
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "bold" },
  price: { fontSize: 18, fontWeight: "700", color: "#036dd6", marginTop: 4 },
  category: { fontSize: 14, marginTop: 6 },
  description: { fontSize: 15, marginTop: 8, lineHeight: 20 },
  vendorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginTop: 8,
  },
  vendorName: { fontSize: 16, fontWeight: "bold" },
  actionRow: { flexDirection: "row", justifyContent: "space-around", borderTopWidth: 1, paddingVertical: 14 },
  actionButton: { alignItems: "center" },
  actionLabel: { fontSize: 14 },
  inlineStats: { flexDirection: "row", alignItems: "center", marginVertical: 12 },
  commentModalContainer: {
    height: height * 0.6,
    borderTopWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  commentShield: { flexDirection: "column", marginVertical: 4, padding: 10, borderRadius: 12 },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderTopWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "ios" ? 65 : 45,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 220,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
  },
  shieldPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    minWidth: 100,
    justifyContent: "center",
    gap: 6,
  },
});
