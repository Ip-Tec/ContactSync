import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { TradeContactProps } from "../../app/types/explore-types";

const TradeContactItem = ({ contact, onTrade, trading }: TradeContactProps) => (
  <View className="bg-white rounded-xl p-4 mb-4 mx-4 shadow shadow-black/10">
    <View className="flex-row items-center">
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
          {contact.name?.charAt(0).toUpperCase() || "?"}
        </Text>
      </View>

      <View className="flex-1">
        <Text className="text-lg font-bold mb-1">{contact.name}</Text>
        {contact.emails?.map((email: { email: string }, idx: number) => (
          <Text key={idx} className="text-gray-600 text-sm">
            {email.email}
          </Text>
        ))}
        {contact.phoneNumbers?.map((phone: { number: string }, idx: number) => (
          <Text key={idx} className="text-gray-600 text-sm">
            {phone.number}
          </Text>
        ))}
      </View>

      <TouchableOpacity
        className={`px-4 py-2 rounded-full ${
          trading ? "bg-gray-400" : "bg-blue-500"
        }`}
        onPress={(e) => {
          e.stopPropagation(); // Prevent parent touch events
          onTrade(); // Call the onTrade function from props
        }}
        disabled={trading}
      >
        <Text className="text-white font-bold">
          {trading ? "Trading..." : "Trade"}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default TradeContactItem;
