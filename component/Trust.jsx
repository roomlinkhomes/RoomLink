// components/Trust.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Trust({ text = "Verified Host" }) {
  return (
    <View style={styles.badge}>
      <Ionicons name="shield-checkmark" size={15} color="#00ff9d" />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 157, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 157, 0.3)',
    marginLeft: 6,
  },
  text: {
    color: '#00ff9d',
    fontSize: 12.5,
    fontWeight: '700',
    marginLeft: 4,
  },
});