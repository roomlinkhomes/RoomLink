// context/TripCountProvider.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

const TripCountContext = createContext();

export function TripCountProvider({ children }) {
  const [upcomingCount, setUpcomingCount] = useState(0);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setUpcomingCount(0);
      return;
    }

    const q = query(
      collection(db, 'bookings'),
      where('buyerId', '==', user.uid),
      where('status', '==', 'confirmed')
      // Optional: where('checkIn', '>=', new Date().toISOString()) for only future trips
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUpcomingCount(snapshot.size); // number of confirmed bookings
    });

    return unsubscribe;
  }, [user]);

  return (
    <TripCountContext.Provider value={{ upcomingCount }}>
      {children}
    </TripCountContext.Provider>
  );
}

export function useTripCount() {
  return useContext(TripCountContext);
}