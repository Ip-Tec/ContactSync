import React, { useRef, useState, useEffect } from "react";
import {
  Animated,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  View,
  Linking,
  Text,
} from "react-native";
import { adsProp } from "@/types/explore-types";
import { useAuth } from "@/context/AuthContext";
import { IconSymbol } from "@/components/ui/IconSymbol";
import PaymentWebView from "@/components/payment/PaymentWebView";
import ImportContactModal from "@/components/data/ImportContactModal";

const HEADER_MAX_HEIGHT = 220;
const HEADER_MIN_HEIGHT = 70;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

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
  const { priceData, loadingPrice, ads } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<{
    price: number;
    number_of_contacts: number;
    name: string;
    payment_url: string;
  } | null>(null);

  // State flags for modals/bottom sheets.
  const [paymentWebViewVisible, setPaymentWebViewVisible] = useState(false);
  const [importContactModalVisible, setImportContactModalVisible] = useState(false);

  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const flatListRef = useRef<FlatList<adsProp>>(null);
  const scrollInterval = useRef<NodeJS.Timeout | null>(null);
  const adsList = ads || [];

  // Separate ads based on pricing_type.
  const homeAd = adsList.find((ad) => ad.pricing_type === "home");
  const carouselAds = adsList.filter((ad) => ad.pricing_type === "carousel");

  // Auto-scrolling logic for carousel ads.
  useEffect(() => {
    if (autoScrollEnabled && carouselAds.length > 0) {
      scrollInterval.current = setInterval(() => {
        setCurrentAdIndex((prev) => {
          const nextIndex = prev + 1 >= carouselAds.length ? 0 : prev + 1;
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
  }, [autoScrollEnabled, carouselAds.length]);

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

  // Header uses a "home" ad if available.
  const renderParallaxHeader = () => (
    <Animated.View
      style={{
        height: headerHeight,
        transform: [{ translateY: headerTranslate }],
      }}
      className="bg-gray-300 overflow-hidden"
    >
      <TouchableOpacity
        onPress={() => {
          if (homeAd && homeAd.redirect_url) {
            Linking.openURL(homeAd.redirect_url);
          } else {
            console.log("No redirect URL available");
          }
        }}
      >
        <Image
          source={
            homeAd
              ? { uri: homeAd.media_url }
              : require("@/assets/images/pdes_ads.jpg")
          }
          style={{ width: "100%", height: "100%", resizeMode: "cover" }}
          className="w-full h-full object-cover"
        />
      </TouchableOpacity>
    </Animated.View>
  );

  // Carousel item rendering for "carousel" ads.
  const renderAdItem = ({ item }: { item: adsProp }) => (
    <TouchableOpacity
      onPress={() => {
        // Open redirect_url if available; otherwise open media_url.
        const urlToOpen = item.redirect_url ? item.redirect_url : item.media_url;
        Linking.openURL(urlToOpen);
      }}
      className="mx-2 h-80 w-80"
    >
      <View className="rounded-xl overflow-hidden shadow-md bg-white h-full aspect-square">
        <Image
          source={{ uri: item.media_url }}
          className="w-full h-full"
          style={{ resizeMode: "cover" }}
        />
      </View>
    </TouchableOpacity>
  );

  // Render Carousel ads or a default image if none available.
  const renderAds = () => {
    if (carouselAds.length === 0) {
      return (
        <View className="mt-5 py-4 bg-gray-100 justify-center items-center">
          <Text className="text-xl font-bold mb-4">Featured Offers</Text>
          <Image
            source={require("@/assets/images/pdes_ads.jpg")}
            style={{ width: 350, height: 256, resizeMode: "cover" }}
            className="rounded-xl"
          />
        </View>
      );
    }
    return (
      <View className="mt-5 py-4 bg-gray-100">
        <Text className="text-xl font-bold mb-4 px-4">Featured Offers</Text>
        <FlatList
          ref={flatListRef}
          data={carouselAds}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.ad_id)}
          renderItem={renderAdItem}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 8,
          }}
          snapToAlignment="start"
          decelerationRate="fast"
          snapToInterval={256 + 16} // width + margin (256 + 16)
          onScrollBeginDrag={() => setAutoScrollEnabled(false)} // Pause on user interaction
          onScrollEndDrag={() => setAutoScrollEnabled(true)} // Resume after interaction
          onMomentumScrollEnd={(event) => {
            const contentOffset = event.nativeEvent.contentOffset;
            const viewSize = event.nativeEvent.layoutMeasurement;
            const pageNum = Math.floor(contentOffset.x / viewSize.width);
            setCurrentAdIndex(pageNum);
          }}
          getItemLayout={(data, index) => ({
            length: 256 + 16,
            offset: (256 + 16) * index,
            index,
          })}
        />
        {/* Indicator dots */}
        <View className="flex-row justify-center mt-2">
          {carouselAds.map((_, index) => (
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
  };

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
