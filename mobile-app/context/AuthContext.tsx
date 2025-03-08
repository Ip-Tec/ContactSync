import React, { createContext, useState, useEffect, useContext, useMemo } from "react";
import { Session, User, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null; data?: { user: User | null; session: Session | null } }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null; data?: { user: User | null; session: Session | null } }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };

    // fetchSession();

    // const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
    //   // console.log("newSession", newSession);
    //   // Option 1: Using functional update with a comparison
    //   // try {
    //   //   setSession((prevSession) => {
    //   //     if (prevSession?.access_token !== newSession?.access_token) {
    //   //       return newSession;
    //   //     }
    //   //     return prevSession;
    //   //   });
    //   // } catch (error) {
    //   //   signOut();
    //   //   console.error("Error setting session:", error);
    //   // }
      
    //   // Option 2: Or simply update the session:
    //   setSession(newSession);
    // });

    // console.log("const { data } = ", { data });
    // return () => {
    //   data.subscription.unsubscribe();
    // };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error, data };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { error, data };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Memoize the context value so that consumers don't re-render unnecessarily.
  const value = useMemo(
    () => ({ session, loading, signIn, signUp, signOut }),
    [session, loading]
  );

  return (
    <AuthContext.Provider value={value}>
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
