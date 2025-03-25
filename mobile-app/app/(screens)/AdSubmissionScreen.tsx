import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
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
  else if (positionId === 5) return "contacts";
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

      // Only apply the exclusion if there are booked positions
      if (bookedPositionIds.length > 0) {
        // Convert array to string "(1,2,3)"
        const bookedStr = `(${bookedPositionIds.join(",")})`;
        query = query.not("position_id", "in", bookedStr);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Format the positions if needed
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
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Please allow media library access");
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [6, 4],
        quality: 1,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      setPreviewUri(file.uri);

      // Prepare upload
      const fileExt =
        file.uri.split(".").pop() || (file.type === "video" ? "mp4" : "jpg");
      const fileName = `${user?.user.id}/${Date.now()}.${fileExt}`;

      // Create FormData
      const uploadData = new FormData();
      uploadData.append("file", {
        uri: file.uri,
        name: fileName,
        type: file.type === "video" ? "video/mp4" : "image/jpeg",
      } as any);

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from("adsfile")
        .upload(fileName, uploadData);

      if (error) throw error;

      // Get public URL
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

  // Instead of submitting the ad immediately, we now trigger the payment flow.
  const handleAdSubmit = () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fill all required fields");
      return;
    }
    setShowPaymentModal(true);
  };

  // Callback triggered when payment is successful.
  const handlePaymentSuccess = async (paymentData: PaymentData) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const durationDays = Math.ceil(
        (formData.endDate.getTime() - formData.startDate.getTime()) /
          (1000 * 3600 * 24)
      );

      const submissionId = `CONTACT-SYNC${user?.user.id}-${Date.now()}IP-TEC`;

      const pricingType = getPricingType(Number(formData.positionId));

      const { error } = await supabase
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
          status: "active",
          payment_duration: `${durationDays} days`,
          submission_id: submissionId,
        })
        .select();

      if (error) throw error;

      setShowPaymentModal(false);
      navigation.goBack();
      Alert.alert("Success", "Ad submitted for approval");
    } catch (error) {
      console.error("Submission error:", error);
      Alert.alert(
        "Submission Error",
        error instanceof Error ? error.message : "Failed to submit ad"
      );
    } finally {
      setIsSubmitting(false);
      setShowPaymentModal(false);
    }
  };

  const handlePaymentError = (error: any) => {
    Alert.alert("Payment Error", error.message || "Payment failed");
    setShowPaymentModal(false);
  };

  return (
    <ScrollView className="p-4 bg-white">
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
              showDatePicker === "start" ? formData.startDate : formData.endDate
            }
            mode="date"
            minimumDate={new Date()}
            onChange={(event, date) => {
              setShowDatePicker(null);
              if (date) {
                setFormData((prev) => ({
                  ...prev,
                  [showDatePicker === "start" ? "startDate" : "endDate"]: date,
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
            positions.find((p) => p.position_id === Number(formData.positionId))
              ?.description
          }
        </Text>
      </View>

      {/* Submit Button - triggers Payment Flow */}
      <TouchableOpacity
        className="bg-blue-500 p-4 rounded-lg"
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
                // Clear the payment modal first
                setShowPaymentModal(false);
                // Then handle submission
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
  );
};

export default AdSubmissionScreen;
