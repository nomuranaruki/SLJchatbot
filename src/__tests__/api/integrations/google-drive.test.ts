import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/integrations/google-drive/route'

// Mock Google Drive service
jest.mock('@/lib/google-drive', () => ({
  googleDriveService: {
    listFiles: jest.fn(),
    syncDocuments: jest.fn(),
    downloadFile: jest.fn(),
    getFileMetadata: jest.fn()
  }
}))

describe('/api/integrations/google-drive', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('lists Google Drive files successfully', async () => {
      const { googleDriveService } = require('@/lib/google-drive')
      const mockFiles = [
        {
          id: 'file1',
          name: 'Test Document.pdf',
          mimeType: 'application/pdf'
        }
      ]

      googleDriveService.listFiles.mockResolvedValue({ files: mockFiles })

      const request = new NextRequest('http://localhost:3000/api/integrations/google-drive?action=list')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.files).toEqual(mockFiles)
    })

    it('syncs documents successfully', async () => {
      const { googleDriveService } = require('@/lib/google-drive')
      const mockDocuments = [
        {
          id: 'doc1',
          title: 'Synced Document',
          source: 'google_drive'
        }
      ]

      googleDriveService.syncDocuments.mockResolvedValue(mockDocuments)

      const request = new NextRequest('http://localhost:3000/api/integrations/google-drive?action=sync')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.documents).toEqual(mockDocuments)
      expect(data.count).toBe(1)
    })

    it('handles invalid action parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/integrations/google-drive?action=invalid')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid action parameter')
    })
  })

  describe('POST', () => {
    it('downloads file successfully', async () => {
      const { googleDriveService } = require('@/lib/google-drive')
      
      googleDriveService.downloadFile.mockResolvedValue({
        data: Buffer.from('mock file content')
      })
      googleDriveService.getFileMetadata.mockResolvedValue({
        id: 'file1',
        name: 'Test Document.pdf',
        mimeType: 'application/pdf'
      })

      const request = new NextRequest('http://localhost:3000/api/integrations/google-drive', {
        method: 'POST',
        body: JSON.stringify({ fileId: 'file1', action: 'download' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.metadata.id).toBe('file1')
    })

    it('imports file successfully', async () => {
      const { googleDriveService } = require('@/lib/google-drive')
      
      googleDriveService.downloadFile.mockResolvedValue({
        data: Buffer.from('mock file content')
      })
      googleDriveService.getFileMetadata.mockResolvedValue({
        id: 'file1',
        name: 'Imported Document.pdf',
        mimeType: 'application/pdf',
        size: '1024000'
      })

      const request = new NextRequest('http://localhost:3000/api/integrations/google-drive', {
        method: 'POST',
        body: JSON.stringify({ fileId: 'file1', action: 'import' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.document.title).toBe('Imported Document.pdf')
      expect(data.message).toBe('Document imported successfully from Google Drive')
    })

    it('handles missing fileId', async () => {
      const request = new NextRequest('http://localhost:3000/api/integrations/google-drive', {
        method: 'POST',
        body: JSON.stringify({ action: 'download' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('File ID is required')
    })
  })
})
