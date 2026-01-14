// component/ListingHeader.jsx — FIXED: No syntax errors, no bouncing underline
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Animated,
  Dimensions,
} from 'react-native';
import { useListingTab } from '../context/ListingTabContext';

const { width } = Dimensions.get('window');
const TAB_WIDTH = width / 2;

export default function ListingHeader() {
  const { activeTab, setActiveTab } = useListingTab();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const animatedValue = useRef(new Animated.Value(activeTab === 'houses' ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: activeTab === 'houses' ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
  }, [activeTab]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TAB_WIDTH],
  });

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('houses')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'houses' && styles.activeText,
              { color: activeTab === 'houses' ? '#017a6b' : (isDark ? '#aaa' : '#777') },
            ]}
          >
            Houses & Apartments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('hotels')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'hotels' && styles.activeText,
              { color: activeTab === 'hotels' ? '#017a6b' : (isDark ? '#aaa' : '#777') },
            ]}
          >
            Hotels & Resorts
          </Text>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.underline,
            { transform: [{ translateX }] },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    width: TAB_WIDTH * 2,
    position: 'relative',
  },
  tab: {
    width: TAB_WIDTH,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeText: {
    fontWeight: '700',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    width: TAB_WIDTH - 32,
    height: 3,
    backgroundColor: '#017a6b',
    borderRadius: 2,
  },
});