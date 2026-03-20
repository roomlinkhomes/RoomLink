import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, setDoc, deleteDoc, increment } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // ← adjust path if needed

export default function Love({
  listingId,
  isFavorite: initialIsFavorite = false,
  count: initialCount = 0,
  authUser,
  onToggle,           // optional callback after toggle
  size = 26,
  colorFilled = '#ff3366',
  colorOutline = '#fff',
  backgroundOpacity = 0.5,
  showCount = true,
  style,              // optional extra style for the container
}) {
  // Local state – can be controlled or uncontrolled
  const [isFavorite, setIsFavorite] = React.useState(initialIsFavorite);
  const [count, setCount] = React.useState(initialCount);

  // Animation
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Sync with props if they change from parent
  React.useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  React.useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  const handlePress = async () => {
    if (!authUser?.uid) {
      Alert.alert('Login Required', 'Please sign in to favorite listings.');
      return;
    }

    // Quick optimistic animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.4,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    const favRef = doc(db, 'users', authUser.uid, 'favorites', listingId);
    const listingRef = doc(db, 'listings', listingId);

    const nowFavorite = !isFavorite;

    try {
      if (nowFavorite) {
        await setDoc(favRef, { addedAt: new Date() });
        await setDoc(listingRef, { favoriteCount: increment(1) }, { merge: true });
        setCount((c) => c + 1);
      } else {
        await deleteDoc(favRef);
        await setDoc(listingRef, { favoriteCount: increment(-1) }, { merge: true });
        setCount((c) => Math.max(0, c - 1));
      }

      setIsFavorite(nowFavorite);

      // Optional callback to parent
      if (onToggle) {
        onToggle(listingId, nowFavorite, nowFavorite ? count + 1 : Math.max(0, count - 1));
      }
    } catch (error) {
      console.error('Favorite toggle failed:', error);
      Alert.alert('Error', 'Could not update favorite. Please try again.');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={!authUser}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={size}
          color={isFavorite ? colorFilled : colorOutline}
          style={styles.iconShadow}
        />
      </Animated.View>

      {showCount && count > 0 && (
        <Text style={styles.countText}>{count}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // default semi-transparent bg
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 30,
  },
  iconShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  countText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
});