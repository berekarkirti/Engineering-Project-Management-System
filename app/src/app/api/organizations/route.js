import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/server/supabase";

export async function GET(request) {
  try {
    const supabase = await getServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organizations
    const { data: organizations, error } = await supabase
      .from('organization_members')
      .select(`
        organization_id,
        role,
        organizations (
          id,
          name,
          description,
          industry,
          location,
          created_at
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching organizations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(organizations || []);
  } catch (error) {
    console.error('Error in GET /api/organizations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await getServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, industry, location } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    }

    // Create organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert([
        {
          name: name.trim(),
          description: description?.trim() || null,
          industry: industry?.trim() || null,
          location: location?.trim() || null,
          created_by: user.id
        }
      ])
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      return NextResponse.json({ error: orgError.message }, { status: 500 });
    }

    // Add creator as admin member
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert([
        {
          organization_id: organization.id,
          user_id: user.id,
          role: 'admin'
        }
      ]);

    if (memberError) {
      console.error('Error adding organization member:', memberError);
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error in POST /api/organizations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const supabase = await getServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, action, organization_id, user_id: targetUserId } = body;

    if (action === 'join') {
      // Join existing organization
      if (!organization_id) {
        return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
      }

      // Check if organization exists
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organization_id)
        .single();

      if (orgError) {
        return NextResponse.json({ error: "Organization not found" }, { status: 404 });
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organization_id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        return NextResponse.json({ error: "Already a member of this organization" }, { status: 409 });
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert([
          {
            organization_id,
            user_id: user.id,
            role: 'member'
          }
        ]);

      if (memberError) {
        console.error('Error joining organization:', memberError);
        return NextResponse.json({ error: memberError.message }, { status: 500 });
      }

      return NextResponse.json({ message: "Successfully joined organization", organization });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error('Error in PUT /api/organizations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}