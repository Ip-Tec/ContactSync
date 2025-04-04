import React from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { WebView } from "react-native-webview";

interface PaymentWebViewProps {
  visible: boolean;
  url: string;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

export default function PaymentWebView({
  visible,
  url,
  onPaymentSuccess,
  onClose,
}: PaymentWebViewProps) {
  // This injected JS polls the page every second for the success message.
  // if (document.body.innerText.includes("Payment complete thank you for your payment")) {
  // if (document.body.innerText.includes("This link has been paid")) {
  //  if (document.body.innerText.includes("Download Receipt")) {
  const injectedJS = `
    (function() {
     const successPatterns = [
      "Payment successful",
      "Thank you for your payment",
      "Transaction successful",
      "Transaction completed",
      "Download Receipt",
      "Peter Otakhor",
      "Payed by"
    ];

     let checkTimeout;

    const checkSuccess = () => {
      const pageText = document.body.innerText;
      if (successPatterns.some(pattern => pageText.includes(pattern))) {
        window.ReactNativeWebView.postMessage("success");
        window.clearTimeout(checkTimeout);
        return;
      }
      checkTimeout = window.setTimeout(checkSuccess, 1000);
    };
    
    checkSuccess();
    
    // Cleanup function
    window.onbeforeunload = () => {
      window.clearTimeout(checkTimeout);
    };
  })();
  true;`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <WebView
          source={{ uri: url }}
          injectedJavaScript={injectedJS}
          onMessage={(event) => {
            if (event.nativeEvent.data === "success") {
              onPaymentSuccess();
            }
          }}
          startInLoadingState
          renderLoading={() => (
            <ActivityIndicator size="large" color="#3b82f6" />
          )}
          style={styles.webview}
        />
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Cancel Payment</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  webview: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
