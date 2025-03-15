import { RefObject, Dispatch, SetStateAction } from "react";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as Contacts from "expo-contacts";

export type FormData = {
  dob?: Date;
  country?: string;
  countryCode?: string;
  sex?: string;
  id?: string;
  email?: (string | undefined)[];
  contact?: string;
  phoneNumbers?: (string | undefined)[];
  contactType?: string;
};

export type CartItem = {
  id: string;
  contact: any;
  phoneNumbers: string[];
  dob?: string;
  country?: string;
  countryCode?: string;
  sex?: string;
};

export type TradeContactProps = {
  contact: Contact;
  onTrade: () => void;
  trading?: boolean;
  bottomSheetRef: RefObject<BottomSheetModal>;
  setSelectedContact: Dispatch<SetStateAction<Contact | null>>;
};

// Define the Contact type
export interface Contact extends Contacts.Contact {
  id?: string;
  name: string;
  emails?: Contacts.Email[];
  phoneNumbers?: Contacts.PhoneNumber[];
  dob?: Date;
  isInDb?: boolean;
  country?: string;
  countryCode?: string;
  sex?: string;
  // Add other properties as needed
}