import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/server/supabase";

export async function POST(req) {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from("equipment_documents")
    .insert({
      project_id: body.project_id,
      equipment_id: body.equipment_id,
      file_name: body.file_name,
      url: body.url,
      doc_type: body.doc_type,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
