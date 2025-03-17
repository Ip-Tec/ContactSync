import { useAuth } from "@/context/AuthContext";
import { useContacts } from "@/context/ContactsContext";
import { View, Text, Animated } from "react-native";
import TradeContactItem from "./TradeContactItem";
import ExploreHeader from "./ExploreHeader";

const ContactUserDoNotHave = () => {
  const { dbContacts } = useAuth();
  const { contacts } = useContacts();
  console.log(dbContacts);
  return (
    <View className="flex-1 items-center justify-center bg-white w-full">
      <Text className="text-xl font-bold">Contact User Do Not Have</Text>
      {/* Render additional content here */}
      <Animated.FlatList
        data={dbContacts}
        keyExtractor={(item) => item.id?.toString() || Date.now().toString()}
        renderItem={({ item }) => <TradeContactItem contact={item} />}
       
        scrollEventThrottle={16}
      />
    </View>
  );
};

export default ContactUserDoNotHave;
