// ContactUserDoNotHave.tsx
import React from "react";
import { View, Text, Animated, FlatList } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useContacts } from "@/context/ContactsContext";
import { matchPhoneNumbers } from "@/utils/phoneUtils"; // import your matching function

/**
 * ContactUserDoNotHave Component
 *
 * Cross-checks contacts from the DB and the user's device.
 * Only displays DB contacts that are not present on the device.
 * For each missing contact, displays:
 *  - The contact name.
 *  - Each phone number masked to show only the first 3 and last 3 digits.
 *  - Each email with 70% of the local part hidden.
 *
 * @returns A JSX element containing a list of masked missing contacts.
 */
const ContactUserDoNotHave = () => {
  const { dbContacts } = useAuth(); // all contacts from your database
  const { contacts } = useContacts(); // contacts from the user's device

  // Checks if a DB contact exists on the device based on phone or email matching.
  const isContactOnDevice = (dbContact: any): boolean => {
    return contacts.some((deviceContact: any) => {
      // Check phone numbers if available.
      if (dbContact.phoneNumbers && deviceContact.phoneNumbers) {
        const phoneMatch = dbContact.phoneNumbers.some(
          (dbPhone: { number: string }) =>
            deviceContact.phoneNumbers.some(
              (devicePhone: { number: string }) =>
                matchPhoneNumbers(dbPhone.number, devicePhone.number).match
            )
        );
        if (phoneMatch) return true;
      }
      // Check emails if available.
      if (dbContact.emails && deviceContact.emails) {
        const emailMatch = dbContact.emails.some((dbEmail: { email: string }) =>
          deviceContact.emails.some(
            (deviceEmail: { email: string }) =>
              dbEmail.email.toLowerCase() === deviceEmail.email.toLowerCase()
          )
        );
        if (emailMatch) return true;
      }
      return false;
    });
  };

  // Filter DB contacts to get only those that the user does NOT have.
  const missingContacts = dbContacts.filter(
    (dbContact: any) => !isContactOnDevice(dbContact)
  );

  /**
   * maskPhone
   *
   * Masks a phone number so that only the first 3 and last 3 digits are visible.
   * For example, "+2349033333390" might become "+234903******390".
   *
   * @param phone - The phone number string.
   * @returns The masked phone number.
   */
  const maskPhone = (phone: string): string => {
    let prefix = "";
    let digits = phone;
    if (phone.startsWith("+")) {
      prefix = "+";
      digits = phone.slice(1);
    }
    if (digits.length <= 6) return prefix + digits;
    const firstThree = digits.slice(0, 3);
    const lastThree = digits.slice(-3);
    const masked = "*".repeat(digits.length - 6);
    return prefix + firstThree + masked + lastThree;
  };

  /**
   * maskEmail
   *
   * Masks an email address by hiding approximately 70% of its local part.
   * For example, "johndoe@example.com" might become "jo****oe@example.com".
   *
   * @param email - The email address.
   * @returns The masked email.
   */
  const maskEmail = (email: string): string => {
    const [local, domain] = email.split("@");
    if (!local || !domain) return email;
    // Calculate visible characters (15% on each side, roughly 30% total visible)
    const visibleCount = Math.max(1, Math.floor(local.length * 0.15));
    if (local.length <= 2 * visibleCount) return email;
    const start = local.slice(0, visibleCount);
    const end = local.slice(-visibleCount);
    const masked = "*".repeat(local.length - 2 * visibleCount);
    return `${start}${masked}${end}@${domain}`;
  };

  return (
    <View className="flex-1 bg-white w-full p-4">
      <Text className="text-xl font-bold mb-4">
        Contacts User Does Not Have
      </Text>
      <FlatList
        data={missingContacts}
        keyExtractor={(item) => item.id?.toString() || Date.now().toString()}
        renderItem={({ item }) => (
          <View className="bg-gray-100 rounded-xl p-4 mb-4 mx-4 shadow shadow-black/10">
            <Text className="text-lg font-bold mb-2">{item.name}</Text>
            {Array.isArray(item.phone_number) &&
              item.phone_number.map(
                (phoneObj: { number: string }, idx: number) => (
                  <Text key={idx} className="text-gray-600 text-sm">
                    {maskPhone(phoneObj.number)}
                  </Text>
                )
              )}

            {Array.isArray(item.email) &&
              item.email.map((emailObj: { email: string }, idx: number) => (
                <Text key={idx} className="text-gray-600 text-sm">
                  {maskEmail(emailObj.email)}
                </Text>
              ))}
          </View>
        )}
        scrollEventThrottle={16}
      />
    </View>
  );
};

export default ContactUserDoNotHave;
