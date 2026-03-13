import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // or react-native-vector-icons

const { width, height } = Dimensions.get('window');

// Scattered subtle icons like Trove (financial theme: charts, arrows, diamonds, etc.)
const bgIcons = [
  { name: 'trending-up', lib: Ionicons, size: 50, color: '#00ff9d22' },
  { name: 'chart-line', lib: MaterialCommunityIcons, size: 60, color: '#ffffff15' },
  { name: 'arrow-up-bold-hexagon-outline', lib: MaterialCommunityIcons, size: 45, color: '#00ff9d1a' },
  { name: 'diamond', lib: MaterialCommunityIcons, size: 40, color: '#ffffff18' },
  { name: 'finance', lib: MaterialCommunityIcons, size: 55, color: '#00ff9d11' },
  { name: 'credit-card-outline', lib: Ionicons, size: 50, color: '#ffffff10' },
  { name: 'chart-pie', lib: MaterialCommunityIcons, size: 50, color: '#00ff9d22' },
  { name: 'bank-outline', lib: MaterialCommunityIcons, size: 45, color: '#ffffff12' },
  // Add 5–10 more if you want denser pattern
];

const SplashScreen = ({ navigation }) => {
  // Animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(50)).current;

  // Optional: subtle background pulse/fade (like breathing pattern)
  const bgOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Logo: fade + scale with overshoot
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Text: delayed fade + slide up
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 900,
          easing: Easing.out(Easing.back(1)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Optional subtle bg pulse (uncomment if you like it)
    // Animated.loop(
    //   Animated.sequence([
    //     Animated.timing(bgOpacity, { toValue: 0.8, duration: 3000, useNativeDriver: true }),
    //     Animated.timing(bgOpacity, { toValue: 0.6, duration: 3000, useNativeDriver: true }),
    //   ])
    // ).start();

    // Navigate after animations (~2–2.5s)
    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 2200);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Subtle scattered icons */}
      {bgIcons.map((icon, index) => {
        // Random but balanced positions
        const top = Math.random() * height * 0.9 + 50;
        const left = Math.random() * width * 0.9 + 20;
        const rot = Math.random() * 60 - 30; // slight tilt

        const IconLib = icon.lib;

        return (
          <IconLib
            key={index}
            name={icon.name}
            size={icon.size}
            color={icon.color}
            style={[
              styles.bgIcon,
              {
                top,
                left,
                transform: [{ rotate: `${rot}deg` }],
              },
            ]}
          />
        );
      })}

      {/* Centered logo + text */}
      <Animated.View
        style={[
          styles.centerContent,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require('../assets/roomlink-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Animated.Text
          style={[
            styles.appName,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          RoomLink
        </Animated.Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Trove-like deep dark
    // or try '#0a1a22' for slight blue-green tint
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bgIcon: {
    position: 'absolute',
    opacity: 0.07, // very faint – adjust 0.05–0.12
  },
  centerContent: {
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 24,
  },
  appName: {
    fontSize: 48,
    fontWeight: '900', // ultra bold
    color: '#ffffff',
    letterSpacing: 2,
    // textTransform: 'uppercase', // optional
    // fontFamily: 'Your-Bold-Font', // if custom font
  },
});

export default SplashScreen;