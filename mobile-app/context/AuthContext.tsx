import React, { createContext, useState, useEffect, useContext } from "react";
import { Session, User, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useToast } from "react-native-toast-notifications";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  priceData: { price: number; number_of_contacts: number }[];
  loadingPrice: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    error: AuthError | null;
    data?: { user: User | null; session: Session | null };
  }>;
  signUp: (
    email: string,
    password: string
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
  const [priceData, setPriceData] = useState<
    { price: number; number_of_contacts: number }[]
  >([]);
  const [loadingPrice, setLoadingPrice] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };

    fetchSession();

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
      console.error("Error fetching price data:", error.message);
    } else if (data && data.length > 0) {
      const sortedData = data.sort((a, b) => a.price - b.price);
      setPriceData(sortedData);
    } else {
      console.error("No price data found.");
    }
    setLoadingPrice(false);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
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

  return (
    <AuthContext.Provider
      value={{
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
