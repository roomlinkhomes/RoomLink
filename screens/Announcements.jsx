import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase'; // your firebase config file

export default function AnnouncementsScreen({ navigation }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const q = query(
          collection(db, 'announcements'),
          orderBy('date', 'desc') // newest first
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAnnouncements(data);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      className="mb-6 mx-4 bg-gray-800/80 rounded-2xl overflow-hidden border border-teal-900/30 shadow-lg"
      onPress={() => {
        if (item.link) {
          // Open link in WebView or navigate somewhere
          console.log('Open link:', item.link);
        }
      }}
    >
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          className="w-full h-48 object-cover"
          resizeMode="cover"
        />
      )}
      <View className="p-5">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-teal-400 font-medium text-sm uppercase">
            {item.category || 'Update'}
          </Text>
          <Text className="text-gray-400 text-xs">
            {item.date?.toDate
              ? item.date.toDate().toLocaleDateString()
              : item.date || 'Recent'}
          </Text>
        </View>
        <Text className="text-white font-bold text-lg mb-2">{item.title}</Text>
        <Text className="text-gray-300 text-base leading-6">
          {item.description}
        </Text>
        {item.link && (
          <Text className="mt-4 text-teal-400 font-medium">
            Read more →
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-gray-800">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>

        <Text className="flex-1 text-center text-white text-2xl font-bold">
          Announcements & News
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#14b8a6" />
          <Text className="text-gray-400 mt-4">Loading news...</Text>
        </View>
      ) : (
        <FlatList
          data={announcements}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-20 px-6">
              <Text className="text-gray-300 text-xl font-medium text-center">
                No announcements yet
              </Text>
              <Text className="text-gray-500 mt-3 text-center">
                We'll post updates, safety tips, new features, and more soon!
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </SafeAreaView>
  );
}