import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/server/supabase";

export async function POST(req) {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from("equipment")
    .insert({
      project_id: body.project_id,
      equipment_type: body.equipment_type,
      quantity: body.quantity,
      tag_number: body.tag_number,
      job_number: body.job_number,
      manufacturing_serial: body.manufacturing_serial,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
