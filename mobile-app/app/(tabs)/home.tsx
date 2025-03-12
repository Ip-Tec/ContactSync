import React, { useRef, useState, useEffect } from "react";
import {
  Animated,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  View,
  Linking,
  Text,
  Alert,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { IconSymbol } from "@/components/ui/IconSymbol";
import PaymentWebView from "@/components/payment/PaymentWebView"; // WebView modal for payment
import ImportContactModal from "@/components/data/ImportContactModal"; // Import contact modal (wrapped in a BottomSheet)

const HEADER_MAX_HEIGHT = 220;
const HEADER_MIN_HEIGHT = 70;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const ads = [
  {
    id: "1",
    image: require("@/assets/images/logo.png"),
    link: "https://www.example.com/ad1",
  },
  {
    id: "2",
    image: require("@/assets/images/explore.jpeg"),
    link: "https://www.example.com/ad2",
  },
  {
    id: "3",
    image: require("@/assets/images/react-logo.png"),
    link: "https://www.example.com/ad3",
  },
];

const getIconForPackage = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes("diamond")) return "grade.star";
  if (lower.includes("platinum")) return "stars.fill";
  if (lower.includes("gold")) return "star.half";
  if (lower.includes("silver")) return "star.border";
  if (lower.includes("bronze")) return "whatshot.fill";
  if (lower.includes("copper")) return "whatshot.fill";
  if (lower.includes("starter")) return "flag.fill";
  return "money-sign";
};

export default function HomeScreen() {
  const [priceData, setPriceData] = useState<
    {
      price: number;
      number_of_contacts: number;
      name: string;
      payment_url: string;
    }[]
  >([]);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<{
    price: number;
    number_of_contacts: number;
    name: string;
    payment_url: string;
  } | null>(null);

  // State flags for modals/bottom sheets.
  const [paymentWebViewVisible, setPaymentWebViewVisible] = useState(false);
  const [importContactModalVisible, setImportContactModalVisible] =
    useState(false);

  // Fetch pricing data from Supabase.
  useEffect(() => {
    async function fetchPriceData() {
      setLoadingPrice(true);
      const { data, error } = await supabase
        .from("Price")
        .select("price, number_of_contacts, name, payment_url");
      if (error) {
        console.error("Error fetching price data:", error.message);
      } else if (data && data.length > 0) {
        const sortedData = data.sort((a, b) => a.price - b.price);
        setPriceData(sortedData);
      } else {
        console.error("No price data found.");
      }
      setLoadingPrice(false);
    }
    fetchPriceData();
  }, []);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: "clamp",
  });
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE],
    extrapolate: "clamp",
  });

  const renderParallaxHeader = () => (
    <Animated.View
      className="bg-gray-300 overflow-hidden"
      style={{
        height: headerHeight,
        transform: [{ translateY: headerTranslate }],
      }}
    >
      <Image
        source={require("@/assets/images/explore.jpeg")}
        className="w-full h-full object-cover"
      />
    </Animated.View>
  );

  const renderAdItem = ({ item }: { item: (typeof ads)[0] }) => (
    <TouchableOpacity onPress={() => Linking.openURL(item.link)}>
      <Image source={item.image} className="w-48 h-30 rounded-xl mr-4" />
    </TouchableOpacity>
  );

  const renderPriceCards = () => {
    if (loadingPrice) {
      return <ActivityIndicator size="large" color="#3b82f6" />;
    }
    if (!priceData || priceData.length === 0) {
      return <Text className="text-red-500">Failed to load price data</Text>;
    }
    return (
      <View className="flex-row flex-wrap justify-center">
        {priceData.map((item, index) => {
          const iconName = getIconForPackage(item.name);
          return (
            <TouchableOpacity
              key={index.toString()}
              className="bg-white rounded-2xl p-5 m-2 w-44 shadow"
              onPress={() => {
                setSelectedPackage(item);
                setPaymentWebViewVisible(true);
              }}
            >
              <View className="bg-blue-100 p-2 rounded-full">
                <IconSymbol name={iconName as any} size={40} color="#3b82f6" />
              </View>
              <Text className="mt-2 text-2xl">₦{item.price}</Text>
              <Text className="text-gray-600">{item.name}</Text>
              <Text className="text-gray-600">
                Get {item.number_of_contacts} contacts
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderAds = () => (
    <View className="mt-5">
      <FlatList
        data={ads}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderAdItem}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100">
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {renderParallaxHeader()}
        <View className="mt-5 items-center">{renderPriceCards()}</View>
        {renderAds()}
      </Animated.ScrollView>
      {selectedPackage && paymentWebViewVisible && (
        <PaymentWebView
          visible={paymentWebViewVisible}
          url={selectedPackage.payment_url}
          onPaymentSuccess={() => {
            // When payment is successful, close the WebView and open the ImportContactModal.
            setPaymentWebViewVisible(false);
            setImportContactModalVisible(true);
          }}
          onClose={() => setPaymentWebViewVisible(false)}
        />
      )}
      {selectedPackage && importContactModalVisible && (
        <ImportContactModal
          visible={importContactModalVisible}
          onClose={() => setImportContactModalVisible(false)}
          onSaved={() => {
            setImportContactModalVisible(false);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "#D0D0D0",
    overflow: "hidden",
  },
  headerImage: {
    width: "100%",
    height: HEADER_MAX_HEIGHT,
    resizeMode: "cover",
  },
});
