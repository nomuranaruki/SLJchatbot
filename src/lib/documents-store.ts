import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

interface DocumentMetadata {
  id: string
  title: string
  description: string
  fileName: string
  originalFileName: string
  filePath: string
  fileSize: number
  mimeType: string
  extractedText: string
  tags: string[]
  uploadedBy: string
  uploadedAt: string
  version: number
  isActive: boolean
}

const DOCUMENTS_DB_PATH = join(process.cwd(), 'uploads', 'documents.json')

// Ensure documents.json exists
async function ensureDocumentsDB() {
  if (!existsSync(DOCUMENTS_DB_PATH)) {
    await writeFile(DOCUMENTS_DB_PATH, JSON.stringify([]))
  }
}

// Save document metadata
export async function saveDocument(documentData: DocumentMetadata): Promise<DocumentMetadata> {
  await ensureDocumentsDB()
  
  const documentsJson = await readFile(DOCUMENTS_DB_PATH, 'utf-8')
  const documents: DocumentMetadata[] = JSON.parse(documentsJson)
  
  // Add new document
  documents.push(documentData)
  
  await writeFile(DOCUMENTS_DB_PATH, JSON.stringify(documents, null, 2))
  
  return documentData
}

// Get all documents with filtering
export async function getDocuments(
  query?: string,
  tags?: string[],
  limit = 20,
  offset = 0
): Promise<{ documents: DocumentMetadata[], total: number, hasMore: boolean }> {
  await ensureDocumentsDB()
  
  const documentsJson = await readFile(DOCUMENTS_DB_PATH, 'utf-8')
  let documents: DocumentMetadata[] = JSON.parse(documentsJson)
  
  // Filter by active status
  documents = documents.filter(doc => doc.isActive)
  
  // Filter by search query
  if (query) {
    const searchLower = query.toLowerCase()
    documents = documents.filter(doc => 
      doc.title.toLowerCase().includes(searchLower) ||
      doc.description.toLowerCase().includes(searchLower) ||
      doc.extractedText.toLowerCase().includes(searchLower) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchLower))
    )
  }
  
  // Filter by tags
  if (tags && tags.length > 0) {
    documents = documents.filter(doc =>
      tags.some(tag => doc.tags.includes(tag))
    )
  }
  
  // Sort by upload date (newest first)
  documents.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
  
  const total = documents.length
  const paginatedDocuments = documents.slice(offset, offset + limit)
  const hasMore = offset + limit < total
  
  return {
    documents: paginatedDocuments,
    total,
    hasMore
  }
}

// Get document by ID
export async function getDocumentById(id: string): Promise<DocumentMetadata | null> {
  await ensureDocumentsDB()
  
  const documentsJson = await readFile(DOCUMENTS_DB_PATH, 'utf-8')
  const documents: DocumentMetadata[] = JSON.parse(documentsJson)
  
  return documents.find(doc => doc.id === id && doc.isActive) || null
}

// Delete document (soft delete)
export async function deleteDocument(id: string): Promise<boolean> {
  await ensureDocumentsDB()
  
  const documentsJson = await readFile(DOCUMENTS_DB_PATH, 'utf-8')
  const documents: DocumentMetadata[] = JSON.parse(documentsJson)
  
  const docIndex = documents.findIndex(doc => doc.id === id)
  if (docIndex === -1) return false
  
  documents[docIndex].isActive = false
  
  await writeFile(DOCUMENTS_DB_PATH, JSON.stringify(documents, null, 2))
  
  return true
}
