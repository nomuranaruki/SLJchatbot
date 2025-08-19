import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDocuments } from '@/lib/documents-store'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // In development, allow testing without authentication
    if (!session?.user && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || undefined
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || undefined
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 元のgetDocumentsを利用
    const result = await getDocuments(query, tags, limit, offset)

    // Transform documents to include user info for compatibility
    const documentsWithUser = result.documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      fileName: doc.originalFileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      uploadedAt: new Date(doc.uploadedAt),
      tags: doc.tags,
      user: {
        name: doc.uploadedBy,
        email: doc.uploadedBy.includes('@') ? doc.uploadedBy : `${doc.uploadedBy}@example.com`
      },
      extractedText: doc.extractedText
    }))

    return NextResponse.json({
      documents: documentsWithUser,
      total: result.total,
      hasMore: result.hasMore
    })

  } catch (error) {
    console.error('Documents API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// This file now uses the documents-store instead of mock data
