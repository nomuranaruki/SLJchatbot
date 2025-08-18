import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { searchDocuments } from '@/lib/documents-store'
import { generateNaturalChatResponse } from '@/lib/huggingface'

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

    // Search for relevant documents using enhanced search
    const searchResults = await searchDocuments(message, 5)
    
    const sources = searchResults.map(result => ({
      id: result.document.id,
      title: result.document.title,
      relevantContent: result.matchedText || result.document.extractedText?.substring(0, 500) || '',
      relevanceScore: result.relevanceScore
    }))

    let responseMessage = ''

    if (sources.length > 0) {
      // Use natural chat with document context
      const context = sources.map(s => `${s.title}: ${s.relevantContent}`).join('\n\n')
      
      responseMessage = await generateNaturalChatResponse(message, context)
    } else {
      // Use natural chat for general conversation
      responseMessage = await generateNaturalChatResponse(message)
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
