'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Search, Upload, Download, Eye, Tag, User, Calendar, Trash2, AlertCircle, RefreshCw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import FileUpload from '@/components/upload/file-upload'
import DemoBanner from '@/components/ui/demo-banner'

interface Document {
  id: string
  title: string
  description: string
  fileName: string
  fileSize: number
  mimeType: string
  uploadedAt: Date
  tags: string[]
  user: {
    name: string
    email: string
  }
  extractedText?: string
}

export default function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null)
  const [reprocessingDocumentId, setReprocessingDocumentId] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','))
      
      const response = await fetch(`/api/documents?${params}`)
      if (response.ok) {
        const result = await response.json()
        setDocuments(result.documents)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, selectedTags])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getMimeTypeIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word')) return '📝'
    if (mimeType.includes('presentation')) return '📊'
    return '📁'
  }

  const getAllTags = () => {
    const allTags = documents.flatMap(doc => doc.tags)
    return Array.from(new Set(allTags))
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleUploadSuccess = (uploadedDocument: any) => {
    setIsUploadOpen(false)
    fetchDocuments() // Refresh the document list
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('このドキュメントを削除してもよろしいですか？この操作は元に戻せません。')) {
      return
    }

    try {
      setDeletingDocumentId(documentId)
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove document from state
        setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      } else {
        alert('ドキュメントの削除に失敗しました')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('ドキュメントの削除中にエラーが発生しました')
    } finally {
      setDeletingDocumentId(null)
    }
  }

  const handleReprocessDocument = async (documentId: string) => {
    try {
      setReprocessingDocumentId(documentId)
      const response = await fetch('/api/documents/reprocess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ documentId })
      })

      if (response.ok) {
        const result = await response.json()
        // Update the document in state
        setDocuments(prev => prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, extractedText: result.document.extractedText }
            : doc
        ))
        alert('ドキュメントの再処理が完了しました')
      } else {
        const error = await response.json()
        alert(`再処理に失敗しました: ${error.error}`)
      }
    } catch (error) {
      console.error('Error reprocessing document:', error)
      alert('ドキュメントの再処理中にエラーが発生しました')
    } finally {
      setReprocessingDocumentId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">ドキュメント管理</h1>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              ファイルをアップロード
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>ファイルアップロード</DialogTitle>
            </DialogHeader>
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* 検索とフィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            検索・フィルター
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="タイトル、内容、説明で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button onClick={fetchDocuments}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* タグフィルター */}
            {getAllTags().length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">タグで絞り込み:</p>
                <div className="flex flex-wrap gap-2">
                  {getAllTags().map(tag => (
                    <Button
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleTag(tag)}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ドキュメント一覧 */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">読み込み中...</p>
            </CardContent>
          </Card>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">
                {searchQuery || selectedTags.length > 0 
                  ? '検索条件に一致するドキュメントが見つかりません' 
                  : 'まだドキュメントがアップロードされていません'}
              </p>
              {!searchQuery && selectedTags.length === 0 && (
                <Button onClick={() => setIsUploadOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  最初のファイルをアップロード
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          documents.map(document => (
            <Card key={document.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getMimeTypeIcon(document.mimeType)}</span>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{document.title}</h3>
                        <p className="text-sm text-gray-600 font-medium">{document.fileName}</p>
                        <p className="text-xs text-gray-500">{document.mimeType}</p>
                      </div>
                    </div>

                    {document.description && (
                      <div className="bg-blue-50 p-3 rounded-lg border-l-2 border-blue-300">
                        <p className="text-sm text-gray-700 font-medium">説明:</p>
                        <p className="text-gray-800">{document.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">アップロード者:</span>
                        <span>{document.user.name}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <span className="font-medium">アップロード日:</span>
                        <span>{new Date(document.uploadedAt).toLocaleDateString('ja-JP')}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">ファイルサイズ:</span>
                        <span>{formatFileSize(document.fileSize)}</span>
                      </div>
                    </div>

                    {document.tags.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">タグ:</p>
                        <div className="flex flex-wrap gap-2">
                          {document.tags.map(tag => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 抽出されたテキストの状態表示 */}
                    {document.extractedText && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">テキスト抽出状態:</p>
                        {document.extractedText.includes('requires pdf-parse library') ? (
                          <div className="bg-yellow-50 p-3 rounded-lg border-l-2 border-yellow-300">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm text-yellow-800 font-medium">内容抽出未完了</span>
                            </div>
                            <p className="text-xs text-yellow-700 mt-1">
                              このドキュメントの内容はまだ抽出されていません。「再処理」ボタンをクリックして内容を抽出してください。
                            </p>
                          </div>
                        ) : (
                          <div className="bg-green-50 p-3 rounded-lg border-l-2 border-green-300">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-800 font-medium">内容抽出完了</span>
                            </div>
                            <p className="text-xs text-green-700 mt-1">
                              {document.extractedText.length > 100 
                                ? `${document.extractedText.substring(0, 100)}...` 
                                : document.extractedText}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-6">
                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-300 hover:bg-blue-50">
                      <Eye className="h-4 w-4 mr-1" />
                      プレビュー
                    </Button>
                    <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50">
                      <Download className="h-4 w-4 mr-1" />
                      ダウンロード
                    </Button>
                    {/* 再処理ボタン - PDFの内容抽出に失敗している場合のみ表示 */}
                    {document.extractedText && document.extractedText.includes('requires pdf-parse library') && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                        onClick={() => handleReprocessDocument(document.id)}
                        disabled={reprocessingDocumentId === document.id}
                      >
                        {reprocessingDocumentId === document.id ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-1 border-2 border-orange-600 border-t-transparent rounded-full"></div>
                            再処理中...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            再処理
                          </>
                        )}
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => handleDeleteDocument(document.id)}
                      disabled={deletingDocumentId === document.id}
                    >
                      {deletingDocumentId === document.id ? (
                        <>
                          <div className="animate-spin h-4 w-4 mr-1 border-2 border-red-600 border-t-transparent rounded-full"></div>
                          削除中...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-1" />
                          削除
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
