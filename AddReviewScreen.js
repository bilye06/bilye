import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  Image, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './lib/supabase';
import { uploadReviewImage } from './uploadHelper';

export default function AddReviewScreen({ route, navigation }) {
  const { establishment_id, establishment_name } = route.params;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- 1. IMAGE PICKER LOGIC ---
  const pickImage = async () => {
    // No permissions request is needed for launchImageLibraryAsync in modern Expo
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7, // Compress slightly for faster upload
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // --- 2. SUBMIT LOGIC ---
  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Missing Info", "Please tap a star to select a rating.");
      return;
    }
    if (comment.length < 5) {
      Alert.alert("Missing Info", "Please write a short review.");
      return;
    }

    setLoading(true);

    try {
      let finalImageUrl = null;

      // STEP A: Upload Image (if selected)
      if (imageUri) {
        // console.log('Uploading image...'); 
        finalImageUrl = await uploadReviewImage(imageUri);
      }

      // STEP B: Save to Database
      // console.log('Saving review...');
      const { error } = await supabase.rpc('post_review', {
        establishment_id: establishment_id,
        rating: rating,
        comment: comment,
        media_url: finalImageUrl 
      });

      if (error) throw error;

      Alert.alert("Success", "Review posted! Thank you.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);

    } catch (error) {
      console.error(error);
      Alert.alert("Error", error.message || "Failed to post review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        
        <Text style={styles.header}>Write a Review</Text>
        <Text style={styles.subHeader}>{establishment_name}</Text>

        {/* STAR RATING */}
        <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <Ionicons 
                        name={star <= rating ? "star" : "star-outline"} 
                        size={40} 
                        color="#FFD700" 
                    />
                </TouchableOpacity>
            ))}
        </View>
        <Text style={styles.ratingLabel}>
            {rating > 0 ? `${rating} Stars` : "Tap to Rate"}
        </Text>

        {/* TEXT INPUT */}
        <TextInput
            style={styles.input}
            placeholder="Share your experience... (Food, service, atmosphere)"
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
        />

        {/* IMAGE PICKER */}
        <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
            <Ionicons name="camera" size={24} color="#2196F3" />
            <Text style={styles.photoText}>
                {imageUri ? "Change Photo" : "Add Photo"}
            </Text>
        </TouchableOpacity>

        {/* IMAGE PREVIEW */}
        {imageUri && (
            <View style={styles.previewContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                <TouchableOpacity 
                    style={styles.removeBtn} 
                    onPress={() => setImageUri(null)}
                >
                    <Ionicons name="close-circle" size={24} color="red" />
                </TouchableOpacity>
            </View>
        )}

        {/* SUBMIT BUTTON */}
        <TouchableOpacity 
            style={[styles.submitBtn, loading && styles.disabledBtn]} 
            onPress={handleSubmit}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.submitText}>Post Review</Text>
            )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 24 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  subHeader: { fontSize: 18, color: '#666', marginBottom: 30, marginTop: 4 },
  
  starsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 10 },
  ratingLabel: { textAlign: 'center', fontSize: 16, color: '#666', marginBottom: 30 },
  
  input: {
    backgroundColor: '#f9f9f9', padding: 16, borderRadius: 12, fontSize: 16, minHeight: 120,
    borderWidth: 1, borderColor: '#eee', marginBottom: 20
  },
  
  photoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: 14, borderWidth: 1, borderColor: '#2196F3', borderRadius: 12, borderStyle: 'dashed'
  },
  photoText: { color: '#2196F3', fontWeight: '600', fontSize: 16 },

  previewContainer: { marginTop: 20, alignItems: 'center', position: 'relative' },
  previewImage: { width: '100%', height: 200, borderRadius: 12 },
  removeBtn: { position: 'absolute', top: -10, right: -10, backgroundColor: '#fff', borderRadius: 20 },

  submitBtn: {
    backgroundColor: '#2196F3', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 30,
    elevation: 2, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.2
  },
  disabledBtn: { backgroundColor: '#ccc' },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});