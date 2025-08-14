'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Send, Bot, User, FileText, Loader2, MessageSquare } from 'lucide-react'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  sources?: DocumentSource[]
}

interface DocumentSource {
  documentId: string
  title: string
  page?: number
  excerpt: string
}

interface ChatInterfaceProps {
  documents?: any[]
}

export default function ChatInterface({ documents = [] }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'こんにちは！SLJ ChatbotのAIアシスタントです。🤖\n\nHugging Face AIを使用して、アップロードされた資料について詳しく回答いたします。PDF、Word、PowerPointファイルの内容について何でもお聞きください。\n\n✨ 機能:\n• ドキュメントベースの質問応答\n• 多言語対応\n• 高精度な情報抽出\n• 要約・分析',
      role: 'assistant',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSlackNotification, setShowSlackNotification] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage,
          documentIds: documents.map(doc => doc.id)
        })
      })

      if (response.ok) {
        const result = await response.json()
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: result.message,
          role: 'assistant',
          timestamp: new Date(result.timestamp),
          sources: result.sources?.map((source: string) => ({
            documentId: '1',
            title: source,
            excerpt: ''
          }))
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Chat API error')
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '申し訳ございません。エラーが発生しました。もう一度お試しください。',
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const sendSlackSummary = async () => {
    try {
      const userMessages = messages.filter(m => m.role === 'user')
      const referencedDocs = messages
        .filter(m => m.sources && m.sources.length > 0)
        .flatMap(m => m.sources?.map(s => s.title) || [])
        .filter((title, index, arr) => arr.indexOf(title) === index)

      const chatInfo = {
        summary: `${userMessages.length}件の質問についてAIチャットを実行しました`,
        user: 'ユーザー',
        questionCount: userMessages.length,
        referencedDocuments: referencedDocs.join(', ') || 'なし',
        timestamp: new Date().toLocaleString('ja-JP')
      }

      const response = await fetch('/api/integrations/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat-summary',
          channel: 'general', // デフォルトチャンネル
          data: chatInfo
        })
      })

      if (response.ok) {
        alert('チャット要約をSlackに送信しました')
        setShowSlackNotification(false)
      } else {
        throw new Error('Slack通知の送信に失敗しました')
      }
    } catch (error) {
      console.error('Slack summary error:', error)
      alert('Slack通知の送信に失敗しました')
    }
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AIチャット
          </CardTitle>
          {messages.length > 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSlackNotification(true)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Slack要約送信
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* メッセージ一覧 */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start gap-2">
                  {message.role === 'assistant' && (
                    <Bot className="h-4 w-4 mt-1 flex-shrink-0" />
                  )}
                  {message.role === 'user' && (
                    <User className="h-4 w-4 mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    
                    {/* ソース情報 */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium mb-2">参照資料:</p>
                        <div className="space-y-1">
                          {message.sources.map((source, index) => (
                            <div key={index} className="flex items-center gap-1 text-xs">
                              <FileText className="h-3 w-3" />
                              <span>{source.title}</span>
                              {source.page && <span>(p.{source.page})</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {/* ローディング表示 */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">回答を生成中...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア */}
        <div className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="資料について質問してください..."
            className="flex-1 min-h-[50px] max-h-[100px]"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="lg"
            className="px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* ドキュメント情報 */}
        {documents.length > 0 && (
          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">利用可能な資料 ({documents.length}件):</p>
            <div className="flex flex-wrap gap-1">
              {documents.slice(0, 3).map((doc, index) => (
                <span key={index} className="text-xs bg-white px-2 py-1 rounded">
                  {doc.title}
                </span>
              ))}
              {documents.length > 3 && (
                <span className="text-xs text-gray-500">他{documents.length - 3}件</span>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Slack通知ダイアログ */}
      <Dialog open={showSlackNotification} onOpenChange={setShowSlackNotification}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slack要約送信</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              現在のチャットセッションの要約をSlackに送信しますか？
            </p>
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p><strong>質問数:</strong> {messages.filter(m => m.role === 'user').length}件</p>
              <p><strong>参照資料:</strong> {
                messages
                  .filter(m => m.sources && m.sources.length > 0)
                  .flatMap(m => m.sources?.map(s => s.title) || [])
                  .filter((title, index, arr) => arr.indexOf(title) === index)
                  .join(', ') || 'なし'
              }</p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSlackNotification(false)}>
                キャンセル
              </Button>
              <Button onClick={sendSlackSummary}>
                送信
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
