// app/api/equipment/route.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')
    
    let query = supabase
      .from('equipment')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    
    const { data: equipment, error } = await query
    
    if (error) {
      console.error('Error fetching equipment:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json(equipment)
  } catch (error) {
    console.error('Error in GET /api/equipment:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['project_id', 'equipment_type', 'quantity']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return Response.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }
    
    const { data: equipment, error } = await supabase
      .from('equipment')
      .insert([{
        project_id: body.project_id,
        equipment_type: body.equipment_type,
        quantity: body.quantity,
        tag_number: body.tag_number || null,
        job_number: body.job_number || null,
        manufacturing_serial: body.manufacturing_serial || null,
        status: body.status || 'pending'
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating equipment:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json(equipment, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/equipment:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return Response.json({ error: 'Equipment ID is required' }, { status: 400 })
    }
    
    const { data: equipment, error } = await supabase
      .from('equipment')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating equipment:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json(equipment)
  } catch (error) {
    console.error('Error in PUT /api/equipment:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return Response.json({ error: 'Equipment ID is required' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('equipment')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting equipment:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json({ message: 'Equipment deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/equipment:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}