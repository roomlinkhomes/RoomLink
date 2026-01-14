// components/SellerReviewsList.jsx - Simple list of review comments
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { UserContext } from '../context/UserContext';
import { timeAgo } from '../utils/timeAgo'; // reuse your timeAgo

const SellerReviewsList = ({ userId }) => {
  const { getUserReviews } = useContext(UserContext);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const data = await getUserReviews(userId);
        setReviews(data || []);
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  if (loading) return <ActivityIndicator size="small" color="#28a745" style={{ margin: 20 }} />;

  if (reviews.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="chatbubbles-outline" size={40} color="#888" />
        <Text style={styles.emptyText}>No reviews yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Reviews about this seller</Text>
      <FlatList
        data={reviews}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.review}>
            <View style={styles.header}>
              <Text style={styles.reviewer}>{item.reviewerName || 'Anonymous'}</Text>
              <View style={styles.stars}>
                {[1,2,3,4,5].map(s => (
                  <Ionicons key={s} name={s <= item.rating ? 'star' : 'star-outline'} size={16} color="#FFD700" />
                ))}
              </View>
            </View>
            <Text style={styles.comment}>{item.comment || 'No comment'}</Text>
            <Text style={styles.date}>
              {item.timestamp ? timeAgo(item.timestamp.toDate()) : 'Recent'}
            </Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 24, paddingHorizontal: 16 },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  review: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewer: { fontWeight: '700', fontSize: 16 },
  stars: { flexDirection: 'row' },
  comment: { fontSize: 15, color: '#444', lineHeight: 22 },
  date: { fontSize: 12, color: '#888', marginTop: 8 },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#666', marginTop: 12 },
});

export default SellerReviewsList;