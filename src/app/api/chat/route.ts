import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDocuments } from '@/lib/documents-store'
import { generateIntelligentFallback, enhanceResponseQuality } from '@/lib/huggingface'

export async function GET() {
  return NextResponse.json({ 
    message: 'Chatbot API is working', 
    timestamp: new Date().toISOString() 
  })
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // In development, allow testing without authentication
    // if (!session?.user && process.env.NODE_ENV !== 'development') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Search for relevant documents
    const searchResults = await getDocuments(message, undefined, 5)
    
    const sources = searchResults.documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      relevantContent: doc.extractedText?.substring(0, 500) || ''
    }))

    let responseMessage = ''

    if (sources.length > 0) {
      // Use natural language response with document context
      const context = sources.map(s => `${s.title}: ${s.relevantContent}`).join('\n\n')
      
      // First generate a basic response and then enhance it
      const basicResponse = await generateIntelligentFallback(message, context)
      responseMessage = enhanceResponseQuality(basicResponse, message, context)
    } else {
      // Use intelligent fallback for natural conversation
      responseMessage = await generateIntelligentFallback(message)
    }

    return NextResponse.json({
      message: responseMessage,
      sources: sources,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Chatbot API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
