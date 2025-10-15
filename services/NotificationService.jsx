// services/NotificationService.jsx
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { useEffect, useState, useContext } from "react";
import { Platform } from "react-native";
import { NotificationContext } from "../context/NotificationContext";
import { navigationRef } from "../App"; // Make sure App.js exports navigationRef

// Global notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function useNotificationService() {
  const { addNotification } = useContext(NotificationContext) || {};

  if (!addNotification) {
    console.warn(
      "⚠️ NotificationContext not found! Wrap your app in <NotificationProvider>."
    );
  }

  const [expoPushToken, setExpoPushToken] = useState(null);

  useEffect(() => {
    // 1️⃣ Register device for push notifications
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        console.log("Expo Push Token:", token);
        setExpoPushToken(token);
      }
    });

    // 2️⃣ Foreground notifications
    const receiveSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("📩 Notification received:", notification);
      }
    );

    // 3️⃣ Taps on notifications
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("👉 Notification tapped:", response);

        if (navigationRef.isReady()) {
          const data = response.notification.request.content.data;
          navigationRef.navigate("Notification", { data });
        }
      }
    );

    return () => {
      receiveSub.remove();
      responseSub.remove();
    };
  }, []);

  // Show notification (adds to context + triggers device alert)
  const showNotification = async (title, body, details = {}, data = {}) => {
    if (addNotification) {
      addNotification(title, body, JSON.stringify(details));
    }

    await Notifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: null,
    });
  };

  return { expoPushToken, showNotification };
}

// Helper: register for push notifications
async function registerForPushNotificationsAsync() {
  let token;

  if (!Device.isDevice) {
    alert("Must use physical device for Push Notifications");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    alert("Permission not granted for push notifications!");
    return null;
  }

  token = (
    await Notifications.getExpoPushTokenAsync({
      projectId: "your-expo-project-id",
    })
  ).data;

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}
