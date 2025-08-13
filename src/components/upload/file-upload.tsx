'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'

interface FileUploadProps {
  onUploadComplete?: (file: UploadedFile) => void
  onUploadSuccess?: (file: UploadedFile) => void
}

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  url: string
  tags: string[]
  description: string
}

export default function FileUpload({ onUploadComplete, onUploadSuccess }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [fileMetadata, setFileMetadata] = useState({
    title: '',
    description: '',
    tags: ''
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0])
      setFileMetadata({
        title: acceptedFiles[0].name.split('.')[0],
        description: '',
        tags: ''
      })
      setIsDialogOpen(true)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt']
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024 // 50MB
  })

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('title', fileMetadata.title)
      formData.append('description', fileMetadata.description)
      formData.append('tags', fileMetadata.tags)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Upload response:', result) // デバッグログ
        
        const newFile: UploadedFile = {
          id: result.document.id,
          name: result.document.title,
          type: selectedFile.type,
          size: result.document.fileSize,
          url: `/uploads/${result.document.fileName}`,
          tags: result.document.tags || [],
          description: fileMetadata.description
        }

        setUploadedFiles(prev => [...prev, newFile])
        onUploadComplete?.(newFile)
        onUploadSuccess?.(newFile)
        
        // Slack通知を送信
        sendSlackNotification(newFile)
        
        setIsDialogOpen(false)
        setSelectedFile(null)
        setFileMetadata({ title: '', description: '', tags: '' })
        
        alert('ファイルが正常にアップロードされました！')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'ファイルのアップロードに失敗しました。'
      alert(`エラー: ${errorMessage}`)
    } finally {
      setUploading(false)
    }
  }

  const sendSlackNotification = async (file: UploadedFile) => {
    try {
      const documentInfo = {
        title: file.name,
        size: file.size,
        uploadedBy: 'ユーザー', // 実際の実装では認証されたユーザー名を使用
        mimeType: file.type,
        tags: file.tags
      }

      await fetch('/api/integrations/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'document-notification',
          channel: 'general', // デフォルトチャンネル
          data: documentInfo
        })
      })
    } catch (error) {
      console.error('Slack notification error:', error)
      // Slack通知の失敗はファイルアップロードに影響しないため、エラーは表示しない
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* ドラッグ&ドロップエリア */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            ファイルアップロード
          </CardTitle>
          <CardDescription>
            PDF、Word、PowerPoint、テキストファイルをドラッグ&ドロップするか、クリックして選択してください（最大50MB）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">ファイルをここにドロップしてください</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  ファイルをドラッグ&ドロップするか、<span className="text-blue-600 font-medium">クリックして選択</span>
                </p>
                <p className="text-sm text-gray-400">
                  対応形式: PDF, DOCX, PPTX, TXT（最大50MB）
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* アップロード済みファイル一覧 */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>アップロード済みファイル</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <File className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • {file.tags.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* メタデータ入力ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>ファイル情報を入力</DialogTitle>
            <DialogDescription>
              アップロードするファイルの詳細情報を入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                タイトル
              </label>
              <Input
                id="title"
                value={fileMetadata.title}
                onChange={(e) => setFileMetadata(prev => ({ ...prev, title: e.target.value }))}
                placeholder="ファイルのタイトルを入力"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                説明
              </label>
              <Textarea
                id="description"
                value={fileMetadata.description}
                onChange={(e) => setFileMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="ファイルの説明を入力"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="tags" className="text-sm font-medium">
                タグ（カンマ区切り）
              </label>
              <Input
                id="tags"
                value={fileMetadata.tags}
                onChange={(e) => setFileMetadata(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="例: 会議資料, 重要, 2024年"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !fileMetadata.title.trim()}>
              {uploading ? 'アップロード中...' : 'アップロード'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
