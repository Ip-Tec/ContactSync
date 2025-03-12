import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Linking } from "react-native";

// Map package names to payment links.
const packagePaymentLinks: Record<string, string> = {
  "Diamond Package": "https://pay.chippercash.com/pay/CMGUMNOFNK",
  "Platinum Package": "https://pay.chippercash.com/pay/XYHRNJAUWS",
  "Gold Package": "https://pay.chippercash.com/pay/UKOEIRHSKQ",
  "Silver Package": "https://pay.chippercash.com/pay/DMXJUJMIGD",
  "Bronze Package": "https://pay.chippercash.com/pay/SEBBLMSMRN",
  "Copper Package": "https://pay.chippercash.com/pay/VMYTKKMAJE",
  "Starter Package": "https://pay.chippercash.com/pay/KRIUNQREFW",
};

interface PaymentBottomSheetProps {
  visible: boolean;
  packageName: string;
  price: number;
  numberOfContacts: number;
  paymentUrl: string;
  onClose: () => void;
  onPaymentInitiated: () => void;
}

export default function PaymentBottomSheet({
  visible,
  packageName,
  price,
  numberOfContacts,
  paymentUrl,
  onClose,
  onPaymentInitiated,
}: PaymentBottomSheetProps) {
  const handleProceed = async () => {
    const link = paymentUrl;
    if (link) {
      try {
        await Linking.openURL(link);
        onPaymentInitiated();
      } catch (error) {
        Alert.alert("Error", "Unable to open payment link.");
        console.error(error);
      }
    } else {
      Alert.alert("Error", "Payment link not available for this package.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={sheetStyles.container}>
        <View style={sheetStyles.sheet}>
          <View style={sheetStyles.handle} />
          <ThemedText type="title" style={sheetStyles.title}>
            {packageName}
          </ThemedText>
          <ThemedText style={sheetStyles.detail}>
            Price: ₦{price}
          </ThemedText>
          <ThemedText style={sheetStyles.detail}>
            Get {numberOfContacts} contacts
          </ThemedText>
          <TouchableOpacity style={sheetStyles.proceedButton} onPress={handleProceed}>
            <ThemedText style={sheetStyles.proceedButtonText}>
              Proceed to Payment
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={sheetStyles.closeButton} onPress={onClose}>
            <ThemedText style={sheetStyles.closeButtonText}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    height: "50%",
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 2.5,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
    fontSize: 18,
    fontWeight: "bold",
  },
  detail: {
    textAlign: "center",
    marginBottom: 8,
    fontSize: 16,
    color: "#555",
  },
  proceedButton: {
    backgroundColor: "#3b82f6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 8,
  },
  proceedButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  closeButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#333",
    fontSize: 16,
  },
});
