import { supabase } from "@/lib/supabase";
import React from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet
} from "react-native";
import { Toast } from "react-native-toast-notifications";
import { WebView, WebViewMessageEvent } from "react-native-webview";

interface PaymentComponentProps {
  visible: boolean;
  url?: string;
  amount: number;
  onPaymentSuccess: (data: PaymentData) => void;
  onClose: () => void;
}

interface PaymentData {
  transactionId?: string;
  amount?: number;
  status?: "success" | "failed" | "pending";
  timestamp?: string;
  // Add other relevant payment fields
}

export default function PaymentComponent({
  visible,
  url,
  amount,
  onPaymentSuccess,
  onClose,
}: PaymentComponentProps) {
  const [paymentUrl, setPaymentUrl] = React.useState(url);
  const [loading, setLoading] = React.useState(!url);
  const webViewRef = React.useRef<WebView>(null);
  const successHandled = React.useRef(false);

  const injectedJS = `(function() {
    const successPatterns = [
      "Payment successful",
      "Thank you for your payment",
      "Transaction successful",
      "Transaction completed",
      "Download Receipt",
      "pay for advertisement on Contact Sync mobile app",
      "Peter Otakhor"
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

  React.useEffect(() => {
    if (!url) {
      const fetchUrl = async () => {
        try {
          const { data: ads_link, error } = await supabase
            .from("ads_link")
            .select("*")
            .single();

          if (error) throw error;

          setPaymentUrl(ads_link.link_url);
        } catch (error: any) {
          Toast.show(error.message, {
            type: "danger",
            placement: "top",
            duration: 5000,
            animationType: "slide-in",
          });
          console.error("Error fetching ads_link:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchUrl();
    }

    return () => {
      // Cleanup when component unmounts
      if (webViewRef.current) {
        webViewRef.current.stopLoading();
      }
      successHandled.current = false;
    };
  }, [url]);

  const handleMessage = (event: WebViewMessageEvent) => {
    if (event.nativeEvent.data === "success" && !successHandled.current) {
      successHandled.current = true;
      // Create a payment data object with relevant information
      const paymentData: PaymentData = {
        status: "success",
        timestamp: new Date().toISOString(),
        amount: amount,
      };
      onPaymentSuccess(paymentData);
    }
  };

  if (loading) {
    return (
      <View style={styles.fullScreenCentered}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading payment gateway...</Text>
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {paymentUrl && (
            <View style={styles.amountContainer}>
              <Text style={styles.amountText}>Amount: {amount.toFixed(2)}</Text>
            </View>

            // Render the WebView if paymentUrl exists
          )}

          {paymentUrl ? (
            <WebView
              ref={webViewRef}
              source={{ uri: paymentUrl }}
              injectedJavaScript={injectedJS}
              onMessage={handleMessage}
              onShouldStartLoadWithRequest={(request) => {
                // Prevent redirects from triggering multiple successes
                if (!request.url.startsWith(paymentUrl!)) {
                  webViewRef.current?.stopLoading();
                  return false;
                }
                return true;
              }}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text style={styles.loadingText}>
                    Loading payment gateway...
                  </Text>
                </View>
              )}
              style={styles.webview}
            />
          ) : (
            <View style={styles.loadingContainer}>
              <Text>Unable to load payment gateway</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              if (webViewRef.current) {
                webViewRef.current.stopLoading();
              }
              onClose();
            }}
          >
            <Text style={styles.closeButtonText}>Cancel Payment</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreenCentered: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  modalOverlay: {
    flex: 1,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
  },
  amountContainer: {
    padding: 10,
    backgroundColor: "#3b82f6",
    alignItems: "center",
  },
  amountText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#3b82f6",
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
