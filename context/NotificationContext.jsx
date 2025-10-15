// context/NotificationContext.jsx
import React, { createContext, useState } from "react";

// Create the context
export const NotificationContext = createContext();

// Provider component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Add a new notification
  const addNotification = (title, body, details = "") => {
    const newNotification = {
      id: Date.now().toString(),
      title,
      body,
      details,
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  // Mark a specific notification as read
  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
