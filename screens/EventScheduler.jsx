// screens/EventScheduler.jsx
import React, { useState } from 'react';
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
  Alert,
  SafeAreaView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';

// Configure how notifications should be handled
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function EventScheduler({ route, navigation }) {
  const { listingId, listingTitle, ownerId } = route.params || {};

  const isDark = useColorScheme() === 'dark';

  const [eventTitle, setEventTitle] = useState(`Viewing: ${listingTitle || 'Property'}`);
  const [notes, setNotes] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentUser = auth.currentUser;

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
    date.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const getFormattedTime = () =>
    time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  };

  const saveEventAndNotify = async () => {
    if (!eventTitle.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please provide your phone number so the host can contact you');
      return;
    }

    setLoading(true);

    try {
      // Request notification permission
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission needed', 'Please allow notifications for the best experience.');
      }

      const eventDateTime = new Date(date);
      eventDateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);

      // ────────────────────────────────────────────────
      // Fetch current display name from Firestore (most up-to-date)
      // ────────────────────────────────────────────────
      let tenantDisplayName = 'Tenant';

      if (currentUser?.uid) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const first = userData.firstName || '';
          const last = userData.lastName || '';
          tenantDisplayName = `${first} ${last}`.trim();

          // Fallback to displayName if full name is empty
          if (!tenantDisplayName && userData.displayName) {
            tenantDisplayName = userData.displayName;
          }
        }
      }

      // 1. Save the event with the correct/current name
      const eventRef = await addDoc(collection(db, 'events'), {
        listingId,
        listingTitle: listingTitle || 'Property',
        tenantId: currentUser.uid,
        tenantName: tenantDisplayName,           // ← now uses current Firestore name
        hostId: ownerId,
        title: eventTitle.trim(),
        notes: notes.trim(),
        phoneNumber: phoneNumber.trim(),
        dateTime: eventDateTime,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      const eventDateStr = `${getFormattedDate()} at ${getFormattedTime()}`;
      const message = `${tenantDisplayName} requested: "${eventTitle}"\nDate: ${eventDateStr}\nPhone: ${phoneNumber.trim()}`;

      // 2. Create in-app notification for host
      await addDoc(collection(db, 'notifications'), {
        userId: ownerId,
        type: 'event_request',
        title: 'New Event Request',
        body: message,
        relatedId: eventRef.id,
        relatedType: 'event',
        read: false,
        createdAt: serverTimestamp(),
      });

      // 3. Optional: local notification for testing (shows sound + banner)
      // Remove or comment out in production if using real push
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Event Scheduled',
          body: 'Your request has been sent to the host!',
          sound: 'default',
        },
        trigger: null, // send immediately
      });

      Alert.alert('Success', 'Event scheduled!\nHost has been notified.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error('Scheduling error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fafafa' }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 12 }}>
              <Ionicons name="arrow-back" size={28} color={isDark ? '#e0e0e0' : '#000'} />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: isDark ? '#e0e0e0' : '#1a1a1a' }]}>
              Schedule Event
            </Text>

            <View style={{ width: 48 }} />
          </View>

          {/* Form Fields */}
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            {/* Event Title */}
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

            {/* Phone Number */}
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

            {/* Date */}
            <TouchableOpacity style={styles.row} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={26} color={isDark ? '#e0e0e0' : '#000'} style={styles.rowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: isDark ? '#aaa' : '#666' }]}>Date</Text>
                <Text style={[styles.rowValue, { color: isDark ? '#fff' : '#000' }]}>
                  {getFormattedDate()}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={isDark ? '#666' : '#aaa'} />
            </TouchableOpacity>

            {/* Time */}
            <TouchableOpacity style={styles.row} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time-outline" size={26} color={isDark ? '#e0e0e0' : '#000'} style={styles.rowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: isDark ? '#aaa' : '#666' }]}>Time</Text>
                <Text style={[styles.rowValue, { color: isDark ? '#fff' : '#000' }]}>
                  {getFormattedTime()}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={isDark ? '#666' : '#aaa'} />
            </TouchableOpacity>

            {/* Notes */}
            <View style={[styles.row, { alignItems: 'flex-start' }]}>
              <Ionicons name="document-text-outline" size={26} color={isDark ? '#e0e0e0' : '#000'} style={styles.rowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: isDark ? '#aaa' : '#666' }]}>Notes</Text>
                <TextInput
                  style={[styles.textArea, { color: isDark ? '#fff' : '#000' }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any special requests, number of people, etc."
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitDisabled]}
              onPress={saveEventAndNotify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitText}>Schedule & Notify Host</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 32,
  },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowIcon: { width: 50 },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowValue: { fontSize: 18, fontWeight: '600', marginTop: 4 },
  textArea: { fontSize: 17, minHeight: 100, marginTop: 8, padding: 0 },
  submitButton: {
    backgroundColor: '#017a6b',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 40,
  },
  submitDisabled: { backgroundColor: '#aaa' },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});