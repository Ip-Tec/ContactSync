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