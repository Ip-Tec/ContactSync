import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, Alert } from "react-native";
import { DBContact } from "../data/ImportContactModal";
import ImportContactModal from "../data/ImportContactModal";

interface PaymentConfirmationProps {
  visible: boolean;
  packageName: string;
  price: number;
  onClose: () => void;
}

export default function PaymentConfirmation({
  visible,
  packageName,
  price,
  onClose,
}: PaymentConfirmationProps) {
  const [reference, setReference] = useState("");
  const [importModalVisible, setImportModalVisible] = useState(false);

  const handleConfirm = () => {
    if (!reference.trim()) {
      Alert.alert("Validation", "Please enter your transaction reference.");
      return;
    }
    // Now offer to import the contact.
    setImportModalVisible(true);
  };

  if (!visible) return null;

  return (
    <View className="flex-1 bg-white p-4 items-center justify-center">
      <Text className="mb-4 text-2xl text-center">
        Confirm Payment for {packageName}
      </Text>
      <Text className="mb-2 text-lg text-justify">Price: ₦{price}</Text>
      <TextInput
        placeholder="Enter transaction reference"
        value={reference}
        onChangeText={setReference}
        className="border border-gray-300 rounded p-2 w-full mb-4"
      />
      <TouchableOpacity
        onPress={handleConfirm}
        className="bg-blue-500 rounded-full px-4 py-2 mb-4"
      >
        <Text className="text-white font-bold p-2 text-center">
          Confirm Payment
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setImportModalVisible(true)}
        className="bg-green-500 rounded-full px-6 py-3"
      >
        <Text className="text-white font-bold text-center">
          Save Contact to Device
        </Text>
      </TouchableOpacity>
      <ImportContactModal
        visible={importModalVisible}
        contact={
          {
            id: "",
            name: packageName, // or pass in the contact details associated with the package
            email: null,
            phone_number: null,
          } as DBContact
        }
        onClose={() => setImportModalVisible(false)}
        onSaved={() => {
          setImportModalVisible(false);
          Alert.alert(
            "Contact Imported",
            "Your contact has been saved to your device."
          );
          // Optionally, navigate away or update your state.
        }}
      />
    </View>
  );
}
