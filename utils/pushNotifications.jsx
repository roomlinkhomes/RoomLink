// utils/pushNotifications.js
// Handles delayed auth state reliably after sign-in

import {
  getMessaging,
  getToken,
  onTokenRefresh,
  requestPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { getAuth, onAuthStateChanged, onIdTokenChanged } from '@react-native-firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_WAIT_TIMEOUT_MS = 20000;

const PENDING_TOKEN_KEY = '@pending_push_token';
const PENDING_PLATFORM_KEY = '@pending_push_platform';

const saveTokenToFirestore = async (uid, token, platform) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      pushToken: token,
      pushTokenUpdatedAt: new Date().toISOString(),
      platform: platform || Platform.OS,
    });
    console.log('[PUSH] Token saved to Firestore for user:', uid);
  } catch (err) {
    console.error('[PUSH] Firestore save failed:', err);
  }
};

export const setupPushNotifications = async () => {
  try {
    const messaging = getMessaging();
    const auth = getAuth();

    console.log('[PUSH] Starting setup...');

    // 1. Permissions
    let permissionGranted = false;

    if (Platform.OS === 'ios') {
      const authStatus = await requestPermission(messaging);
      permissionGranted =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;
    } else if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      permissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      permissionGranted = true;
    }

    if (!permissionGranted) {
      console.log('[PUSH] Permission denied');
      return;
    }

    console.log('[PUSH] Permission granted');

    // 2. Get token early
    const token = await getToken(messaging);
    if (!token) {
      console.log('[PUSH] No FCM token');
      return;
    }

    console.log('[PUSH] Token obtained:', token.substring(0, 20) + '...');

    // 3. Save locally always
    await AsyncStorage.setItem(PENDING_TOKEN_KEY, token);
    await AsyncStorage.setItem(PENDING_PLATFORM_KEY, Platform.OS);
    console.log('[PUSH] Token saved locally (pending)');

    // 4. Try immediate user wait (short timeout)
    let currentUser = null;
    try {
      currentUser = await Promise.race([
        new Promise((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              unsubscribe();
              resolve(user);
            }
          });
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), USER_WAIT_TIMEOUT_MS)
        ),
      ]);
    } catch {
      console.log('[PUSH] No user detected within timeout – keeping local');
    }

    if (currentUser) {
      console.log('[PUSH] User ready on setup:', currentUser.uid);
      await saveTokenToFirestore(currentUser.uid, token, Platform.OS);
      await AsyncStorage.multiRemove([PENDING_TOKEN_KEY, PENDING_PLATFORM_KEY]);
    } else {
      console.log('[PUSH] No user yet – relying on listener / retry');
    }

    // 5. Persistent listener for pending token upload
    // Use onIdTokenChanged — more reliable after sign-in token settle
    const unsubscribeToken = onIdTokenChanged(auth, async (user) => {
      if (user) {
        const storedToken = await AsyncStorage.getItem(PENDING_TOKEN_KEY);
        if (storedToken) {
          console.log('[PUSH] onIdTokenChanged: Found pending token – uploading for:', user.uid);
          await saveTokenToFirestore(user.uid, storedToken, await AsyncStorage.getItem(PENDING_PLATFORM_KEY));
          await AsyncStorage.multiRemove([PENDING_TOKEN_KEY, PENDING_PLATFORM_KEY]);
        }
      }
    });

    // Fallback: one-time retry after delay (catches rare misses)
    setTimeout(async () => {
      const lateUser = auth.currentUser;
      if (lateUser) {
        const storedToken = await AsyncStorage.getItem(PENDING_TOKEN_KEY);
        if (storedToken) {
          console.log('[PUSH] Late retry: uploading pending token for:', lateUser.uid);
          await saveTokenToFirestore(lateUser.uid, storedToken, await AsyncStorage.getItem(PENDING_PLATFORM_KEY));
          await AsyncStorage.multiRemove([PENDING_TOKEN_KEY, PENDING_PLATFORM_KEY]);
        }
      }
    }, 8000); // 8 seconds after setup

    // 6. Token refresh
    onTokenRefresh(messaging, async (newToken) => {
      console.log('[PUSH] Token refreshed');
      const refreshedUser = auth.currentUser;
      if (refreshedUser) {
        await saveTokenToFirestore(refreshedUser.uid, newToken, Platform.OS);
      } else {
        await AsyncStorage.setItem(PENDING_TOKEN_KEY, newToken);
        await AsyncStorage.setItem(PENDING_PLATFORM_KEY, Platform.OS);
        console.log('[PUSH] Refreshed token saved locally (no user)');
      }
    });

    console.log('[PUSH] Setup complete');

    // Cleanup note: in a real app, you might unsubscribe on logout / app close,
    // but for most cases leaving it is fine (listeners are lightweight)
  } catch (error) {
    console.error('[PUSH] Setup error:', error.message || error);
  }
};