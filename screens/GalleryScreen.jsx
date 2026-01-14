// screens/GalleryScreen.jsx — Header pushed up EVEN MORE (super tight)
import React, { useState } from "react";
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
const imageSize = (width - 20 - 10) / numColumns;

export default function GalleryScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { images = [] } = route.params || {};

  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

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
        transition={300}
        cachePolicy="disk"
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* ========== SUPER TIGHT HEADER (pushed up max) ========== */}
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
      {/* ========== END HEADER ========== */}

      {/* Grid starts almost immediately */}
      <FlatList
        data={images}
        numColumns={numColumns}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 5 }} // minimal space below header
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={10}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => ({
          length: imageSize + 10,
          offset: (imageSize + 10) * index,
          index,
        })}
      />

      {/* Fullscreen Viewer */}
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
    paddingTop: 20,     // ← Even tighter (was 30)
    paddingBottom: 16,  // ← Reduced
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  image: {
    width: imageSize,
    height: imageSize,
    margin: 5,
    borderRadius: 12,
    backgroundColor: "#222",
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