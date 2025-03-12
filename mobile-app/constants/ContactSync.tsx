import { useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Contacts from "expo-contacts";
import { supabase } from "@/lib/supabase";
import { compareContacts, generateContactHash } from "@/hooks/contactUtils";

const ContactSync = ({ userId }: { userId: string }) => {
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.match(/inactive|background/) && nextAppState === "active") {
      syncContacts();
    }
    setAppState(nextAppState);
  };

  // Fetch all contacts from database
  const fetchDbContacts = async () => {
    const { data, error } = await supabase
      .from("Contact")
      .select("*")
      .eq("user_id", userId);

    return data || [];
  };

  // Main sync function
  const syncContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") return;

      // Get device contacts
      const { data: deviceContacts } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.Emails,
          Contacts.Fields.PhoneNumbers,
        ],
      });

      // Get database contacts
      const dbContacts = await fetchDbContacts();

      // Process each device contact
      for (const deviceContact of deviceContacts) {
        // Find matching DB contact
        const existingContact = dbContacts.find(
          (c) =>
            c.phone_number === deviceContact.phoneNumbers?.[0]?.number ||
            c.email === deviceContact.emails?.[0]?.email
        );

        if (existingContact) {
          // Update existing contact if needed
          const needsUpdate = compareContacts(existingContact, deviceContact);
          if (needsUpdate) {
            await supabase
              .from("Contact")
              .update(enrichContactData(existingContact, deviceContact))
              .eq("id", existingContact.id);
          }
        } else {
          // Insert new contact
          await supabase.from("Contact").insert({
            user_id: userId,
            ...enrichContactData({}, deviceContact),
            contact_hash: generateContactHash(deviceContact),
          });
        }
      }
    } catch (error) {
      console.error("Sync error:", error);
    }
  };

  // Enrich contact data
  const enrichContactData = (
    dbContact: any,
    deviceContact: Contacts.Contact
  ) => {
    return {
      name: dbContact.name || deviceContact.name,
      email: dbContact.email || deviceContact.emails?.[0]?.email,
      phone_number:
        dbContact.phone_number || deviceContact.phoneNumbers?.[0]?.number,
      // Add other fields as needed
    };
  };

  // Sync when app comes to foreground
  useEffect(() => {
    if (appState === "active") {
      syncContacts();
    }
  }, [appState]);

  // Initial sync
  useEffect(() => {
    syncContacts();
  }, []);

  return null; // This is a background component
};

export default ContactSync;
