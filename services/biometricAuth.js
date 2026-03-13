// services/biometricAuth.js
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'roomlinkAuthToken';

export const biometricAuth = {
  async isBiometricAvailable() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.log('Biometric availability check failed:', error);
      return false;
    }
  },

  async authenticate(promptMessage = 'Unlock RoomLink') {
    try {
      const { success } = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use device passcode',
      });
      return success;
    } catch (error) {
      console.log('Biometric prompt error:', error);
      return false;
    }
  },

  async saveToken(token) {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      console.log('Auth token saved for biometric use');
    } catch (error) {
      console.error('Failed to save token:', error);
    }
  },

  async getToken() {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  },

  async deleteToken() {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      console.log('Auth token deleted');
    } catch (error) {
      console.error('Failed to delete token:', error);
    }
  },
};