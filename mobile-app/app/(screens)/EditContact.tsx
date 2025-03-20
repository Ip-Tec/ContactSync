import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import DateTimePicker from "@react-native-community/datetimepicker"; // New date picker import
import RNPickerSelect from "react-native-picker-select";
import { Ionicons } from "@expo/vector-icons"; // Using Ionicons for icons
import { useAuth } from "@/context/AuthContext";
import { Contact, useContacts } from "@/context/ContactsContext";
import * as Contacts from "expo-contacts";
import { ContactType as ExpoContactType } from "expo-contacts";

// ---------- ICON COMPONENTS ----------

// Replace lucide-react-native's icons with Ionicons equivalents
const ChevronDownIcon = ({ size = 20, color = "#4A5568" }) => (
  <Ionicons name="chevron-down" size={size} color={color} />
);

const PlusIcon = ({ size = 20, color = "#3B82F6" }) => (
  <Ionicons name="add" size={size} color={color} />
);

const TrashIcon = ({ size = 20, color = "#EF4444" }) => (
  <Ionicons name="trash" size={size} color={color} />
);

// ---------- CUSTOM DATE PICKER COMPONENT ----------
// This component replaces react-native-modal-datetime-picker.
// It uses @react-native-community/datetimepicker and a custom modal for iOS if needed.
// IMPORTANT: If no date is provided, it does not default to today's date in the form.
const CustomDatePicker = ({
  date,
  onChange,
}: {
  date: Date | null;
  onChange: (date: Date) => void;
}) => {
  // Initialize selectedDate as whatever is provided (null or a date)
  const [selectedDate, setSelectedDate] = useState<Date | null>(date);
  const [show, setShow] = useState(false);

  // Handler for date change
  const handleChange = (event: any, newDate?: Date) => {
    if (newDate) {
      setSelectedDate(newDate);
      // For Android, update immediately and close the picker.
      if (Platform.OS !== "ios") {
        setShow(false);
        onChange(newDate);
      }
    }
  };

  return (
    <View>
      {/* Touchable area shows either the selected date or a placeholder */}
      <TouchableOpacity
        onPress={() => setShow(true)}
        className="border border-gray-300 rounded-lg p-3 bg-gray-50"
      >
        <Text className="text-gray-700 text-base">
          {selectedDate
            ? selectedDate.toISOString().split("T")[0]
            : "Select Date of Birth"}
        </Text>
      </TouchableOpacity>
      {show &&
        (Platform.OS === "android" ? (
          // Android: DateTimePicker appears as a dialog.
          <DateTimePicker
            value={selectedDate || new Date()} // Supply current date if none selected (only for picker)
            mode="date"
            display="default"
            onChange={handleChange}
          />
        ) : (
          // iOS: Wrap DateTimePicker in a Modal.
          <Modal transparent animationType="slide">
            <View className="flex-1 justify-center items-center">
              <View className="bg-white p-5 rounded-lg">
                <DateTimePicker
                  value={selectedDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={handleChange}
                  style={{ width: "100%" }}
                />
                {/* Confirm Button for iOS */}
                <TouchableOpacity
                  onPress={() => {
                    setShow(false);
                    // Only update if a date is selected.
                    if (selectedDate) onChange(selectedDate);
                  }}
                  className="mt-4 bg-blue-500 p-3 rounded-lg"
                >
                  <Text className="text-white font-bold text-center">
                    Confirm
                  </Text>
                </TouchableOpacity>
                {/* Cancel Button for iOS */}
                <TouchableOpacity
                  onPress={() => setShow(false)}
                  className="mt-2 bg-gray-300 p-3 rounded-lg"
                >
                  <Text className="text-gray-800 font-bold text-center">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        ))}
    </View>
  );
};

// ---------- INTERFACES AND ENUMS ----------

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

// ---------- MAIN COMPONENT ----------

const EditContact = () => {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const { addContact, updateContact } = useContacts();
  const { contact, isUpdate } = useLocalSearchParams();

  // Parse the passed contact JSON string if available.
  const parsedContact = useMemo(() => {
    return contact ? JSON.parse(contact as string) : null;
  }, [contact]);

  // Initialize react-hook-form with default values.
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

  // Manage dynamic email fields using useFieldArray.
  const {
    fields: emailFields,
    append: appendEmail,
    remove: removeEmail,
  } = useFieldArray({
    control,
    name: "emails",
  });

  // Manage dynamic phone number fields using useFieldArray.
  const {
    fields: phoneFields,
    append: appendPhone,
    remove: removePhone,
  } = useFieldArray({
    control,
    name: "phoneNumbers",
  });

  // Watch for changes in phone numbers to auto-update country and code if a Nigerian number is detected.
  const phoneNumbers = watch("phoneNumbers");
  useEffect(() => {
    const nigeriaNumber = phoneNumbers.find((phone) =>
      phone.number.startsWith("+234")
    );
    if (nigeriaNumber) {
      setValue("country", "Nigeria");
      setValue("countryCode", "+234");
    }
  }, [phoneNumbers, setValue]);

  // When editing an existing contact, reset the form with the contact's data.
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

  // Function to save the contact to the device.
  const onSave = async (formData: EditContactFormData) => {
    setLoading(true);
    try {
      // Request permissions to access contacts.
      const { status } = await Contacts.requestPermissionsAsync();
      // For Android, request both read and write permissions.
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

      // Save the contact using expo-contacts.
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

      // Handle possible errors.
      if (response.error) {
        throw new Error("Failed to save contact on device");
      } else {
        Alert.alert("Success", "Contact saved to your device");
      }

      // Go back to the previous screen after saving.
      router.back();
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message || "Failed to save contact");
        console.log(error.message)
      } else {
        Alert.alert("Error", "Failed to save contact");
      }
    } finally {
      setLoading(false);
    }
  };

  // If the screen is in update mode but no contact data is provided, display a message.
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

      {/* NAME FIELD */}
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

      {/* EMAIL FIELDS */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-base font-medium text-gray-700">Emails</Text>
          <TouchableOpacity
            onPress={() => appendEmail({ email: "" })}
            className="p-1"
          >
            <PlusIcon size={20} color="#3B82F6" />
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
                <TrashIcon size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* PHONE NUMBER FIELDS */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-base font-medium text-gray-700">Phones</Text>
          <TouchableOpacity
            onPress={() => appendPhone({ number: "" })}
            className="p-1"
          >
            <PlusIcon size={20} color="#3B82F6" />
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
                <TrashIcon size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* COUNTRY FIELD */}
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

      {/* COUNTRY CODE FIELD */}
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

      {/* DATE OF BIRTH FIELD */}
      <View className="mb-4">
        <Text className="text-base font-medium text-gray-700 mb-1">
          Date of Birth
        </Text>
        <Controller
          control={control}
          name="dob"
          render={({ field: { onChange, value } }) => (
            <CustomDatePicker date={value} onChange={onChange} />
          )}
        />
      </View>

      {/* GENDER/PICKER FIELD */}
      <View className="mb-6">
        <Text className="text-base font-medium text-gray-700 mb-1">
          Gender
        </Text>
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
                  <ChevronDownIcon size={20} color="#4A5568" />
                )}
              />
            </View>
          )}
        />
      </View>

      {/* SAVE BUTTON */}
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
