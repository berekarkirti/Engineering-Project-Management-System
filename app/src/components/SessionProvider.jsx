"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // <- client-side supabase (createClient)

const SessionContext = createContext({ session: null, supabase });

export default function SessionProvider({ children }) {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // 1) App load: session lo & server cookies seed karo
    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);

      if (data.session) {
        await fetch("/api/auth/set", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }),
        });
      }
    };
    bootstrap();

    // 2) Auth events: server cookies update/clear
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, sess) => {
        setSession(sess);

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          await fetch("/api/auth/set", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: sess?.access_token,
              refresh_token: sess?.refresh_token,
            }),
          });
        }

        if (event === "SIGNED_OUT") {
          await fetch("/api/auth/signout", { method: "POST" });
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={{ session, supabase }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
