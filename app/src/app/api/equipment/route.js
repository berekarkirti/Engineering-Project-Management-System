import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
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
