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
  contact: any;
  onTrade: () => void;
  trading?: boolean;
};

// Define the Contact type
export interface Contact {
  id?: string;
  name: string;
  emails?: { email: string }[];
  phoneNumbers?: { number: string }[];
  dob?: Date;
  isInDb?: boolean;
  country?: string;
  countryCode?: string;
  sex?: string;
  // Add other properties as needed
}