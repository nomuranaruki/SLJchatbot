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
      content: '🚀 **SLJ Chatbot AI - ChatGPT風機能が実装されました！**\n\n✨ **新機能**:\n• 🤖 **ChatGPT風会話**: Hugging Face AIによる自然な対話\n• 💬 **ストリーミング応答**: リアルタイムでの回答表示\n• 🧠 **会話記憶**: 過去のやり取りを考慮した応答\n• 📄 **文書解析**: PDF内容に基づく高精度回答\n• 🎯 **インテリジェント分析**: 評価制度、グレード、昇格などの企業情報に対応\n\n💡 **使い方**:\n1. PDFファイルをアップロード\n2. 資料について質問\n3. AIが文書を分析して詳細回答\n\n何でもお聞きください！',
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
    const currentMessage = inputMessage
    setInputMessage('')
    setIsLoading(true)

    // Create initial assistant message for streaming
    const assistantMessageId = (Date.now() + 1).toString()
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, initialAssistantMessage])

    try {
      // Try streaming first, fallback to regular chat if needed
      const shouldUseStreaming = process.env.NODE_ENV === 'development' || true // Enable for better UX
      
      if (shouldUseStreaming) {
        await handleStreamingResponse(currentMessage, assistantMessageId)
      } else {
        await handleRegularResponse(currentMessage, assistantMessageId)
      }
    } catch (error) {
      console.error('Chat error:', error)
      // Update the assistant message with error
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: '申し訳ございません。エラーが発生しました。もう一度お試しください。' }
          : msg
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const handleStreamingResponse = async (message: string, messageId: string) => {
    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          documentIds: documents.map(doc => doc.id),
          conversationHistory: messages.slice(-10) // Last 10 messages for context
        })
      })

      if (!response.ok) {
        throw new Error('Streaming API error')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Response body is not readable')
      }

      let buffer = ''
      let sources: string[] = []

      while (true) {
        const { value, done } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              // Streaming completed
              return
            }

            try {
              const parsed = JSON.parse(data)
              
              if (parsed.error) {
                throw new Error(parsed.error)
              }

              if (parsed.content) {
                // Update message content
                setMessages(prev => prev.map(msg => 
                  msg.id === messageId 
                    ? { 
                        ...msg, 
                        content: parsed.content,
                        sources: parsed.sources?.map((source: string) => ({
                          documentId: '1',
                          title: source,
                          excerpt: ''
                        }))
                      }
                    : msg
                ))
              }

              if (parsed.sources && parsed.sources.length > 0) {
                sources = parsed.sources
              }
            } catch (parseError) {
              console.error('Failed to parse streaming data:', parseError)
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error)
      // Fallback to regular response
      await handleRegularResponse(message, messageId)
    }
  }

  const handleRegularResponse = async (message: string, messageId: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          documentIds: documents.map(doc => doc.id),
          conversationHistory: messages.slice(-10)
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update the assistant message
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? {
                ...msg,
                content: result.message,
                timestamp: new Date(result.timestamp),
                sources: result.sources?.map((source: string) => ({
                  documentId: '1',
                  title: source,
                  excerpt: ''
                }))
              }
            : msg
        ))
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Chat API error')
      }
    } catch (error) {
      throw error // Re-throw to be handled by the main function
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
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6" />
            SLJ AI Assistant - ChatGPT風
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              Powered by Hugging Face
            </span>
          </CardTitle>
          {messages.length > 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSlackNotification(true)}
              className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
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
                className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white ml-auto'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 order-last">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className={`prose prose-sm max-w-none ${message.role === 'user' ? 'prose-invert' : ''}`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                    
                    {/* ソース情報 */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium mb-2 text-gray-600">📄 参照資料:</p>
                        <div className="space-y-1">
                          {message.sources.map((source, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs bg-gray-50 px-2 py-1 rounded">
                              <FileText className="h-3 w-3 text-blue-600" />
                              <span className="font-medium">{source.title}</span>
                              {source.page && <span className="text-gray-500">(p.{source.page})</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString('ja-JP')}
                </div>
              </div>
            </div>
          ))}
          
          {/* ローディング表示 */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm max-w-[85%]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                    <span className="text-sm text-gray-600">AIが考えています...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア */}
        <div className="border-t pt-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="何でもお聞きください... (Shift+Enterで改行)"
                className="resize-none border-0 bg-gray-50 focus:bg-white transition-colors min-h-[50px] max-h-[120px] rounded-xl"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="lg"
              className="h-[50px] w-[50px] rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
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
