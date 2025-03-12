import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { BottomSheetModal, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useForm, Controller } from "react-hook-form";
import DateTimePicker from "@react-native-community/datetimepicker";

interface EditContactFormData {
  name: string;
  email: string;
  phone: string;
  country: string;
  countryCode: string;
  dob: Date;
  sex: string;
}

const ContactDetail: React.FC = () => {
  const { contact } = useLocalSearchParams();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [contactData, setContactData] = useState<any>({});

  // Initialize form with contact data
  const { control, handleSubmit, reset } = useForm<EditContactFormData>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      country: "",
      countryCode: "",
      dob: new Date(),
      sex: "",
    },
  });

  // Parse contact data when component mounts
  React.useEffect(() => {
    if (contact) {
      const parsedContact = JSON.parse(contact as string);
      setContactData(parsedContact);
      reset({
        name: parsedContact.name || "",
        email: parsedContact.emails?.[0]?.email || "",
        phone: parsedContact.phoneNumbers?.[0]?.number || "",
        country: parsedContact.country || "",
        countryCode: parsedContact.countryCode || "",
        dob: parsedContact.birthday
          ? new Date(parsedContact.birthday)
          : new Date(),
        sex: parsedContact.sex || "",
      });
    }
  }, [contact]);

  if (!contact) {
    return (
      <Text className="p-4 text-center text-lg">
        No contact data available.
      </Text>
    );
  }

  const firstInitial = contactData.name ? contactData.name.charAt(0) : "?";

  const handleSave = (data: EditContactFormData) => {
    setContactData({
      ...contactData,
      name: data.name,
      emails: [{ email: data.email }],
      phoneNumbers: [{ number: data.phone }],
      country: data.country,
      countryCode: data.countryCode,
      birthday: data.dob.toISOString().split("T")[0],
      sex: data.sex,
    });
    bottomSheetRef.current?.dismiss();
  };

  return (
    <View className="flex-1">
      <ScrollView className="bg-gray-100">
        {/* Header Section */}
        <View className="bg-white p-6 shadow rounded-b-3xl items-center relative">
          <View className="w-24 h-24 rounded-full bg-blue-500 items-center justify-center">
            <Text className="text-white text-3xl font-bold">
              {firstInitial}
            </Text>
          </View>
          <Text className="text-2xl font-bold mt-4">{contactData.name}</Text>
          {contactData.jobTitle && (
            <Text className="text-lg text-gray-600 mt-1">
              {contactData.jobTitle}
            </Text>
          )}
          <TouchableOpacity
            className="absolute top-4 right-4 bg-blue-500 p-2 rounded-full"
            onPress={() => bottomSheetRef.current?.present()}
          >
            <IconSymbol name="pencil.circle.fill" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Details Section */}
        <View className="mt-4 px-4 mb-8">
          {contactData.phoneNumbers?.length > 0 && (
            <View className="bg-white p-4 rounded-lg mb-4 shadow">
              <Text className="text-lg font-semibold mb-2">Phone Numbers</Text>
              {contactData.phoneNumbers.map(
                (phone: { number: string }, index: number) => (
                  <View
                    key={index}
                    className="flex-row items-center py-1.5 border-b border-gray-200"
                  >
                    <IconSymbol name="phone.fill" size={20} color="#0a7ea4" />
                    <Text className="text-base ml-2">
                      {phone.number || "N/A"}
                    </Text>
                  </View>
                )
              )}
            </View>
          )}

          {contactData.emails?.length > 0 && (
            <View className="bg-white p-4 rounded-lg mb-4 shadow">
              <Text className="text-lg font-semibold mb-2">Email</Text>
              {contactData.emails.map(
                (email: { email: string }, index: number) => (
                  <View
                    key={index}
                    className="flex-row items-center py-1.5 border-b border-gray-200"
                  >
                    <IconSymbol
                      name="envelope.fill"
                      size={20}
                      color="#0a7ea4"
                    />
                    <Text className="text-base ml-2">
                      {email.email || "N/A"}
                    </Text>
                  </View>
                )
              )}
            </View>
          )}

          {contactData.country && (
            <View className="bg-white p-4 rounded-lg mb-4 shadow">
              <Text className="text-lg font-semibold mb-2">Country</Text>
              <Text className="text-base">{contactData.country}</Text>
            </View>
          )}

          {contactData.countryCode && (
            <View className="bg-white p-4 rounded-lg mb-4 shadow">
              <Text className="text-lg font-semibold mb-2">Country Code</Text>
              <Text className="text-base">{contactData.countryCode}</Text>
            </View>
          )}

          {contactData.birthday && (
            <View className="bg-white p-4 rounded-lg mb-4 shadow">
              <Text className="text-lg font-semibold mb-2">Date of Birth</Text>
              <Text className="text-base">{contactData.birthday}</Text>
            </View>
          )}

          {contactData.sex && (
            <View className="bg-white p-4 rounded-lg mb-4 shadow">
              <Text className="text-lg font-semibold mb-2">Sex</Text>
              <Text className="text-base">{contactData.sex}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit Contact Bottom Sheet */}
      <BottomSheetModal
        ref={bottomSheetRef}
        index={90}
        snapPoints={["90%"]}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
          />
        )}
      >
        <ScrollView className="flex-1 bg-gray-100 p-4">
          <Text className="text-xl font-bold mb-4 text-center">
            Edit Contact
          </Text>

          {/* Name Field */}
          <Text className="text-base mt-3 mb-1">Name</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="border border-gray-300 rounded-md p-2 bg-white"
                value={value}
                onChangeText={onChange}
                placeholder="Name"
              />
            )}
          />

          {/* Email Field */}
          <Text className="text-base mt-3 mb-1">Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="border border-gray-300 rounded-md p-2 bg-white"
                value={value}
                onChangeText={onChange}
                placeholder="Email"
                keyboardType="email-address"
              />
            )}
          />

          {/* Phone Field */}
          <Text className="text-base mt-3 mb-1">Phone Number</Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="border border-gray-300 rounded-md p-2 bg-white"
                value={value}
                onChangeText={onChange}
                placeholder="Phone Number"
                keyboardType="phone-pad"
              />
            )}
          />

          {/* Country Field */}
          <Text className="text-base mt-3 mb-1">Country</Text>
          <Controller
            control={control}
            name="country"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="border border-gray-300 rounded-md p-2 bg-white"
                value={value}
                onChangeText={onChange}
                placeholder="Country"
              />
            )}
          />

          {/* Country Code Field */}
          <Text className="text-base mt-3 mb-1">Country Code</Text>
          <Controller
            control={control}
            name="countryCode"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="border border-gray-300 rounded-md p-2 bg-white"
                value={value}
                onChangeText={onChange}
                placeholder="Country Code"
              />
            )}
          />

          {/* Date of Birth Field */}
          <Text className="text-base mt-3 mb-1">Date of Birth</Text>
          <Controller
            control={control}
            name="dob"
            render={({ field: { onChange, value } }) => (
              <>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="border border-gray-300 rounded-md p-3 mb-2 justify-center bg-white"
                >
                  <Text className="text-base">
                    {value.toISOString().split("T")[0]}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={value}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(_, date) => {
                      setShowDatePicker(false);
                      if (date) onChange(date);
                    }}
                  />
                )}
              </>
            )}
          />

          {/* Sex Field */}
          <Text className="text-base mt-3 mb-1">Sex</Text>
          <Controller
            control={control}
            name="sex"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="border border-gray-300 rounded-md p-2 bg-white"
                value={value}
                onChangeText={onChange}
                placeholder="Sex"
              />
            )}
          />

          {/* Save Button */}
          <TouchableOpacity
            className="bg-blue-500 p-3 rounded-md mt-6 items-center"
            onPress={handleSubmit(handleSave)}
          >
            <Text className="text-white font-bold text-base">Save</Text>
          </TouchableOpacity>
        </ScrollView>
      </BottomSheetModal>
    </View>
  );
};

export default ContactDetail;
