// screens/HotelBookingScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  useColorScheme,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Amenity icons & labels
const amenityIcons = {
  wifi: { icon: "wifi", color: "#4CAF50" },
  ac: { icon: "snow-outline", color: "#2196F3" },
  kitchen: { icon: "restaurant-outline", color: "#FF5722" },
  pool: { icon: "water-outline", color: "#00BCD4" },
  gym: { icon: "fitness-outline", color: "#F44336" },
  parking: { icon: "car-outline", color: "#607D8B" },
  tv: { icon: "tv-outline", color: "#9C27B0" },
  hotwater: { icon: "flame-outline", color: "#FF5722" },
  security: { icon: "shield-outline", color: "#4CAF50" },
  power: { icon: "flash-outline", color: "#FFC107" },
  balcony: { icon: "leaf-outline", color: "#8BC34A" },
  laundry: { icon: "shirt-outline", color: "#795548" },
  workspace: { icon: "laptop-outline", color: "#3F51B5" },
  smartlock: { icon: "lock-closed-outline", color: "#673AB7" },
  selfcheckin: { icon: "key-outline", color: "#009688" },
  elevator: { icon: "arrow-up-circle-outline", color: "#607D8B" },
  washingmachine: { icon: "shirt-outline", color: "#795548" },
  dryer: { icon: "sunny-outline", color: "#FF9800" },
  iron: { icon: "sparkles-outline", color: "#FFEB3B" },
  hairdryer: { icon: "brush-outline", color: "#E91E63" },
  firstaid: { icon: "medkit-outline", color: "#F44336" },
  smokedetector: { icon: "alert-circle-outline", color: "#FF5722" },
  garden: { icon: "flower-outline", color: "#4CAF50" },
  rooftop: { icon: "sunny-outline", color: "#FFC107" },
  oceanview: { icon: "water-outline", color: "#00BCD4" },
  cityview: { icon: "business-outline", color: "#607D8B" },
  towels: { icon: "bed-outline", color: "#9C27B0" },
  toiletries: { icon: "water-outline", color: "#2196F3" },
  wheelchair: { icon: "accessibility-outline", color: "#4CAF50" },
  highspeedwifi: { icon: "wifi-outline", color: "#4CAF50" },
  streaming: { icon: "play-circle-outline", color: "#E91E63" },
  crib: { icon: "bed-outline", color: "#FFC107" },
  highchair: { icon: "restaurant-outline", color: "#FF5722" },
  extrabedding: { icon: "bed-outline", color: "#9C27B0" },
  roomservice: { icon: "restaurant-outline", color: "#FF5722" },
  privatepool: { icon: "water-outline", color: "#00BCD4" },
  jacuzzi: { icon: "water-outline", color: "#00BCD4" },
  sauna: { icon: "thermometer-outline", color: "#F44336" },
  concierge: { icon: "call-outline", color: "#673AB7" },
};

const amenityLabels = {
  wifi: "WiFi",
  ac: "Air Conditioning",
  kitchen: "Kitchen",
  pool: "Swimming Pool",
  gym: "Gym / Fitness Center",
  parking: "Free Parking",
  tv: "Smart TV",
  hotwater: "Hot Water",
  security: "24/7 Security",
  power: "24/7 Power Supply",
  balcony: "Balcony / Terrace",
  laundry: "Laundry",
  workspace: "Workspace / Desk",
  smartlock: "Smart Lock",
  selfcheckin: "Self Check-in",
  elevator: "Elevator / Lift",
  washingmachine: "Washing Machine",
  dryer: "Dryer",
  iron: "Iron & Ironing Board",
  hairdryer: "Hair Dryer",
  firstaid: "First Aid Kit",
  smokedetector: "Smoke Detector",
  garden: "Garden / Courtyard",
  rooftop: "Rooftop Access",
  oceanview: "Ocean View",
  cityview: "City View",
  towels: "Towels & Linens",
  toiletries: "Shampoo & Body Wash",
  wheelchair: "Wheelchair Accessible",
  highspeedwifi: "High-Speed Internet",
  streaming: "Streaming Services",
  crib: "Crib / Baby Cot",
  highchair: "High Chair",
  extrabedding: "Extra Pillows & Blankets",
  roomservice: "Room Service",
  privatepool: "Private Pool",
  jacuzzi: "Jacuzzi / Hot Tub",
  sauna: "Sauna",
  concierge: "Concierge Service",
};

// House Rules icons & labels
const houseRuleIcons = {
  nosmoking: { icon: "close-circle-outline", color: "#F44336" },
  noparties: { icon: "beer-outline", color: "#9C27B0" },
  nopets: { icon: "paw-outline", color: "#795548" },
  quiethours: { icon: "volume-mute-outline", color: "#607D8B" },
  checkinafter3pm: { icon: "time-outline", color: "#2196F3" },
  checkoutbefore11am: { icon: "time-outline", color: "#2196F3" },
  noshoes: { icon: "footsteps-outline", color: "#4CAF50" },
  novisitors: { icon: "people-outline", color: "#F44336" },
  noextraguests: { icon: "person-add-outline", color: "#F44336" },
  maxoccupancy: { icon: "people-outline", color: "#F44336" },
  noloudmusic: { icon: "musical-notes-outline", color: "#9C27B0" },
  nonoise: { icon: "volume-mute-outline", color: "#607D8B" },
  nostrongodors: { icon: "restaurant-outline", color: "#FF5722" },
  noillegal: { icon: "warning-outline", color: "#F44336" },
  respectneighbors: { icon: "hand-left-outline", color: "#4CAF50" },
  childsupervision: { icon: "alert-circle-outline", color: "#FF9800" },
  norunning: { icon: "walk-outline", color: "#F44336" },
  lockdoors: { icon: "lock-closed-outline", color: "#673AB7" },
  leaveclean: { icon: "sparkles-outline", color: "#FFEB3B" },
  nodamage: { icon: "warning-outline", color: "#F44336" },
  reportissues: { icon: "chatbox-ellipses-outline", color: "#2196F3" },
  nodrones: { icon: "airplane-outline", color: "#607D8B" },
  noopenflames: { icon: "flame-outline", color: "#F44336" },
  novaping: { icon: "cloudy-outline", color: "#9C27B0" },
  returnkeys: { icon: "key-outline", color: "#673AB7" },
  nounauthorizedparties: { icon: "people-outline", color: "#F44336" },
};

const houseRuleLabels = {
  nosmoking: "No Smoking",
  noparties: "No Parties / Events",
  nopets: "No Pets",
  quiethours: "Quiet Hours 10pm-7am",
  checkinafter3pm: "Check-in after 3pm",
  checkoutbefore11am: "Check-out before 11am",
  noshoes: "No Shoes Inside",
  novisitors: "No Visitors / Overnight Guests",
  noextraguests: "No Additional Guests Beyond Booking",
  maxoccupancy: "Maximum Occupancy: 2-6 Guests",
  noloudmusic: "No Loud Music After 10pm",
  nonoise: "Keep Noise to a Minimum",
  nostrongodors: "No Cooking with Strong Odors",
  noillegal: "No Illegal Activities",
  respectneighbors: "Respect Neighbors",
  childsupervision: "Children Must Be Supervised",
  norunning: "No Running in the House",
  lockdoors: "Lock Doors When Leaving",
  leaveclean: "Leave Property Clean",
  nodamage: "No Damage to Property",
  reportissues: "Report Any Issues Immediately",
  nodrones: "No Drones Inside/On Property",
  noopenflames: "No Open Flames / Candles",
  novaping: "No Vaping Inside",
  returnkeys: "Return Keys / Fobs on Departure",
  nounauthorizedparties: "No Unauthorized Parties",
};

export default function HotelBookingScreen({ route }) {
  const { listing } = route.params || {};
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const navigation = useNavigation();

  const images = listing?.images || [];
  const pricePerNight = listing?.pricePerNight || 0;

  const amenities = Array.isArray(listing?.amenities)
    ? listing.amenities.map(a => typeof a === 'string' ? a.toLowerCase() : (a?.name?.toLowerCase() || 'unknown'))
    : [];

  const houseRules = Array.isArray(listing?.houseRules)
    ? listing.houseRules.map(r => typeof r === 'string' ? r.toLowerCase() : (r?.name?.toLowerCase() || 'unknown'))
    : [];

  const [showMoreAmenities, setShowMoreAmenities] = useState(false);
  const [showMoreRules, setShowMoreRules] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showCheckOut, setShowCheckOut] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const onChangeCheckIn = (event, selectedDate) => {
    setShowCheckIn(Platform.OS === "ios");
    if (selectedDate) {
      setCheckIn(selectedDate);
      setCheckOut(null);
    }
  };

  const onChangeCheckOut = (event, selectedDate) => {
    setShowCheckOut(Platform.OS === "ios");
    if (selectedDate && checkIn && selectedDate > checkIn) {
      setCheckOut(selectedDate);
    }
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diffTime = Math.abs(checkOut - checkIn);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const totalPrice = nights * pricePerNight;

  const formatDate = (date) => {
    if (!date) return "Select date";
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const openGallery = () => {
    if (images.length > 0) {
      navigation.navigate("GalleryScreen", {
        images,
        initialIndex: currentImageIndex,
      });
    }
  };

  const handleContinue = () => {
    if (!checkIn || !checkOut) {
      Alert.alert("Select Dates", "Please choose check-in and check-out dates.");
      return;
    }

    if (nights < 1) {
      Alert.alert("Invalid Dates", "Check-out must be after check-in.");
      return;
    }

    navigation.navigate("GuestDetails", {
      listing,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      nights,
      pricePerNight,
      totalAmount: totalPrice,
      // Feel free to pass more if your GuestDetails screen needs them:
      // listingTitle: listing.title,
      // listingLocation: listing.location,
      // thumbnail: images[0] || null,
    });
  };

  if (!listing) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: isDark ? "#fff" : "#000", fontSize: 18 }}>No listing selected</Text>
      </View>
    );
  }

  const displayedAmenities = showMoreAmenities ? amenities : amenities.slice(0, 10);
  const displayedRules = showMoreRules ? houseRules : houseRules.slice(0, 10);

  const hasDates = checkIn && checkOut && nights > 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? "#121212" : "#fff" }]}>
      {/* Curved Bottom Gallery */}
      <View style={styles.imageGalleryContainer}>
        <TouchableOpacity activeOpacity={0.95} onPress={openGallery}>
          <View style={styles.curvedWrapper}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setCurrentImageIndex(index);
              }}
            >
              {images.length > 0 ? (
                images.map((img, idx) => (
                  <Image key={idx} source={{ uri: img }} style={styles.heroImage} resizeMode="cover" />
                ))
              ) : (
                <View style={[styles.heroImage, styles.noImageContainer]}>
                  <Ionicons name="image-outline" size={60} color="#999" />
                  <Text style={styles.noImageText}>No Photo Available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>

        {/* Clean Back Arrow */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButtonOverlay}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="arrow-back" size={32} color="#fff" />
        </TouchableOpacity>

        {/* Image Counter */}
        {images.length > 1 && (
          <View style={styles.imageCounter}>
            <Text style={styles.counterText}>
              {currentImageIndex + 1} / {images.length}
            </Text>
          </View>
        )}

        {/* Fullscreen Hint */}
        {images.length > 0 && (
          <View style={styles.fullscreenHint}>
            <Ionicons name="expand-outline" size={24} color="#fff" />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>{listing.title}</Text>
        <Text style={[styles.location, { color: isDark ? "#aaa" : "#666" }]}>
          <Ionicons name="location-outline" size={16} color="#017a6b" />
          {" "}{listing.location}
        </Text>
        <Text style={styles.price}>
          ₦{pricePerNight.toLocaleString()}
          <Text style={styles.perNight}> / night</Text>
        </Text>

        {/* Date Selection */}
        <View style={styles.dateSection}>
          <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#000" }]}>Select Dates</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.datePicker} onPress={() => setShowCheckIn(true)}>
              <Ionicons name="calendar-outline" size={20} color="#017a6b" />
              <Text style={styles.dateText}>Check-in: {formatDate(checkIn)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.datePicker}
              onPress={() => setShowCheckOut(true)}
              disabled={!checkIn}
            >
              <Ionicons name="calendar-outline" size={20} color="#017a6b" />
              <Text style={[styles.dateText, !checkIn && { color: "#aaa" }]}>
                Check-out: {formatDate(checkOut)}
              </Text>
            </TouchableOpacity>
          </View>

          {nights > 0 && (
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total for {nights} night{nights > 1 ? "s" : ""}</Text>
              <Text style={styles.totalPrice}>₦{totalPrice.toLocaleString()}</Text>
            </View>
          )}
        </View>

        {/* Amenities */}
        {amenities.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#000" }]}>Amenities</Text>
            <View style={styles.listContainer}>
              {displayedAmenities.map((amenity, index) => {
                const amenityStr = amenity.toLowerCase();
                const iconData = amenityIcons[amenityStr] || { icon: "checkmark-circle-outline", color: "#757575" };
                return (
                  <View key={index} style={styles.listItem}>
                    <Ionicons name={iconData.icon} size={28} color={iconData.color} />
                    <Text style={[styles.listText, { color: isDark ? "#ddd" : "#333" }]}>
                      {amenityLabels[amenityStr] || amenityStr.charAt(0).toUpperCase() + amenityStr.slice(1)}
                    </Text>
                  </View>
                );
              })}
              {amenities.length > 10 && !showMoreAmenities && (
                <TouchableOpacity onPress={() => setShowMoreAmenities(true)}>
                  <Text style={styles.viewMoreText}>View More Amenities ({amenities.length - 10} more)</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* House Rules */}
        {houseRules.length > 0 && (
          <View style={[styles.section, { marginTop: 40 }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#000" }]}>House Rules</Text>
            <View style={styles.listContainer}>
              {displayedRules.map((rule, index) => {
                const ruleStr = rule.toLowerCase();
                const iconData = houseRuleIcons[ruleStr] || { icon: "information-circle-outline", color: "#757575" };
                return (
                  <View key={index} style={styles.listItem}>
                    <Ionicons name={iconData.icon} size={28} color={iconData.color} />
                    <Text style={[styles.listText, { color: isDark ? "#ddd" : "#333" }]}>
                      {houseRuleLabels[ruleStr] || ruleStr.charAt(0).toUpperCase() + ruleStr.slice(1)}
                    </Text>
                  </View>
                );
              })}
              {houseRules.length > 10 && !showMoreRules && (
                <TouchableOpacity onPress={() => setShowMoreRules(true)}>
                  <Text style={styles.viewMoreText}>View More Rules ({houseRules.length - 10} more)</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Warning */}
        <View style={styles.warningBox}>
          <Ionicons name="alert-circle-outline" size={28} color="#FF9500" />
          <Text style={styles.warningText}>
            Booking is final and non-refundable after payment. Please enter correct guest details on the next screen.
          </Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.payButton,
            !hasDates && { opacity: 0.6, backgroundColor: "#999" },
          ]}
          onPress={handleContinue}
          disabled={loading || !hasDates}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons
                name={hasDates ? "arrow-forward" : "calendar-outline"}
                size={24}
                color="#fff"
              />
              <Text style={styles.payButtonText}>
                {hasDates ? "Continue" : "Select Dates to Continue"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </View>

      {/* Date Pickers */}
      {showCheckIn && (
        <DateTimePicker
          value={checkIn || new Date()}
          mode="date"
          minimumDate={new Date()}
          onChange={onChangeCheckIn}
        />
      )}
      {showCheckOut && (
        <DateTimePicker
          value={checkOut || new Date(checkIn?.getTime() + 86400000 || Date.now())}
          mode="date"
          minimumDate={checkIn ? new Date(checkIn.getTime() + 86400000) : new Date()}
          onChange={onChangeCheckOut}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  imageGalleryContainer: {
    position: "relative",
    width: "100%",
    height: 360,
    overflow: "hidden",
  },
  curvedWrapper: {
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: "hidden",
    height: "100%",
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: 360,
  },
  noImageContainer: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: { marginTop: 12, fontSize: 16, color: "#999" },

  backButtonOverlay: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    left: 16,
    zIndex: 10,
  },

  imageCounter: {
    position: "absolute",
    bottom: 28,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  counterText: { color: "#fff", fontSize: 14, fontWeight: "bold" },

  fullscreenHint: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 8,
    borderRadius: 20,
  },

  content: { padding: 20, paddingTop: 28 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 8 },
  location: { fontSize: 16, marginBottom: 20, fontWeight: "500" },
  price: { fontSize: 25, fontWeight: "700", color: "#017a6b", marginBottom: 24 },
  perNight: { fontSize: 18, fontWeight: "normal", color: "#666" },
  dateSection: { marginBottom: 36 },
  sectionTitle: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  dateRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  datePicker: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  dateText: { marginLeft: 12, fontSize: 16 },
  totalBox: {
    backgroundColor: "#000",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 12,
  },
  totalLabel: { color: "#fff", fontSize: 18, fontWeight: "600" },
  totalPrice: { color: "#fff", fontSize: 32, fontWeight: "900", marginTop: 8 },
  listContainer: { marginTop: 8 },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  listText: { marginLeft: 16, fontSize: 16, flex: 1 },
  viewMoreText: {
    color: "#017a6b",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  warningBox: {
    flexDirection: "row",
    backgroundColor: "#fff8f0",
    padding: 20,
    borderRadius: 16,
    marginVertical: 40,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#ffd8a8",
  },
  warningText: {
    marginLeft: 12,
    flex: 1,
    fontSize: 15,
    color: "#888",
    lineHeight: 22,
    fontWeight: "500",
  },
  payButton: {
    backgroundColor: "#017a6b",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 20,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    marginBottom: 20,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 12,
  },
});