// hooks/useNotificationHandler.js
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';

export default function useNotificationHandler() {
  const navigation = useNavigation();
  const responseListener = useRef();

  useEffect(() => {
    // Listener for when user TAPS on a notification (from notification panel)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const content = response.notification.request.content;
      const data = content.data || {};

      console.log('📬 Notification tapped:', data);

      // Handle different notification types
      if (data.type === 'event_request' || data.relatedType === 'event') {
        // Navigate to your Notifications screen
        navigation.navigate('Notifications');   // ← Change this if your screen name is different

        // Optional: If you want to go directly to the specific event details
        // if (data.relatedId) {
        //   navigation.navigate('EventDetails', { 
        //     eventId: data.relatedId 
        //   });
        // }
      }

      // You can add more notification types here in the future
      // Example:
      // else if (data.type === 'chat_message') {
      //   navigation.navigate('Chat', { chatId: data.chatId });
      // }
    });

    // Cleanup when component unmounts
    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [navigation]);
}