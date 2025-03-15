import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import RNPickerSelect from "react-native-picker-select";
import { ChevronDownIcon, Plus, Trash2 } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { Contact, useContacts } from "@/context/ContactsContext";
import * as Contacts from "expo-contacts";
import { ContactType as ExpoContactType } from "expo-contacts";

interface EmailEntry {
  email: string;
}

interface PhoneEntry {
  number: string;
}

interface EditContactFormData {
  name: string;
  emails: EmailEntry[];
  phoneNumbers: PhoneEntry[];
  country: string;
  countryCode: string;
  dob: Date | null;
  sex: string;
  contactType?: string;
}

enum ContactTypes {
  Personal = "personal",
  Business = "business",
  Family = "family",
  Work = "work",
  Company = "company",
  Other = "other",
}

const EditContact: React.FC = () => {
  const { session } = useAuth();
  const { addContact, updateContact } = useContacts();
  const { contact, isUpdate } = useLocalSearchParams();
  const router = useRouter();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const parsedContact = useMemo(() => {
    return contact ? JSON.parse(contact as string) : null;
  }, [contact]);

  const { control, handleSubmit, reset, watch, setValue } =
    useForm<EditContactFormData>({
      defaultValues: {
        name: "",
        emails: [{ email: "" }],
        phoneNumbers: [{ number: "" }],
        country: "",
        countryCode: "",
        dob: null,
        sex: "",
      },
    });

  const {
    fields: emailFields,
    append: appendEmail,
    remove: removeEmail,
  } = useFieldArray({
    control,
    name: "emails",
  });

  const {
    fields: phoneFields,
    append: appendPhone,
    remove: removePhone,
  } = useFieldArray({
    control,
    name: "phoneNumbers",
  });

  // Watch the phoneNumbers field for changes
  const phoneNumbers = watch("phoneNumbers");

  useEffect(() => {
    // Check if any phone number starts with +234
    const nigeriaNumber = phoneNumbers.find((phone) =>
      phone.number.startsWith("+234")
    );
    if (nigeriaNumber) {
      setValue("country", "Nigeria");
      setValue("countryCode", "+234");
    }
  }, [phoneNumbers, setValue]);

  useEffect(() => {
    if (parsedContact) {
      reset({
        name: parsedContact.name,
        emails:
          parsedContact.emails?.length > 0
            ? parsedContact.emails
            : [{ email: "" }],
        phoneNumbers:
          parsedContact.phoneNumbers?.length > 0
            ? parsedContact.phoneNumbers
            : [{ number: "" }],
        country: parsedContact.country,
        countryCode: parsedContact.countryCode,
        dob: parsedContact.dob ? new Date(parsedContact.dob) : null,
        sex: parsedContact.sex,
      });
    }
  }, [parsedContact, reset]);

  const onSave = async (formData: EditContactFormData) => {
    setLoading(true);
    try {
      // Request permissions
      const { status } = await Contacts.requestPermissionsAsync();
      // For Android specifically, we need to check both permissions
      if (Platform.OS === "android") {
        const { status: writeStatus } =
          await Contacts.requestPermissionsAsync();
        if (status !== "granted" || writeStatus !== "granted") {
          Alert.alert(
            "Permission Required",
            "You must grant contacts permission to save contacts"
          );
          setLoading(false);
          return;
        }
      } else if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "You must grant contacts permission to save contacts"
        );
        setLoading(false);
        return;
      }

      // Save contact to device
      const response = (await Contacts.addContactAsync({
        firstName: formData.name,
        emails: formData.emails
          .filter((e) => e.email.trim())
          .map((e) => ({ email: e.email, label: "work" })),
        phoneNumbers: formData.phoneNumbers
          .filter((p) => p.number.trim())
          .map((p) => ({ number: p.number, label: "mobile" })),
        birthday: formData.dob
          ? {
              day: formData.dob.getDate(),
              month: formData.dob.getMonth() + 1,
              year: formData.dob.getFullYear(),
            }
          : undefined,
        contactType: formData.contactType
          ? (formData.contactType as ExpoContactType)
          : (ContactTypes.Personal as ExpoContactType),
        name: formData.name,
      })) as unknown as { data: Contact; error?: Error };

      if (response.error) {
        throw new Error("Failed to save contact on device");
      } else {
        Alert.alert("Success", "Contact saved to your device");
      }

      router.back();
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message || "Failed to save contact");
      } else {
        Alert.alert("Error", "Failed to save contact");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!contact && isUpdate === "true") {
    return (
      <Text className="p-4 text-center text-lg">
        No contact data available.
      </Text>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white p-5">
      <Text className="text-2xl font-bold mb-4 text-center text-gray-800">
        {isUpdate === "true" ? "Edit Contact" : "Create Contact"}
      </Text>

      {/* Name */}
      <View className="mb-4">
        <Text className="text-base font-medium text-gray-700 mb-1">Name</Text>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className="border border-gray-300 rounded-lg p-3 bg-gray-50"
              value={value}
              onChangeText={onChange}
              placeholder="Full Name"
            />
          )}
        />
      </View>

      {/* Emails */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-base font-medium text-gray-700">Emails</Text>
          <TouchableOpacity
            onPress={() => appendEmail({ email: "" })}
            className="p-1"
          >
            <Plus size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        {emailFields.map((field, index) => (
          <View key={field.id} className="flex-row items-center mb-2">
            <Controller
              control={control}
              name={`emails.${index}.email`}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="flex-1 border border-gray-300 rounded-lg p-3 bg-gray-50 mr-2"
                  value={value}
                  onChangeText={onChange}
                  placeholder={`Email #${index + 1}`}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />
            {emailFields.length > 1 && (
              <TouchableOpacity
                onPress={() => removeEmail(index)}
                className="p-2"
              >
                <Trash2 size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Phone Numbers */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-base font-medium text-gray-700">Phones</Text>
          <TouchableOpacity
            onPress={() => appendPhone({ number: "" })}
            className="p-1"
          >
            <Plus size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        {phoneFields.map((field, index) => (
          <View key={field.id} className="flex-row items-center mb-2">
            <Controller
              control={control}
              name={`phoneNumbers.${index}.number`}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="flex-1 border border-gray-300 rounded-lg p-3 bg-gray-50 mr-2"
                  value={value}
                  onChangeText={onChange}
                  placeholder={`Phone #${index + 1}`}
                  keyboardType="phone-pad"
                />
              )}
            />
            {phoneFields.length > 1 && (
              <TouchableOpacity
                onPress={() => removePhone(index)}
                className="p-2"
              >
                <Trash2 size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Country */}
      <View className="mb-4">
        <Text className="text-base font-medium text-gray-700 mb-1">
          Country
        </Text>
        <Controller
          control={control}
          name="country"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className="border border-gray-300 rounded-lg p-3 bg-gray-50"
              value={value}
              onChangeText={onChange}
              placeholder="Country"
            />
          )}
        />
      </View>

      {/* Country Code */}
      <View className="mb-4">
        <Text className="text-base font-medium text-gray-700 mb-1">
          Country Code
        </Text>
        <Controller
          control={control}
          name="countryCode"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className="border border-gray-300 rounded-lg p-3 bg-gray-50"
              value={value}
              onChangeText={onChange}
              placeholder="Code (e.g., +1)"
            />
          )}
        />
      </View>

      {/* Date of Birth */}
      <View className="mb-4">
        <Text className="text-base font-medium text-gray-700 mb-1">
          Date of Birth
        </Text>
        <Controller
          control={control}
          name="dob"
          render={({ field: { onChange, value } }) => (
            <>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="border border-gray-300 rounded-lg p-3 bg-gray-50"
              >
                <Text className="text-gray-700 text-base">
                  {value
                    ? value.toISOString().split("T")[0]
                    : "Select Date of Birth"}
                </Text>
              </TouchableOpacity>

              <DateTimePickerModal
                isVisible={showDatePicker}
                mode="date"
                onConfirm={(date) => {
                  setShowDatePicker(false);
                  onChange(date);
                }}
                onCancel={() => setShowDatePicker(false)}
              />
            </>
          )}
        />
      </View>

      {/* Sex Selection */}
      <View className="mb-6">
        <Text className="text-base font-medium text-gray-700 mb-1">Gender</Text>
        <Controller
          control={control}
          name="sex"
          render={({ field: { onChange, value } }) => (
            <View className="border border-gray-300 rounded-lg bg-gray-50">
              <RNPickerSelect
                onValueChange={onChange}
                value={value}
                placeholder={{ label: "Select Gender", value: "" }}
                items={[
                  { label: "Male", value: "Male" },
                  { label: "Female", value: "Female" },
                  { label: "Prefer Not to Say", value: "Undisclosed" },
                ]}
                style={{
                  inputIOS: { padding: 12, color: "#4A5568" },
                  inputAndroid: { padding: 12, color: "#4A5568" },
                }}
                useNativeAndroidPickerStyle={false}
                Icon={() => (
                  <ChevronDownIcon
                    size={20}
                    color="#4A5568"
                    className="mb-3 mt-4 mr-6 ml-2 bg-gray-50"
                  />
                )}
              />
            </View>
          )}
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity
        className="bg-blue-500 p-4 rounded-lg items-center shadow-lg disabled:opacity-50 mb-10"
        onPress={handleSubmit(onSave)}
        disabled={loading}
      >
        <Text className="text-white font-bold text-lg">
          {loading ? "Processing..." : "Save Contact"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default EditContact;
