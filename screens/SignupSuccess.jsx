// screens/SignupSuccess.jsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function SignupSuccess() {
  const navigation = useNavigation();
  const route = useRoute();
  const isDark = useColorScheme() === 'dark';
  
  const { firstName = '' } = route.params || {};
  const primaryColor = '#017a6b';

  const handleContinue = () => {
    navigation.replace('Login');   // or 'Home' if you want to auto-login later
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.card}>
        <Text style={styles.emoji}>🎉</Text>
        
        <Text style={[styles.title, { color: primaryColor }]}>
          Welcome to RoomLink!
        </Text>
        
        <Text style={[styles.message, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>
          Hey {firstName || 'there'}! 👋{"\n\n"}
          Your account has been created and verified successfully.
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: primaryColor }]}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Continue to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '90%',
    maxWidth: 360,
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
  emoji: {
    fontSize: 90,
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});