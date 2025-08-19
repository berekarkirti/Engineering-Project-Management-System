// app/api/upload-file/route.js
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for server operations
)

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const path = formData.get('path')
    const bucket = formData.get('bucket')

    if (!file || !path || !bucket) {
      return NextResponse.json(
        { error: 'Missing required fields: file, path, or bucket' },
        { status: 400 }
      )
    }

    // Convert file to ArrayBuffer
    const bytes = await file.arrayBuffer()
    const buffer = new Uint8Array(bytes)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true // Allow overwriting existing files
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}