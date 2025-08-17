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

// Enhanced search with relevance scoring
interface SearchResult {
  document: DocumentMetadata
  relevanceScore: number
  matchType: 'title' | 'description' | 'content' | 'tags'
  matchedText?: string
}

export async function searchDocuments(
  query: string,
  limit = 10
): Promise<SearchResult[]> {
  await ensureDocumentsDB()
  
  const documentsJson = await readFile(DOCUMENTS_DB_PATH, 'utf-8')
  let documents: DocumentMetadata[] = JSON.parse(documentsJson)
  
  // Filter by active status
  documents = documents.filter(doc => doc.isActive)
  
  if (!query || query.trim().length === 0) {
    return documents.slice(0, limit).map(doc => ({
      document: doc,
      relevanceScore: 0,
      matchType: 'content' as const
    }))
  }
  
  const searchLower = query.toLowerCase()
  
  // Enhanced search terms extraction for Japanese and English
  let searchTerms: string[] = []
  
  // Split by spaces for English words
  const spaceTerms = searchLower.split(/\s+/).filter(term => term.length > 1)
  searchTerms.push(...spaceTerms)
  
  // For Japanese text, extract meaningful terms
  // Extract single characters and 2-4 character combinations
  if (/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(searchLower)) {
    // Extract individual kanji/hiragana/katakana
    const japaneseChars = searchLower.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g) || []
    searchTerms.push(...japaneseChars)
    
    // Extract 2-4 character combinations
    for (let i = 0; i < searchLower.length - 1; i++) {
      if (/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(searchLower[i])) {
        for (let len = 2; len <= Math.min(4, searchLower.length - i); len++) {
          const term = searchLower.substr(i, len)
          if (/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(term)) {
            searchTerms.push(term)
          }
        }
      }
    }
  }
  
  // Remove duplicates and short terms
  searchTerms = [...new Set(searchTerms)].filter(term => term.length > 0)
  
  const results: SearchResult[] = []
  
  for (const doc of documents) {
    let totalScore = 0
    let bestMatchType: 'title' | 'description' | 'content' | 'tags' = 'content'
    let matchedText = ''
    
    // Title matching (highest weight)
    const titleScore = calculateMatchScore(doc.title, searchTerms)
    if (titleScore > 0) {
      totalScore += titleScore * 10
      bestMatchType = 'title'
      matchedText = doc.title
    }
    
    // Description matching
    const descriptionScore = calculateMatchScore(doc.description, searchTerms)
    if (descriptionScore > 0) {
      totalScore += descriptionScore * 5
      if (bestMatchType === 'content') {
        bestMatchType = 'description'
        matchedText = doc.description
      }
    }
    
    // Tags matching
    const tagsText = doc.tags.join(' ')
    const tagsScore = calculateMatchScore(tagsText, searchTerms)
    if (tagsScore > 0) {
      totalScore += tagsScore * 8
      if (bestMatchType === 'content') {
        bestMatchType = 'tags'
        matchedText = tagsText
      }
    }
    
    // Content matching (lower weight but more comprehensive)
    if (doc.extractedText && doc.extractedText.length > 0) {
      const contentScore = calculateMatchScore(doc.extractedText, searchTerms)
      if (contentScore > 0) {
        totalScore += contentScore * 2
        if (bestMatchType === 'content') {
          // Find the best matching snippet
          const snippet = findBestSnippet(doc.extractedText, searchTerms)
          matchedText = snippet
        }
      }
    }
    
    if (totalScore > 0) {
      results.push({
        document: doc,
        relevanceScore: totalScore,
        matchType: bestMatchType,
        matchedText
      })
    }
  }
  
  // Sort by relevance score (highest first)
  results.sort((a, b) => b.relevanceScore - a.relevanceScore)
  
  return results.slice(0, limit)
}

// Calculate match score for text against search terms
function calculateMatchScore(text: string, searchTerms: string[]): number {
  if (!text) return 0
  
  const textLower = text.toLowerCase()
  let score = 0
  
  for (const term of searchTerms) {
    if (term.length === 0) continue
    
    // Use simple includes for Japanese characters, regex for English
    let occurrences = 0
    
    if (/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(term)) {
      // Japanese term - use simple includes matching
      let startIndex = 0
      while ((startIndex = textLower.indexOf(term, startIndex)) !== -1) {
        occurrences++
        startIndex += term.length
      }
    } else {
      // English term - use regex
      const matches = textLower.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))
      occurrences = matches ? matches.length : 0
    }
    
    if (occurrences > 0) {
      // Base score for match
      score += occurrences
      
      // Bonus for longer terms (more specific)
      score += term.length * 0.1
      
      // Bonus for word boundaries (English only)
      if (!/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(term)) {
        const wordMatch = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
        const exactMatches = (textLower.match(wordMatch) || []).length
        score += exactMatches * 2
      }
    }
  }
  
  return score
}

// Find the best snippet containing search terms
function findBestSnippet(text: string, searchTerms: string[], maxLength = 200): string {
  const textLower = text.toLowerCase()
  let bestSnippet = ''
  let bestScore = 0
  
  const sentences = text.split(/[.!?。！？]\s+/)
  
  for (let i = 0; i < sentences.length; i++) {
    let snippet = sentences[i]
    
    // Try to include surrounding sentences for context
    if (i > 0) snippet = sentences[i - 1] + ' ' + snippet
    if (i < sentences.length - 1) snippet = snippet + ' ' + sentences[i + 1]
    
    if (snippet.length > maxLength) {
      snippet = snippet.substring(0, maxLength) + '...'
    }
    
    const score = calculateMatchScore(snippet, searchTerms)
    if (score > bestScore) {
      bestScore = score
      bestSnippet = snippet
    }
  }
  
  return bestSnippet || text.substring(0, maxLength) + (text.length > maxLength ? '...' : '')
}

// Get all documents (for debugging)
export async function getAllDocuments(): Promise<DocumentMetadata[]> {
  await ensureDocumentsDB()
  
  const documentsJson = await readFile(DOCUMENTS_DB_PATH, 'utf-8')
  const documents: DocumentMetadata[] = JSON.parse(documentsJson)
  
  return documents.filter(doc => doc.isActive)
}
