// DiscoverScreen.tsx
import React, { useState } from "react";
import { View } from "react-native";
import ExploreHeader from "@/components/explore/ExploreHeader";
import ContactUserDoNotHave from "@/components/explore/ContactUserDoNotHave";

interface DiscoverScreenProps {}

const DiscoverScreen: React.FC<DiscoverScreenProps> = () => {
  // Optionally, you can add search functionality here as well.
  const [searchQuery, setSearchQuery] = useState("");
  const headerHeight = 100;

  return (
    <View className="flex-1 bg-gray-100">
      <ExploreHeader
        headerHeight={headerHeight}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <ContactUserDoNotHave />
    </View>
  );
};

export default DiscoverScreen;
