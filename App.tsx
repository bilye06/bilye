import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';

// --- Tür Tanımlamaları ---
interface Restaurant {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  cuisine: string;
  image: string;
  description: string;
}

const RESTAURANTS = [
  { id: '1', name: 'Süper Burger', rating: 4.7, reviews: 250, cuisine: 'Burger', image: 'https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480/img/recipe/ras/Assets/102cf51c-9220-4278-8b63-2b9611ad275e/Derivates/3831dbe2-352e-4409-a2e2-fc87d11cab0a.jpg', description: 'Taze malzemelerle hazırlanan nefis burgerler ve patates kızartması. Şehrin en popüler burger mekanı!' },
  { id: '2', name: 'Pide Sarayı', rating: 4.5, reviews: 180, cuisine: 'Türk Mutfağı', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRub9MHB_c_4mWo06bzzhjDUHrW008_rNbhMg&s', description: 'Geleneksel Türk mutfağının en lezzetli örnekleri. Özel fırında pişirilen pide ve lahmacun çeşitleri.' },
  { id: '3', name: 'Lezzet Balık', rating: 4.8, reviews: 120, cuisine: 'Deniz Ürünleri', image: 'https://cdn.firsatbufirsat.com/files/images/deal-image/image/1200x1200/859/8592662_44ad.jpg?r=1', description: 'Günlük taze balık ve deniz ürünleri. Özel soslar ve mezelerle servis edilen nefis deniz mahsulleri.' },
];

const Stack = createStackNavigator();

// --- 1. Ana Ekran (Liste) ---
const HomeScreen = ({ navigation }: any) => {
  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('Details', { restaurant: item })}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSubtitle}>{item.cuisine} • ⭐{item.rating}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bilye</Text>
        <TextInput style={styles.searchBar} placeholder="Restoran arayın..." />
      </View>
      <FlatList
        data={RESTAURANTS}
        renderItem={renderRestaurant}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
};

// --- 2. Detay Ekranı ---
const DetailsScreen = ({ route, navigation }: any) => {
  const { restaurant } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: restaurant.image }} style={styles.detailImage} />
      <View style={styles.detailContent}>
        <Text style={styles.detailTitle}>{restaurant.name}</Text>
        <Text style={styles.detailInfo}>{restaurant.cuisine} • ⭐{restaurant.rating} ({restaurant.reviews} yorum)</Text>
        <View style={styles.divider} />
        <Text style={styles.descriptionTitle}>Hakkında</Text>
        <Text style={styles.descriptionText}>{restaurant.description}</Text>
        
        <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Menü özelliği yakında!')}>
          <Text style={styles.buttonText}>Menüyü Gör</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// --- Ana Uygulama Yapısı ---
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Details" component={DetailsScreen} options={{ title: 'Restoran Detayı' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#ff6b6b' },
  searchBar: { backgroundColor: '#f1f3f5', padding: 12, borderRadius: 10, marginTop: 10 },
  listContainer: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 15, marginBottom: 20, elevation: 4, overflow: 'hidden' },
  cardImage: { width: '100%', height: 150 },
  cardInfo: { padding: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardSubtitle: { color: '#868e96', marginTop: 5 },
  // Detay Sayfası Stilleri
  detailImage: { width: '100%', height: 250 },
  detailContent: { padding: 20 },
  detailTitle: { fontSize: 26, fontWeight: 'bold' },
  detailInfo: { fontSize: 16, color: '#495057', marginVertical: 10 },
  divider: { height: 1, backgroundColor: '#dee2e6', marginVertical: 15 },
  descriptionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  descriptionText: { fontSize: 16, color: '#495057', lineHeight: 24 },
  button: { backgroundColor: '#ff6b6b', padding: 15, borderRadius: 10, marginTop: 30, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});