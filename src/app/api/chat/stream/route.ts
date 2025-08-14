import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateStreamingResponse, EnhancedConversationMemory } from '@/lib/huggingface'
import { getDocuments } from '@/lib/documents-store'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // In development, allow testing without authentication
    if (!session?.user && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, documentIds = [], conversationHistory = [] } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Create enhanced conversation memory
    const conversationMemory = new EnhancedConversationMemory(15, 3000)
    
    // Add conversation history to memory
    conversationHistory.forEach((turn: ChatMessage) => {
      conversationMemory.addTurn(turn.role, turn.content)
    })

    // Get document context if documentIds are provided
    let documentContext = ''
    let sources: string[] = []

    if (documentIds.length > 0) {
      try {
        const documentsResult = await getDocuments()
        const allDocuments = documentsResult.documents
        const selectedDocs = allDocuments.filter(doc => documentIds.includes(doc.id))
        
        const documentContents = selectedDocs.map(doc => ({
          name: doc.title,
          content: doc.extractedText || `${doc.title}: ${doc.description || 'No content available'}`
        }))
        
        documentContext = documentContents
          .map(doc => `Document: ${doc.name}\nContent: ${doc.content}`)
          .join('\n\n')
        sources = documentContents.map(doc => doc.name)
      } catch (error) {
        console.error('Error fetching documents:', error)
      }
    }

    // Create streaming response
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of generateStreamingResponse(message, conversationMemory, documentContext)) {
            const data = JSON.stringify({ 
              content: chunk,
              sources,
              timestamp: new Date().toISOString()
            })
            
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          }
          
          // Send final completion signal
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          
          // Send error and close stream
          const errorData = JSON.stringify({ 
            error: 'Failed to generate response',
            timestamp: new Date().toISOString()
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (error) {
    console.error('Chat streaming API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
