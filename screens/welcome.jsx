// screens/Welcome.jsx
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  useColorScheme,
  Linking,
  Alert,
  Dimensions,
  FlatList,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200",
    title: "Welcome to RoomLink",
    subtitle:
      "Verified apartments & stylish shortlets, safe, transparent, effortless.",
  },
  {
    id: "2",
    image:
      "https://res.cloudinary.com/drserbss8/image/upload/v1775229718/image_tmuntq.jpg",
    title: "Find Your Perfect Stay",
    subtitle:
      "Browse thousands of verified properties with real photos and honest reviews.",
  },
  {
    id: "3",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1200",
    title: "Book with Confidence",
    subtitle:
      "Secure payments, instant booking, and 24/7 support when you need it.",
  },
];

export default function Welcome() {
  const navigation = useNavigation();
  const scheme = useColorScheme();
  const isDarkMode = scheme === "dark";

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  const theme = {
    primary: "#017a6b",
    text: isDarkMode ? "#e2e8f0" : "#0f172a",
    textLight: isDarkMode
      ? "rgba(226,232,240,0.92)"
      : "rgba(15,23,42,0.92)",
  };

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= slides.length) {
        nextIndex = 0;
      }

      flatListRef.current?.scrollToOffset({
        offset: nextIndex * width,
        animated: true,
      });

      setCurrentIndex(nextIndex);
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const renderSlide = ({ item }) => (
    <View style={styles.slide}>
      <Animated.Image
        source={{ uri: item.image }}
        style={styles.heroImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0.82)"]}
        style={styles.overlay}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>{item.title}</Text>
          <Text style={styles.heroSubtitle}>{item.subtitle}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderDots = () => (
    <View style={styles.pagination}>
      {slides.map((_, index) => {
        const inputRange = [
          (index - 1) * width,
          index * width,
          (index + 1) * width,
        ];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 28, 8],
          extrapolate: "clamp",
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.4, 1, 0.4],
          extrapolate: "clamp",
        });

        return (
          <Animated.View
            key={index}
            style={[styles.dot, { width: dotWidth, opacity }]}
          />
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.heroContainer}>
        <FlatList
          ref={flatListRef}
          data={slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(
              e.nativeEvent.contentOffset.x / width
            );
            setCurrentIndex(index);
          }}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
        />
        {renderDots()}
      </View>

      <LinearGradient
        colors={
          isDarkMode
            ? ["#0f172a", "#1e293b"]
            : ["#f8fafc", "#e0f7fa"]
        }
        style={styles.bottomSection}
      >
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate("Signup")}
            activeOpacity={0.88}
          >
            <Ionicons name="person-add-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.buttonOutline,
              { borderColor: theme.primary },
            ]}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.88}
          >
            <Ionicons
              name="log-in-outline"
              size={20}
              color={theme.primary}
            />
            <Text
              style={[
                styles.buttonOutlineText,
                { color: theme.primary },
              ]}
            >
              Sign In
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.footerContainer}
          onPress={() =>
            Linking.openURL("https://roomlink.homes/privacy").catch(
              () => Alert.alert("Error", "Could not open link")
            )
          }
        >
          <Text style={[styles.footerText, { color: theme.textLight }]}>
            By continuing, you agree to our{" "}
            <Text
              style={{ color: theme.primary, fontWeight: "600" }}
            >
              Terms of Service & Privacy Policy
            </Text>
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  heroContainer: {
    height: "62%",
    width: "100%",
    position: "relative",
  },

  slide: {
    width,
    height: "100%",
  },

  heroImage: {
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: 32,
    paddingBottom: 80,
  },

  heroContent: {
    alignItems: "center",
  },

  heroTitle: {
    fontSize: 42,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },

  heroSubtitle: {
    fontSize: 18,
    color: "rgba(255,255,255,0.96)",
    textAlign: "center",
    maxWidth: "88%",
    lineHeight: 26,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 20,
    width: "100%",
  },

  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginHorizontal: 5,
  },

  bottomSection: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  buttonsContainer: {
    width: "100%",
    gap: 14, // smaller gap
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10, // smaller
    borderRadius: 999,
    gap: 8, // smaller
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  buttonText: {
    color: "#fff",
    fontSize: 18, // smaller font
    fontWeight: "700",
  },

  buttonOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10, // smaller
    borderWidth: 2,
    borderRadius: 999,
    gap: 8,
  },

  buttonOutlineText: {
    fontSize: 16,
    fontWeight: "700",
  },

  footerContainer: {
    position: "absolute",
    bottom: 30,
    left: 24,
    right: 24,
    alignItems: "center",
  },

  footerText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});