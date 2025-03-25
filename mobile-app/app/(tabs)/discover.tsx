// DiscoverScreen.tsx
import React, { useState } from "react";
import { View } from "react-native";
import ExploreHeader from "@/components/explore/ExploreHeader";
import ContactUserDoNotHave from "@/components/explore/ContactUserDoNotHave";
import { useAuth } from "@/context/AuthContext";

interface DiscoverScreenProps {}

const DiscoverScreen: React.FC<DiscoverScreenProps> = () => {
  // Optionally, you can add search functionality here as well.
  const [searchQuery, setSearchQuery] = useState("");
  const { ads } = useAuth();
  const adsList = ads || [];

  // Separate ads based on pricing_type.
  const discoverAd = adsList.find((ad) => ad.pricing_type === "discover");
  const headerHeight = 100;

  return (
    <View className="flex-1 bg-gray-100">
      <ExploreHeader
        image_url={
          discoverAd
            ? discoverAd.media_url
            : require("@/assets/images/explore.jpeg")
        }
        headerHeight={headerHeight}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        displayInput={false}
      />
      <ContactUserDoNotHave />
    </View>
  );
};

export default DiscoverScreen;
