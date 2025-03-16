import React, { useEffect } from "react";
import * as Contacts from "expo-contacts";
import { Alert, Platform, PermissionsAndroid, Linking } from "react-native";

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
    };

    requestAllPermissions();
  }, []);

  return null;
};
// New exported function to toggle contacts permissions
export async function toggleContactsPermission() {
  const { status } = await Contacts.getPermissionsAsync();

  if (status === "granted") {
    return true;
  } else {
    const { status: newStatus } = await Contacts.requestPermissionsAsync();
    if (newStatus === "granted") {
      return true;
    }

    return false;
  }
}

export default RequestPermissions;
