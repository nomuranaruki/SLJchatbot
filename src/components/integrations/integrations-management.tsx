'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Cloud, 
  MessageSquare, 
  RefreshCw, 
  Download, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Users,
  Settings,
  Link,
  Upload
} from 'lucide-react'

interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  size: string
  webViewLink: string
}

interface SlackChannel {
  id: string
  name: string
  is_member: boolean
}

export default function IntegrationsManagement() {
  const [googleDriveFiles, setGoogleDriveFiles] = useState<GoogleDriveFile[]>([])
  const [slackChannels, setSlackChannels] = useState<SlackChannel[]>([])
  const [isGoogleDriveLoading, setIsGoogleDriveLoading] = useState(false)
  const [isSlackLoading, setIsSlackLoading] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [connectionStatus, setConnectionStatus] = useState({
    googleDrive: false,
    slack: false
  })

  useEffect(() => {
    loadGoogleDriveFiles()
    loadSlackChannels()
    testConnections()
  }, [])

  const loadGoogleDriveFiles = async () => {
    try {
      setIsGoogleDriveLoading(true)
      const response = await fetch('/api/integrations/google-drive?action=list')
      if (response.ok) {
        const result = await response.json()
        setGoogleDriveFiles(result.files || [])
      }
    } catch (error) {
      console.error('Error loading Google Drive files:', error)
    } finally {
      setIsGoogleDriveLoading(false)
    }
  }

  const loadSlackChannels = async () => {
    try {
      setIsSlackLoading(true)
      const response = await fetch('/api/integrations/slack?action=channels')
      if (response.ok) {
        const result = await response.json()
        setSlackChannels(result.channels || [])
      }
    } catch (error) {
      console.error('Error loading Slack channels:', error)
    } finally {
      setIsSlackLoading(false)
    }
  }

  const testConnections = async () => {
    // Google Drive接続テスト
    try {
      const gdResponse = await fetch('/api/integrations/google-drive?action=list')
      setConnectionStatus(prev => ({ ...prev, googleDrive: gdResponse.ok }))
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, googleDrive: false }))
    }

    // Slack接続テスト
    try {
      const slackResponse = await fetch('/api/integrations/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-connection' })
      })
      const result = await slackResponse.json()
      setConnectionStatus(prev => ({ ...prev, slack: result.connected }))
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, slack: false }))
    }
  }

  const syncGoogleDriveDocuments = async () => {
    try {
      setIsGoogleDriveLoading(true)
      const response = await fetch('/api/integrations/google-drive?action=sync')
      if (response.ok) {
        const result = await response.json()
        alert(`${result.count}個のドキュメントを同期しました`)
        loadGoogleDriveFiles()
      }
    } catch (error) {
      console.error('Error syncing Google Drive documents:', error)
      alert('Google Driveドキュメントの同期に失敗しました')
    } finally {
      setIsGoogleDriveLoading(false)
    }
  }

  const importGoogleDriveFile = async (fileId: string) => {
    try {
      const response = await fetch('/api/integrations/google-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, action: 'import' })
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`ファイル "${result.document.title}" をインポートしました`)
      }
    } catch (error) {
      console.error('Error importing file:', error)
      alert('ファイルのインポートに失敗しました')
    }
  }

  const sendTestMessage = async () => {
    if (!selectedChannel || !testMessage) {
      alert('チャンネルとメッセージを入力してください')
      return
    }

    try {
      const response = await fetch('/api/integrations/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-message',
          channel: selectedChannel,
          message: testMessage
        })
      })

      if (response.ok) {
        alert('テストメッセージを送信しました')
        setTestMessage('')
      }
    } catch (error) {
      console.error('Error sending test message:', error)
      alert('メッセージの送信に失敗しました')
    }
  }

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes)
    if (size === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(size) / Math.log(k))
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">外部サービス統合</h2>
        <Button onClick={testConnections} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          接続状況を更新
        </Button>
      </div>

      {/* 接続状況 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Cloud className="h-5 w-5 text-blue-600" />
            <CardTitle className="ml-2">Google Drive</CardTitle>
            {connectionStatus.googleDrive ? (
              <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500 ml-auto" />
            )}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              ステータス: {connectionStatus.googleDrive ? '接続中' : '未接続'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            <CardTitle className="ml-2">Slack</CardTitle>
            {connectionStatus.slack ? (
              <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500 ml-auto" />
            )}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              ステータス: {connectionStatus.slack ? '接続中' : '未接続'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Google Drive統合 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cloud className="h-5 w-5 text-blue-600 mr-2" />
            Google Drive統合
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Google Driveからドキュメントを同期・インポートできます
              </p>
              <div className="space-x-2">
                <Button 
                  onClick={loadGoogleDriveFiles} 
                  variant="outline"
                  disabled={isGoogleDriveLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isGoogleDriveLoading ? 'animate-spin' : ''}`} />
                  ファイル一覧を更新
                </Button>
                <Button 
                  onClick={syncGoogleDriveDocuments}
                  disabled={isGoogleDriveLoading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  ドキュメントを同期
                </Button>
              </div>
            </div>

            {googleDriveFiles.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  {googleDriveFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)} • {new Date(file.modifiedTime).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                      </div>
                      <div className="space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(file.webViewLink, '_blank')}
                        >
                          <Link className="h-3 w-3 mr-1" />
                          表示
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => importGoogleDriveFile(file.id)}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          インポート
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Slack統合 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 text-purple-600 mr-2" />
            Slack統合
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Slackチャンネルにドキュメント通知やチャット要約を送信できます
            </p>

            {/* テストメッセージ送信 */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">チャンネル選択</label>
                  <select 
                    className="w-full mt-1 p-2 border rounded-md"
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                  >
                    <option value="">チャンネルを選択</option>
                    {slackChannels.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        #{channel.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">テストメッセージ</label>
                  <Input
                    placeholder="テストメッセージを入力"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <Button onClick={sendTestMessage} disabled={!selectedChannel || !testMessage}>
                <MessageSquare className="h-4 w-4 mr-2" />
                テストメッセージを送信
              </Button>
            </div>

            {/* Slack設定 */}
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">通知設定</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• 新しいドキュメントがアップロードされた時の通知</p>
                <p>• チャットセッションの要約送信</p>
                <p>• システム重要通知</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 統合設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 text-gray-600 mr-2" />
            統合設定
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              外部サービスとの統合設定を管理します
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Google Drive設定</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 自動同期間隔: 1時間</li>
                  <li>• 対象フォルダ: 指定なし（全体）</li>
                  <li>• ファイル形式: PDF, Word, PowerPoint</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Slack設定</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• デフォルトチャンネル: #general</li>
                  <li>• 通知タイミング: リアルタイム</li>
                  <li>• 要約送信: 有効</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
