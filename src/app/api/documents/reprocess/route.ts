import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDocumentById, saveDocument } from '@/lib/documents-store'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // In development, allow testing without authentication
    if (!session?.user && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
    }

    // Get document from store
    const document = await getDocumentById(documentId)

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Only reprocess if current text indicates extraction failed or is a placeholder
    if (document.extractedText && 
        !document.extractedText.includes('requires pdf-parse library') && 
        !document.extractedText.includes('PDF text extraction is being processed')) {
      return NextResponse.json({ 
        message: 'Document already has extracted text',
        document 
      })
    }

    // Read file and extract text
    const filePath = join(process.cwd(), 'uploads', document.fileName)
    let extractedText = ''

    try {
      extractedText = await extractTextFromFile(filePath, document.mimeType)
    } catch (error) {
      console.error('Error extracting text:', error)
      return NextResponse.json({ 
        error: 'Failed to extract text from document' 
      }, { status: 500 })
    }

    // Update document with extracted text
    const updatedDocument = {
      ...document,
      extractedText,
      updatedAt: new Date().toISOString()
    }

    // Save updated document
    await saveDocument(updatedDocument)

    return NextResponse.json({
      success: true,
      message: 'Document reprocessed successfully',
      document: {
        ...updatedDocument,
        extractedText: extractedText.substring(0, 1000) + (extractedText.length > 1000 ? '...' : '')
      }
    })

  } catch (error) {
    console.error('Reprocess error:', error)
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
      try {
        // Use the same approach that works in the command line
        const fs = require('fs')
        const pdfParse = require('pdf-parse')
        
        // Read the file directly (this approach worked in our test)
        const fileBuffer = fs.readFileSync(filePath)
        const data = await pdfParse(fileBuffer)
        
        return data.text || 'PDF処理完了しましたが、テキストコンテンツが見つかりませんでした'
      } catch (error) {
        console.error('PDF extraction error:', error)
        throw new Error('PDFからのテキスト抽出に失敗しました')
      }

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      // Word document parsing would require mammoth library
      return 'Word document content extraction requires mammoth library'

    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      // PowerPoint text extraction is more complex
      return 'PowerPoint content extraction not yet implemented'

    default:
      return 'Content extraction not supported for this file type'
  }
}
