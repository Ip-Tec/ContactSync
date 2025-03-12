import * as Contacts from "expo-contacts";

export const generateContactHash = (contact: Contacts.Contact) => {
  return [
    contact.name,
    contact.emails?.[0]?.email,
    contact.phoneNumbers?.[0]?.number,
  ].join("|");
};

export const compareContacts = (
  dbContact: any,
  deviceContact: Contacts.Contact
) => {
  return (
    dbContact.name !== deviceContact.name ||
    dbContact.email !== deviceContact.emails?.[0]?.email ||
    dbContact.phone_number !== deviceContact.phoneNumbers?.[0]?.number
  );
};
