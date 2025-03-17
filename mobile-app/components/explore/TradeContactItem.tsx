// TradeContactItem.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { TradeContactProps } from "../../app/types/explore-types";
import { IconSymbol } from "../ui/IconSymbol";
import { router } from "expo-router";
import { deduplicatePhoneNumbers } from "@/utils/phoneUtils";

/**
 * TradeContactItem Component
 *
 * Renders an individual tradeable contact.
 * It displays the contact's name, emails, and a list of deduplicated & normalized phone numbers.
 * Also includes a "Trade" button to navigate to the EditContact screen.
 *
 * @param {TradeContactProps} props - Contains a contact and an onTrade callback.
 * @returns A JSX element representing the contact.
 */
const TradeContactItem = ({ contact, onTrade }: TradeContactProps) => {
  // Extract phone numbers from the contact, deduplicate & normalize them.
  const phoneNumbers =
    contact.phoneNumbers?.map((p: { number: string }) => p.number) || [];
  const uniquePhoneNumbers = deduplicatePhoneNumbers(phoneNumbers);

  return (
    <View className="bg-white rounded-xl p-4 mb-4 mx-4 shadow shadow-black/10">
      <View className="flex-row items-center">
        {/* Avatar / Icon */}
        <View
          style={{
            backgroundColor: "#3b82f6",
            height: 50,
            width: 50,
            borderRadius: 25,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
          }}
        >
          <Text className="text-white text-2xl font-bold">
            <IconSymbol name="person.fill" size={28} className="text-white" />
          </Text>
        </View>

        {/* Contact Details */}
        <TouchableOpacity
          className="flex-1"
          onPress={() =>
            router.push({
              pathname: "/ContactDetail",
              params: { contact: JSON.stringify(contact) },
            })
          }
        >
          <Text className="text-lg font-bold mb-1">{contact.name}</Text>
          {contact.emails?.map((email: { email: string }, idx: number) => (
            <Text key={idx} className="text-gray-600 text-sm">
              {email.email}
            </Text>
          ))}
          {/* Render deduplicated & normalized phone numbers */}
          {uniquePhoneNumbers.map((phone, idx) => (
            <Text key={idx} className="text-gray-600 text-sm">
              {phone}
            </Text>
          ))}
        </TouchableOpacity>

        {/* Trade Button */}
        {/* <View className="flex justify-center items-center gap-2">
          <TouchableOpacity
            className="px-4 py-2 rounded-full mb-2 bg-blue-500"
            onPress={() =>
              router.push({
                pathname: "/EditContact",
                params: {
                  contact: JSON.stringify(contact),
                  isUpdate: "true",
                },
              })
            }
          >
            <Text className="text-white font-bold">Trade</Text>
          </TouchableOpacity>
        </View>
           */}
      </View>
    </View>
  );
};

export default TradeContactItem;
