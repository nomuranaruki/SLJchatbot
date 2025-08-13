import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OpenAI } from 'openai'
import { prisma } from '@/lib/prisma'
import { envConfig, createMockResponse } from '@/lib/env'

// OpenAI クライアントの初期化（開発環境での安全性確保）
let openai: OpenAI | null = null

try {
  if (envConfig.openai.isValid) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  } else if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ OpenAI API key not configured, using mock responses')
  }
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error)
  if (process.env.NODE_ENV !== 'development') {
    throw error
  }
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // In development, allow testing without authentication
    if (!session?.user && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, documentIds = [] } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // 開発環境でOpenAI APIが利用できない場合のモック応答
    if (!openai && process.env.NODE_ENV === 'development') {
      return NextResponse.json(createMockResponse({
        message: `Mock response for: "${message}". This is a development environment response since OpenAI API is not configured.`,
        sources: documentIds.length > 0 ? ['Mock Document 1', 'Mock Document 2'] : []
      }, 'OpenAI Chat'))
    }

    if (!openai) {
      return NextResponse.json({ error: 'OpenAI service not available' }, { status: 503 })
    }

    // Get document context if documentIds are provided
    let documentContext = ''
    let sources: string[] = []

    if (documentIds.length > 0) {
      try {
        // For now, use mock data. In production, fetch from database
        const documents = await getMockDocuments(documentIds)
        documentContext = documents.map(doc => `Document: ${doc.name}\nContent: ${doc.content}`).join('\n\n')
        sources = documents.map(doc => doc.name)
      } catch (error) {
        console.error('Error fetching documents:', error)
        // Continue without document context
      }
    }

    // Prepare the prompt for OpenAI
    const systemPrompt = `あなたは専門的なドキュメントアシスタントです。提供されたドキュメントの内容に基づいて、正確で役立つ回答を提供してください。
    
もしドキュメントの内容から答えを見つけられない場合は、そのことを明確に伝えてください。
常に丁寧で専門的な日本語で回答してください。

${documentContext ? `関連ドキュメント:\n${documentContext}` : ''}`

    const messages: ChatMessage[] = [
      { role: 'user', content: message }
    ]

    // If OpenAI API key is not configured, return mock response
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
      const mockResponse = generateMockResponse(message, sources)
      
      // Save chat history (mock implementation)
      await saveChatHistory(session?.user?.id || 'development-user', message, mockResponse.content, sources)
      
      return NextResponse.json({
        message: mockResponse.content,
        sources,
        timestamp: new Date().toISOString()
      })
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const assistantMessage = completion.choices[0]?.message?.content || 'すみません、回答を生成できませんでした。'

    // Save chat history (mock implementation)
    await saveChatHistory(session?.user?.id || 'development-user', message, assistantMessage, sources)

    return NextResponse.json({
      message: assistantMessage,
      sources,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Mock function to get documents (replace with actual database query)
async function getMockDocuments(documentIds: string[]) {
  return [
    {
      id: '1',
      name: 'サンプル文書.pdf',
      content: 'これは会社の規定に関する重要な文書です。従業員は勤務時間を遵守し、適切な服装で出勤することが求められています。'
    },
    {
      id: '2', 
      name: '製品仕様書.docx',
      content: '当社の新製品は高品質な素材を使用し、環境に優しい設計となっています。保証期間は購入から2年間です。'
    }
  ].filter(doc => documentIds.includes(doc.id))
}

// Generate mock AI response for development
function generateMockResponse(message: string, sources: string[]): { content: string } {
  const responses = [
    'ご質問いただいた内容について、アップロードされた文書を確認いたしました。',
    '提供された情報に基づいて回答いたします。',
    'ドキュメントの内容を参照して、以下のようにお答えします。',
    '関連する文書から情報を抽出し、回答を作成いたします。'
  ]
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)]
  
  let response = `${randomResponse}\n\n`
  
  if (message.includes('規定') || message.includes('ルール')) {
    response += '会社の規定によると、従業員は勤務時間を遵守し、適切な服装で出勤することが重要です。詳細については人事部にお問い合わせください。'
  } else if (message.includes('製品') || message.includes('仕様')) {
    response += '当社の製品は高品質な素材を使用し、環境に配慮した設計となっています。保証期間は購入から2年間となっております。'
  } else {
    response += `「${message}」に関するご質問ですね。アップロードされた文書を基に、可能な限り詳細な情報を提供いたします。追加でご質問がございましたら、お気軽にお聞きください。`
  }
  
  if (sources.length > 0) {
    response += `\n\n参考文書: ${sources.join(', ')}`
  }
  
  return { content: response }
}

// Save chat history (mock implementation)
async function saveChatHistory(userId: string, userMessage: string, assistantMessage: string, sources: string[]) {
  try {
    // In production, save to database using Prisma
    console.log('Saving chat history:', {
      userId,
      userMessage: userMessage.substring(0, 100) + '...',
      assistantMessage: assistantMessage.substring(0, 100) + '...',
      sources
    })
    
    // Mock implementation - in production use:
    // await prisma.chatHistory.create({
    //   data: {
    //     userId,
    //     userMessage,
    //     assistantMessage,
    //     sources: sources.join(','),
    //   }
    // })
    
  } catch (error) {
    console.error('Error saving chat history:', error)
  }
}
