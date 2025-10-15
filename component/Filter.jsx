// components/Filter.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

const filterSections = [
  {
    title: "Sort",
    options: [{ label: "Newest", value: "newest" }],
  },
  {
    title: "Trending",
    options: [
      { label: "5 minutes", value: "5min" },
      { label: "1 hour", value: "1hour" },
      { label: "6 hours", value: "6hour" },
      { label: "24 hours", value: "24hour" },
    ],
  },
  {
    title: "Top",
    options: [
      { label: "Most contacted", value: "mostContacted" },
      { label: "Location", value: "location" },
    ],
  },
  {
    title: "Time",
    options: [
      { label: "Last week", value: "lastWeek" },
      { label: "Last month", value: "lastMonth" },
    ],
  },
  {
    title: "Property Type",
    options: [
      { label: "Lands", value: "lands" },
      { label: "Apartment", value: "apartment" },
      { label: "Houses", value: "houses" },
    ],
  },
];

export default function Filter({ visible, onClose, onSelect }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (option) => {
    setSelected(option.value);
    onSelect(option.value); // send selection back
    onClose(); // close modal
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.container}>
          <Text style={styles.title}>Sort & Filter</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {filterSections.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.optionsRow}>
                  {section.options.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionCard,
                        selected === option.value && styles.optionCardSelected,
                      ]}
                      onPress={() => handleSelect(option)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          selected === option.value && styles.optionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "70%",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#000",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    color: "#444",
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionCard: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 8,
  },
  optionCardSelected: {
    backgroundColor: "#1A237E",
    borderColor: "#1A237E",
  },
  optionText: {
    fontSize: 14,
    color: "#333",
  },
  optionTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
});
