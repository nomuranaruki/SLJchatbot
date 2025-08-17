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
  timestamp: string
  sources?: Array<{
    id: string
    title: string
  }>
}

const HISTORY_FILE = path.join(process.cwd(), 'uploads', 'chat-history.json')

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Ensure chat history file exists
    try {
      await fs.access(HISTORY_FILE)
    } catch {
      await fs.writeFile(HISTORY_FILE, JSON.stringify([]))
    }

    const historyContent = await fs.readFile(HISTORY_FILE, 'utf-8')
    const history: ChatHistory[] = JSON.parse(historyContent)
    
    // Filter by user in production, show all in development
    const userHistory = process.env.NODE_ENV === 'development' 
      ? history 
      : history.filter(h => h.userId === session?.user?.email)
    
    // Sort by timestamp (newest first) and limit
    const recentHistory = userHistory
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return NextResponse.json({
      history: recentHistory,
      total: userHistory.length
    })

  } catch (error) {
    console.error('Chat history GET error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, response, sources = [] } = body

    if (!message || !response) {
      return NextResponse.json({ 
        error: 'Message and response are required' 
      }, { status: 400 })
    }

    // Ensure chat history file exists
    try {
      await fs.access(HISTORY_FILE)
    } catch {
      await fs.writeFile(HISTORY_FILE, JSON.stringify([]))
    }

    const historyContent = await fs.readFile(HISTORY_FILE, 'utf-8')
    const history: ChatHistory[] = JSON.parse(historyContent)

    const newEntry: ChatHistory = {
      id: Date.now().toString(),
      userId: session?.user?.email || 'development-user',
      message,
      response,
      timestamp: new Date().toISOString(),
      sources
    }

    history.push(newEntry)

    // Keep only the last 1000 entries
    if (history.length > 1000) {
      history.splice(0, history.length - 1000)
    }

    await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2))

    return NextResponse.json({ 
      success: true,
      entry: newEntry
    })

  } catch (error) {
    console.error('Chat history POST error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
