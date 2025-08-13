import { NextRequest, NextResponse } from 'next/server'
import { googleDriveService } from '@/lib/google-drive'
import { envConfig, createMockResponse } from '@/lib/env'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const folderId = searchParams.get('folderId')

    // 開発環境でGoogle Drive APIが設定されていない場合のモック
    if (!envConfig.google.isValid && process.env.NODE_ENV === 'development') {
      switch (action) {
        case 'list':
          return NextResponse.json(createMockResponse({ 
            success: true, 
            files: [
              { id: 'mock-file-1', name: 'Mock Document 1.pdf', mimeType: 'application/pdf' },
              { id: 'mock-file-2', name: 'Mock Document 2.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
            ] 
          }, 'Google Drive'))

        case 'sync':
          return NextResponse.json(createMockResponse({ 
            success: true, 
            documents: [
              { id: 'mock-doc-1', title: 'Mock Document 1', content: 'This is mock content for development' }
            ],
            count: 1
          }, 'Google Drive'))

        default:
          return NextResponse.json(
            { error: 'Invalid action parameter' },
            { status: 400 }
          )
      }
    }

    switch (action) {
      case 'list':
        const files = await googleDriveService.listFiles(folderId || undefined)
        return NextResponse.json({ 
          success: true, 
          files: files.files || [] 
        })

      case 'sync':
        const syncedDocuments = await googleDriveService.syncDocuments(folderId || undefined)
        return NextResponse.json({ 
          success: true, 
          documents: syncedDocuments,
          count: syncedDocuments.length
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Google Drive API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fileId, action } = await request.json()

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'download':
        const fileData = await googleDriveService.downloadFile(fileId)
        const metadata = await googleDriveService.getFileMetadata(fileId)
        
        return NextResponse.json({
          success: true,
          metadata,
          content: process.env.NODE_ENV === 'development' 
            ? 'Mock file content' 
            : fileData.data.toString('base64')
        })

      case 'metadata':
        const fileMetadata = await googleDriveService.getFileMetadata(fileId)
        return NextResponse.json({
          success: true,
          metadata: fileMetadata
        })

      case 'import':
        // ファイルをダウンロードして、ローカルドキュメントとして保存
        const downloadedFile = await googleDriveService.downloadFile(fileId)
        const fileInfo = await googleDriveService.getFileMetadata(fileId)
        
        // 実際の実装では、ここでPrismaを使ってドキュメントをデータベースに保存
        const mockDocument = {
          id: `imported-${fileId}`,
          title: fileInfo.name,
          filename: fileInfo.name,
          mimeType: fileInfo.mimeType,
          size: parseInt(fileInfo.size || '0'),
          content: process.env.NODE_ENV === 'development' 
            ? 'Imported mock content from Google Drive' 
            : 'Extracted content would be here',
          tags: ['imported', 'google-drive'],
          source: 'google_drive',
          uploadedAt: new Date(),
          updatedAt: new Date()
        }

        return NextResponse.json({
          success: true,
          document: mockDocument,
          message: 'Document imported successfully from Google Drive'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Google Drive POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
