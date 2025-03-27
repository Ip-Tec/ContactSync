import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Alert,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import PaymentComponent from "@/components/payment/PaymentComponent";
import {
  useNavigation,
  NavigationProp,
  ParamListBase,
} from "@react-navigation/native";

interface AdPosition {
  position_id: number;
  position_name: string;
  description: string;
  pricing: number;
}

interface PaymentData {
  transactionId?: string;
  amount?: number;
  status?: "success" | "failed" | "pending";
  timestamp?: string;
  // Add other relevant payment fields
}

// Helper to return pricing_type based on positionId
const getPricingType = (positionId: number): string => {
  if (positionId === 1) return "home";
  else if (positionId >= 2 && positionId <= 4) return "carousel";
  else if (positionId === 5)
    return "contact"; // changed from "contacts" to "contact"
  else if (positionId === 6) return "discover";
  else if (positionId === 7) return "profile";
  else return "unknown";
};

const AdSubmissionScreen = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { session: user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState<AdPosition[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingAdId, setPendingAdId] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    positionId: "",
    mediaUrl: "",
    mediaType: "image",
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week
    redirectUrl: "",
    calculatedPrice: 0,
  });
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<"start" | "end" | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAdPositions();
  }, []);

  const fetchAdPositions = async () => {
    try {
      const now = new Date().toISOString();

      // 1. Get the positions that are currently booked (active or pending) and not expired
      const { data: bookedAds, error: bookedError } = await supabase
        .from("ads")
        .select("position_id")
        .in("status", ["active", "pending"])
        .lte("start_date", now)
        .gt("end_date", now);

      if (bookedError) throw bookedError;

      // Get an array of booked position IDs
      const bookedPositionIds: number[] =
        bookedAds?.map((ad: any) => ad.position_id) || [];

      // 2. Query ad positions/pricing that are effective now and NOT in the booked list.
      let query = supabase
        .from("ad_position_pricing")
        .select("*, ad_positions:ad_positions(*)")
        .lte("effective_from", now)
        .or(`effective_to.is.null,effective_to.gte.${now}`);

      if (bookedPositionIds.length > 0) {
        const bookedStr = `(${bookedPositionIds.join(",")})`;
        query = query.not("position_id", "in", bookedStr);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formattedPositions = data.map((item: any) => ({
        position_id: item.position_id,
        position_name: item.ad_positions?.position_name || "Unknown",
        description: item.ad_positions?.description || "",
        pricing: item.base_price,
      }));

      setPositions(formattedPositions);
    } catch (error) {
      console.error("Error fetching ad positions:", error);
      Alert.alert("Error", "Failed to load ad positions");
    }
  };

  const calculatePrice = () => {
    if (!formData.positionId) return 0;
    const days = Math.ceil(
      (formData.endDate.getTime() - formData.startDate.getTime()) /
        (1000 * 3600 * 24)
    );
    const position = positions.find(
      (p) => p.position_id === Number(formData.positionId)
    );
    return days * (position?.pricing || 0);
  };

  const handleMediaUpload = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Please allow media library access");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [6, 4],
        quality: 1,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      setPreviewUri(file.uri);

      const fileExt =
        file.uri.split(".").pop() || (file.type === "video" ? "mp4" : "jpg");
      const fileName = `${user?.user.id}/${Date.now()}.${fileExt}`;

      const uploadData = new FormData();
      uploadData.append("file", {
        uri: file.uri,
        name: fileName,
        type: file.type === "video" ? "video/mp4" : "image/jpeg",
      } as any);

      const { data, error } = await supabase.storage
        .from("adsfile")
        .upload(fileName, uploadData);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("adsfile").getPublicUrl(data.path);

      setFormData((prev) => ({
        ...prev,
        mediaUrl: publicUrl,
        mediaType: file.type === "video" ? "video" : "image",
      }));
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert(
        "Upload Error",
        error instanceof Error
          ? error.message
          : "Upload failed. Please try again."
      );
    }
  };

  const validateForm = () => {
    return (
      formData.positionId &&
      formData.mediaUrl &&
      formData.startDate < formData.endDate &&
      formData.redirectUrl
    );
  };

  const submissionId = `CONTACT-SYNC${user?.user.id}-${Date.now()}IP-TEC`;

  // First, create a pending ad record.
  const createPendingAd = async (): Promise<number> => {
    const durationDays = Math.ceil(
      (formData.endDate.getTime() - formData.startDate.getTime()) /
        (1000 * 3600 * 24)
    );
    const pricingType = getPricingType(Number(formData.positionId));
    const { data, error } = await supabase
      .from("ads")
      .insert({
        user_id: user?.user.id,
        position_id: Number(formData.positionId),
        media_type: formData.mediaType,
        pricing_type: pricingType,
        media_url: formData.mediaUrl,
        start_date: formData.startDate.toISOString(),
        end_date: formData.endDate.toISOString(),
        redirect_url: formData.redirectUrl,
        payment_amount: calculatePrice(),
        status: "pending", // Insert as pending
        payment_duration: `${durationDays} days`,
        submission_id: submissionId,
      })
      .select();

    if (error) throw error;
    // Assuming the returned data has an "ad_id" field.
    return data[0].ad_id;
  };

  // Update an ad record to active once payment is successful.
  const updateAdToActive = async (
    submissionId: string,
    paymentData: PaymentData
  ): Promise<void> => {
    const { error } = await supabase
      .from("ads")
      .update({ status: "active" /*, payment_data: paymentData*/ })
      .eq("submission_id", submissionId);
    if (error) throw error;
  };

  // When the user submits the ad, create the pending record and then show payment.
  const handleAdSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fill all required fields");
      return;
    }
    try {
      setIsSubmitting(true);
      // Create a pending ad record.
      const adId = await createPendingAd();
      setPendingAdId(adId);
      // Show payment modal
      setShowPaymentModal(true);
    } catch (error) {
      console.error("Submission error:", error);
      Alert.alert(
        "Submission Error",
        error instanceof Error ? error.message : "Failed to submit ad"
      );
      setIsSubmitting(false);
    }
  };

  // When payment is successful, update the pending ad to active and show a success modal.
  const handlePaymentSuccess = async (paymentData: PaymentData) => {
    if (isSubmitting) return;
    try {
      if (!pendingAdId) {
        throw new Error("No pending ad record found.");
      }
      await updateAdToActive(submissionId, paymentData);
      // Hide payment modal and show success modal.
      setShowPaymentModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Submission error:", error);
      Alert.alert(
        "Submission Error",
        error instanceof Error ? error.message : "Failed to submit ad"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentError = (error: any) => {
    Alert.alert("Payment Error", error.message || "Payment failed");
    setShowPaymentModal(false);
  };

  return (
    <>
      <ScrollView className="p-4 bg-white h-vh overflow-y-scroll">
        <Text className="text-2xl font-bold my-6">Create New Ad</Text>

        {/* Position Selection */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2">Ad Position</Text>
          <Picker
            selectedValue={formData.positionId}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, positionId: value }))
            }
          >
            <Picker.Item label="Select Position" value="" />
            {positions.map((position) => (
              <Picker.Item
                key={position.position_id}
                label={`${position.position_name} - $${position.pricing}/day`}
                value={position.position_id}
              />
            ))}
          </Picker>
        </View>

        {/* Media Upload */}
        <TouchableOpacity
          className="bg-blue-100 p-4 rounded-lg mb-4"
          onPress={handleMediaUpload}
        >
          <Text className="text-blue-600 text-center">
            {formData.mediaUrl
              ? "Media Uploaded ✓"
              : "Upload Ad Media (Image/Video)"}
          </Text>
        </TouchableOpacity>

        {/* Media Preview */}
        {previewUri && formData.mediaType === "image" ? (
          <Image
            source={{ uri: previewUri }}
            style={{
              width: 200,
              height: 200,
              alignSelf: "center",
              marginBottom: 16,
            }}
          />
        ) : previewUri && formData.mediaType === "video" ? (
          <Text className="text-center mb-4">Video Selected</Text>
        ) : null}

        {/* Date Selection */}
        <View className="flex-row justify-between mb-4">
          <TouchableOpacity
            className="flex-1 mr-2 p-3 border rounded-lg"
            onPress={() => setShowDatePicker("start")}
          >
            <Text className="text-gray-600">Start Date</Text>
            <Text>{formData.startDate.toLocaleDateString()}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 ml-2 p-3 border rounded-lg"
            onPress={() => setShowDatePicker("end")}
          >
            <Text className="text-gray-600">End Date</Text>
            <Text>{formData.endDate.toLocaleDateString()}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={
                showDatePicker === "start"
                  ? formData.startDate
                  : formData.endDate
              }
              mode="date"
              minimumDate={new Date()}
              onChange={(event, date) => {
                setShowDatePicker(null);
                if (date) {
                  setFormData((prev) => ({
                    ...prev,
                    [showDatePicker === "start" ? "startDate" : "endDate"]:
                      date,
                  }));
                }
              }}
            />
          )}
        </View>

        {/* Contact Link Input (Website/WhatsApp) */}
        <TextInput
          className="border p-3 rounded-lg mb-4"
          placeholder="Enter Contact Link (Website or WhatsApp)"
          value={formData.redirectUrl}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, redirectUrl: text }))
          }
          keyboardType="url"
        />

        {/* Price Calculation */}
        <View className="bg-gray-100 p-4 rounded-lg mb-4">
          <Text className="text-lg font-semibold">
            Total Cost: ${calculatePrice().toFixed(2)}
          </Text>
          <Text className="text-gray-600 text-sm">
            {
              positions.find(
                (p) => p.position_id === Number(formData.positionId)
              )?.description
            }
          </Text>
        </View>

        {/* Submit Button - triggers Payment Flow */}
        <TouchableOpacity
          className="bg-blue-500 p-4 rounded-lg mb-8"
          onPress={handleAdSubmit}
          disabled={loading || !validateForm()}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-bold">
              Submit Ad Request
            </Text>
          )}
        </TouchableOpacity>

        {/* Payment Modal */}
        <Modal visible={showPaymentModal} animationType="slide" transparent>
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-white p-4 rounded-lg w-full h-4/5">
              <PaymentComponent
                amount={calculatePrice()}
                visible={showPaymentModal}
                onPaymentSuccess={(paymentData) => {
                  setShowPaymentModal(false);
                  handlePaymentSuccess(paymentData);
                }}
                onClose={() => {
                  setShowPaymentModal(false);
                  setIsSubmitting(false);
                }}
              />
            </View>
          </View>
        </Modal>
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} animationType="slide" transparent>
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <Text style={styles.successTitle}>Ad Submitted Successfully!</Text>
            <Text style={styles.successMessage}>
              Your ad has been approved and is now active.
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack(); // or navigation.navigate("Home")
              }}
            >
              <Text style={styles.successButtonText}>Go Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  successModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successModalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  successButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  successButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AdSubmissionScreen;
