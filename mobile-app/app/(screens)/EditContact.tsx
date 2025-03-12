import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
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

const EditContact: React.FC = () => {
  const { contact } = useLocalSearchParams();
  const router = useRouter();

  if (!contact) {
    return (
      <Text className="p-4 text-center text-lg">
        No contact data available.
      </Text>
    );
  }

  const parsedContact = JSON.parse(contact as string);

  const { control, handleSubmit } = useForm<EditContactFormData>({
    defaultValues: {
      name: parsedContact.name || "",
      email:
        parsedContact.emails && parsedContact.emails.length > 0
          ? parsedContact.emails[0].email
          : "",
      phone:
        parsedContact.phoneNumbers && parsedContact.phoneNumbers.length > 0
          ? parsedContact.phoneNumbers[0].number
          : "",
      country: parsedContact.country || "",
      countryCode: parsedContact.countryCode || "",
      dob: parsedContact.birthday ? new Date(parsedContact.birthday) : new Date(),
      sex: parsedContact.sex || "",
    },
  });

  // State to control DateTimePicker visibility
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  const onSave = (data: EditContactFormData) => {
    console.log("Updated contact data:", data);
    // Optionally update the contact data in context or send to your backend.
    // Then navigate back.
    router.back();
  };

  return (
    <ScrollView className="flex-1 bg-gray-100 p-4">
      <Text className="text-xl font-bold mb-4 text-center">Edit Contact</Text>

      <Text className="text-base mt-3 mb-1">Name</Text>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-md p-2"
            value={value}
            onChangeText={onChange}
            placeholder="Name"
          />
        )}
      />

      <Text className="text-base mt-3 mb-1">Email</Text>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-md p-2"
            value={value}
            onChangeText={onChange}
            placeholder="Email"
            keyboardType="email-address"
          />
        )}
      />

      <Text className="text-base mt-3 mb-1">Phone Number</Text>
      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-md p-2"
            value={value}
            onChangeText={onChange}
            placeholder="Phone Number"
            keyboardType="phone-pad"
          />
        )}
      />

      <Text className="text-base mt-3 mb-1">Country</Text>
      <Controller
        control={control}
        name="country"
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-md p-2"
            value={value}
            onChangeText={onChange}
            placeholder="Country"
          />
        )}
      />

      <Text className="text-base mt-3 mb-1">Country Code</Text>
      <Controller
        control={control}
        name="countryCode"
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-md p-2"
            value={value}
            onChangeText={onChange}
            placeholder="Country Code"
          />
        )}
      />

      <Text className="text-base mt-3 mb-1">Date of Birth</Text>
      <Controller
        control={control}
        name="dob"
        render={({ field: { onChange, value } }) => (
          <>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="border border-gray-300 rounded-md p-3 mb-2 justify-center"
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
                  if (date) {
                    onChange(date);
                  }
                }}
              />
            )}
          </>
        )}
      />

      <Text className="text-base mt-3 mb-1">Sex</Text>
      <Controller
        control={control}
        name="sex"
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-md p-2"
            value={value}
            onChangeText={onChange}
            placeholder="Sex"
          />
        )}
      />

      <TouchableOpacity
        className="bg-blue-500 p-3 rounded-md mt-6 items-center"
        onPress={handleSubmit(onSave)}
      >
        <Text className="text-white font-bold text-base">Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default EditContact;
