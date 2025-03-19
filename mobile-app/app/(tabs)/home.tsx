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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/IconSymbol";
import PaymentWebView from "@/components/payment/PaymentWebView"; // Payment webview
import ImportContactModal from "@/components/data/ImportContactModal"; // Import contact modal (wrapped in a BottomSheet)
import { useAuth } from "@/context/AuthContext";

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

const HomeScreen = () => {
  const { priceData, loadingPrice } = useAuth();
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

  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const scrollInterval = useRef<NodeJS.Timeout | null>(null);
  // Fetch pricing data from Supabase.

  useEffect(() => {
    if (autoScrollEnabled && ads.length > 1) {
      scrollInterval.current = setInterval(() => {
        setCurrentAdIndex((prev) => {
          const nextIndex = prev + 1 >= ads.length ? 0 : prev + 1;
          flatListRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          return nextIndex;
        });
      }, 3000); // Change slide every 3 seconds

      return () => {
        if (scrollInterval.current) clearInterval(scrollInterval.current);
      };
    }
  }, [autoScrollEnabled, ads.length]);

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
    <TouchableOpacity
      onPress={() => Linking.openURL(item.link)}
      className="mx-2 h-80 w-80" // Fixed height
    >
      <View className="rounded-xl overflow-hidden shadow-md bg-white h-full aspect-square">
        <Image
          source={item.image}
          className="w-full h-full"
          style={{
            resizeMode: "cover",
          }}
        />
      </View>
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
    <View className="mt-5 py-4 bg-gray-100">
      <Text className="text-xl font-bold mb-4 px-4">Featured Offers</Text>
      <FlatList
        ref={flatListRef}
        data={ads}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderAdItem}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 8,
        }}
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={256 + 16} // width + margin (64*4 + 16)
        onScrollBeginDrag={() => setAutoScrollEnabled(false)} // Pause on user interaction
        onScrollEndDrag={() => setAutoScrollEnabled(true)} // Resume after interaction
        onMomentumScrollEnd={(event) => {
          const contentOffset = event.nativeEvent.contentOffset;
          const viewSize = event.nativeEvent.layoutMeasurement;
          const pageNum = Math.floor(contentOffset.x / viewSize.width);
          setCurrentAdIndex(pageNum);
        }}
        getItemLayout={(data, index) => ({
          length: 256 + 16, // width + margin
          offset: (256 + 16) * index,
          index,
        })}
      />
      {/* Add indicator dots */}
      <View className="flex-row justify-center mt-2">
        {ads.map((_, index) => (
          <View
            key={index}
            className={`w-2 h-2 rounded-full mx-1 ${
              index === currentAdIndex ? "bg-blue-500" : "bg-gray-300"
            }`}
          />
        ))}
      </View>
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
          limit={selectedPackage.number_of_contacts}
        />
      )}
    </View>
  );
};

export default HomeScreen;
