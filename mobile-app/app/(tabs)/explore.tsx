import { View } from "react-native";
import React, { useState } from "react";
import { ThemedView } from "@/components/ThemedView";
import ExploreHeader from "@/components/explore/ExploreHeader";
import ContactsRoute from "@/components/explore/UserContacts";
import { useAuth } from "@/context/AuthContext";

interface ExploreScreenProps {}

const ExploreScreen: React.FC<ExploreScreenProps> = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { ads } = useAuth();
  const adsList = ads || [];

  // Separate ads based on pricing_type.
  const exploreAd = adsList.find((ad) => ad.pricing_type === "contact");
  const headerHeight = 100;

  return (
    <ThemedView style={{ flex: 1 }}>
      <ExploreHeader
        image_url={
          exploreAd
            ? exploreAd.media_url
            : require("@/assets/images/explore.jpeg")
        }
        headerHeight={headerHeight}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <View>
        <ContactsRoute
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </View>
    </ThemedView>
  );
};

export default ExploreScreen;
