import React, { useRef, useState } from "react";
import { View, Animated, Dimensions, TouchableOpacity } from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { useForm } from "react-hook-form";
import { useCart } from "@/context/CartContext";
import ExploreHeader from "@/components/explore/ExploreHeader";
import TradeContactItem from "@/components/explore/TradeContactItem";
import ContactFormBottomSheet from "@/components/explore/ContactFormBottomSheet";
import useTradeableContacts from "@/hooks/useTradeableContacts";
import RandomBuyContact from "@/components/RandomBuyContact";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useSearch } from "@/hooks/useSearch"; // Import the hook
import { Contact, FormData } from "@/types/explore-types"; // Adjust the path as necessary
import { useRouter } from "expo-router";

interface ExploreScreenProps {
  userId: string;
}

const HEADER_MAX_HEIGHT = 220;
const HEADER_MIN_HEIGHT = 70; // minimum height equals the search bar height
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
const TAB_BAR_HEIGHT = 48; // adjust as needed

const ExploreScreen: React.FC<ExploreScreenProps> = ({ userId }) => {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "tradeable", title: "Tradeable" },
    { key: "buyContact", title: "Buy Contact" },
  ]);

  // Get contacts from your custom hook
  const { tradeableContacts } = useTradeableContacts(userId);
  // Use the search hook to filter contacts based on the search query.
  const { searchQuery, setSearchQuery, filteredData } = useSearch(
    tradeableContacts,
    (item: Contact, query: string) => {
      // Adjust the filtering logic as needed. For example, filter by name.
      return item.name
        ? item.name.toLowerCase().includes(query.toLowerCase())
        : false;
    }
  );

  const { control, handleSubmit, reset } = useForm<FormData>();
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const { addToCart } = useCart();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // Animate header height from 220 to 70
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: "clamp",
  });

  const handleTrade = (data: FormData) => {
    if (!selectedContact) return;

    const uniquePhones = [
      ...new Set(
        selectedContact.phoneNumbers?.map((p: any) => p.number).filter(Boolean)
      ),
    ];

    addToCart({
      ...selectedContact,
      ...data,
      phoneNumbers: uniquePhones,
      id: selectedContact.id || Date.now().toString(),
    });

    bottomSheetRef.current?.dismiss();
    reset();
  };

  // Define scenes for the tabs, using filteredData for the Tradeable tab
  const renderScene = SceneMap({
    tradeable: () => (
      <Animated.FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: HEADER_MAX_HEIGHT + TAB_BAR_HEIGHT,
          paddingBottom: 100,
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/ContactDetail",
                params: { contact: JSON.stringify(item) },
              })
            }
          >
            <TradeContactItem
              contact={item}
              onTrade={() => {
                console.log("Trade button clicked for:", item);
                if (!item.isInDb) {
                  if (
                    !item.dob ||
                    !item.country ||
                    !item.countryCode ||
                    !item.sex
                  ) {
                    setSelectedContact(item);
                    setTimeout(() => {
                      bottomSheetRef.current?.present();
                    }, 200); // Small delay to ensure UI updates
                  } else {
                    addToCart({
                      id: item.id || Date.now().toString(),
                      contact: item,
                      phoneNumbers: item.phoneNumbers
                        ? item.phoneNumbers.map((p) => p.number)
                        : [],
                      dob: item.dob ? item.dob.toISOString() : undefined,
                      country: item.country,
                      countryCode: item.countryCode,
                      sex: item.sex,
                    });
                  }
                }
              }}
            />
          </TouchableOpacity>
        )}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />
    ),
    buyContact: () => (
      <Animated.ScrollView
        contentContainerStyle={{
          paddingTop: HEADER_MAX_HEIGHT + TAB_BAR_HEIGHT,
          paddingBottom: 100,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <RandomBuyContact />
      </Animated.ScrollView>
    ),
  });

  return (
    <View style={{ flex: 1 }}>
      {/* Animated Header (background + search) */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: headerHeight,
          zIndex: 10,
        }}
      >
        <ExploreHeader
          headerHeight={headerHeight}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </Animated.View>

      {/* Tab View with pinned TabBar */}
      <TabView
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        renderScene={renderScene}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: "#3b82f6", height: 3 }}
            style={{
              backgroundColor: "#000033",
              position: "absolute",
              top: HEADER_MIN_HEIGHT,
              left: 0,
              right: 0,
              zIndex: 11,
            }}
            // labelStyle={{
            //   color: "#3b82f6",
            //   fontWeight: "bold",
            //   textTransform: "capitalize",
            // }}
            inactiveColor="#64748b"
            pressColor="#e2e8f0"
          />
        )}
        initialLayout={{ width: Dimensions.get("window").width }}
      />

      {/* Bottom Sheet for contact form */}
      <ContactFormBottomSheet
        ref={bottomSheetRef}
        control={control}
        onSubmit={handleSubmit(handleTrade)}
        requiredFieldsMissing={false}
      />
    </View>
  );
};

export default ExploreScreen;
