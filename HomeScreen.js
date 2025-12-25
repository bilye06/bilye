import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "./lib/supabase";
import opening_hours from "opening_hours";

export default function HomeScreen({navigation}) {
  // --- Data States ---
  const [rawData, setRawData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Filter States ---
  const [searchText, setSearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Client-Side Filter
  const [onlyOpen, setOnlyOpen] = useState(true);

  // Server-Side Filters
  const [selectedType, setSelectedType] = useState("all"); // 'all', 'restaurant', 'cafe'
  const [minRating, setMinRating] = useState(0); // 0, 3, 4, 4.5
  const [onlyPopular, setOnlyPopular] = useState(false); // If true, min_review_count = 10

  // Hardcoded Location (Ankara)
  const USER_LAT = 39.87;
  const USER_LONG = 32.75;

  // 1. FETCH DATA (Server-Side)
  const fetchEstablishments = async () => {
    setLoading(true);

    const amenityFilter = selectedType === "all" ? null : selectedType;
    // If "Popular" is checked, we ask for min 10 reviews, otherwise 0
    const reviewCountFilter = onlyPopular ? 10 : 0;

    const { data: establishments, error } = await supabase.rpc(
      "get_establishments",
      {
        user_lat: USER_LAT,
        user_long: USER_LONG,
        radius_meters: 5000,
        search_text: searchText.length > 0 ? searchText : null,
        filter_amenity: amenityFilter,
        min_rating: minRating,
        min_review_count: reviewCountFilter,
        page_size: 50,
        page_number: 0,
      }
    );

    if (error) {
      console.error("Error fetching data:", error);
    } else {
      setRawData(establishments || []);
    }
    setLoading(false);
  };

  // 2. APPLY "OPEN NOW" (Client-Side)
  useEffect(() => {
    if (!onlyOpen) {
      setFilteredData(rawData);
      return;
    }

    const now = new Date();
    const openPlaces = rawData.filter((place) => {
      if (!place.opening_hours) return true; // Assume open if no data
      try {
        const oh = new opening_hours(place.opening_hours);
        return oh.getState(now);
      } catch (e) {
        return true;
      }
    });
    setFilteredData(openPlaces);
  }, [rawData, onlyOpen]);

  // Trigger fetch when Server-Side filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEstablishments();
    }, 600); // Slight debounce
    return () => clearTimeout(timer);
  }, [searchText, selectedType, minRating, onlyPopular]);

  // --- RENDER CARD ---
  const renderItem = ({ item }) => {
    // Calculate open status for UI Badge
    let isOpen = true;
    try {
      if (item.opening_hours) {
        isOpen = new opening_hours(item.opening_hours).getState(new Date());
      }
    } catch (e) {}

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate("Details", { id: item.id })}
      >
          <View style={styles.card}>
            {/* Row 1: Name and Distance */}
            <View style={styles.cardHeader}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name || "Unknown"}
              </Text>
              <Text style={styles.distBadge}>
                {item.dist_meters < 1000
                  ? `${Math.round(item.dist_meters)}m`
                  : `${(item.dist_meters / 1000).toFixed(1)}km`}
              </Text>
            </View>

            {/* Row 2: Ratings & Status */}
            <View style={styles.statsRow}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {item.average_rating > 0
                    ? item.average_rating.toFixed(1)
                    : "New"}
                </Text>
                <Text style={styles.reviewCount}>({item.review_count})</Text>
              </View>

              <Text
                style={[
                  styles.statusText,
                  { color: isOpen ? "#2e7d32" : "#d32f2f" },
                ]}
              >
                {isOpen ? "Open Now" : "Closed"}
              </Text>
            </View>

            {/* Row 3: Cuisine Tags */}
            {item.cuisine_tags && item.cuisine_tags.length > 0 && (
              <View style={styles.tagContainer}>
                {item.cuisine_tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Row 4: Details */}
            <Text style={styles.details}>
              {item.amenity} •{" "}
              {item.opening_hours ? "Has hours" : "No hours info"}
            </Text>
          </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <TouchableOpacity
            style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons
              name="options"
              size={24}
              color={showFilters ? "#fff" : "#333"}
            />
          </TouchableOpacity>

          <TextInput
            style={styles.searchInput}
            placeholder="Search tags, menus, names..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* --- FILTERS SECTION --- */}
        {showFilters && (
          <View style={styles.filterSection}>
            {/* 1. Toggles Row */}
            <View style={styles.filterRow}>
              <View style={styles.switchWrapper}>
                <Text style={styles.filterLabel}>Open Now</Text>
                <Switch
                  value={onlyOpen}
                  onValueChange={setOnlyOpen}
                  trackColor={{ false: "#ccc", true: "#81b0ff" }}
                  thumbColor={onlyOpen ? "#2196F3" : "#f4f3f4"}
                />
              </View>
              <View style={styles.switchWrapper}>
                <Text style={styles.filterLabel}>Popular (10+)</Text>
                <Switch
                  value={onlyPopular}
                  onValueChange={setOnlyPopular}
                  trackColor={{ false: "#ccc", true: "#81b0ff" }}
                  thumbColor={onlyPopular ? "#2196F3" : "#f4f3f4"}
                />
              </View>
            </View>

            {/* 2. Rating Selector */}
            <View style={styles.filterRowVertical}>
              <Text style={styles.filterLabelSmall}>Minimum Rating</Text>
              <View style={styles.pills}>
                {[0, 3, 4, 4.5].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.pill, minRating === r && styles.pillActive]}
                    onPress={() => setMinRating(r)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        minRating === r && styles.pillTextActive,
                      ]}
                    >
                      {r === 0 ? "Any" : `${r}+ ★`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 3. Type Selector */}
            <View style={styles.filterRowVertical}>
              <Text style={styles.filterLabelSmall}>Category</Text>
              <View style={styles.pills}>
                {["all", "restaurant", "cafe"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.pill,
                      selectedType === type && styles.pillActive,
                    ]}
                    onPress={() => setSelectedType(type)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        selectedType === type && styles.pillTextActive,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* --- CONTENT --- */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2196F3"
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No places match your filters.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingTop: 40,
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    zIndex: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  filterBtn: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
  },
  filterBtnActive: {
    backgroundColor: "#2196F3",
  },
  searchInput: {
    flex: 1,
    height: 46,
    backgroundColor: "#f1f3f4",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  },

  // --- Filter Section Styles ---
  filterSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f1f1",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  filterRowVertical: {
    marginBottom: 14,
  },
  switchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  filterLabelSmall: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#eee",
  },
  pillActive: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196F3",
  },
  pillText: {
    color: "#555",
    fontWeight: "500",
  },
  pillTextActive: {
    color: "#1565c0",
    fontWeight: "700",
  },

  // --- Card Styles ---
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 14,
    borderRadius: 16,
    // Modern Shadow
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    flex: 1,
    marginRight: 10,
  },
  distBadge: {
    backgroundColor: "#f5f5f5",
    color: "#666",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: "600",
    overflow: "hidden",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  reviewCount: {
    fontSize: 14,
    color: "#888",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  tag: {
    backgroundColor: "#fff3e0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    color: "#e65100",
    fontWeight: "600",
  },
  details: {
    fontSize: 12,
    color: "#999",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#aaa",
    fontSize: 16,
  },
});
