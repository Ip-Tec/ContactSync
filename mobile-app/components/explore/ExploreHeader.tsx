import React from "react";
import { Animated, TextInput, View, StyleSheet } from "react-native";

interface ExploreHeaderProps {
  headerHeight?: Animated.AnimatedInterpolation<number> | number;
  searchQuery: string;
  setSearchQuery: (text: string) => void;
}

const ExploreHeader: React.FC<ExploreHeaderProps> = ({
  headerHeight = 150,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <View
      className="flex-1 items-center justify-center w-full h-auto bg-blue-800"
      style={{
        height: 120,
        maxHeight: headerHeight,
        position: "relative",
        backgroundColor: "#3b82f6",
      }}
    >
      {/* Animated background image fills the header */}
      <Animated.Image
        source={require("@/assets/images/explore.jpeg")}
        style={[StyleSheet.absoluteFill, { height: headerHeight }]}
        resizeMode="cover"
      />
      {/* Search bar container positioned at the bottom */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 20, // ensure the search is above the background image
  },
  searchInput: {
    backgroundColor: "white",
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
    // Shadow styling for iOS and Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    color: "#4B5563",
  },
});

export default ExploreHeader;
