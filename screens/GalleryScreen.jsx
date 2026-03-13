// screens/GalleryScreen.jsx — fixes for production blank images
import React, { useState, useRef } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Text,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import ImageViewing from "react-native-image-viewing";
import { Image } from "expo-image";

const { width } = Dimensions.get("window");
const numColumns = 2;
const itemWidth = (width - 20 - 10) / numColumns; // renamed for clarity
const spacing = 10;

export default function GalleryScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { images = [] } = route.params || {};

  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Ref to force re-measure / trigger layout if needed
  const flatListRef = useRef(null);

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      onPress={() => {
        setCurrentIndex(index);
        setVisible(true);
      }}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: item }}
        style={styles.image}
        contentFit="cover"
        transition={400}               // slightly longer fade helps visibility
        cachePolicy="disk"             // keep, but add priority below
        placeholderContentFit="cover"
        // Add priority to help initial batch load in production
        priority={index < 12 ? "high" : "low"} // preload first 2-3 rows aggressively
        // Optional: debug border while testing
        // borderWidth: 1, borderColor: 'red'
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* SUPER TIGHT HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: "center", marginRight: 48 }}>
          <Text style={styles.pageTitle}>Gallery</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={images}
        numColumns={numColumns}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 5, paddingBottom: 20 }}
        // Increase visibility window & batch size for production reliability
        initialNumToRender={12}          // preload more (2-3 rows)
        maxToRenderPerBatch={10}
        windowSize={15}                  // larger → less aggressive unmount
        removeClippedSubviews={false}    // ← KEY: disable in production if blank issue persists (tradeoff: perf vs reliability)
        getItemLayout={(data, index) => ({
          length: itemWidth + spacing,
          offset: (itemWidth + spacing) * Math.floor(index / numColumns),
          index,
        })}
      />

      <ImageViewing
        images={images.map((uri) => ({ uri }))}
        imageIndex={currentIndex}
        visible={visible}
        onRequestClose={() => setVisible(false)}
        presentationStyle="overFullScreen"
        backgroundColor="#000"
        FooterComponent={({ imageIndex }) => (
          <View style={styles.footer}>
            <View style={styles.footerTextContainer}>
              <Text style={styles.footerText}>
                {imageIndex + 1} / {images.length}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  image: {
    width: itemWidth,
    height: itemWidth, // square grid
    margin: spacing / 2,
    borderRadius: 12,
    backgroundColor: "#222", // fallback color
  },
  footer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 40,
  },
  footerTextContainer: {
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  footerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});