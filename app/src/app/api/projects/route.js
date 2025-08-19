// app/api/projects/route.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for server-side operations
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('org_id')
    
    let query = supabase
      .from('projects')
      .select(`
        *,
        equipment(*),
        project_documents(*),
        equipment_documents(*)
      `)
      .order('created_at', { ascending: false })
    
    if (orgId) {
      query = query.eq('org_id', orgId)
    }
    
    const { data: projects, error } = await query
    
    if (error) {
      console.error('Error fetching projects:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json(projects)
  } catch (error) {
    console.error('Error in GET /api/projects:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['project_title', 'po_number', 'client_name', 'sales_order_date', 'org_id']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return Response.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Validate UUID format for org_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(body.org_id)) {
      return Response.json(
        { 
          error: 'Invalid UUID format for org_id',
          details: `Provided org_id: ${body.org_id} is not a valid UUID`
        },
        { status: 400 }
      )
    }
    
    const { data: project, error } = await supabase
      .from('projects')
      .insert([{
        project_title: body.project_title,
        po_number: body.po_number,
        client_name: body.client_name,
        sales_order_date: body.sales_order_date,
        plant_location: body.plant_location || null,
        client_industry: body.client_industry || null,
        project_manager: body.project_manager || null,
        consultant: body.consultant || null,
        tpi_agency: body.tpi_agency || null,
        client_focal_point: body.client_focal_point || null,
        total_value: body.total_value || 0,
        payment_terms: body.payment_terms || null,
        payment_milestones: body.payment_milestones || null,
        kickoff_notes: body.kickoff_notes || null,
        production_notes: body.production_notes || null,
        scope: body.scope || [],
        org_id: body.org_id
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating project:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json(project, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/projects:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return Response.json({ error: 'Project ID is required' }, { status: 400 })
    }
    
    const { data: project, error } = await supabase
      .from('projects')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating project:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json(project)
  } catch (error) {
    console.error('Error in PUT /api/projects:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return Response.json({ error: 'Project ID is required' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting project:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/projects:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}