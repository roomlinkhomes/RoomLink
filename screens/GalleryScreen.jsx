import React, { useState } from "react";
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Text,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import ImageViewing from "react-native-image-viewing";

const { width } = Dimensions.get("window");

export default function GalleryScreen() {
  const route = useRoute();
  const { images } = route.params;

  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <View style={styles.container}>
      {/* Grid of Images */}
      <FlatList
        data={images}
        numColumns={2}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => {
              setCurrentIndex(index);
              setVisible(true);
            }}
          >
            <Image source={{ uri: item }} style={styles.image} />
          </TouchableOpacity>
        )}
      />

      {/* Fullscreen Image Viewer */}
      <ImageViewing
        images={images.map((uri) => ({ uri }))}
        imageIndex={currentIndex}
        visible={visible}
        onRequestClose={() => setVisible(false)}
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
  container: { flex: 1, backgroundColor: "#fff", padding: 5 },
  image: {
    width: width / 2 - 10,
    height: 180,
    margin: 5,
    borderRadius: 10,
  },
  footer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  footerTextContainer: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  footerText: {
    color: "#fff",
    fontSize: 14,
  },
});
	
