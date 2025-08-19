import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { deleteDocument, getDocumentById } from '@/lib/documents-store'
import { unlink } from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // In development, allow testing without authentication
    if (!session?.user && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const document = await getDocumentById(id)
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Transform document to include user info for compatibility
    const documentWithUser = {
      id: document.id,
      title: document.title,
      description: document.description,
      fileName: document.originalFileName,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      uploadedAt: new Date(document.uploadedAt),
      tags: document.tags,
      user: {
        name: document.uploadedBy,
        email: document.uploadedBy.includes('@') ? document.uploadedBy : `${document.uploadedBy}@example.com`
      },
      extractedText: document.extractedText
    }

    return NextResponse.json({ document: documentWithUser })

  } catch (error) {
    console.error('Document GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // In development, allow testing without authentication
    if (!session?.user && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    // Get document to find file path
    const document = await getDocumentById(id)
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete the physical file
    try {
      const filePath = path.join(process.cwd(), 'uploads', document.fileName)
      await unlink(filePath)
    } catch (fileError) {
      console.warn('Failed to delete physical file:', fileError)
      // Continue with database deletion even if file deletion fails
    }

    // Delete from document store
    const success = await deleteDocument(id)
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Document deleted successfully',
      deletedId: id 
    })

  } catch (error) {
    console.error('Document DELETE API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // In development, allow testing without authentication
    if (!session?.user && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, description, tags } = body

    // Get existing document
    const document = await getDocumentById(id)
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Update document (this would need to be implemented in documents-store)
    // For now, return success without actual update
    return NextResponse.json({ 
      message: 'Document update functionality coming soon',
      documentId: id 
    })

  } catch (error) {
    console.error('Document PATCH API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
