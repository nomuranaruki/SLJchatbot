import { google } from 'googleapis'

export class GoogleDriveService {
  private drive: any
  private auth: any

  constructor() {
    this.auth = new google.auth.GoogleAuth({
      credentials: process.env.NODE_ENV === 'development' ? {
        // 開発環境用のモック認証
        client_email: 'mock@example.com',
        private_key: 'mock-private-key'
      } : {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly']
    })

    this.drive = google.drive({ version: 'v3', auth: this.auth })
  }

  async listFiles(folderId?: string) {
    try {
      if (process.env.NODE_ENV === 'development') {
        // 開発環境用のモックデータ
        return {
          files: [
            {
              id: 'mock-file-1',
              name: 'Sample Document.pdf',
              mimeType: 'application/pdf',
              modifiedTime: new Date().toISOString(),
              size: '1024000',
              webViewLink: 'https://drive.google.com/file/d/mock-file-1/view'
            },
            {
              id: 'mock-file-2',
              name: 'Company Policy.docx',
              mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              modifiedTime: new Date().toISOString(),
              size: '2048000',
              webViewLink: 'https://drive.google.com/file/d/mock-file-2/view'
            }
          ]
        }
      }

      const response = await this.drive.files.list({
        q: folderId ? `'${folderId}' in parents` : undefined,
        fields: 'files(id,name,mimeType,modifiedTime,size,webViewLink)',
        pageSize: 100
      })

      return response.data
    } catch (error) {
      console.error('Google Drive API error:', error)
      throw new Error('Failed to fetch files from Google Drive')
    }
  }

  async downloadFile(fileId: string) {
    try {
      if (process.env.NODE_ENV === 'development') {
        // 開発環境用のモックレスポンス
        return {
          data: Buffer.from('Mock file content for development'),
          headers: {
            'content-type': 'application/pdf'
          }
        }
      }

      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      })

      return response
    } catch (error) {
      console.error('Google Drive download error:', error)
      throw new Error('Failed to download file from Google Drive')
    }
  }

  async getFileMetadata(fileId: string) {
    try {
      if (process.env.NODE_ENV === 'development') {
        return {
          id: fileId,
          name: 'Mock File.pdf',
          mimeType: 'application/pdf',
          size: '1024000',
          modifiedTime: new Date().toISOString()
        }
      }

      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id,name,mimeType,size,modifiedTime,webViewLink'
      })

      return response.data
    } catch (error) {
      console.error('Google Drive metadata error:', error)
      throw new Error('Failed to get file metadata from Google Drive')
    }
  }

  async syncDocuments(folderId?: string) {
    try {
      const files = await this.listFiles(folderId)
      const syncedDocuments = []

      for (const file of files.files || []) {
        // PDF、Word、PowerPointファイルのみを処理
        const supportedMimeTypes = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain'
        ]

        if (supportedMimeTypes.includes(file.mimeType)) {
          syncedDocuments.push({
            id: file.id,
            title: file.name,
            filename: file.name,
            mimeType: file.mimeType,
            size: parseInt(file.size || '0'),
            uploadedAt: new Date(file.modifiedTime),
            source: 'google_drive',
            metadata: {
              driveId: file.id,
              webViewLink: file.webViewLink
            }
          })
        }
      }

      return syncedDocuments
    } catch (error) {
      console.error('Google Drive sync error:', error)
      throw new Error('Failed to sync documents from Google Drive')
    }
  }
}

export const googleDriveService = new GoogleDriveService()
