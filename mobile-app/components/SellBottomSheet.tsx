// SellBottomSheet.tsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
  StyleSheet,
} from "react-native";

export interface TradeableContact {
  id?: string;
  name: string;
  emails?: { email: string; label?: string }[];
  phoneNumbers?: { number: string }[];
  // Additional fields for selling
  sex?: string;
  country?: string;
}

interface SellBottomSheetProps {
  visible: boolean;
  contact: TradeableContact | null;
  onClose: () => void;
  onSubmit: (updatedContact: TradeableContact) => void;
}

const SellBottomSheet: React.FC<SellBottomSheetProps> = ({
  visible,
  contact,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [sex, setSex] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (contact) {
      setName(contact.name || "");
      setSex(contact.sex || "");
      setCountry(contact.country || "");
      setEmail(
        contact.emails && contact.emails.length > 0
          ? contact.emails[0].email
          : ""
      );
    }
  }, [contact]);

  const handleSubmit = () => {
    if (!name || !sex || !country || !email) {
      Alert.alert(
        "Incomplete Form",
        "Please fill in all required fields: name, sex, country, and email."
      );
      return;
    }
    const updatedContact: TradeableContact = {
      ...contact!,
      name,
      emails: [{ email, label: "Primary" }],
      sex,
      country,
    };
    onSubmit(updatedContact);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Complete Contact Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Sex"
            value={sex}
            onChangeText={setSex}
          />
          <TextInput
            style={styles.input}
            placeholder="Country"
            value={country}
            onChangeText={setCountry}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    height: "50%",
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 2.5,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
    fontSize: 18,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: "#3b82f6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  submitButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  closeButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  closeButtonText: {
    color: "#333",
  },
});

export default SellBottomSheet;
