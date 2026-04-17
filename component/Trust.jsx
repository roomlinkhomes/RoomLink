// components/Trust.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Trust({ 
  text = "Verified Host",
  showModal = true 
}) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable 
        style={styles.badge} 
        onPress={() => showModal && setVisible(true)}
        android_ripple={{ color: 'rgba(0, 255, 157, 0.2)' }}
      >
        <Ionicons name="shield-checkmark" size={13} color="#00ff9d" />
        <Text style={styles.text}>{text}</Text>
      </Pressable>

      {showModal && (
        <Modal
          transparent
          animationType="fade"
          visible={visible}
          onRequestClose={() => setVisible(false)}
          statusBarTranslucent
        >
          <TouchableOpacity 
            style={styles.overlay} 
            activeOpacity={1}
            onPress={() => setVisible(false)}
          >
            <View style={styles.modal} onStartShouldSetResponder={() => true}>
              <View style={styles.modalContent}>
                <Ionicons name="shield-checkmark" size={48} color="#00ff9d" style={styles.icon} />
                
                <Text style={styles.title}>Verified Host</Text>
                
                <Text style={styles.desc}>
                  This badge means the user has completed identity verification, 
                  has good reviews, and follows community guidelines.
                </Text>

                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setVisible(false)}
                >
                  <Text style={styles.closeText}>Got it</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 157, 0.12)',
    paddingHorizontal: 6,      // Smaller padding
    paddingVertical: 2,        // Smaller padding
    borderRadius: 10,          // Smaller radius (as in your original)
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 157, 0.3)',
    marginLeft: 6,
  },
  text: {
    color: '#00ff9d',
    fontSize: 11,              // Smaller text
    fontWeight: '600',
    marginLeft: 3,             // Smaller margin
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    color: '#00ff9d',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  desc: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: '#00ff9d',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  closeText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});