// screens/EventScheduler.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function EventScheduler({ route, navigation }) {
  const { listingId, listingTitle, ownerId, listingImage: passedImage } = route.params || {};

  const isDark = useColorScheme() === 'dark';

  const [eventTitle, setEventTitle] = useState(`Viewing: ${listingTitle || 'Property'}`);
  const [notes, setNotes] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listingImage, setListingImage] = useState(passedImage || null);
  const [success, setSuccess] = useState(false);

  const currentUser = auth.currentUser;

  // Fetch image if needed
  useEffect(() => {
    const fetchListingImage = async () => {
      if (listingImage || !listingId) return;
      try {
        const listingDoc = await getDoc(doc(db, 'listings', listingId));
        if (listingDoc.exists()) {
          const data = listingDoc.data();
          const imageUrl = data.imageUrls?.[0] || data.images?.[0] || data.mainImage || null;
          setListingImage(imageUrl);
        }
      } catch (error) {
        console.error('Failed to fetch image:', error);
      }
    };
    fetchListingImage();
  }, [listingId]);

  if (!currentUser) {
    Alert.alert('Error', 'You must be logged in.');
    navigation.goBack();
    return null;
  }

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) setTime(selectedTime);
  };

  const getFormattedDate = () =>
    date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const getFormattedTime = () =>
    time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const saveEventAndNotifyHostOnly = async () => {
    if (!eventTitle.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please provide your phone number');
      return;
    }

    setLoading(true);

    try {
      const eventDateTime = new Date(date);
      eventDateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);

      let tenantDisplayName = 'Tenant';
      if (currentUser?.uid) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const u = userDoc.data();
          tenantDisplayName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.displayName || 'Tenant';
        }
      }

      // Create the event
      const eventRef = await addDoc(collection(db, 'events'), {
        listingId,
        listingTitle: listingTitle || 'Property',
        tenantId: currentUser.uid,
        tenantName: tenantDisplayName,
        hostId: ownerId,
        title: eventTitle.trim(),
        notes: notes.trim(),
        phoneNumber: phoneNumber.trim(),
        dateTime: eventDateTime,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      const baseData = {
        relatedId: eventRef.id,
        relatedType: 'event',
        imageUrl: listingImage,
        read: false,
        createdAt: serverTimestamp(),
      };

      // ONLY NOTIFY THE HOST (Post Owner) - No notification to scheduler
      await addDoc(collection(db, 'notifications'), {
        userId: ownerId,                       // ← Only host
        type: 'event_request',
        title: 'New Viewing Request',
        body: `${tenantDisplayName} requested a viewing for "${eventTitle}"`,
        ...baseData,
      });

      // Show success screen
      setSuccess(true);

    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success Screen
  if (success) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0f1117' : '#f8fafc' }]}>
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={110} color="#017a6b" />
          <Text style={[styles.successTitle, { color: isDark ? '#fff' : '#111' }]}>
            Request Sent!
          </Text>
          <Text style={[styles.successSubtitle, { color: isDark ? '#aaa' : '#555' }]}>
            The host has been notified and will get back to you soon.
          </Text>

          <View style={styles.successCard}>
            <Text style={[styles.successEventTitle, { color: isDark ? '#fff' : '#000' }]}>{eventTitle}</Text>
            <Text style={[styles.successDate, { color: isDark ? '#ccc' : '#666' }]}>
              {getFormattedDate()} • {getFormattedTime()}
            </Text>
          </View>

          <TouchableOpacity style={styles.doneButton} onPress={() => navigation.goBack()}>
            <Text style={styles.doneButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main Form
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fafafa' }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 12 }}>
              <Ionicons name="arrow-back" size={28} color={isDark ? '#e0e0e0' : '#000'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: isDark ? '#e0e0e0' : '#1a1a1a' }]}>Schedule Viewing</Text>
            <View style={{ width: 48 }} />
          </View>

          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            {/* Your form fields remain the same */}
            <View style={styles.row}>
              <Ionicons name="pencil" size={26} color={isDark ? '#e0e0e0' : '#000'} style={styles.rowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: isDark ? '#aaa' : '#666' }]}>Event Title</Text>
                <TextInput
                  style={[styles.rowValue, { color: isDark ? '#fff' : '#000' }]}
                  value={eventTitle}
                  onChangeText={setEventTitle}
                  placeholder="e.g. House Viewing"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                />
              </View>
            </View>

            <View style={styles.row}>
              <Ionicons name="call-outline" size={26} color={isDark ? '#e0e0e0' : '#000'} style={styles.rowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: isDark ? '#aaa' : '#666' }]}>Your Phone Number</Text>
                <TextInput
                  style={[styles.rowValue, { color: isDark ? '#fff' : '#000' }]}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="+234 800 000 0000"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.row} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={26} color={isDark ? '#e0e0e0' : '#000'} style={styles.rowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: isDark ? '#aaa' : '#666' }]}>Date</Text>
                <Text style={[styles.rowValue, { color: isDark ? '#fff' : '#000' }]}>{getFormattedDate()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={isDark ? '#666' : '#aaa'} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.row} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time-outline" size={26} color={isDark ? '#e0e0e0' : '#000'} style={styles.rowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: isDark ? '#aaa' : '#666' }]}>Time</Text>
                <Text style={[styles.rowValue, { color: isDark ? '#fff' : '#000' }]}>{getFormattedTime()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={isDark ? '#666' : '#aaa'} />
            </TouchableOpacity>

            <View style={[styles.row, { alignItems: 'flex-start' }]}>
              <Ionicons name="document-text-outline" size={26} color={isDark ? '#e0e0e0' : '#000'} style={styles.rowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: isDark ? '#aaa' : '#666' }]}>Additional Notes</Text>
                <TextInput
                  style={[styles.textArea, { color: isDark ? '#fff' : '#000' }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any special requests..."
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitDisabled]}
              onPress={saveEventAndNotifyHostOnly}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitText}>Send Request to Host</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker value={date} mode="date" display="default" onChange={handleDateChange} minimumDate={new Date()} />
      )}
      {showTimePicker && (
        <DateTimePicker value={time} mode="time" display="default" onChange={handleTimeChange} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 32 },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowIcon: { width: 50 },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowValue: { fontSize: 18, fontWeight: '600', marginTop: 4 },
  textArea: { fontSize: 17, minHeight: 100, marginTop: 8, padding: 0 },
  submitButton: { backgroundColor: '#017a6b', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 40 },
  submitDisabled: { backgroundColor: '#aaa' },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  successIconContainer: { marginBottom: 30 },
  successTitle: { fontSize: 28, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  successSubtitle: { fontSize: 16, textAlign: 'center', marginBottom: 40, lineHeight: 24 },
  successCard: { backgroundColor: '#017a6b15', padding: 24, borderRadius: 16, width: '100%', marginBottom: 50, alignItems: 'center' },
  successEventTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  successDate: { fontSize: 16, textAlign: 'center' },
  doneButton: { backgroundColor: '#017a6b', paddingVertical: 16, paddingHorizontal: 60, borderRadius: 12 },
  doneButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});