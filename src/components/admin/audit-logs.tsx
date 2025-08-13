'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  FileText,
  MessageSquare,
  Upload,
  Download,
  User,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Eye
} from 'lucide-react'

interface AuditLog {
  id: string
  timestamp: string
  userId: string
  userName: string
  action: string
  resource: string
  resourceId: string
  details: string
  ipAddress: string
  userAgent: string
  status: 'SUCCESS' | 'FAILED'
}

interface AuditStats {
  totalEvents: number
  successfulEvents: number
  failedEvents: number
  uniqueUsers: number
  topActions: Array<{ action: string; count: number }>
  recentActivity: AuditLog[]
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // fetchAuditLogs関数をuseCallbackで最適化
  const fetchAuditLogs = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // paginationが正しく初期化されているかチェック
      if (!pagination || typeof pagination.page !== 'number') {
        console.warn('Pagination not properly initialized in AuditLogs')
        return
      }
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(actionFilter && { action: actionFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(userFilter && { userId: userFilter }),
        ...(dateFromFilter && { dateFrom: dateFromFilter }),
        ...(dateToFilter && { dateTo: dateToFilter })
      })

      const response = await fetch(`/api/admin/audit-logs?${params}`)
      if (response.ok) {
        const result = await response.json()
        setLogs(result.logs)
        setPagination(result.pagination)
        setStats(result.stats)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setIsLoading(false)
    }
  }, [pagination, actionFilter, statusFilter, userFilter, dateFromFilter, dateToFilter])

  // 初回マウント時にログを取得
  useEffect(() => {
    fetchAuditLogs()
  }, [fetchAuditLogs])

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'DOCUMENT_UPLOAD':
        return <Upload className="h-4 w-4 text-blue-600" />
      case 'DOCUMENT_DELETE':
        return <FileText className="h-4 w-4 text-red-600" />
      case 'CHAT_SESSION':
        return <MessageSquare className="h-4 w-4 text-green-600" />
      case 'LOGIN_ATTEMPT':
        return <User className="h-4 w-4 text-purple-600" />
      case 'USER_ROLE_CHANGE':
        return <Shield className="h-4 w-4 text-orange-600" />
      case 'GOOGLE_DRIVE_SYNC':
        return <Download className="h-4 w-4 text-indigo-600" />
      case 'SLACK_NOTIFICATION':
        return <MessageSquare className="h-4 w-4 text-pink-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      'DOCUMENT_UPLOAD': 'ドキュメントアップロード',
      'DOCUMENT_DELETE': 'ドキュメント削除',
      'CHAT_SESSION': 'チャットセッション',
      'LOGIN_ATTEMPT': 'ログイン試行',
      'USER_ROLE_CHANGE': 'ユーザーロール変更',
      'GOOGLE_DRIVE_SYNC': 'Google Drive同期',
      'SLACK_NOTIFICATION': 'Slack通知'
    }
    return labels[action] || action
  }

  const getStatusIcon = (status: string) => {
    return status === 'SUCCESS' ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const exportLogs = async () => {
    try {
      // In a real implementation, this would generate and download a CSV/Excel file
      const exportData = logs.map(log => ({
        日時: formatDate(log.timestamp),
        ユーザー: log.userName,
        アクション: getActionLabel(log.action),
        リソース: log.resource,
        詳細: log.details,
        ステータス: log.status,
        IPアドレス: log.ipAddress
      }))

      const csvContent = [
        Object.keys(exportData[0]).join(','),
        ...exportData.map(row => Object.values(row).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting logs:', error)
      alert('ログのエクスポートに失敗しました')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">システム監査ログ</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchAuditLogs} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>
          <Button onClick={exportLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            エクスポート
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総イベント数</CardTitle>
              <Activity className="h-4 w-4 text-blue-600 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">成功</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successfulEvents}</div>
              <p className="text-xs text-gray-600">
                {((stats.successfulEvents / stats.totalEvents) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">失敗</CardTitle>
              <XCircle className="h-4 w-4 text-red-600 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failedEvents}</div>
              <p className="text-xs text-gray-600">
                {((stats.failedEvents / stats.totalEvents) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ユニークユーザー</CardTitle>
              <User className="h-4 w-4 text-purple-600 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* トップアクション */}
      {stats?.topActions && (
        <Card>
          <CardHeader>
            <CardTitle>よく実行されるアクション</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topActions.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getActionIcon(item.action)}
                    <span className="text-sm">{getActionLabel(item.action)}</span>
                  </div>
                  <span className="text-sm font-medium">{item.count}回</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle>フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium">アクション</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="">すべて</option>
                <option value="DOCUMENT_UPLOAD">ドキュメントアップロード</option>
                <option value="CHAT_SESSION">チャットセッション</option>
                <option value="LOGIN_ATTEMPT">ログイン試行</option>
                <option value="USER_ROLE_CHANGE">ロール変更</option>
                <option value="GOOGLE_DRIVE_SYNC">Google Drive同期</option>
                <option value="SLACK_NOTIFICATION">Slack通知</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">ステータス</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="">すべて</option>
                <option value="SUCCESS">成功</option>
                <option value="FAILED">失敗</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">開始日時</label>
              <Input
                type="datetime-local"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">終了日時</label>
              <Input
                type="datetime-local"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline"
                onClick={() => {
                  setActionFilter('')
                  setStatusFilter('')
                  setUserFilter('')
                  setDateFromFilter('')
                  setDateToFilter('')
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                リセット
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ログテーブル */}
      <Card>
        <CardHeader>
          <CardTitle>監査ログ</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">日時</th>
                    <th className="text-left p-2">ユーザー</th>
                    <th className="text-left p-2">アクション</th>
                    <th className="text-left p-2">詳細</th>
                    <th className="text-left p-2">ステータス</th>
                    <th className="text-left p-2">IPアドレス</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 text-sm">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          <p className="font-medium">{log.userName}</p>
                          <p className="text-gray-600">{log.userId}</p>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center space-x-2">
                          {getActionIcon(log.action)}
                          <span className="text-sm">{getActionLabel(log.action)}</span>
                        </div>
                      </td>
                      <td className="p-2 text-sm">
                        <div className="max-w-md">
                          <p>{log.details}</p>
                          {log.resourceId && (
                            <p className="text-gray-600">ID: {log.resourceId}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(log.status)}
                          <span className={`text-sm ${
                            log.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {log.status === 'SUCCESS' ? '成功' : '失敗'}
                          </span>
                        </div>
                      </td>
                      <td className="p-2 text-sm text-gray-600">
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ページネーション */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                {pagination.total}件中 {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  前へ
                </Button>
                <span className="text-sm">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                >
                  次へ
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
