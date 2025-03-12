import React, { createContext, useState, useEffect, useContext } from "react";
import { Session, User, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [priceData, setPriceData] = useState<
    { price: number; number_of_contacts: number }[]
  >([]);
  const [loadingPrice, setLoadingPrice] = useState(true);
  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      // console.log("Fetched session:", data.session);
      setSession(data.session);
      setLoading(false);
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // console.log("Auth state changed:", newSession);
      setSession(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch pricing data from Supabase.
  const fetchPriceData = async () => {
    setLoadingPrice(true);
    const { data, error } = await supabase
      .from("Price")
      .select("price, number_of_contacts");
    if (error) {
      console.error("Error fetching price data:", error.message);
    } else if (data && data.length > 0) {
      // Sort data numerically by price.
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
