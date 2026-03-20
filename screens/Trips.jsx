// screens/Trips.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  useColorScheme,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import * as Sharing from 'expo-sharing'; // ← Added this import

export default function Trips() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [celebrateModal, setCelebrateModal] = useState(null);
  const user = auth.currentUser;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'bookings'),
      where('buyerId', '==', user.uid),
      where('status', '==', 'confirmed')
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const bookingList = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setBookings(bookingList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching bookings:', error);
        Alert.alert('Error', 'Could not load your trips.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const confirmCheckIn = async (bookingId) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        checkedIn: true,
        checkedInAt: serverTimestamp(),
        checkedInBy: 'guest',
      });
      const booking = bookings.find((b) => b.id === bookingId);
      if (booking) {
        setCelebrateModal({ booking, visible: true });
      } else {
        Alert.alert('Success', 'Checked in successfully!');
      }
    } catch (err) {
      console.error('Check-in error:', err);
      Alert.alert('Error', 'Failed to update check-in status.');
    }
  };

  const handleCheckInPress = (booking) => {
    Alert.alert(
      'Confirm Check-In',
      'Please make sure that you are actually checked in before confirming.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Proceed', onPress: () => confirmCheckIn(booking.id) },
      ],
      { cancelable: true }
    );
  };

  const canCheckIn = (booking) => {
    if (booking.checkedIn) return false;
    if (!booking.checkIn) return false;
    const today = new Date();
    const checkInDate = new Date(booking.checkIn);
    return today >= checkInDate;
  };

  const isCurrentlyStaying = (booking) => {
    if (!booking.checkIn || !booking.checkOut) return false;
    const today = new Date();
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    return today >= checkIn && today < checkOut;
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderBooking = ({ item }) => {
    const checkInPossible = canCheckIn(item);

    // Debug log (remove after testing)
    console.log('Trips debug:', {
      bookingId: item.id,
      title: item.listingTitle,
      listingImagesCount: item.listingImages?.length || 0,
      firstUrl: item.listingImages?.[0] || 'no images',
    });

    const images = item.listingImages || item.images || item.listing?.images || [];

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        style={[styles.bookingCard, isDark && styles.bookingCardDark]}
      >
        <View style={styles.cardImageGrid}>
          {Array.from({ length: 4 }).map((_, index) => {
            const imgUrl = images[index];

            return imgUrl ? (
              <Image
                key={index}
                source={{ uri: imgUrl }}
                style={styles.gridImage}
                resizeMode="cover"
                onError={(e) =>
                  console.log('Image load failed:', imgUrl, e.nativeEvent.error || 'unknown')
                }
              />
            ) : (
              <View key={index} style={[styles.gridPlaceholder, isDark && styles.gridPlaceholderDark]}>
                <Ionicons name="image-outline" size={28} color={isDark ? '#4b5563' : '#d1d5db'} />
              </View>
            );
          })}
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.title, isDark && styles.textLight]}>
            {item.listingTitle || 'Your Trip'}
          </Text>
          <View style={styles.detailsRow}>
            <Ionicons name="calendar-outline" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[styles.detailText, isDark && styles.textMuted]}>
              {formatDate(item.checkIn)} – {formatDate(item.checkOut)} • {item.nights} night
              {item.nights !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.detailsRow}>
            <Ionicons name="cash-outline" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[styles.detailText, isDark && styles.textMuted]}>
              ₦{item.totalAmount?.toLocaleString() || '—'}
            </Text>
          </View>
          {item.checkedIn ? (
            <View style={styles.checkedInBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.checkedInText}>
                {isCurrentlyStaying(item) ? "You're here right now! 🌟" : "You've been here 🌸"}
              </Text>
            </View>
          ) : checkInPossible ? (
            <TouchableOpacity style={styles.checkInButton} onPress={() => handleCheckInPress(item)}>
              <Text style={styles.checkInButtonText}>I’m Checked In</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.upcomingText, isDark && styles.textMuted]}>
              Upcoming • Check-in {formatDate(item.checkIn)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const closeCelebration = () => {
    setCelebrateModal(null);
  };

  const handleShare = async () => {
    try {
      const booking = celebrateModal?.booking;
      if (!booking) return;

      const imageUri = booking.listingImages?.[0] || booking.images?.[0];

      if (!imageUri) {
        Alert.alert("No Image", "No photo available to share for this stay.");
        return;
      }

      const shareMessage = 
        `Just checked in at ${booking.listingTitle || 'this amazing place'}! 🌟\n\n` +
        `📅 Check-in: ${formatDate(booking.checkIn)}\n` +
        `📅 Check-out: ${formatDate(booking.checkOut)}\n` +
        `Nights: ${booking.nights}\n\n` +
        `Having an incredible time — join me on RoomLink! #RoomLink #TravelVibes`;

      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        Alert.alert("Sharing Not Supported", "Sharing is not available on this device.");
        return;
      }

      await Sharing.shareAsync(imageUri, {
        dialogTitle: "Share your stay moment",
        mimeType: 'image/jpeg',
      });

      Alert.alert("Shared!", "Your trip moment has been shared 🎉");
    } catch (error) {
      console.error("Share failed:", error);
      Alert.alert("Share Failed", "Couldn't share right now. Try again later.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color="#017a6b" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.screenTitle, isDark && styles.textLight]}>
        My Trips & Memories
      </Text>

      {bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bed-outline" size={80} color={isDark ? '#4b5563' : '#9ca3af'} />
          <Text style={[styles.emptyText, isDark && styles.textMuted]}>
            No adventures yet...
          </Text>
          <Text style={[styles.emptySubText, isDark && styles.textMuted]}>
            Your next unforgettable stay is waiting, book now!
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal
        visible={!!celebrateModal?.visible}
        transparent
        animationType="fade"
        onRequestClose={closeCelebration}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.celebrateContainer, isDark && styles.celebrateContainerDark]}>
            <TouchableOpacity style={styles.closeButton} onPress={closeCelebration}>
              <Ionicons name="close" size={28} color={isDark ? '#fff' : '#333'} />
            </TouchableOpacity>

            {celebrateModal?.booking && (
              <>
                {celebrateModal.booking.listingImages?.[0] ||
                celebrateModal.booking.images?.[0] ? (
                  <Image
                    source={{
                      uri:
                        celebrateModal.booking.listingImages?.[0] ||
                        celebrateModal.booking.images?.[0],
                    }}
                    style={styles.celebrateImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={60} color="#d1d5db" />
                  </View>
                )}

                <Text style={styles.celebrateTitle}>
                  {isCurrentlyStaying(celebrateModal.booking)
                    ? "You're staying here right now! 🌟"
                    : "You've been here! 🌸✨"}
                </Text>

                <Text style={[styles.celebrateSubtitle, isDark && styles.textMuted]}>
                  {isCurrentlyStaying(celebrateModal.booking)
                    ? 'Enjoy every moment of your stay!'
                    : 'What a beautiful memory made at'}{' '}
                  {celebrateModal.booking.listingTitle || 'your stay'}
                </Text>

                <View style={styles.flowerRow}>
                  <Text style={styles.flower}>🌺 🌼 🌸 🌷 🌻</Text>
                </View>

                {/* Real share button */}
                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                  <Ionicons name="share-social" size={20} color="#fff" />
                  <Text style={styles.shareButtonText}>Share this moment</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={closeCelebration}>
                  <Text style={styles.continueText}>Continue Exploring</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  containerDark: {
    backgroundColor: '#0f1117',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    padding: 20,
    paddingBottom: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  bookingCardDark: {
    backgroundColor: '#1e2535',
    borderColor: '#334155',
  },
  cardImageGrid: {
    width: '100%',
    height: 180,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridImage: {
    width: '50%',
    height: '50%',
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
  },
  gridPlaceholder: {
    width: '50%',
    height: '50%',
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
  },
  gridPlaceholderDark: {
    backgroundColor: '#334155',
    borderColor: '#475569',
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 15,
    color: '#475569',
    marginLeft: 8,
  },
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  checkedInText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8,
  },
  checkInButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    alignItems: 'center',
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  upcomingText: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 12,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111',
    marginTop: 24,
  },
  emptySubText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
  },
  textLight: {
    color: '#f1f5f9',
  },
  textMuted: {
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrateContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 15,
  },
  celebrateContainerDark: {
    backgroundColor: '#1e2535',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  celebrateImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 20,
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  celebrateTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111',
    marginBottom: 12,
    textAlign: 'center',
  },
  celebrateSubtitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
  },
  flowerRow: {
    marginVertical: 16,
  },
  flower: {
    fontSize: 40,
    textAlign: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  continueText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
});