import { View } from "react-native";
import React, { useState } from "react";
import { ThemedView } from "@/components/ThemedView";
import ExploreHeader from "@/components/explore/ExploreHeader";
import ContactsRoute from "@/components/explore/UserContacts";

interface ExploreScreenProps {}

const ExploreScreen: React.FC<ExploreScreenProps> = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const headerHeight = 100;

  return (
    <ThemedView style={{ flex: 1 }}>
      <ExploreHeader
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
