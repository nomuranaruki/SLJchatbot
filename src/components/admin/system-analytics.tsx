'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { 
  TrendingUp, 
  Users, 
  FileText, 
  MessageSquare, 
  Activity,
  Clock,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalUsers: number
    activeUsers: number
    totalDocuments: number
    totalChatSessions: number
    totalAPIRequests: number
    averageResponseTime: number
    systemUptime: number
    storageUsed: number
  }
  userActivity: Array<{
    date: string
    users: number
    sessions: number
    documents: number
  }>
  apiUsage: Array<{
    endpoint: string
    requests: number
    avgResponseTime: number
    errorRate: number
  }>
  documentTypes: Array<{
    type: string
    count: number
    percentage: number
  }>
  chatMetrics: {
    averageSessionLength: number
    averageMessagesPerSession: number
    mostAskedTopics: Array<{ topic: string; count: number }>
    userSatisfaction: number
  }
  performanceMetrics: Array<{
    timestamp: string
    cpuUsage: number
    memoryUsage: number
    responseTime: number
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function SystemAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState('overview')

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/analytics?type=${selectedMetric}&period=${selectedPeriod}`)
      if (response.ok) {
        const result = await response.json()
        setAnalyticsData(result.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedMetric, selectedPeriod])

  useEffect(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  const exportReport = async () => {
    try {
      const response = await fetch('/api/admin/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export-report', data: { period: selectedPeriod } })
      })

      if (response.ok) {
        const result = await response.json()
        // In a real implementation, this would download the report
        alert('レポートを生成しました')
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      alert('レポートの生成に失敗しました')
    }
  }

  const runHealthCheck = async () => {
    try {
      const response = await fetch('/api/admin/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'system-health-check' })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`システムヘルスチェック完了: ${result.health.overallStatus}`)
      }
    } catch (error) {
      console.error('Error running health check:', error)
      alert('ヘルスチェックに失敗しました')
    }
  }

  if (isLoading || !analyticsData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">システム分析</h2>
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="1d">過去24時間</option>
            <option value="7d">過去7日</option>
            <option value="30d">過去30日</option>
          </select>
          <Button onClick={fetchAnalyticsData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            レポート出力
          </Button>
          <Button onClick={runHealthCheck}>
            <Activity className="h-4 w-4 mr-2" />
            ヘルスチェック
          </Button>
        </div>
      </div>

      {/* 概要統計 */}
      {analyticsData.overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
              <Users className="h-4 w-4 text-blue-600 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.totalUsers}</div>
              <p className="text-xs text-green-600">
                アクティブ: {analyticsData.overview.activeUsers}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総ドキュメント数</CardTitle>
              <FileText className="h-4 w-4 text-green-600 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.totalDocuments}</div>
              <p className="text-xs text-gray-600">
                ストレージ: {analyticsData.overview.storageUsed}GB
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">チャットセッション</CardTitle>
              <MessageSquare className="h-4 w-4 text-purple-600 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.totalChatSessions}</div>
              <p className="text-xs text-gray-600">平均応答時間: {analyticsData.overview.averageResponseTime}ms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">システム稼働率</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.systemUptime}%</div>
              <p className="text-xs text-green-600">正常稼働中</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ユーザーアクティビティチャート */}
      {analyticsData.userActivity && (
        <Card>
          <CardHeader>
            <CardTitle>ユーザーアクティビティ推移</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.userActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="users" stackId="1" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="sessions" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                <Area type="monotone" dataKey="documents" stackId="1" stroke="#ffc658" fill="#ffc658" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API使用状況 */}
        {analyticsData.apiUsage && (
          <Card>
            <CardHeader>
              <CardTitle>API使用状況</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.apiUsage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="endpoint" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="requests" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* ドキュメントタイプ分布 */}
        {analyticsData.documentTypes && (
          <Card>
            <CardHeader>
              <CardTitle>ドキュメントタイプ分布</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.documentTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percentage }) => `${type} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analyticsData.documentTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* チャット分析 */}
      {analyticsData.chatMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>チャット分析</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">チャット統計</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">平均セッション時間</span>
                    <span className="font-medium">{analyticsData.chatMetrics.averageSessionLength}分</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">平均メッセージ数</span>
                    <span className="font-medium">{analyticsData.chatMetrics.averageMessagesPerSession}件</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">ユーザー満足度</span>
                    <span className="font-medium">{analyticsData.chatMetrics.userSatisfaction}/5.0</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <h4 className="font-medium mb-4">よく聞かれるトピック</h4>
                <div className="space-y-2">
                  {analyticsData.chatMetrics.mostAskedTopics.map((topic, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{topic.topic}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${(topic.count / analyticsData.chatMetrics.mostAskedTopics[0].count) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-8">{topic.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* パフォーマンス監視 */}
      {analyticsData.performanceMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>システムパフォーマンス</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.performanceMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(time) => new Date(time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(time) => new Date(time).toLocaleString('ja-JP')}
                />
                <Line type="monotone" dataKey="cpuUsage" stroke="#8884d8" name="CPU使用率%" />
                <Line type="monotone" dataKey="memoryUsage" stroke="#82ca9d" name="メモリ使用率%" />
                <Line type="monotone" dataKey="responseTime" stroke="#ffc658" name="応答時間(ms)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
