import React from "react";
import { Animated, TextInput, View, TouchableOpacity, Linking, StyleSheet, ImageURISource } from "react-native";

interface ExploreHeaderProps {
  headerHeight?: Animated.AnimatedInterpolation<number> | number;
  searchQuery: string;
  redirect_url?:string | undefined;
  image_url: ImageURISource;
  displayInput?: boolean;
  setSearchQuery: (text: string) => void;
}

const ExploreHeader: React.FC<ExploreHeaderProps> = ({
  headerHeight = 150,
  image_url,
  redirect_url,
  searchQuery,
  setSearchQuery,
  displayInput=true
}) => {
  return (
    <View
      className="items-center justify-center w-full h-auto bg-blue-800"
      style={{
        height: 120,
        maxHeight: headerHeight,
        position: "relative",
        backgroundColor: "#3b82f6",
      }}
    >
      {/* Animated background image fills the header */}
    <TouchableOpacity className="flex-1 w-full h-full"
    onPress={() => redirect_url && Linking.openURL(redirect_url)}>
      <Animated.Image
        source={image_url}
        style={[StyleSheet.absoluteFill, { height: headerHeight }]}
        resizeMode="cover"
      />
      </TouchableOpacity>
      {/* Search bar container positioned at the bottom */}
      <View style={[styles.searchContainer, { display: displayInput ? "flex" : "none" }]}>
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
