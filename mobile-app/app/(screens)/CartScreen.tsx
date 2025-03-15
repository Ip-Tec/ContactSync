import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
} from "react-native";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";

const CartScreen = () => {
  const { cart, removeFromCart } = useCart();
  const [accountDetails, setAccountDetails] = useState({
    accountNumber: "",
    accountName: "",
    bankName: "",
    accountType: "",
  });
  const [showAccountForm, setShowAccountForm] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const totalItems = cart.length;

  const handleSave = async () => {
    if (cart.length === 0) {
      Alert.alert("Cart is empty", "Please add items before saving.");
      return;
    }
    if (
      !accountDetails.accountNumber ||
      !accountDetails.accountName ||
      !accountDetails.bankName ||
      !accountDetails.accountType
    ) {
      Alert.alert("Missing Details", "Please fill in all account details.");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("orders") // change to your table name
        .insert([
          {
            cart, // consider using a JSONB column for the cart array if using PostgreSQL
            account_number: accountDetails.accountNumber,
            account_name: accountDetails.accountName,
            bank_name: accountDetails.bankName,
            account_type: accountDetails.accountType,
            total_items: totalItems,
            created_at: new Date(),
          },
        ]);

      if (error) {
        console.error(error);
        Alert.alert("Error", "Failed to save cart items.");
        return;
      }

      Alert.alert("Success", "Cart items saved successfully.");
      handleDeleteAll();
      setShowAccountForm(false);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save cart items.");
    }
  };

  const handleDeleteAll = () => {
    cart.forEach((item) => removeFromCart(item.id));
  };

  // Animate the account form fade-in when shown.
  useEffect(() => {
    if (showAccountForm) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [showAccountForm, fadeAnim]);

  const renderCartItem = ({ item }: { item: any }) => (
    <View
      style={{
        backgroundColor: "white",
        padding: 16,
        marginBottom: 12,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
     <TouchableOpacity
      onPress={() => router.push({
        pathname: "/ContactDetail",
        params: {
          contact: JSON.stringify(item.contact),
          phoneNumbers: JSON.stringify(item.phoneNumbers),
          dob: JSON.stringify(item.dob),
        },
      })}
      > 
     <Text style={{ fontSize: 16, fontWeight: "bold" }}>
        {item.contact.name}
      </Text>
      <Text style={{ marginTop: 4 }}>Phone: {item.phoneNumbers.join(", ")}</Text>
      {item.dob && (
        <Text style={{ marginTop: 4 }}>
          DOB:{" "}
          {typeof item.dob === "string"
            ? item.dob
            : item.dob.toLocaleDateString()}
        </Text>
      )}
     </TouchableOpacity>
      <TouchableOpacity
        onPress={() => removeFromCart(item.id)}
        style={{
          backgroundColor: "#e74c3c",
          paddingVertical: 8,
          borderRadius: 4,
          marginTop: 8,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
          Remove
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#f2f2f2" }}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        Cart Items ({totalItems})
      </Text>
      {totalItems === 0 ? (
        <Text style={{ textAlign: "center", color: "#777" }}>
          Your cart is empty
        </Text>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(item) => item.id}
          renderItem={renderCartItem}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}

      {/* Checkout button to show account form */}
      {totalItems > 0 && !showAccountForm && (
        <TouchableOpacity
          onPress={() => setShowAccountForm(true)}
          style={{
            backgroundColor: "#3498db",
            paddingVertical: 12,
            borderRadius: 8,
            marginTop: 16,
          }}
        >
          <Text
            style={{
              color: "white",
              textAlign: "center",
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            Proceed to Checkout
          </Text>
        </TouchableOpacity>
      )}

      {/* Account Details Form (animated) */}
      {showAccountForm && (
        <Animated.View style={{ opacity: fadeAnim, marginTop: 16, backgroundColor: "white", padding: 16, borderRadius: 8, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
            Enter Account Details
          </Text>
          <TextInput
            placeholder="Account Number"
            value={accountDetails.accountNumber}
            onChangeText={(text) =>
              setAccountDetails({ ...accountDetails, accountNumber: text })
            }
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 8,
              borderRadius: 4,
              marginBottom: 12,
            }}
          />
          <TextInput
            placeholder="Account Name"
            value={accountDetails.accountName}
            onChangeText={(text) =>
              setAccountDetails({ ...accountDetails, accountName: text })
            }
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 8,
              borderRadius: 4,
              marginBottom: 12,
            }}
          />
          <TextInput
            placeholder="Bank Name"
            value={accountDetails.bankName}
            onChangeText={(text) =>
              setAccountDetails({ ...accountDetails, bankName: text })
            }
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 8,
              borderRadius: 4,
              marginBottom: 12,
            }}
          />
          <TextInput
            placeholder="Account Type (Savings/Current)"
            value={accountDetails.accountType}
            onChangeText={(text) =>
              setAccountDetails({ ...accountDetails, accountType: text })
            }
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 8,
              borderRadius: 4,
              marginBottom: 12,
            }}
          />
          <TouchableOpacity
            onPress={handleSave}
            style={{
              backgroundColor: "#2ecc71",
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color: "white",
                textAlign: "center",
                fontWeight: "bold",
                fontSize: 16,
              }}
            >
              Save Order
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {totalItems > 0 && (
        <TouchableOpacity
          onPress={handleDeleteAll}
          style={{
            backgroundColor: "#e74c3c",
            paddingVertical: 12,
            borderRadius: 8,
            marginTop: 16,
          }}
        >
          <Text
            style={{
              color: "white",
              textAlign: "center",
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            Clear Cart
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default CartScreen;
