import React from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { useCart } from "@/context/CartContext";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useAnimatedGestureHandler,
} from "react-native-reanimated";

const CartBadge = () => {
  const { cart } = useCart();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // If the cart is empty, don't render the badge
  if (cart.length === 0) return null;

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    },
    onActive: (event, ctx) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    },
    onEnd: () => {
      // Optional: Add snap-back logic here if wanted
      translateX.value = withSpring(translateX.value, { damping: 10 });
      translateY.value = withSpring(translateY.value, { damping: 10 });
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/CartScreen")}
          activeOpacity={0.7}
        >
          <MaterialIcons name="shopping-cart" size={26} color="white" />
          <Text style={styles.badge}>{cart.length}</Text>
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 20,
    bottom: 80,
    zIndex: 9999,
  },
  button: {
    backgroundColor: "#475569",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
});

export default CartBadge;
