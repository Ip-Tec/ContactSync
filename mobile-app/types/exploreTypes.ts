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
  onTrade?: () => void;
  trading?: boolean;
};

export type FormData = {
  id: string;
  email: string[];
  contact: string;
  phoneNumbers: string[];
  dob: Date;
  country: string;
  countryCode: string;
  sex: string;
  contactType: string;
};

export interface Contact {
  id: string;
  name: string;
  contact_type: "personal" | "work" | "family" | "other";
  phones: Array<{
    number: string;
    type: "mobile" | "home" | "work" | "other";
  }>;
  emails: Array<{
    email: string;
    type: "personal" | "work" | "other";
  }>;
  dob: Date;
  sex: string;
  country: string;
  country_code: string;
}
