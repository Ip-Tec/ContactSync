import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";

// Define your Contact interface
export interface Contact {
  id?: string;
  name: string;
  emails?: { email: string | undefined }[];
  phoneNumbers?: { number: string | undefined }[];
}

// Levenshtein distance function to compare two strings
function levenshtein(a: string, b: string): number {
  const aLen = a.length;
  const bLen = b.length;
  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  const matrix: number[][] = [];
  for (let i = 0; i <= bLen; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= aLen; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bLen; i++) {
    for (let j = 1; j <= aLen; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bLen][aLen];
}

// Check whether two phone numbers are similar (90% similarity)
function areNumbersSimilar(num1: string, num2: string): boolean {
  const normalize = (str: string) => str.replace(/\D/g, "");
  const n1 = normalize(num1);
  const n2 = normalize(num2);
  if (!n1 || !n2) return false;
  const maxLen = Math.max(n1.length, n2.length);
  const distance = levenshtein(n1, n2);
  const similarity = (maxLen - distance) / maxLen;
  return similarity >= 0.9;
}

// Group duplicate contacts by checking if any phone numbers in one contact are similar to any in another
function groupDuplicateContacts(contacts: Contact[]): Contact[][] {
  const groups: Contact[][] = [];
  const used = new Set<number>();

  for (let i = 0; i < contacts.length; i++) {
    if (used.has(i)) continue;
    const group: Contact[] = [contacts[i]];
    used.add(i);

    for (let j = i + 1; j < contacts.length; j++) {
      if (used.has(j)) continue;
      let duplicateFound = false;
      if (contacts[i].phoneNumbers && contacts[j].phoneNumbers) {
        for (const phoneA of contacts[i].phoneNumbers || []) {
          for (const phoneB of contacts[j].phoneNumbers || []) {
            if (
              phoneA.number &&
              phoneB.number &&
              areNumbersSimilar(phoneA.number, phoneB.number)
            ) {
              duplicateFound = true;
              break;
            }
          }
          if (duplicateFound) break;
        }
      }
      if (duplicateFound) {
        group.push(contacts[j]);
        used.add(j);
      }
    }
    if (group.length > 1) {
      groups.push(group);
    }
  }
  return groups;
}

interface MergeContactsComponentProps {
  contacts: Contact[];
  onMerge?: (mergedContact: Contact, mergedGroup: Contact[]) => void;
}

const MergeContactsComponent: React.FC<MergeContactsComponentProps> = ({
  contacts,
  onMerge,
}) => {
  const [duplicateGroups, setDuplicateGroups] = useState<Contact[][]>([]);

  useEffect(() => {
    const groups = groupDuplicateContacts(contacts);
    setDuplicateGroups(groups);
  }, [contacts]);

  const handleMerge = (group: Contact[]) => {
    // Simple merge logic: take the first contact as the base,
    // and merge emails and phone numbers from the rest.
    const mergedContact: Contact = { ...group[0] };

    const emailsSet = new Set<string>();
    const phoneSet = new Set<string>();

    group.forEach((contact) => {
      contact.emails?.forEach((e) => {
        if (e.email) emailsSet.add(e.email);
      });
      contact.phoneNumbers?.forEach((p) => {
        if (p.number) phoneSet.add(p.number);
      });
    });

    mergedContact.emails = Array.from(emailsSet).map((email) => ({ email }));
    mergedContact.phoneNumbers = Array.from(phoneSet).map((number) => ({ number }));

    if (onMerge) {
      onMerge(mergedContact, group);
    } else {
      Alert.alert("Merged", `Merged ${group.length} contacts into one.`);
    }
  };

  return (
    <View className="p-4">
      {duplicateGroups.length === 0 ? (
        <Text className="text-center text-gray-600">
          No duplicate contacts found.
        </Text>
      ) : (
        duplicateGroups.map((group, index) => (
          <View
            key={index}
            className="mb-4 p-4 border border-gray-300 rounded-lg"
          >
            <Text className="font-bold mb-2">
              Duplicate Group {index + 1} ({group.length} contacts)
            </Text>
            {group.map((contact, i) => (
              <Text key={contact.id || i.toString()} className="text-base">
                {contact.name} -{" "}
                {contact.phoneNumbers
                  ?.map((p) => p.number)
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            ))}
            <TouchableOpacity
              onPress={() => handleMerge(group)}
              className="mt-2 bg-green-500 p-2 rounded-lg"
            >
              <Text className="text-white text-center">Merge</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
};

export default MergeContactsComponent;
