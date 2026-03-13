// hooks/useAuth.js
import { useEffect, useState } from 'react';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[useAuth] Starting auth listener...');

    // 1. Subscribe to real-time changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log(
        '[useAuth] Auth state changed:',
        currentUser ? currentUser.uid : 'null / logged out'
      );

      setUser(currentUser);
      // We only turn loading off after we've received the (possibly restored) state
      setLoading(false);
    });

    // 2. Extra defensive initial check (helps in some React Native / Expo edge cases)
    const initialUser = auth.currentUser;
    if (initialUser) {
      console.log('[useAuth] Initial sync - found persisted user:', initialUser.uid);
      setUser(initialUser);
      setLoading(false); // safe to set early if we already have a user
    }

    // Cleanup
    return () => {
      console.log('[useAuth] Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  return { user, loading, isAuthenticated: !!user && !loading };
}