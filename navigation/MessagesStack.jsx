// navigation/MessagesStack.jsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Conversations from "../screens/Conversations";
import Message from "../screens/message";

const Stack = createNativeStackNavigator();

export default function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Conversations screen without header */}
      <Stack.Screen
        name="Conversations"
        component={Conversations}
      />
      
      {/* Message screen fully relies on App.js header now */}
      <Stack.Screen
        name="Message"
        component={Message}
      />
    </Stack.Navigator>
  );
}
