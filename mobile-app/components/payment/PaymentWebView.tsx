import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import WebView from "react-native-webview";
import { encode } from 'base-64';

interface PaymentWebViewProps {
  visible: boolean;
  amount: number;
  currency: string;
  apiKey: string;
  apiSecret: string;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

export default function PaymentWebView({
  visible,
  amount,
  currency,
  apiKey,
  apiSecret,
  onPaymentSuccess,
  onClose,
}: PaymentWebViewProps) {
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;

    const createPaymentSession = async () => {
      try {
        const authToken = encode(`${apiKey}:${apiSecret}`);
        const response = await fetch(
          "https://api.credocentral.com/transaction/initialize", // Verify if this is the correct endpoint
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Basic ${authToken}`,
            },
            body: JSON.stringify({
              amount: amount * 100,
              currency,
              redirect_url: "https://your-app.com/payment-success",
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.url) {
          setPaymentUrl(data.url);
        } else {
          throw new Error("Failed to get payment URL");
        }
      } catch (error) {
        console.error("Payment error:", error);
        setError(error instanceof Error ? error.message : "Payment failed");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    createPaymentSession();
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white dark:bg-gray-900">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 bg-blue-600 dark:bg-blue-800">
          <Text className="text-white text-lg font-bold">Complete Payment</Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-white text-lg">✕</Text>
          </TouchableOpacity>
        </View>

        {/* Loading/Error State */}
        {loading ? (
          <View className="flex-1 items-center justify-center space-y-4">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-gray-600 dark:text-gray-300">
              Processing payment...
            </Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center p-4 space-y-4">
            <Text className="text-red-500 text-lg font-bold">{error}</Text>
            <TouchableOpacity
              className="bg-red-500 rounded-lg px-6 py-3"
              onPress={onClose}
            >
              <Text className="text-white font-semibold">Close</Text>
            </TouchableOpacity>
          </View>
        ) : (
          paymentUrl && (
            <WebView
              source={{ uri: paymentUrl }}
              onNavigationStateChange={(navState) => {
                if (navState.url.includes("/payment-success")) {
                  onPaymentSuccess();
                }
              }}
              startInLoadingState
              renderLoading={() => (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator size="large" color="#3b82f6" />
                </View>
              )}
              className="flex-1"
            />
          )
        )}

        {/* Footer */}
        <View className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Text className="text-gray-500 dark:text-gray-400 text-center text-sm">
            Secure payment processed by CredoCentral
          </Text>
        </View>
      </View>
    </Modal>
  );
}
