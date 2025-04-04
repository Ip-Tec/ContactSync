import React, { createContext, useState, useEffect, useContext } from "react";
import { Session, User, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useToast } from "react-native-toast-notifications";
import { DBContact } from "@/hooks/useUniqueContacts";
import { adsProp } from "@/types/explore-types";

type AuthContextType = {
  ads: adsProp[];
  session: Session | null;
  loading: boolean;
  priceData: {
    name: string;
    price: number;
    number_of_contacts: number;
    payment_url: string;
  }[];
  loadingPrice: boolean;
  dbContacts: DBContact[];
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    error: AuthError | null;
    data?: { user: User | null; session: Session | null };
  }>;
  signUp: (
    email: string,
    password: string,
    phone: string
  ) => Promise<{
    error: AuthError | null;
    data?: { user: User | null; session: Session | null };
  }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<AuthError | null>;
  resetPassword: (
    newPassword: string,
    token: string
  ) => Promise<AuthError | null>;
  changeEmail: (newEmail: string) => Promise<AuthError | null>;
  changePhoneNumber: (newPhoneNumber: string) => Promise<AuthError | null>;
  deleteAccount: () => Promise<AuthError | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<any>();
  const [priceData, setPriceData] = useState<
    {
      name: string;
      price: number;
      number_of_contacts: number;
      payment_url: string;
    }[]
  >([]);
  const [loadingPrice, setLoadingPrice] = useState(true);

  const [dbContacts, setDbContacts] = useState<DBContact[]>([]);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
      fetchPriceData();
    };

    fetchSession();
    getAds();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch pricing data from Supabase.
  const fetchPriceData = async () => {
    setLoadingPrice(true);
    const { data, error } = await supabase.from("Price").select("*");
    if (error) {
      toast.show("Error fetching price data: " + error.message, {
        type: "error",
      }); // Add this line
    } else if (data && data.length > 0) {
      const sortedData = data.sort((a, b) => a.price - b.price);
      setPriceData(sortedData);
    } else {
      toast.show("No price data found.", { type: "error" }); // Add this line
    }
    setLoadingPrice(false);
  };

  // Fetch contacts from Supabase.
  const fetchContacts = async () => {
    const { data, error } = await supabase.from("contacts").select("*");
    if (error) {
      toast.show("Error fetching contacts: " + error.message, {
        type: "error",
      });
    } else if (data) {
      setDbContacts(data);
    }
  };
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, phone: string) => {
    const { error } = await supabase.auth.signUp({ email, password, phone });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const forgotPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return error;
  };

  const resetPassword = async (newPassword: string, token: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return error;
  };

  const changeEmail = async (newEmail: string): Promise<AuthError | null> => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      toast.show(error.message, { type: "error" });
      return error;
    }
    return null;
  };

  const changePhoneNumber = async (
    newPhoneNumber: string
  ): Promise<AuthError | null> => {
    const { error } = await supabase.auth.updateUser({
      phone: newPhoneNumber,
    });
    if (error) {
      toast.show(error.message, { type: "error" });
      return error;
    }
    return null;
  };

  const deleteAccount = async (): Promise<AuthError | null> => {
    const user = session?.user;
    if (!user)
      return {
        message: "User not authenticated",
        name: "AuthError",
      } as AuthError;

    const identity = user.identities?.[0];
    if (!identity) {
      return {
        message: "No identity found for user",
        name: "AuthError",
      } as AuthError;
    }

    const { error } = await supabase.auth.unlinkIdentity(identity);
    if (error) {
      toast.show(error.message, { type: "error" });
      // log user out
      await supabase.auth.signOut();
      return error;
    }
    return null;
  };

  const getAds = async () => {
    // Fetch active ads
    const { data: ads, error } = await supabase
      .from("ads")
      .select("*")
      .eq("status", "active");
  
    if (error) {
      toast.show("Error fetching ads: " + error.message, {
        type: "error",
        duration: 5000,
      });
      return;
    }
    if (!ads) return;
  
    // Get current time
    const now = new Date();
    // Identify ads that have expired
    const expiredAds = ads.filter((ad) => new Date(ad.end_date) < now);
  
    if (expiredAds.length > 0) {
      // Create a list of ad IDs that need updating
      const expiredIds = expiredAds.map((ad) => ad.ad_id);
      // Update those ads in the DB
      const { error: updateError } = await supabase
        .from("ads")
        .update({ status: "expired" })
        .in("ad_id", expiredIds);
  
      if (updateError) {
        toast.show("Error updating expired ads: " + updateError.message, {
          type: "error",
          duration: 5000,
        });
      }
  
      // Optionally update the local ads data:
      ads.forEach((ad) => {
        if (expiredIds.includes(ad.ad_id)) {
          ad.status = "expired";
        }
      });
    }
  
    // Optionally, filter out expired ads from being displayed
    const activeAds = ads.filter((ad) => ad.status === "active");
  
    setAds(activeAds);
    return activeAds;
  };
  

  return (
    <AuthContext.Provider
      value={{
        ads,
        session,
        loading,
        priceData,
        loadingPrice,
        signIn,
        signUp,
        signOut,
        forgotPassword,
        resetPassword,
        changeEmail,
        changePhoneNumber,
        deleteAccount,
        dbContacts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
