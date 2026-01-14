// context/ListingTabContext.jsx
import React, { createContext, useContext, useState } from 'react';

// Create the context
const ListingTabContext = createContext();

// Provider component
export function ListingTabProvider({ children }) {
  const [activeTab, setActiveTab] = useState('houses'); // 'houses' or 'hotels'

  return (
    <ListingTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </ListingTabContext.Provider>
  );
}

// Custom hook to use the context in any component
export function useListingTab() {
  const context = useContext(ListingTabContext);
  if (!context) {
    throw new Error('useListingTab must be used within a ListingTabProvider');
  }
  return context;
}