import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // For now, return mock data
    const mockHistory = await getMockChatHistory(session.user.id, limit, offset)

    return NextResponse.json({
      history: mockHistory.history,
      total: mockHistory.total,
      hasMore: mockHistory.hasMore
    })

  } catch (error) {
    console.error('Chat history API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Mock function to get chat history
async function getMockChatHistory(userId: string, limit: number, offset: number) {
  const allHistory = [
    {
      id: '1',
      userMessage: '会社の勤務時間について教えてください',
      assistantMessage: '会社の規定によると、標準勤務時間は平日9:00-18:00（休憩1時間）となっています。詳細については就業規則をご確認ください。',
      sources: ['会社規定ハンドブック'],
      createdAt: new Date('2024-02-01T10:30:00Z')
    },
    {
      id: '2',
      userMessage: '新製品の保証期間はどのくらいですか？',
      assistantMessage: '新製品の保証期間は購入から2年間となっています。製品に欠陥が見つかった場合は、保証期間内であれば無償で修理または交換いたします。',
      sources: ['新製品仕様書 2024'],
      createdAt: new Date('2024-02-01T14:15:00Z')
    },
    {
      id: '3',
      userMessage: 'Q1のマーケティング戦略について詳しく教えてください',
      assistantMessage: 'Q1のマーケティング戦略では、ターゲット顧客層の詳細分析を行い、新しいデジタルマーケティングアプローチを導入します。主要施策として、SNS活用とコンテンツマーケティングに重点を置いています。',
      sources: ['マーケティング戦略プレゼンテーション'],
      createdAt: new Date('2024-02-01T16:45:00Z')
    },
    {
      id: '4',
      userMessage: 'パスワードのセキュリティポリシーについて',
      assistantMessage: 'パスワードは8文字以上で、大文字・小文字・数字・記号を組み合わせてください。90日ごとの変更が推奨され、過去3回使用したパスワードは使用できません。二要素認証の設定も強く推奨しています。',
      sources: ['セキュリティガイドライン'],
      createdAt: new Date('2024-02-02T09:20:00Z')
    },
    {
      id: '5',
      userMessage: 'Q4の財務状況はどうでしたか？',
      assistantMessage: 'Q4の業績は非常に好調で、売上は前年同期比15%増となりました。利益率も3%改善し、全体的に順調な成長を続けています。特に主力製品の売上が大幅に伸びました。',
      sources: ['財務報告書 Q4'],
      createdAt: new Date('2024-02-02T11:10:00Z')
    }
  ]

  const total = allHistory.length
  const history = allHistory.slice(offset, offset + limit)
  const hasMore = offset + limit < total

  return {
    history,
    total,
    hasMore
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
