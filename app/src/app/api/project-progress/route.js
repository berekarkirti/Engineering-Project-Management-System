// First, create API route for progress updates
// app/api/project-progress/route.js

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const body = await request.json()
    const { project_id, phase_name, progress, remarks } = body
    
    if (!project_id || !phase_name || progress === undefined) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Upsert progress (insert or update if exists)
    const { data, error } = await supabase
      .from('project_progress')
      .upsert({
        project_id,
        phase_name,
        progress: Number(progress),
        remarks: remarks || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'project_id,phase_name'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error saving progress:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json(data, { status: 201 })
    
  } catch (error) {
    console.error('Error in POST /api/project-progress:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')
    
    let query = supabase
      .from('project_progress')
      .select('*')
      .order('updated_at', { ascending: false })
    
    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    
    const { data, error } = await query
    
    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json(data)
    
  } catch (error) {
    console.error('Error in GET /api/project-progress:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}