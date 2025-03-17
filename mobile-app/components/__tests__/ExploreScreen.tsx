import React, { useRef, useState } from "react";
import { View, Animated, Dimensions } from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { useSearch } from "@/hooks/useSearch";
import useTradeableContacts from "@/hooks/useTradeableContacts";
import ExploreHeader from "@/components/explore/ExploreHeader";
import TradeContactItem from "@/components/explore/TradeContactItem";
import RandomBuyContact from "@/components/RandomBuyContact";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useForm } from "react-hook-form";
import { FormData, Contact } from "@/types/explore-types";
import ContactFormBottomSheet from "@/components/explore/ContactFormBottomSheet";
import { useCart } from "@/context/CartContext";
import { useRouter } from "expo-router";

interface ExploreScreenProps {
  userId: string;
}

const HEADER_MAX_HEIGHT = 220;
const HEADER_MIN_HEIGHT = 70;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
const TAB_BAR_HEIGHT = 48;

const routes = [
  { key: "tradeable", title: "Tradeable Contacts" },
  { key: "buyContact", title: "Buy Contact" },
];

const ExploreScreen: React.FC<ExploreScreenProps> = ({ userId }) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { addToCart } = useCart();
  const { control, handleSubmit, reset } = useForm<FormData>();

  // Get tradeable contacts via your custom hook
  const { tradeableContacts } = useTradeableContacts(userId);
  // Use the search hook to filter contacts based on the search query.
  const { searchQuery, setSearchQuery, filteredData } = useSearch(
    tradeableContacts,
    (item, query) =>
      item.name?.toLowerCase().includes(query.toLowerCase()) || false
  );

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: "clamp",
  });

  // Helper type guard function
  function isDefined<T>(value: T | undefined): value is T {
    return value !== undefined;
  }

  const handleTrade = (contact: Contact) => {
    if (
      !contact.isInDb &&
      (!contact.dob || !contact.country || !contact.countryCode || !contact.sex)
    ) {
      setSelectedContact(contact);
      bottomSheetRef.current?.present();
    } else {
      const phoneNumbers: string[] = (contact.phoneNumbers || [])
  .map(p => p.number)
  .filter((n): n is string => typeof n === "string");

      const emails: string[] = (contact.emails || [])
        .map((e) => e.email)
        .filter((e): e is string => typeof e === "string");

      addToCart({
        id: contact.id?.toString() || Date.now().toString(),
        contact,
        phoneNumbers,
        emails,
        dob: contact.dob ? new Date(contact.dob).toISOString() : undefined,
        country: contact.country,
        countryCode: contact.countryCode,
        sex: contact.sex,
      });
    }
  };

  const handleFormSubmit = (data: FormData) => {
    if (selectedContact) {
      const phoneNumbers: string[] = (selectedContact.phoneNumbers || [])
        .map((p) => p.number)
        .filter(isDefined);
      const emails: string[] = (selectedContact.emails || [])
        .map((e) => e.email)
        .filter(isDefined);

      addToCart({
        id: selectedContact.id?.toString() || Date.now().toString(),
        contact: selectedContact,
        phoneNumbers: phoneNumbers.filter(isDefined) as string[],
        emails: emails.filter(isDefined) as string[],
        dob: data.dob ? new Date(data.dob).toISOString() : undefined,
        country: data.country,
        countryCode: data.countryCode,
        sex: data.sex,
        contactType: data.contactType,
        ...data,
      });
    }
    bottomSheetRef.current?.dismiss();
    setSelectedContact(null);
    reset();
  };

  // Define scenes for the TabView.
  const renderScene = SceneMap({
    tradeable: () => (
      <Animated.FlatList<Contact>
        data={filteredData}
        keyExtractor={(item) => item.id?.toString() || Date.now().toString()}
        contentContainerStyle={{
          paddingTop: HEADER_MAX_HEIGHT + TAB_BAR_HEIGHT,
          paddingBottom: 100,
        }}
        renderItem={({ item }) => (
          <TradeContactItem contact={item} onTrade={() => handleTrade(item)} />
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
        <RandomBuyContact contactLimit={20} />
      </Animated.ScrollView>
    ),
  });

  return (
    <View style={{ flex: 1 }}>
      {/* Animated Header */}
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

      {/* TabView with pinned TabBar */}
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

      {/* Bottom Sheet for Completing Contact Data */}
      <ContactFormBottomSheet
        ref={bottomSheetRef}
        control={control}
        onSubmit={handleSubmit(handleFormSubmit)}
        requiredFieldsMissing={!selectedContact}
      />
    </View>
  );
};

export default ExploreScreen;