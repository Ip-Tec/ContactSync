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
  emails?: string[];
  phoneNumbers: (string | undefined)[];
  dob?: string | Date;
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

export interface adsProp{
  ad_id: number;
  user_id?: string | null;
  position_id?: number | null;
  pricing_type?: 'home' | 'carousel' | 'contact' | 'discover' | 'profile';
  media_type: 'image';
  media_url: string;
  start_date: string; // ISO 8601 format
  end_date: string; // ISO 8601 format
  inspired_date?: string | null; // ISO 8601 format
  payment_duration: string; // Interval type, e.g., "1 day" or "3 months"
  payment_amount?: number | null;
  status?: 'active' | 'expired' | 'pending';
  created_at?: string; // Default: now()
  updated_at?: string; // Default: now()
  redirect_url?: string | null;
  submission_id?: string | null;
}