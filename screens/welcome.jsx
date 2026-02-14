import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  useColorScheme,
  Linking,
  Alert,
  ImageBackground,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function Welcome() {
  const navigation = useNavigation();
  const scheme = useColorScheme();
  const isDarkMode = scheme === "dark";

  const theme = {
    primary: "#017a6b", // teal-green
    text: isDarkMode ? "#e2e8f0" : "#0f172a",
    textLight: isDarkMode ? "rgba(226,232,240,0.92)" : "rgba(15,23,42,0.92)",
  };

  // Title & subtitle animations (unchanged)
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(40)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  const titleWords = ["Welcome", "to", "RoomLink."];
  const wordAnims = useRef(titleWords.map(() => new Animated.Value(0))).current;

  // Button animations – one per button
  const buttonAnims = useRef([
    { opacity: new Animated.Value(0), translateY: new Animated.Value(60) },
    { opacity: new Animated.Value(0), translateY: new Animated.Value(60) },
  ]).current;

  useEffect(() => {
    Animated.sequence([
      // Title container fade + slide
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // Stagger title words
      Animated.stagger(
        180,
        wordAnims.map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          })
        )
      ),

      // Subtitle fade
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 900,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),

      // Now stagger the two buttons (after everything above)
      Animated.stagger(
        220, // delay between buttons – feels natural
        buttonAnims.map((anim) =>
          Animated.parallel([
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 700,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(anim.translateY, {
              toValue: 0,
              duration: 700,
              easing: Easing.out(Easing.back(1)),
              useNativeDriver: true,
            }),
          ])
        )
      ),
    ]).start();
  }, []);

  const openPrivacyPolicy = async () => {
    const url =
      "https://doc-hosting.flycricket.io/roomlink-privacy-policy/a6dd1327-c200-4adb-a491-e3812385b0e9/privacy";
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert("Cannot open", "No browser found.");
    } catch (error) {
      Alert.alert("Error", "Failed to open link.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200",
        }}
        style={styles.hero}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0.78)"]}
          style={styles.overlay}
        >
          <View style={styles.heroContent}>
            <Animated.View
              style={[
                styles.titleContainer,
                {
                  opacity: titleOpacity,
                  transform: [{ translateY: titleTranslateY }],
                },
              ]}
            >
              {titleWords.map((word, index) => (
                <Animated.Text
                  key={word}
                  style={[
                    styles.heroTitle,
                    {
                      opacity: wordAnims[index],
                      transform: [
                        {
                          translateY: wordAnims[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {word}{" "}
                </Animated.Text>
              ))}
            </Animated.View>

            <Animated.Text
              style={[styles.heroSubtitle, { opacity: subtitleOpacity }]}
            >
              Verified apartments & stylish shortlets, safe, transparent, effortless.
            </Animated.Text>
          </View>
        </LinearGradient>
      </ImageBackground>

      <LinearGradient
        colors={isDarkMode ? ["#0f172a", "#1e293b"] : ["#f8fafc", "#e0f7fa"]}
        style={styles.contentGradient}
      >
        <View style={styles.buttonsContainer}>
          {/* Create Account Button – first in stagger */}
          <Animated.View
            style={{
              opacity: buttonAnims[0].opacity,
              transform: [{ translateY: buttonAnims[0].translateY }],
              width: "100%",
            }}
          >
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate("Signup")}
              activeOpacity={0.88}
            >
              <Ionicons name="person-add-outline" size={24} color="#fff" />
              <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Sign In Button – second in stagger */}
          <Animated.View
            style={{
              opacity: buttonAnims[1].opacity,
              transform: [{ translateY: buttonAnims[1].translateY }],
              width: "100%",
            }}
          >
            <TouchableOpacity
              style={[styles.buttonOutline, { borderColor: theme.primary }]}
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.88}
            >
              <Ionicons name="log-in-outline" size={24} color={theme.primary} />
              <Text style={[styles.buttonOutlineText, { color: theme.primary }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <TouchableOpacity
          style={styles.footerContainer}
          onPress={openPrivacyPolicy}
          activeOpacity={0.7}
        >
          <Text style={[styles.footerText, { color: theme.textLight }]}>
            By continuing, you agree to our{" "}
            <Text style={{ color: theme.primary, fontWeight: "600" }}>
              Terms of Service & Privacy Policy
            </Text>
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    height: "62%",
    width: "100%",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 32,
  },
  heroContent: {
    alignItems: "center",
  },
  titleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: "900",
    color: "#fff",
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
    marginTop: 12,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  contentGradient: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  buttonsContainer: {
    width: "100%",
    gap: 20,
    marginTop: -50,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12, // ← fixed your last change (was 8, too small)
    borderRadius: 999,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  buttonOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10, // ← fixed (was 6)
    borderRadius: 999,
    borderWidth: 2.5,
    gap: 12,
  },
  buttonOutlineText: {
    fontSize: 18,
    fontWeight: "800",
  },
  footerContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});