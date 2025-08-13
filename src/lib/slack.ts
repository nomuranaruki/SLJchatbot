import { WebClient } from '@slack/web-api'

export class SlackService {
  private client: WebClient

  constructor() {
    this.client = new WebClient(
      process.env.NODE_ENV === 'development' 
        ? 'mock-token' 
        : process.env.SLACK_BOT_TOKEN
    )
  }

  async sendMessage(channel: string, message: string, options?: any) {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MOCK] Slack message to ${channel}: ${message}`)
        return {
          ok: true,
          ts: Date.now().toString(),
          channel: channel,
          message: {
            text: message
          }
        }
      }

      const result = await this.client.chat.postMessage({
        channel: channel,
        text: message,
        ...options
      })

      return result
    } catch (error) {
      console.error('Slack send message error:', error)
      throw new Error('Failed to send message to Slack')
    }
  }

  async sendDocumentNotification(documentInfo: any, channel: string) {
    try {
      const message = {
        text: `新しいドキュメントがアップロードされました: ${documentInfo.title}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*📄 新しいドキュメント*\n*${documentInfo.title}*`
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*ファイルサイズ:*\n${this.formatFileSize(documentInfo.size)}`
              },
              {
                type: 'mrkdwn',
                text: `*アップロード者:*\n${documentInfo.uploadedBy}`
              },
              {
                type: 'mrkdwn',
                text: `*ファイル形式:*\n${documentInfo.mimeType}`
              },
              {
                type: 'mrkdwn',
                text: `*タグ:*\n${documentInfo.tags?.join(', ') || 'なし'}`
              }
            ]
          }
        ]
      }

      return await this.sendMessage(channel, message.text, { blocks: message.blocks })
    } catch (error) {
      console.error('Slack document notification error:', error)
      throw new Error('Failed to send document notification to Slack')
    }
  }

  async sendChatSummary(chatInfo: any, channel: string) {
    try {
      const message = {
        text: `チャット要約: ${chatInfo.summary}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*💬 チャット要約*\n${chatInfo.summary}`
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*ユーザー:*\n${chatInfo.user}`
              },
              {
                type: 'mrkdwn',
                text: `*質問数:*\n${chatInfo.questionCount}`
              },
              {
                type: 'mrkdwn',
                text: `*参照ドキュメント:*\n${chatInfo.referencedDocuments}`
              },
              {
                type: 'mrkdwn',
                text: `*時間:*\n${chatInfo.timestamp}`
              }
            ]
          }
        ]
      }

      return await this.sendMessage(channel, message.text, { blocks: message.blocks })
    } catch (error) {
      console.error('Slack chat summary error:', error)
      throw new Error('Failed to send chat summary to Slack')
    }
  }

  async getUserInfo(userId: string) {
    try {
      if (process.env.NODE_ENV === 'development') {
        return {
          ok: true,
          user: {
            id: userId,
            name: 'mock-user',
            real_name: 'Mock User',
            profile: {
              email: 'mock@example.com'
            }
          }
        }
      }

      const result = await this.client.users.info({
        user: userId
      })

      return result
    } catch (error) {
      console.error('Slack get user info error:', error)
      throw new Error('Failed to get user info from Slack')
    }
  }

  async getChannels() {
    try {
      if (process.env.NODE_ENV === 'development') {
        return {
          ok: true,
          channels: [
            {
              id: 'C1234567890',
              name: 'general',
              is_member: true
            },
            {
              id: 'C0987654321',
              name: 'documents',
              is_member: true
            }
          ]
        }
      }

      const result = await this.client.conversations.list({
        types: 'public_channel,private_channel'
      })

      return result
    } catch (error) {
      console.error('Slack get channels error:', error)
      throw new Error('Failed to get channels from Slack')
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

export const slackService = new SlackService()
