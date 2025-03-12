import React, { useEffect } from "react";
import * as Contacts from "expo-contacts";
import { Alert, Platform, PermissionsAndroid } from "react-native";

const RequestPermissions: React.FC = () => {
  useEffect(() => {
    const requestAllPermissions = async () => {
      // Request Contacts permission
      const { status: contactsStatus } =
        await Contacts.requestPermissionsAsync();
      if (contactsStatus !== "granted") {
        Alert.alert(
          "Contacts Permission",
          "Contacts permission was not granted."
        );
      }

      // Request SMS permission on Android (iOS doesn't require this)
      if (Platform.OS === "android") {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.SEND_SMS,
            {
              title: "SMS Permission",
              message: "This app requires access to send SMS messages.",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "OK",
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert("SMS Permission", "SMS permission was not granted.");
          }
        } catch (error) {
          console.warn("SMS permission error:", error);
        }
      }
      // Email and WhatsApp usually do not require explicit permissions.
    };

    requestAllPermissions();
  }, []);

  return null;
};

export default RequestPermissions;
