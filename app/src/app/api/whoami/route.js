import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/server/supabase";

export async function GET() {
  const supabase = getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return NextResponse.json({ user });
}
