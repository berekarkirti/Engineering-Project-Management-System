import { NextResponse } from "next/server";
import { getServerClient } from "./supabase";

// List + Create
export const makeListCreate = (table, { orderBy = "created_at" } = {}) => ({
  GET: async (req) => {
    const supabase = await getServerClient();   // <= await
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    let query = supabase.from(table).select("*");
    if (orderBy) query = query.order(orderBy, { ascending: false });
    for (const [key, value] of searchParams.entries()) query = query.eq(key, value);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data ?? []);
  },

  POST: async (req) => {
    const supabase = await getServerClient();   // <= await
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { data, error } = await supabase.from(table).insert(body).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  },
});

// One / Patch / Delete
export const makeOne = (table) => ({
  GET: async (_req, { params }) => {
    const supabase = await getServerClient();   // <= await
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase.from(table).select("*").eq("id", params.id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
  },

  PATCH: async (req, { params }) => {
    const supabase = await getServerClient();   // <= await
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { data, error } = await supabase.from(table).update(body).eq("id", params.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  },

  DELETE: async (_req, { params }) => {
    const supabase = await getServerClient();   // <= await
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase.from(table).delete().eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  },
});
