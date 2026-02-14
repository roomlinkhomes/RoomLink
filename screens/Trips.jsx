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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig'; // Adjust path if needed

export default function Trips() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Query: only confirmed bookings for this user
    const q = query(
      collection(db, 'bookings'),
      where('buyerId', '==', user.uid),
      where('status', '==', 'confirmed')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingList = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setBookings(bookingList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Could not load your bookings.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markCheckedIn = async (bookingId) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        checkedIn: true,
        checkedInAt: serverTimestamp(),
        checkedInBy: 'guest',
      });
      Alert.alert('Success', 'You have been marked as checked in!');
    } catch (err) {
      console.error('Check-in error:', err);
      Alert.alert('Error', 'Failed to update check-in status.');
    }
  };

  const canCheckIn = (booking) => {
    if (booking.checkedIn) return false;
    if (!booking.checkIn) return false;

    const today = new Date();
    const checkInDate = new Date(booking.checkIn);
    return today >= checkInDate;
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

    return (
      <View style={[styles.bookingCard, isDark && styles.bookingCardDark]}>
        <Text style={[styles.title, isDark && styles.textLight]}>
          {item.listingTitle || 'Booking'}
        </Text>

        <View style={styles.detailsRow}>
          <Ionicons name="calendar-outline" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
          <Text style={[styles.detailText, isDark && styles.textMuted]}>
            Check-in: {formatDate(item.checkIn)} • {item.nights} night{item.nights !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.detailsRow}>
          <Ionicons name="cash-outline" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
          <Text style={[styles.detailText, isDark && styles.textMuted]}>
            Total paid: ₦{item.totalAmount?.toLocaleString() || '—'}
          </Text>
        </View>

        {item.checkedIn ? (
          <View style={styles.checkedInBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.checkedInText}>Checked In</Text>
          </View>
        ) : checkInPossible ? (
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={() => markCheckedIn(item.id)}
          >
            <Text style={styles.checkInButtonText}>I’m Checked In</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.upcomingText, isDark && styles.textMuted]}>
            Upcoming – Check-in on {formatDate(item.checkIn)}
          </Text>
        )}
      </View>
    );
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
        My Trips
      </Text>

      {bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bed-outline" size={60} color={isDark ? '#4b5563' : '#9ca3af'} />
          <Text style={[styles.emptyText, isDark && styles.textMuted]}>
            No confirmed trips yet
          </Text>
          <Text style={[styles.emptySubText, isDark && styles.textMuted]}>
            Book your next stay and it will appear here
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
    paddingBottom: 20,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bookingCardDark: {
    backgroundColor: '#1e2535',
    borderColor: '#334155',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
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
  },
  checkedInText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8,
  },
  checkInButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
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
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  textLight: {
    color: '#f1f5f9',
  },
  textMuted: {
    color: '#94a3b8',
  },
});