import { NextRequest, NextResponse } from 'next/server'
import { slackService } from '@/lib/slack'
import { envConfig, createMockResponse } from '@/lib/env'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // 開発環境でSlack APIが設定されていない場合のモック
    if (!envConfig.slack.isValid && process.env.NODE_ENV === 'development') {
      switch (action) {
        case 'channels':
          return NextResponse.json(createMockResponse({ 
            success: true, 
            channels: [
              { id: 'C1234567890', name: 'general', is_member: true },
              { id: 'C0987654321', name: 'development', is_member: true }
            ] 
          }, 'Slack'))

        case 'user':
          const userId = searchParams.get('userId')
          return NextResponse.json(createMockResponse({ 
            success: true, 
            user: {
              id: userId || 'U123456789',
              name: 'Mock User',
              real_name: 'Mock Development User'
            }
          }, 'Slack'))

        case 'status':
          return NextResponse.json(createMockResponse({ 
            success: true, 
            connected: false,
            message: 'Development mode - Slack not configured'
          }, 'Slack'))

        default:
          return NextResponse.json(
            { error: 'Invalid action parameter' },
            { status: 400 }
          )
      }
    }

    switch (action) {
      case 'channels':
        const channels = await slackService.getChannels()
        return NextResponse.json({ 
          success: true, 
          channels: channels.channels || [] 
        })

      case 'user':
        const userId = searchParams.get('userId')
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          )
        }
        
        const userInfo = await slackService.getUserInfo(userId)
        return NextResponse.json({ 
          success: true, 
          user: userInfo.user 
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Slack API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, channel, message, data } = await request.json()

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'send-message':
        if (!channel || !message) {
          return NextResponse.json(
            { error: 'Channel and message are required' },
            { status: 400 }
          )
        }

        const result = await slackService.sendMessage(channel, message)
        return NextResponse.json({
          success: true,
          result: result
        })

      case 'document-notification':
        if (!channel || !data) {
          return NextResponse.json(
            { error: 'Channel and document data are required' },
            { status: 400 }
          )
        }

        const docNotification = await slackService.sendDocumentNotification(data, channel)
        return NextResponse.json({
          success: true,
          result: docNotification,
          message: 'Document notification sent to Slack'
        })

      case 'chat-summary':
        if (!channel || !data) {
          return NextResponse.json(
            { error: 'Channel and chat data are required' },
            { status: 400 }
          )
        }

        const chatSummary = await slackService.sendChatSummary(data, channel)
        return NextResponse.json({
          success: true,
          result: chatSummary,
          message: 'Chat summary sent to Slack'
        })

      case 'test-connection':
        // Slack接続をテスト
        const testResult = await slackService.getChannels()
        return NextResponse.json({
          success: true,
          connected: testResult.ok,
          message: testResult.ok ? 'Slack connection successful' : 'Slack connection failed'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Slack POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
