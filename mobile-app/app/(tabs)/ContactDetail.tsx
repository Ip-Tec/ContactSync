import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

const ContactDetail: React.FC = () => {
  const { contact } = useLocalSearchParams();

  if (!contact) {
    return <Text className="p-4 text-center text-lg">No contact data available.</Text>;
  }

  const parsedContact = JSON.parse(contact as string);
  const firstInitial = parsedContact.name ? parsedContact.name[0] : '';

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header Section */}
      <View className="bg-white p-6 shadow rounded-b-3xl">
        <View className="bg-blue-500 w-24 h-24 rounded-full items-center justify-center mx-auto">
          <Text className="text-white text-3xl font-bold">{firstInitial}</Text>
        </View>
        <Text className="text-2xl text-center font-bold mt-4">
          {parsedContact.name}
        </Text>
      </View>

      {/* Details Section */}
      <View className="mt-6 px-4">
        <View className="bg-white p-4 rounded-lg shadow">
          {/* Email Section */}
          {parsedContact.emails?.length > 0 && (
            <View className="mb-4">
              <Text className="text-lg font-semibold mb-2">Email</Text>
              {parsedContact.emails.map((email: { email: string }, index: number) => (
                <View
                  key={index}
                  className="flex-row items-center border-b border-gray-200 py-2"
                >
                  {/* Optionally, add an email icon here */}
                  <Text className="text-base ml-2">{email.email}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Phone Section */}
          {parsedContact.phoneNumbers?.length > 0 && (
            <View>
              <Text className="text-lg font-semibold mb-2">Phone</Text>
              {parsedContact.phoneNumbers.map((phone: { number: string }, index: number) => (
                <View
                  key={index}
                  className="flex-row items-center border-b border-gray-200 py-2"
                >
                  {/* Optionally, add a phone icon here */}
                  <Text className="text-base ml-2">{phone.number}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default ContactDetail;
