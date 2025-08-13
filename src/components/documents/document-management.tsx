'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Search, Upload, Download, Eye, Tag, User, Calendar } from 'lucide-react'
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
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getMimeTypeIcon(document.mimeType)}</span>
                      <div>
                        <h3 className="text-lg font-semibold">{document.title}</h3>
                        <p className="text-sm text-gray-600">{document.fileName}</p>
                      </div>
                    </div>

                    {document.description && (
                      <p className="text-gray-700">{document.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {document.user.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(document.uploadedAt).toLocaleDateString('ja-JP')}
                      </div>
                      <span>{formatFileSize(document.fileSize)}</span>
                    </div>

                    {document.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {document.tags.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {document.extractedText && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">抽出されたテキスト (プレビュー):</p>
                        <p className="text-sm">{document.extractedText}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      プレビュー
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      ダウンロード
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
