'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Activity, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  UserPlus
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive'
  image: string
  createdAt: string
  lastLogin: string
  documentsCount: number
  chatSessionsCount: number
}

interface UserStats {
  totalUsers: number
  activeUsers: number
  adminUsers: number
  regularUsers: number
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // fetchUsers関数をuseCallbackで最適化
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // paginationが正しく初期化されているかチェック
      if (!pagination || typeof pagination.page !== 'number' || pagination.page < 1) {
        setIsLoading(false)
        return
      }
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter })
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const result = await response.json()
        setUsers(result.users)
        setPagination(result.pagination)
        setUserStats(result.stats)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }, [pagination, searchQuery, roleFilter, statusFilter])

  // 初回マウント時にユーザーを取得
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates })
      })

      if (response.ok) {
        fetchUsers()
        setIsEditDialogOpen(false)
        setSelectedUser(null)
        alert('ユーザーが正常に更新されました')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('ユーザーの更新に失敗しました')
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('このユーザーを削除してもよろしいですか？')) return

    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchUsers()
        alert('ユーザーが正常に削除されました')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('ユーザーの削除に失敗しました')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'text-purple-600 bg-purple-100' : 'text-blue-600 bg-blue-100'
  }

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">ユーザー管理</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchUsers} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            エクスポート
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
              <Users className="h-4 w-4 text-blue-600 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">アクティブユーザー</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.activeUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">管理者</CardTitle>
              <Shield className="h-4 w-4 text-purple-600 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.adminUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">一般ユーザー</CardTitle>
              <Users className="h-4 w-4 text-gray-600 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.regularUsers}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* フィルターと検索 */}
      <Card>
        <CardHeader>
          <CardTitle>フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">検索</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="名前またはメールで検索"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">ロール</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="">すべて</option>
                <option value="admin">管理者</option>
                <option value="user">ユーザー</option>
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
                <option value="active">アクティブ</option>
                <option value="inactive">非アクティブ</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('')
                  setRoleFilter('')
                  setStatusFilter('')
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                リセット
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ユーザーテーブル */}
      <Card>
        <CardHeader>
          <CardTitle>ユーザー一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">ユーザー</th>
                    <th className="text-left p-2">ロール</th>
                    <th className="text-left p-2">ステータス</th>
                    <th className="text-left p-2">最終ログイン</th>
                    <th className="text-left p-2">アクティビティ</th>
                    <th className="text-left p-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div className="flex items-center space-x-3">
                          <img
                            src={user.image}
                            alt={user.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role === 'admin' ? '管理者' : 'ユーザー'}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {user.status === 'active' ? 'アクティブ' : '非アクティブ'}
                        </span>
                      </td>
                      <td className="p-2 text-sm text-gray-600">
                        {formatDate(user.lastLogin)}
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          <p>{user.documentsCount}件の資料</p>
                          <p>{user.chatSessionsCount}回のチャット</p>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteUser(user.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
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

      {/* ユーザー編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ユーザー編集</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedUser.image}
                  alt={selectedUser.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">ロール</label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as 'admin' | 'user' })}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="user">ユーザー</option>
                  <option value="admin">管理者</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">ステータス</label>
                <select
                  value={selectedUser.status}
                  onChange={(e) => setSelectedUser({ ...selectedUser, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="active">アクティブ</option>
                  <option value="inactive">非アクティブ</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={() => updateUser(selectedUser.id, { 
                  role: selectedUser.role, 
                  status: selectedUser.status 
                })}>
                  更新
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
