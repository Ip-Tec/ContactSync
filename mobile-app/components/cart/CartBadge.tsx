import React from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { useCart } from "@/context/CartContext";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const CartBadge = () => {
  const { cart } = useCart();
  
  // Stores the last position when dragging ends
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  // Tracks current movement
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Define the pan gesture
  const panGesture = Gesture.Pan()
    .onStart(() => {
      translateX.value = offsetX.value;
      translateY.value = offsetY.value;
    })
    .onUpdate((event) => {
      translateX.value = offsetX.value + event.translationX;
      translateY.value = offsetY.value + event.translationY;
    })
    .onEnd(() => {
      // Store the final position with spring effect
      offsetX.value = withSpring(translateX.value);
      offsetY.value = withSpring(translateY.value);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withSpring(translateX.value) },
      { translateY: withSpring(translateY.value) },
    ],
  }));

  if (cart.length === 0) return null;

  return (
    <GestureDetector gesture={panGesture}>
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
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 20,
    bottom: 20,
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
