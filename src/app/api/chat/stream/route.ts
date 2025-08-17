import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateIntelligentFallback } from '@/lib/huggingface'
import { searchDocuments, getDocuments } from '@/lib/documents-store'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // In development, allow testing without authentication
    if (!session?.user && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, conversationHistory = [] } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Create a readable stream for the response
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Search for relevant documents using enhanced search
          console.log('Searching for documents with message:', message)
          console.log('searchDocuments function available:', typeof searchDocuments)
          
          // First check if we have any documents at all
          const allDocsResult = await getDocuments()
          console.log('Total documents available:', allDocsResult.total)
          if (allDocsResult.documents.length > 0) {
            console.log('Sample document titles:', allDocsResult.documents.slice(0, 3).map(d => d.title))
          }
          
          console.log('About to call searchDocuments with:', { message, limit: 5 })
          const searchResults = await searchDocuments(message, 5)
          console.log('searchDocuments returned:', typeof searchResults, 'length:', searchResults?.length || 'undefined')
          if (searchResults && searchResults.length > 0) {
            console.log('First result:', {
              title: searchResults[0].document?.title,
              score: searchResults[0].relevanceScore,
              hasText: Boolean(searchResults[0].document?.extractedText)
            })
          }
          
          console.log('Search results:', {
            documentCount: searchResults.length,
            totalDocuments: searchResults.length,
            documentTitles: searchResults.map(result => `${result.document.title} (score: ${result.relevanceScore})`)
          })
          
          const context = searchResults.length > 0 
            ? searchResults.map(result => 
                `${result.document.title}: ${result.document.extractedText?.substring(0, 1000) || ''}`
              ).join('\n\n')
            : ''

          console.log('Generated context length:', context.length)
          console.log('Generating fallback response with context:', {
            questionLength: message.length,
            contextLength: context.length,
            hasContext: context.length > 0
          })

          // Generate natural language response
          const responseMessage = await generateIntelligentFallback(message, context)
          console.log('Generated response length:', responseMessage.length)
          
          // Split response into chunks for streaming effect
          const words = responseMessage.split(' ')
          
          for (let i = 0; i < words.length; i++) {
            const chunk = words.slice(0, i + 1).join(' ')
            const data = JSON.stringify({ 
              content: chunk,
              isComplete: i === words.length - 1,
              sources: searchResults.map(result => ({
                id: result.document.id,
                title: result.document.title
              }))
            })
            
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            
            // Add small delay for streaming effect
            await new Promise(resolve => setTimeout(resolve, 50))
          }
          
          // Send final completion signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
          
        } catch (error) {
          console.error('Stream error:', error)
          const errorData = JSON.stringify({ 
            error: 'Internal server error',
            isComplete: true 
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Chat stream error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
