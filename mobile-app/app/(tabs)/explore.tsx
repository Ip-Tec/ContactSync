// ExploreScreen.tsx
import React, { useState } from "react";
import { View, Dimensions } from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import ExploreHeader from "@/components/explore/ExploreHeader";
import ContactUserDoNotHave from "@/components/explore/ContactUserDoNotHave";

// ContactsRoute component renders your contacts list (you can add your actual list here)
import ContactsRoute from "@/components/explore/UserContacts";

import { useSearch } from "@/hooks/useSearch";
import { useContacts } from "@/context/ContactsContext";

// Use Dimensions for layout.
const initialLayout = { width: Dimensions.get("window").width };

const ExploreScreen = () => {
  // State for the TabView.
  const [index, setIndex] = useState(0);

  const { contacts } = useContacts();
  const [routes] = useState([
    { key: "contacts", title: "Contacts" },
    { key: "something", title: "Missing Contacts" },
  ]);

  const [searchQuery, setSearchQuery] = useState("");

  // Define a smaller header height (smaller than before, e.g. 80)
  const headerHeight = 100;

  // Map each tab key to its corresponding scene.
  // Use a custom renderScene so we can pass search props to the contacts list.
  const renderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case "contacts":
        return (
          // Pass searchQuery and setSearchQuery to contacts list.
          <ContactsRoute searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        );
      case "something":
        return <ContactUserDoNotHave />;
      default:
        return null;
    }
  };


  return (
    <View className="flex-1 bg-gray-100">
      {/*
        Render the ExploreHeader at the top.
        It includes an animated background image and a search bar.
      */}
      <ExploreHeader
        headerHeight={headerHeight}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/*
        Render the TabView below the header.
        The TabView switches between "Contacts" and "Something".
      */}
      <TabView
        style={{ flex: 1 }}
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={initialLayout}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: "#3b82f6" }}
            style={{ backgroundColor: "#000033" }}
            activeColor="#ffffff"
            inactiveColor="#a1a1aa"
          />
        )}
      />
    </View>
  );
};

export default ExploreScreen;
