import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, ActivityIndicator, 
  TouchableOpacity, LayoutAnimation, Platform, UIManager,
  Linking, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from './lib/supabase'; // Check your path
import opening_hours from 'opening_hours';

// 1. ENABLE ANIMATION FOR ANDROID
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function DetailsScreen({ route }) {
  const { id } = route.params;
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  
    const openMapDirections = () => {
        if (!details || !details.location) return;

        const lat = details.location.latitude;
        const lng = details.location.longitude;
        const label = encodeURIComponent(details.name); // Handles spaces in name

        const url = Platform.select({
        // iOS: Opens Apple Maps with a pin. User clicks "Go" to start navigation.
        ios: `maps:0,0?q=${label}@${lat},${lng}`,
        
        // Android: Opens Google Maps.
        android: `geo:0,0?q=${lat},${lng}(${label})`
        });

        Linking.openURL(url).catch(err => 
        console.error("Couldn't load page", err)
        );
    };

  const makeCall = () => {
    // 1. Safety Check: Does the venue actually have a phone number?
    if (!details.phone) {
      Alert.alert("Info", "This venue has not provided a contact number.");
      return;
    }

    // 2. Open the dialer
    // This works identically on iOS and Android
    Linking.openURL(`tel:${details.phone}`);
  };

  // 2. NEW STATE FOR EXPANSION
  const [menuExpanded, setMenuExpanded] = useState(false);

  const USER_LAT = 39.8700;
  const USER_LONG = 32.7500;

  useEffect(() => {
    fetchDetails();
  }, []);

  const fetchDetails = async () => {
    const { data, error } = await supabase.rpc('get_establishment_details', {
      input_id: id,
      user_lat: USER_LAT,
      user_long: USER_LONG
    });

    if (error) console.error(error);
    else setDetails(data);
    
    setLoading(false);
  };

  // 3. TOGGLE FUNCTION
  const toggleMenu = () => {
    // This one line makes the transition smooth!
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMenuExpanded(!menuExpanded);
  };

  const getOpenStatus = (hoursString) => {
    if (!hoursString) return { text: 'No hours info', color: '#666' };
    try {
      const isOpen = new opening_hours(hoursString).getState(new Date());
      return isOpen 
        ? { text: 'Open Now', color: 'green' } 
        : { text: 'Closed', color: 'red' };
    } catch (e) {
      return { text: 'Hours available', color: '#666' };
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!details) return null;

  const status = getOpenStatus(details.opening_hours);

  // 4. PREPARE MENU DATA
  // Convert object { "Burgers": [...], "Drinks": [...] } into Array [ ["Burgers", [...]], ... ]
  const allMenuEntries = details.menu ? Object.entries(details.menu) : [];
  
  // Logic: If expanded, show everything. If not, show only the 1st category.
  const categoriesToShow = menuExpanded ? allMenuEntries : allMenuEntries.slice(0, 1);

  return (
    <ScrollView style={styles.container}>
      
      {/* HEADER SECTION (Same as before) */}
      <View style={styles.header}>
        <Text style={styles.title}>{details.name}</Text>
        <Text style={styles.subtitle}>
            {details.amenity} • {Math.round(details.distance_meters)}m away
        </Text>
        
        <View style={styles.ratingRow}>
            <Ionicons name="star" size={18} color="#FFD700" />
            <Text style={styles.rating}>{details.stats.rating.toFixed(1)}</Text>
            <Text style={styles.count}>({details.stats.count} reviews)</Text>
            <Text style={[styles.status, { color: status.color }]}>
                • {status.text}
            </Text>
        </View>

        <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={makeCall}>
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={openMapDirections}>
                <Ionicons name="navigate" size={20} color="#fff" />
                <Text style={styles.actionText}>Directions</Text>
            </TouchableOpacity>
        </View>
      </View>

      {/* --- MENU SECTION (UPDATED) --- */}
      {allMenuEntries.length > 0 && (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Menu</Text>
            
            {/* Map through the filtered categories */}
            {categoriesToShow.map(([category, items]) => {
                
                // Logic: If NOT expanded, show max 3 items. If expanded, show all.
                const displayItems = menuExpanded ? items : items.slice(0, 3);

                return (
                    <View key={category} style={styles.menuCategory}>
                        <Text style={styles.categoryTitle}>{category}</Text>
                        {displayItems.map((item, index) => (
                            <View key={index} style={styles.menuItem}>
                                <View style={{flex: 1}}>
                                    <Text style={styles.menuName}>{item.name}</Text>
                                    {item.description && (
                                        <Text style={styles.menuDesc}>{item.description}</Text>
                                    )}
                                </View>
                                <Text style={styles.menuPrice}>₺{item.price}</Text>
                            </View>
                        ))}
                    </View>
                );
            })}

            {/* 5. THE EXPAND BUTTON */}
            <TouchableOpacity style={styles.expandBtn} onPress={toggleMenu}>
                <Text style={styles.expandText}>
                    {menuExpanded ? "Show Less" : "View Full Menu"}
                </Text>
                <Ionicons 
                    name={menuExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#2196F3" 
                />
            </TouchableOpacity>
        </View>
      )}

      {/* REVIEWS SECTION (Same as before) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Latest Reviews</Text>
        {details.reviews && details.reviews.length > 0 ? (
            details.reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                        <Text style={styles.reviewerName}>
                            {review.user_name}
                            {review.is_verified && (
                                <Ionicons name="checkmark-circle" size={14} color="#2196F3" />
                            )}
                        </Text>
                        <View style={styles.starRow}>
                            <Ionicons name="star" size={12} color="#FFD700" />
                            <Text style={styles.reviewRating}>{review.rating}</Text>
                        </View>
                    </View>
                    <Text style={styles.reviewText}>{review.comment}</Text>
                    <Text style={styles.date}>
                        {new Date(review.created_at).toLocaleDateString()}
                    </Text>
                </View>
            ))
        ) : (
            <Text style={styles.emptyText}>No reviews yet.</Text>
        )}
      </View>

      <View style={{height: 40}} /> 
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header
  header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#222' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4, textTransform: 'capitalize' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  rating: { fontSize: 16, fontWeight: 'bold', marginLeft: 4 },
  count: { fontSize: 14, color: '#888', marginLeft: 4 },
  status: { fontSize: 14, fontWeight: '600', marginLeft: 10 },
  
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionBtn: { 
    flexDirection: 'row', backgroundColor: '#2196F3', 
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', gap: 6 
  },
  actionText: { color: '#fff', fontWeight: '600' },

  // Sections
  section: { marginTop: 16, backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#222' },

  // Menu
  menuCategory: { marginBottom: 20 },
  categoryTitle: { fontSize: 16, fontWeight: '700', color: '#2196F3', marginBottom: 8, textTransform: 'uppercase' },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  menuName: { fontSize: 16, fontWeight: '500' },
  menuDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  menuPrice: { fontSize: 16, fontWeight: 'bold', color: '#444' },

  // 6. NEW STYLES FOR BUTTON
  expandBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    gap: 8
  },
  expandText: {
    color: '#2196F3',
    fontWeight: 'bold',
    fontSize: 14
  },

  // Reviews
  reviewCard: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reviewerName: { fontWeight: '600', fontSize: 14 },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  reviewRating: { fontWeight: 'bold', fontSize: 12 },
  reviewText: { color: '#444', fontSize: 14, lineHeight: 20 },
  date: { fontSize: 11, color: '#999', marginTop: 6, textAlign: 'right' },
  emptyText: { color: '#888', fontStyle: 'italic' }
});