import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req) {
  const { access_token, refresh_token } = await req.json();


  const res = NextResponse.json({ ok: true });


  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  if (access_token && refresh_token) {
    await supabase.auth.setSession({ access_token, refresh_token });
  } else {
    await supabase.auth.signOut();
  }

  return res;
}
