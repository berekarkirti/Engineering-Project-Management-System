// app/api/project-documents/route.js
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const body = await request.json()
    
    const { project_id, file_name, url, doc_type } = body

    if (!project_id || !file_name || !url || !doc_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert document record
    const { data, error } = await supabase
      .from('project_documents')
      .insert([
        {
          project_id,
          file_name,
          url,
          doc_type,
          uploaded_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('Database insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save document record' },
        { status: 500 }
      )
    }

    return NextResponse.json(data[0])

  } catch (error) {
    console.error('Project documents API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}