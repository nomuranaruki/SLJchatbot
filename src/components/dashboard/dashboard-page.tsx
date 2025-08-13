'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  MessageSquare, 
  FileText, 
  Upload, 
  Settings, 
  Users, 
  Search,
  Filter,
  Plus,
  LogOut,
  Menu,
  X,
  Link
} from 'lucide-react'
import DocumentManagement from '@/components/documents/document-management'
import ChatInterface from '@/components/chat/chat-interface'
import IntegrationsManagement from '@/components/integrations/integrations-management'
import UserManagement from '@/components/admin/user-management'
import AuditLogs from '@/components/admin/audit-logs'
import SystemAnalytics from '@/components/admin/system-analytics'
import DemoBanner from '@/components/ui/demo-banner'

type TabType = 'overview' | 'documents' | 'chat' | 'integrations' | 'settings' | 'admin' | 'admin-users' | 'admin-logs' | 'admin-analytics'

export default function DashboardPage() {
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [adminActiveTab, setAdminActiveTab] = useState<'dashboard' | 'users' | 'logs' | 'analytics'>('dashboard')
  const [documents, setDocuments] = useState([])

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents')
      if (response.ok) {
        const result = await response.json()
        // React state update should be wrapped properly
        setTimeout(() => {
          setDocuments(result.documents || [])
        }, 0)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      // Ensure state is set even on error
      setTimeout(() => {
        setDocuments([])
      }, 0)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const sidebarItems = [
    { icon: FileText, label: 'ダッシュボード', tab: 'overview' as TabType, active: activeTab === 'overview' },
    { icon: FileText, label: '資料管理', tab: 'documents' as TabType, active: activeTab === 'documents' },
    { icon: MessageSquare, label: 'AIチャット', tab: 'chat' as TabType, active: activeTab === 'chat' },
    { icon: Link, label: '外部統合', tab: 'integrations' as TabType, active: activeTab === 'integrations' },
    { icon: Settings, label: '設定', tab: 'settings' as TabType, active: activeTab === 'settings' },
  ]

  // Add admin menu if user is admin
  if (session?.user?.role === 'admin') {
    sidebarItems.push({ icon: Users, label: '管理者', tab: 'admin' as TabType, active: activeTab === 'admin' })
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold text-gray-900">SLJ Chatbot</h1>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  item.active
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-3 mb-3">
              <img
                src={session?.user?.image || '/default-avatar.png'}
                alt="User avatar"
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              ログアウト
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-2xl font-semibold text-gray-900">
                {activeTab === 'overview' && 'ダッシュボード'}
                {activeTab === 'documents' && '資料管理'}
                {activeTab === 'chat' && 'AIチャット'}
                {activeTab === 'integrations' && '外部統合'}
                {activeTab === 'settings' && '設定'}
                {activeTab === 'admin' && '管理者'}
              </h2>
            </div>
            {activeTab === 'documents' && (
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="資料を検索..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  フィルタ
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  アップロード
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'overview' && <OverviewContent session={session} documents={documents} />}
          {activeTab === 'documents' && <DocumentManagement />}
          {activeTab === 'chat' && <ChatInterface documents={documents} />}
          {activeTab === 'integrations' && <IntegrationsManagement />}
          {activeTab === 'settings' && <SettingsContent />}
          {activeTab === 'admin' && session?.user?.role === 'admin' && (
            <AdminContent 
              adminActiveTab={adminActiveTab} 
              setAdminActiveTab={setAdminActiveTab} 
            />
          )}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

// Tab content components
function OverviewContent({ session, documents }: { session: any, documents: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {/* Welcome Card */}
      <Card className="md:col-span-2 lg:col-span-3 xl:col-span-4">
        <CardHeader>
          <CardTitle>ようこそ、{session?.user?.name}さん</CardTitle>
          <CardDescription>
            資料をアップロードして、AIチャットボットと対話を始めましょう
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{documents.length}</p>
              <p className="text-sm text-gray-600">アップロード済み資料</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">0</p>
              <p className="text-sm text-gray-600">チャット履歴</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">1</p>
              <p className="text-sm text-gray-600">アクティブユーザー</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">クイックアクション</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start" variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            新しい資料をアップロード
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            チャットを開始
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            外部サービス連携
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">最近のアクティビティ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>まだアクティビティがありません</p>
            <p className="text-sm">資料をアップロードするか、チャットを開始してください</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SettingsContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>外部サービス連携</CardTitle>
          <CardDescription>Google DriveやSlackなどの外部サービスと連携できます</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Google Drive</h3>
                <p className="text-sm text-gray-600">Google Driveから直接ファイルをインポート</p>
              </div>
              <Button variant="outline">連携する</Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Slack</h3>
                <p className="text-sm text-gray-600">Slackでチャット結果を共有</p>
              </div>
              <Button variant="outline">連携する</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AdminContent({ 
  adminActiveTab, 
  setAdminActiveTab 
}: { 
  adminActiveTab: 'dashboard' | 'users' | 'logs' | 'analytics';
  setAdminActiveTab: (tab: 'dashboard' | 'users' | 'logs' | 'analytics') => void;
}) {
  return (
    <div className="space-y-6">
      {/* Admin Navigation */}
      <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg">
        {[
          { id: 'dashboard', label: 'ダッシュボード' },
          { id: 'users', label: 'ユーザー管理' },
          { id: 'logs', label: '監査ログ' },
          { id: 'analytics', label: 'システム分析' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAdminActiveTab(tab.id as 'dashboard' | 'users' | 'logs' | 'analytics')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              adminActiveTab === tab.id
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Admin Content */}
      {adminActiveTab === 'dashboard' && (
        <Card>
          <CardHeader>
            <CardTitle>管理者ダッシュボード</CardTitle>
            <CardDescription>システム概要と主要指標</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">登録ユーザー</h3>
                <p className="text-2xl font-bold text-blue-600">42</p>
                <p className="text-sm text-gray-600">アクティブユーザー: 28</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">総ドキュメント数</h3>
                <p className="text-2xl font-bold text-green-600">156</p>
                <p className="text-sm text-gray-600">今月: +12</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">API使用量</h3>
                <p className="text-2xl font-bold text-purple-600">2,341</p>
                <p className="text-sm text-gray-600">今日のリクエスト</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {adminActiveTab === 'users' && <UserManagement />}
      {adminActiveTab === 'logs' && <AuditLogs />}
      {adminActiveTab === 'analytics' && <SystemAnalytics />}
    </div>
  )
}
