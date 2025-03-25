import * as Contacts from "expo-contacts";

/**
 * Parses a CSV file into an array of contact objects.
 * Assumes the CSV file has headers: "name", "phone", and "email".
 *
 * @param csvText - The raw CSV string
 * @returns An array of parsed contacts
 */
export const parseCSV = (csvText: string) => {
  const lines = csvText.split("\n").map((line) => line.trim());
  const headers = lines[0].split(",");

  return lines.slice(1).map((line) => {
    const values = line.split(",");
    let contact: { name?: string; phoneNumbers?: string[]; emails?: string[] } = {};

    headers.forEach((header, index) => {
      const key = header.trim().toLowerCase();
      const value = values[index]?.trim() || "";

      if (key === "name") {
        contact.name = value;
      } else if (key === "phone") {
        contact.phoneNumbers = value ? [value] : [];
      } else if (key === "email") {
        contact.emails = value ? [value] : [];
      }
    });

    return contact;
  });
};

/**
 * Parses a VCF (vCard) file into an array of contact objects.
 *
 * @param vcfText - The raw VCF string
 * @returns An array of parsed contacts
 */
export const parseVCF = (vcfText: string) => {
  const contacts: { name?: string; phoneNumbers?: string[]; emails?: string[] }[] = [];
  const vCards = vcfText.split("END:VCARD");

  vCards.forEach((vCard) => {
    const lines = vCard.split("\n");
    let contact: { name?: string; phoneNumbers?: string[]; emails?: string[] } = {
      phoneNumbers: [],
      emails: [],
    };

    lines.forEach((line) => {
      if (line.startsWith("FN:")) {
        contact.name = line.replace("FN:", "").trim();
      } else if (line.startsWith("TEL:")) {
        contact.phoneNumbers?.push(line.replace("TEL:", "").trim());
      } else if (line.startsWith("EMAIL:")) {
        contact.emails?.push(line.replace("EMAIL:", "").trim());
      }
    });

    if (contact.name || contact.phoneNumbers?.length || contact.emails?.length) {
      contacts.push(contact);
    }
  });

  return contacts;
};
