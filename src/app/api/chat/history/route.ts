import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

interface ChatHistory {
  id: string
  userId: string
  message: string
  response: string
  sources: string[]
  timestamp: Date
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Load chat history from file
    const chatHistory = await loadChatHistory(session?.user?.id || 'development-user')
    
    // Filter and paginate
    const total = chatHistory.length
    const paginatedHistory = chatHistory
      .slice(offset, offset + limit)
      .map(entry => ({
        id: entry.id,
        userMessage: entry.message,
        assistantMessage: entry.response,
        sources: entry.sources,
        createdAt: entry.timestamp
      }))

    return NextResponse.json({
      history: paginatedHistory,
      total,
      hasMore: offset + limit < total
    })

  } catch (error) {
    console.error('Chat history API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function loadChatHistory(userId: string): Promise<ChatHistory[]> {
  try {
    const historyPath = path.join(process.cwd(), 'uploads', 'chat-history.json')
    const historyData = await fs.readFile(historyPath, 'utf-8')
    const allHistory: ChatHistory[] = JSON.parse(historyData)
    
    // Filter by user ID and sort by timestamp (newest first)
    return allHistory
      .filter(entry => entry.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  } catch (error) {
    console.error('Error loading chat history:', error)
    return []
  }
}

// In production, use this Prisma query:
async function getChatHistoryFromDatabase(userId: string, limit: number, offset: number) {
  // const [history, total] = await Promise.all([
  //   prisma.chatHistory.findMany({
  //     where: { userId },
  //     orderBy: { createdAt: 'desc' },
  //     take: limit,
  //     skip: offset,
  //     select: {
  //       id: true,
  //       userMessage: true,
  //       assistantMessage: true,
  //       sources: true,
  //       createdAt: true
  //     }
  //   }),
  //   prisma.chatHistory.count({ where: { userId } })
  // ])

  // return {
  //   history: history.map(item => ({
  //     ...item,
  //     sources: item.sources ? item.sources.split(',') : []
  //   })),
  //   total,
  //   hasMore: offset + limit < total
  // }
}
