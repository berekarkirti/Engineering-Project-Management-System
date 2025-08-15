// src/app/api/projects/route.js
import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/server/supabase";

export async function GET(req) {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: mem } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!mem?.org_id)
    return NextResponse.json({ error: "Missing org_id. User must belong to an organization." }, { status: 400 });

  const { searchParams } = new URL(req.url);
  let q = supabase.from("projects").select("*").eq("org_id", mem.org_id).order("created_at", { ascending: false });
  for (const [k, v] of searchParams.entries()) q = q.eq(k, v);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

export async function POST(req) {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: mem } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!mem?.org_id)
    return NextResponse.json({ error: "Missing org_id. User must belong to an organization." }, { status: 400 });

  const body = await req.json();
  const insert = { ...body, org_id: mem.org_id };
  const { data, error } = await supabase.from("projects").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
