import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  StyleSheet,
} from "react-native";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Contact } from "expo-contacts";
import { CartItem, TradeContactProps } from "@/types/explore-types";

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
      const { data, error } = await supabase.from("orders").insert([
        {
          cart,
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

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/ContactDetail",
            params: {
              contact: JSON.stringify(item.contact),
              phoneNumbers: JSON.stringify(item.phoneNumbers),
              dob: JSON.stringify(item.dob),
            },
          })
        }
      >
        <Text style={styles.itemText}>{item.contact.name}</Text>
        <Text style={styles.itemSubText}>
          Phone: {item.phoneNumbers.join(", ")}
        </Text>
        {item.dob && <Text style={styles.itemSubText}>DOB: {item.dob instanceof Date ? item.dob.toISOString() : item.dob}</Text>}
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => removeFromCart(item.id)}
        style={styles.removeButton}
      >
        <MaterialIcons name="delete" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );


  

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Cart Items ({totalItems})</Text>
      {totalItems === 0 ? (
        <Text style={styles.emptyCartText}>Your cart is empty</Text>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(item) => item.id}
          renderItem={renderCartItem}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
      {totalItems > 0 && !showAccountForm && (
        <TouchableOpacity
          onPress={() => setShowAccountForm(true)}
          style={styles.checkoutButton}
        >
          <MaterialIcons
            name="shopping-cart-checkout"
            size={24}
            color="white"
          />
          <Text style={styles.buttonText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      )}
      {showAccountForm && (
        <Animated.View style={[styles.accountForm, { opacity: fadeAnim }]}>
          <Text style={styles.formHeader}>Enter Account Details</Text>
          <TextInput
            placeholder="Account Number"
            value={accountDetails.accountNumber}
            onChangeText={(text) =>
              setAccountDetails({ ...accountDetails, accountNumber: text })
            }
            style={styles.input}
          />
          <TextInput
            placeholder="Account Name"
            value={accountDetails.accountName}
            onChangeText={(text) =>
              setAccountDetails({ ...accountDetails, accountName: text })
            }
            style={styles.input}
          />
          <TextInput
            placeholder="Bank Name"
            value={accountDetails.bankName}
            onChangeText={(text) =>
              setAccountDetails({ ...accountDetails, bankName: text })
            }
            style={styles.input}
          />
          <TextInput
            placeholder="Account Type"
            value={accountDetails.accountType}
            onChangeText={(text) =>
              setAccountDetails({ ...accountDetails, accountType: text })
            }
            style={styles.input}
          />
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.buttonText}>Save Order</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f2f2f2" },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  emptyCartText: { textAlign: "center", color: "#777" },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  itemText: { fontSize: 16, fontWeight: "bold" },
  itemSubText: { marginTop: 4, color: "#555" },
  removeButton: { backgroundColor: "#e74c3c", padding: 8, borderRadius: 4 },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  accountForm: {
    marginTop: 16,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
  },
  formHeader: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  saveButton: { backgroundColor: "#2ecc71", padding: 12, borderRadius: 8 },
});

export default CartScreen;
