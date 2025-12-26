import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, ActivityIndicator, 
  TouchableOpacity, LayoutAnimation, Platform, UIManager,
  Linking, Alert, Image, Modal, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from './lib/supabase'; 
import opening_hours from 'opening_hours';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const { width, height } = Dimensions.get('window');

export default function DetailsScreen({ route, navigation }) {
  const { id } = route.params;
  
  // Data State
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [menuExpanded, setMenuExpanded] = useState(false);
  
  // Image Popup State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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

    if (error) {
      console.error(error);
      Alert.alert("Error", "Could not load details.");
    } else {
      setDetails(data);
    }
    setLoading(false);
  };

  // --- ACTIONS ---

  const makeCall = () => {
    if (!details.phone) {
      Alert.alert("Info", "No phone number available.");
      return;
    }
    Linking.openURL(`tel:${details.phone}`);
  };

  const openMapDirections = () => {
    if (!details || !details.location) return;
    const lat = details.location.latitude;
    const lng = details.location.longitude;
    const label = encodeURIComponent(details.name);

    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`
    });

    Linking.openURL(url);
  };

  const goToAddReview = () => {
    navigation.navigate('AddReview', {
      establishment_id: details.id,
      establishment_name: details.name
    });
  };

  const toggleMenu = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMenuExpanded(!menuExpanded);
  };

  // --- IMAGE HELPER ---
  // Removes query params (thumbnail logic) to get the original file
  const getFullSizeUrl = (url) => {
    if (!url) return null;
    return url.split('?')[0]; 
  };

  const handleImagePress = (thumbnailUrl) => {
    const fullSize = getFullSizeUrl(thumbnailUrl);
    setSelectedImage(fullSize);
    setModalVisible(true);
  };

  // --- RENDER HELPERS ---

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
  const allMenuEntries = details.menu ? Object.entries(details.menu) : [];
  const categoriesToShow = menuExpanded ? allMenuEntries : allMenuEntries.slice(0, 1);

  return (
    <View style={{flex: 1}}>
      <ScrollView style={styles.container}>
        
        {/* HEADER SECTION */}
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

          {/* ACTION BUTTONS (SIDE BY SIDE) */}
          <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={makeCall}>
                  <Ionicons name="call" size={20} color="#fff" />
                  <Text style={styles.actionText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={openMapDirections}>
                  <Ionicons name="navigate" size={20} color="#fff" />
                  <Text style={styles.actionText}>Go</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={goToAddReview}>
                  <Ionicons name="create" size={20} color="#fff" />
                  <Text style={styles.actionText}>Review</Text>
              </TouchableOpacity>
          </View>
        </View>

        {/* MENU SECTION */}
        {allMenuEntries.length > 0 && (
          <View style={styles.section}>
              <Text style={styles.sectionTitle}>Menu</Text>
              {categoriesToShow.map(([category, items]) => {
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
              <TouchableOpacity style={styles.expandBtn} onPress={toggleMenu}>
                  <Text style={styles.expandText}>
                      {menuExpanded ? "Show Less" : "View Full Menu"}
                  </Text>
                  <Ionicons name={menuExpanded ? "chevron-up" : "chevron-down"} size={20} color="#2196F3" />
              </TouchableOpacity>
          </View>
        )}

        {/* REVIEWS SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Reviews</Text>
          {details.reviews && details.reviews.length > 0 ? (
              details.reviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                          <Text style={styles.reviewerName}>
                              {review.user_name}
                              {review.is_verified && (
                                  <Ionicons name="checkmark-circle" size={14} color="#2196F3" style={{marginLeft: 4}}/>
                              )}
                          </Text>
                          <View style={styles.starRow}>
                              <Ionicons name="star" size={12} color="#FFD700" />
                              <Text style={styles.reviewRating}>{review.rating}</Text>
                          </View>
                      </View>

                      <View style={styles.reviewBody}>
                          {/* REVIEW TEXT */}
                          <View style={{flex: 1}}>
                            <Text style={styles.reviewText}>{review.comment}</Text>
                            <Text style={styles.date}>
                                {new Date(review.created_at).toLocaleDateString()}
                            </Text>
                          </View>

                          {/* THUMBNAIL IMAGE (CLICKABLE) */}
                          {review.photo_url && (
                             <TouchableOpacity onPress={() => handleImagePress(review.photo_url)}>
                                <Image 
                                    source={{ uri: review.photo_url }} 
                                    style={styles.reviewThumbnail} 
                                />
                             </TouchableOpacity>
                          )}
                      </View>
                  </View>
              ))
          ) : (
              <Text style={styles.emptyText}>No reviews yet.</Text>
          )}
        </View>

        <View style={{height: 40}} /> 
      </ScrollView>

      {/* --- FULL SCREEN IMAGE POPUP (MODAL) --- */}
      <Modal 
        visible={modalVisible} 
        transparent={true} 
        animationType="fade"
        onRequestClose={() => setModalVisible(false)} // Android Back Button
      >
        <View style={styles.modalBackground}>
            <TouchableOpacity 
                style={styles.modalCloseArea} 
                onPress={() => setModalVisible(false)} 
            />
            
            {selectedImage && (
                <Image 
                    source={{ uri: selectedImage }} 
                    style={styles.fullImage} 
                    resizeMode="contain"
                />
            )}

            <TouchableOpacity 
                style={styles.closeBtn} 
                onPress={() => setModalVisible(false)}
            >
                <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
        </View>
      </Modal>
    </View>
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
    flex: 1, flexDirection: 'row', backgroundColor: '#2196F3', 
    paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' 
  },
  actionText: { color: '#fff', fontWeight: '600', marginLeft: 6, fontSize: 14 },

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
  expandBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, marginTop: 10, backgroundColor: '#e3f2fd', borderRadius: 8, gap: 8 },
  expandText: { color: '#2196F3', fontWeight: 'bold', fontSize: 14 },

  // Reviews
  reviewCard: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reviewerName: { fontWeight: '600', fontSize: 14 },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  reviewRating: { fontWeight: 'bold', fontSize: 12 },
  
  // Review Body Layout
  reviewBody: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewText: { color: '#444', fontSize: 14, lineHeight: 20, paddingRight: 10 },
  reviewThumbnail: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#ddd' },
  date: { fontSize: 11, color: '#999', marginTop: 6 },
  emptyText: { color: '#888', fontStyle: 'italic' },

  // Modal / Popup Styles
  modalBackground: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.9)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalCloseArea: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0
  },
  fullImage: {
    width: width,
    height: height * 0.7,
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20
  }
});