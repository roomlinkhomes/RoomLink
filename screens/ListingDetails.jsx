// screens/ListingDetails.jsx — FIXED: CTA styled + replyToCommentId for Cloud Functions notifications
import React, { useContext, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  Keyboard,
  Modal,
  useColorScheme,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { UserContext } from "../context/UserContext";
import Avatar from "../component/avatar";
import * as ImagePicker from "expo-image-picker";
import { timeAgo } from "../utils/timeAgo";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useFocusEffect } from "@react-navigation/native";

// SVG Badges
import BlueBadge from "../assets/icons/blue.svg";
import YellowBadge from "../assets/icons/yellow.svg";
import RedBadge from "../assets/icons/red.svg";

const { width, height } = Dimensions.get("window");

const safeCategory = (cat) => {
  if (!cat) return "Not specified";
  if (typeof cat === "string") return cat;
  return cat?.name || "Not specified";
};

const useRecordView = (listingId, ownerId) => {
  const { user: currentUser } = useContext(UserContext);
  useFocusEffect(
    useCallback(() => {
      if (!currentUser || !listingId || currentUser.uid === ownerId) return;
      const record = async () => {
        try {
          const viewRef = doc(db, "listings", listingId, "views", currentUser.uid);
          await setDoc(viewRef, { timestamp: Date.now() }, { merge: true });
        } catch (e) {}
      };
      record();
    }, [currentUser?.uid, listingId, ownerId])
  );
};

const getImageUri = (img) => {
  if (!img) return "https://via.placeholder.com/400x300.png?text=No+Image";
  if (typeof img === "string") return img;
  if (img.uri) return img.uri;
  if (img._url) return img._url;
  if (img.url) return img.url;
  return "https://via.placeholder.com/400x300.png?text=Error";
};

const getFullName = (userData) => {
  if (!userData) return "User";
  if (userData.displayName?.trim()) return userData.displayName.trim();
  if (userData.firstName && userData.lastName)
    return `${userData.firstName.trim()} ${userData.lastName.trim()}`;
  if (userData.name?.trim()) return userData.name.trim();
  if (userData.username) return userData.username;
  return "User";
};

const VerificationBadge = ({ type }) => {
  if (!type) return null;
  const badgeStyle = { marginLeft: 8 };
  if (type === "vendor") return <YellowBadge width={24} height={24} style={badgeStyle} />;
  if (type === "studentLandlord") return <BlueBadge width={24} height={24} style={badgeStyle} />;
  if (type === "realEstate") return <RedBadge width={24} height={24} style={badgeStyle} />;
  return null;
};

export default function ListingDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { listing } = route.params || {};
  const { user, getUserById } = useContext(UserContext);
  const posterId = listing?.userId || listing?.posterId || listing?.ownerId;

  useRecordView(listing?.id, posterId);

  const [poster, setPoster] = useState({
    name: "Loading...",
    avatar: null,
    verificationType: null,
    averageRating: 0,
    reviewCount: 0,
  });
  const [loadingSeller, setLoadingSeller] = useState(true);

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [userCache, setUserCache] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyToUser, setReplyToUser] = useState(null);
  const [replyToCommentId, setReplyToCommentId] = useState(null); // For Cloud Functions to detect replies
  const [attachedImage, setAttachedImage] = useState(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerUri, setImageViewerUri] = useState(null);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [sendStatus, setSendStatus] = useState("idle");

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const theme = {
    background: isDark ? "#121212" : "#fafafa",
    card: isDark ? "#1e1e1e" : "#ffffff",
    text: isDark ? "#e0e0e0" : "#212529",
    textSecondary: isDark ? "#b0b0b0" : "#666",
    primary: "#017a6b",
    success: "#00ff7f",
    danger: "#ef4444",
    border: isDark ? "#333" : "#e0e6ed",
    inputBg: isDark ? "#1e1e1e" : "#f8f8f8",
  };

  const bgColor = theme.background;
  const textColor = theme.text;
  const secondaryText = theme.textSecondary;
  const borderColor = theme.border;

  const getTotalCommentsCount = (comments) => {
    return comments.reduce((total, comment) => {
      return total + 1 + (comment.children?.length || 0);
    }, 0);
  };

  const rootComments = comments.filter((c) => !c.replyToCommentId); // Updated to use replyToCommentId

  const hasSellerRating = poster.averageRating > 0 || poster.reviewCount > 0;

  // Fetch poster with rating info
  useEffect(() => {
    if (!posterId) {
      setPoster({
        name: "User",
        avatar: null,
        verificationType: null,
        averageRating: 0,
        reviewCount: 0,
      });
      setLoadingSeller(false);
      return;
    }

    let isMounted = true;

    const fetchPoster = async () => {
      try {
        setLoadingSeller(true);

        let userData = await getUserById?.(posterId);
        if (!userData) {
          const snap = await getDoc(doc(db, "users", posterId));
          userData = snap.exists() ? snap.data() : null;
        }

        if (isMounted) {
          if (userData) {
            setPoster({
              name: getFullName(userData),
              avatar: userData.photoURL || userData.profileImage || userData.avatar || null,
              verificationType: userData.verificationType || null,
              averageRating: userData.averageRating || 0,
              reviewCount: userData.reviewCount || 0,
            });
          } else {
            setPoster({
              name: "User",
              avatar: null,
              verificationType: null,
              averageRating: 0,
              reviewCount: 0,
            });
          }
        }
      } catch (e) {
        console.error("Poster fetch failed:", e);
        if (isMounted) {
          setPoster({
            name: "User",
            avatar: null,
            verificationType: null,
            averageRating: 0,
            reviewCount: 0,
          });
        }
      } finally {
        if (isMounted) setLoadingSeller(false);
      }
    };

    fetchPoster();

    return () => {
      isMounted = false;
    };
  }, [posterId, getUserById]);

  // Comments fetching – updated to support replyToCommentId
  useEffect(() => {
    if (!listing?.id) return;

    setLoadingComments(true);

    const q = query(collection(db, "listings", listing.id, "comments"), orderBy("timestamp", "asc"));

    const unsub = onSnapshot(q, async (snap) => {
      try {
        if (snap.empty) {
          setComments([]);
          setLoadingComments(false);
          return;
        }

        const userIds = snap.docs.map((doc) => doc.data().userId).filter(Boolean);
        const uniqueUserIds = [...new Set(userIds)];
        const newUserCache = { ...userCache };
        const missingUserIds = uniqueUserIds.filter((id) => !userCache[id]);

        if (missingUserIds.length > 0) {
          const userPromises = missingUserIds.map((id) => getDoc(doc(db, "users", id)).catch(() => null));
          const userSnaps = await Promise.all(userPromises);
          userSnaps.forEach((userSnap, index) => {
            const userId = missingUserIds[index];
            if (userSnap?.exists()) {
              const userData = userSnap.data();
              newUserCache[userId] = {
                name: getFullName(userData),
                avatar: userData.photoURL || userData.profileImage || userData.avatar || null,
                verificationType: userData.verificationType || null,
              };
            }
          });
          setUserCache(newUserCache);
        }

        const commentMap = {};
        const roots = [];

        snap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const userId = data.userId;
          const cachedUser = newUserCache[userId] || userCache[userId];
          const comment = {
            id: docSnap.id,
            ...data,
            userName: cachedUser?.name || data.userName || "Anonymous",
            userAvatar: cachedUser?.avatar || data.userAvatar || null,
            verificationType: cachedUser?.verificationType || null,
            children: [],
          };
          commentMap[comment.id] = comment;

          if (data.replyToCommentId) {
            const parent = commentMap[data.replyToCommentId];
            if (parent) parent.children.push(comment);
            else roots.push(comment);
          } else {
            roots.push(comment);
          }
        });

        const sortByTime = (a, b) => (a.timestamp?.toDate() || 0) - (b.timestamp?.toDate() || 0);
        roots.sort(sortByTime);
        roots.forEach((root) => root.children.sort(sortByTime));

        setComments(roots);
      } catch (error) {
        console.error("Comments fetch error:", error);
      } finally {
        setLoadingComments(false);
      }
    });

    return () => unsub();
  }, [listing?.id]);

  const goToProfile = (userId) => {
    if (!userId) return;
    navigation.navigate("HomeTabs", { screen: "Profile", params: { userId } });
  };

  const toggleExpanded = (id) => {
    setExpandedComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const pickCommentImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!res.canceled) setAttachedImage(res.assets[0].uri);
  };

  const handleSendComment = async () => {
    const text = newComment.trim();
    if (!text && !attachedImage) return;
    setSendStatus("sending");

    try {
      const fullName = getFullName(user || {});
      const photoURL = user?.photoURL || user?.profileImage || user?.avatar || null;

      const commentData = {
        userId: user?.uid,
        userName: fullName,
        userAvatar: photoURL,
        text,
        image: attachedImage || null,
        timestamp: serverTimestamp(),
        replyToUser: replyToUser || null,
        replyToCommentId: replyToCommentId || null, // For Cloud Functions to detect replies
      };

      await addDoc(collection(db, "listings", listing.id, "comments"), commentData);

      // No client-side FCM – Cloud Function will handle notifications

      setNewComment("");
      setReplyToUser(null);
      setReplyToCommentId(null);
      setAttachedImage(null);
      Keyboard.dismiss();
      setSendStatus("success");
      setTimeout(() => setSendStatus("idle"), 2000);
    } catch (error) {
      console.error("Send failed:", error);
      Alert.alert("Error", "Failed to send comment. Try again.");
      setSendStatus("idle");
    }
  };

  const openImageViewer = (uri) => {
    setImageViewerUri(uri);
    setImageViewerVisible(true);
  };

  const onMainMomentumScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setMainImageIndex(idx);
  };

  const renderComment = (comment, depth = 0) => {
    const isExpanded = !!expandedComments[comment.id];
    const hasReplies = comment.children.length > 0;
    const avatarSize = depth === 0 ? 44 : 36;
    return (
      <View key={comment.id} style={[styles.commentContainer, { marginVertical: depth === 0 ? 16 : 12 }]}>
        <View style={styles.commentRow}>
          <TouchableOpacity onPress={() => goToProfile(comment.userId)}>
            <Avatar uri={comment.userAvatar} size={avatarSize} />
          </TouchableOpacity>
          <View style={styles.commentContent}>
            <View style={styles.commentHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={[styles.commentUser, { color: theme.text }]}>
                  {comment.userName}
                </Text>
                <VerificationBadge type={comment.verificationType} />
              </View>
              {comment.replyToUser && (
                <Text style={[styles.replyIndicator, { color: theme.primary }]}>
                  {" "}→ {comment.replyToUser}
                </Text>
              )}
            </View>
            {comment.text && (
              <Text style={[styles.commentText, { color: theme.textSecondary }]}>
                {comment.text}
              </Text>
            )}
            {comment.image && (
              <TouchableOpacity onPress={() => openImageViewer(getImageUri(comment.image))}>
                <Image source={{ uri: getImageUri(comment.image) }} style={styles.commentImage} />
              </TouchableOpacity>
            )}
            <View style={styles.commentFooter}>
              <Text style={[styles.commentTime, { color: theme.textSecondary }]}>
                {comment.timestamp ? timeAgo(comment.timestamp.toDate()) : "Just now"}
              </Text>
              <TouchableOpacity onPress={() => {
                setReplyToUser(comment.userName);
                setReplyToCommentId(comment.id);
              }}>
                <Text style={[styles.replyButton, { color: theme.primary }]}>Reply</Text>
              </TouchableOpacity>
              {depth === 0 && hasReplies && (
                <TouchableOpacity onPress={() => toggleExpanded(comment.id)}>
                  <View style={styles.repliesButton}>
                    <Text style={[styles.repliesText, { color: theme.primary }]}>
                      {isExpanded ? "Hide" : `${comment.children.length} ${comment.children.length === 1 ? "reply" : "replies"}`}
                    </Text>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={14}
                      color={theme.primary}
                    />
                  </View>
                </TouchableOpacity>
              )}
            </View>
            {isExpanded && comment.children.map((child) => renderComment(child, depth + 1))}
          </View>
        </View>
      </View>
    );
  };

  const renderSkeletonComments = () => (
    Array.from({ length: 5 }).map((_, index) => (
      <View key={`skeleton-${index}`} style={[styles.commentContainer, { marginVertical: 16 }]}>
        <View style={styles.commentRow}>
          <View style={styles.skeletonAvatar} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <View style={styles.skeletonLine1} />
            <View style={[styles.skeletonLine2, { marginTop: 8, width: "70%" }]} />
            <View style={[styles.skeletonLine3, { marginTop: 12, width: "50%" }]} />
          </View>
        </View>
      </View>
    ))
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.imageWrapper}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMainMomentumScroll}
          >
            {(listing?.images || []).map((img, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => navigation.navigate("GalleryScreen", { images: listing.images, startIndex: i })}
              >
                <Image source={{ uri: getImageUri(img) }} style={styles.image} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          {listing?.images?.length > 1 && (
            <View style={styles.imageCounterContainer}>
              <Text style={styles.imageCounterText}>{mainImageIndex + 1} / {listing.images.length}</Text>
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Text style={[styles.title, { color: textColor }]}>{listing?.title || "No title"}</Text>
          {listing?.price && <Text style={styles.price}>₦{Number(listing.price).toLocaleString()}</Text>}
          {listing?.category && (
            <Text style={[styles.category, { color: secondaryText }]}>
              Category: {safeCategory(listing.category)}
            </Text>
          )}
          {listing?.description && <Text style={[styles.description, { color: secondaryText }]}>{listing.description}</Text>}
        </View>

        {/* Seller section with real rating */}
        <TouchableOpacity
          onPress={() => goToProfile(posterId)}
          style={[styles.vendorBox, { borderColor }]}
        >
          <Avatar uri={poster.avatar} size={50} />

          <View style={{ marginLeft: 12, flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[styles.vendorName, { color: textColor }]}>{poster.name}</Text>
              <VerificationBadge type={poster.verificationType} />
            </View>

            {/* Tiny seller rating */}
            {loadingSeller ? (
              <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 6 }} />
            ) : hasSellerRating ? (
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={
                      s <= Math.floor(poster.averageRating || 0)
                        ? "star"
                        : s <= (poster.averageRating || 0)
                        ? "star-half"
                        : "star-outline"
                    }
                    size={13}
                    color={s <= (poster.averageRating || 0) ? "#FFA41C" : "#888"}
                    style={{ marginRight: 2 }}
                  />
                ))}
                <Text style={styles.ratingNumber}>
                  {poster.averageRating?.toFixed(1) || "0.0"}
                </Text>
                <Text style={styles.reviewCountText}>
                  • ({poster.reviewCount || 0})
                </Text>
              </View>
            ) : (
              <Text style={{ fontSize: 13, color: secondaryText, fontStyle: "italic", marginTop: 6 }}>
                No ratings yet
              </Text>
            )}

            <Text style={{ color: secondaryText }}>Tap to view profile</Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={secondaryText} />
        </TouchableOpacity>

        <View style={styles.inlineStats}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="chatbubble-outline" size={16} color={textColor} style={{ marginRight: 6 }} />
            <Text style={{ color: textColor }}>
              {loadingComments ? "Loading..." : `${getTotalCommentsCount(comments)} Comments`}
            </Text>
          </View>
        </View>

        {/* Comments Preview */}
        <View style={{ paddingHorizontal: 16 }}>
          {loadingComments ? (
            renderSkeletonComments()
          ) : rootComments.length === 0 ? (
            <View style={styles.noCommentsPreview}>
              <Ionicons name="chatbubble-outline" size={48} color={secondaryText} />
              <Text style={[styles.noCommentsText, { color: secondaryText }]}>
                No comments yet
              </Text>
            </View>
          ) : (
            rootComments.slice(0, 2).map((c) => (
              <View key={c.id} style={{ marginBottom: 16, flexDirection: "row", alignItems: "flex-start" }}>
                <TouchableOpacity onPress={() => goToProfile(c.userId)}>
                  <Avatar uri={c.userAvatar} size={40} />
                </TouchableOpacity>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontWeight: "600", color: textColor, fontSize: 15 }}>{c.userName}</Text>
                    <VerificationBadge type={c.verificationType} />
                  </View>
                  {c.text && <Text style={{ color: secondaryText, marginTop: 4, lineHeight: 20 }}>{c.text}</Text>}
                  <Text style={{ fontSize: 11, color: secondaryText, marginTop: 6 }}>
                    {c.timestamp ? timeAgo(c.timestamp.toDate()) : "Just now"}
                  </Text>
                  {c.children.length > 0 && (
                    <Text style={{ fontSize: 12, color: theme.primary, marginTop: 6, fontWeight: "500" }}>
                      View {c.children.length} {c.children.length === 1 ? "reply" : "replies"}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Fixed CTA row – Rating | Comment | Report – your requested style */}
        <View style={[styles.actionRowFixed, { borderTopColor: borderColor }]}>
          <TouchableOpacity
            style={styles.actionButtonFixed}
            onPress={() => {
              if (!posterId) {
                Alert.alert("Hold on", "Seller info is still loading, try again in a second.");
                return;
              }
              navigation.navigate("RatingScreen", { targetUserId: posterId });
            }}
          >
            <View style={styles.ctaPill}>
              <Ionicons name="star-outline" size={18} color="#888" />
              <Text style={styles.ctaText}>Rating</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButtonFixed} onPress={() => setShowCommentModal(true)}>
            <View style={styles.ctaPill}>
              <Ionicons name="chatbubble-outline" size={18} color="#888" />
              <Text style={styles.ctaText}>Comment</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButtonFixed}
            onPress={() => navigation.navigate("ReportScreen", { listingId: listing?.id, title: listing?.title })}
          >
            <View style={styles.ctaPill}>
              <Ionicons name="flag-outline" size={18} color="#888" />
              <Text style={styles.ctaText}>Report</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Full Comment Modal */}
      <Modal visible={showCommentModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShowCommentModal(false)} />
          <View style={[styles.modalContainerFixed, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <View style={styles.modalHeaderContent}>
                <Ionicons name="chatbubble-ellipses-outline" size={24} color={theme.primary} />
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Comments ({loadingComments ? "..." : getTotalCommentsCount(comments)})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowCommentModal(false)}>
                <Ionicons name="close-outline" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.commentsListContainerFixed}>
              <KeyboardAwareScrollView
                contentContainerStyle={styles.commentsListContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                enableOnAndroid={true}
                extraScrollHeight={20}
              >
                {loadingComments ? (
                  renderSkeletonComments()
                ) : comments.length === 0 ? (
                  <View style={styles.noCommentsContainer}>
                    <Ionicons name="chatbubble-outline" size={64} color={theme.textSecondary} />
                    <Text style={[styles.noCommentsTitle, { color: theme.textSecondary }]}>
                      No comments yet
                    </Text>
                    <Text style={[styles.noCommentsSubtitle, { color: theme.textSecondary }]}>
                      Be the first to comment on this listing!
                    </Text>
                  </View>
                ) : (
                  comments.map((comment) => renderComment(comment))
                )}
                <View style={{ height: 100 }} />
              </KeyboardAwareScrollView>
            </View>

            {/* Input section */}
            <View style={[styles.commentInputSectionFixed, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
              {sendStatus === "success" && (
                <View style={[styles.successMessage, { backgroundColor: `rgba(0,255,127,0.1)` }]}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                  <Text style={[styles.successText, { color: theme.success }]}>Comment added successfully!</Text>
                </View>
              )}
              {replyToUser && (
                <View style={[styles.replyIndicatorContainer, { backgroundColor: `rgba(1,122,107,0.1)` }]}>
                  <Ionicons name="arrow-undo" size={16} color={theme.primary} />
                  <Text style={[styles.replyIndicatorText, { color: theme.primary }]}>
                    Replying to {replyToUser}
                  </Text>
                  <TouchableOpacity onPress={() => {
                    setReplyToUser(null);
                    setReplyToCommentId(null);
                  }}>
                    <Ionicons name="close-outline" size={18} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
              {attachedImage && (
                <View style={styles.attachedImageContainer}>
                  <Image source={{ uri: attachedImage }} style={styles.attachedImage} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={() => setAttachedImage(null)}>
                    <Ionicons name="close-circle" size={24} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.commentInputWrapper}>
                <TouchableOpacity onPress={pickCommentImage} style={styles.imagePickerButton}>
                  <Ionicons name="image-outline" size={24} color={theme.primary} />
                </TouchableOpacity>
                <TextInput
                  style={[
                    styles.commentInput,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder={replyToUser ? `Reply to ${replyToUser}...` : "Add a comment..."}
                  placeholderTextColor={theme.textSecondary}
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  maxLength={1000}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (newComment.trim() || attachedImage)
                      ? [styles.sendButtonActive, { backgroundColor: theme.primary }]
                      : [styles.sendButtonInactive, { backgroundColor: theme.border }],
                  ]}
                  onPress={handleSendComment}
                  disabled={sendStatus === "sending" || (!newComment.trim() && !attachedImage)}
                >
                  {sendStatus === "sending" ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons
                      name="send"
                      size={24}
                      color={(newComment.trim() || attachedImage) ? "#fff" : theme.textSecondary}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal visible={imageViewerVisible} transparent>
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <TouchableOpacity
            style={{ position: "absolute", top: 50, right: 20, zIndex: 10 }}
            onPress={() => setImageViewerVisible(false)}
          >
            <Ionicons name="close" size={40} color="#fff" />
          </TouchableOpacity>
          {imageViewerUri && (
            <Image
              source={{ uri: getImageUri(imageViewerUri) }}
              style={{ width, height, resizeMode: "contain" }}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  imageWrapper: {
    width,
    height: height * 0.5,
    backgroundColor: "#000",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: "hidden",
  },
  image: { width, height: height * 0.5, resizeMode: "cover" },
  imageCounterContainer: {
    position: "absolute",
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  imageCounterText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  title: { fontSize: 24, fontWeight: "bold" },
  price: { fontSize: 23, fontWeight: "800", color: "#017a6b", marginVertical: 6 },
  category: { fontSize: 15, marginBottom: 4 },
  description: { fontSize: 16, lineHeight: 24 },
  vendorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginTop: 12,
  },
  vendorName: { fontSize: 18, fontWeight: "bold" },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  ratingNumber: {
    marginLeft: 6,
    fontSize: 13.5,
    fontWeight: "700",
    color: "#FFA41C",
  },
  reviewCountText: {
    fontSize: 12.5,
    color: "#888",
    fontWeight: "400",
  },
  inlineStats: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, marginVertical: 16 },
  actionRowFixed: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    backgroundColor: "transparent",
  },
  actionButtonFixed: {
    flex: 1,
    marginHorizontal: 6,
  },
  ctaPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(240,240,240,0.85)", // light gray semi-transparent
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(200,200,200,0.6)",
  },
  ctaText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#888", // gray text
  },
  // Dark theme override
  ctaPillDark: {
    backgroundColor: "rgba(50,50,50,0.85)",
    borderColor: "rgba(100,100,100,0.6)",
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalContainerFixed: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: height * 0.75,
    maxHeight: height * 0.90,
    overflow: "hidden",
  },
  modalHandle: { width: 48, height: 5, borderRadius: 3, alignSelf: "center", marginTop: 12, marginBottom: 8 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  modalHeaderContent: { flexDirection: "row", alignItems: "center" },
  modalTitle: { fontSize: 20, fontWeight: "800", marginLeft: 12 },
  commentsListContainerFixed: { flex: 1 },
  commentsListContent: { paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 20, flexGrow: 1 },
  skeletonAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#e0e0e0" },
  skeletonLine1: { width: 120, height: 16, borderRadius: 8, backgroundColor: "#e0e0e0" },
  skeletonLine2: { width: "85%", height: 14, borderRadius: 7, backgroundColor: "#e0e0e0" },
  skeletonLine3: { width: "60%", height: 12, borderRadius: 6, backgroundColor: "#e0e0e0" },
  commentContainer: {},
  commentRow: { flexDirection: "row", alignItems: "flex-start" },
  commentContent: { marginLeft: 12, flex: 1 },
  commentHeader: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  commentUser: { fontSize: 15, fontWeight: "800" },
  replyIndicator: { fontSize: 13, fontWeight: "600", marginLeft: 4 },
  commentText: { fontSize: 15, lineHeight: 22, marginTop: 6, marginBottom: 8 },
  commentImage: { width: 160, height: 160, borderRadius: 12, marginTop: 8 },
  commentFooter: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 10 },
  commentTime: { fontSize: 11.5 },
  replyButton: { fontSize: 13.5, fontWeight: "500" },
  repliesButton: { flexDirection: "row", alignItems: "center" },
  repliesText: { fontSize: 13, fontWeight: "600" },
  noCommentsContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  noCommentsTitle: { fontSize: 18, fontWeight: "700", marginTop: 16, textAlign: "center" },
  noCommentsSubtitle: { fontSize: 15, textAlign: "center", marginTop: 8, lineHeight: 20 },
  noCommentsPreview: { justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  noCommentsText: { fontSize: 16, marginTop: 12, textAlign: "center" },
  commentInputSectionFixed: { borderTopWidth: 1, paddingTop: 16, paddingBottom: 20 },
  successMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  successText: { fontSize: 15, fontWeight: "600", marginLeft: 8 },
  replyIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  replyIndicatorText: { fontSize: 13.5, marginLeft: 8, flex: 1 },
  attachedImageContainer: {
    position: "relative",
    marginBottom: 12,
    alignSelf: "flex-start",
    marginHorizontal: 16,
  },
  attachedImage: { width: 84, height: 84, borderRadius: 14 },
  removeImageButton: { position: "absolute", top: -10, right: -10 },
  commentInputWrapper: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 16, paddingVertical: 12 },
  imagePickerButton: { padding: 12 },
  commentInput: {
    flex: 1,
    marginHorizontal: 14,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    minHeight: 54,
    maxHeight: 120,
    borderWidth: 1,
  },
  sendButton: { width: 54, height: 54, borderRadius: 27, justifyContent: "center", alignItems: "center" },
  sendButtonActive: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  sendButtonInactive: {},
});