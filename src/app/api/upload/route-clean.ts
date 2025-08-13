import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { readFile } from 'fs/promises'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain'
]

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // In development, allow testing without authentication
    if (!session?.user && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const tagsString = formData.get('tags') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Unsupported file type. Please upload PDF, Word, PowerPoint, or text files.' 
      }, { status: 400 })
    }

    // Generate unique filename
    const fileId = randomUUID()
    const fileExtension = getFileExtension(file.name)
    const fileName = `${fileId}.${fileExtension}`
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads')
    await mkdir(uploadsDir, { recursive: true })
    
    // Save file to disk
    const filePath = join(uploadsDir, fileName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Extract text content from file
    let extractedText = ''
    try {
      extractedText = await extractTextFromFile(filePath, file.type)
    } catch (error) {
      console.error('Error extracting text:', error)
      // Continue without text extraction
      extractedText = 'Text extraction not available for this file type'
    }

    // Parse tags
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(Boolean) : []

    // Prepare document metadata
    const documentData = {
      id: fileId,
      title,
      description: description || '',
      fileName: file.name,
      filePath: fileName,
      fileSize: file.size,
      mimeType: file.type,
      extractedText,
      tags,
      uploadedBy: session?.user?.id || 'development-user',
      uploadedAt: new Date(),
      version: 1,
      isActive: true
    }

    // In production, save to database using Prisma
    const savedDocument = await saveMockDocument(documentData)

    return NextResponse.json({
      success: true,
      document: {
        id: savedDocument.id,
        title: savedDocument.title,
        fileName: savedDocument.fileName,
        fileSize: savedDocument.fileSize,
        mimeType: savedDocument.mimeType,
        uploadedAt: savedDocument.uploadedAt,
        extractedText: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''),
        tags: savedDocument.tags
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Extract text content from different file types
async function extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
  const buffer = await readFile(filePath)
  
  switch (mimeType) {
    case 'text/plain':
      return buffer.toString('utf8')

    case 'application/pdf':
      // PDF parsing requires additional setup
      return 'PDF content extraction requires pdf-parse library'

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      // Word document parsing requires additional setup
      return 'Word document content extraction requires mammoth library'

    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      // PowerPoint text extraction is more complex
      return 'PowerPoint content extraction not yet implemented'

    default:
      return 'Content extraction not supported for this file type'
  }
}

// Get file extension from filename
function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || 'bin'
}

// Mock function to save document (replace with actual database operation)
async function saveMockDocument(documentData: any) {
  console.log('Saving document (mock):', {
    ...documentData,
    extractedText: documentData.extractedText.substring(0, 100) + '...'
  })

  // Return mock response
  return {
    ...documentData,
    user: {
      name: 'Mock User',
      email: 'user@example.com'
    }
  }
}
