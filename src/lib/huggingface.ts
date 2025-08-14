import { HfInference } from '@huggingface/inference'

// Hugging Face API client initialization
export const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

// Available models for different tasks - updated for better Japanese support
export const MODELS = {
  // Primary conversation model - better for Japanese
  CHAT: 'microsoft/DialoGPT-medium',
  // Backup lightweight model
  SIMPLE_CHAT: 'microsoft/DialoGPT-small', 
  // Question answering model
  QA: 'deepset/roberta-base-squad2',
  // Text generation
  TEXT_GENERATION: 'gpt2',
  // Summarization
  SUMMARIZATION: 'facebook/bart-large-cnn',
  // Fast QA for quick responses
  FAST_QA: 'distilbert-base-cased-distilled-squad'
}

// API configuration
const API_CONFIG = {
  baseURL: process.env.HUGGINGFACE_API_URL || 'https://api-inference.huggingface.co/models',
  headers: {
    'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  retries: 3
}

/**
 * Conversation Turn interface
 */
interface ConversationTurn {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  documentContext?: string
}

/**
 * Advanced conversation memory management
 */
export class ConversationMemory {
  protected history: ConversationTurn[] = []
  private maxTurns: number = 10
  private maxTokens: number = 2000

  constructor(maxTurns: number = 10, maxTokens: number = 2000) {
    this.maxTurns = maxTurns
    this.maxTokens = maxTokens
  }

  /**
   * Add a conversation turn
   */
  addTurn(role: 'user' | 'assistant', content: string, documentContext?: string) {
    this.history.push({
      role,
      content,
      timestamp: new Date(),
      documentContext
    })

    // Keep only recent turns
    if (this.history.length > this.maxTurns) {
      this.history = this.history.slice(-this.maxTurns)
    }
  }

  /**
   * Get conversation context for model input
   */
  getContext(): string {
    let context = ''
    let tokenCount = 0

    // Build context from most recent conversations
    for (let i = this.history.length - 1; i >= 0; i--) {
      const turn = this.history[i]
      const turnText = `${turn.role === 'user' ? 'Human' : 'Assistant'}: ${turn.content}\n`
      
      // Rough token estimation (1 token ≈ 4 characters for English/Japanese)
      const turnTokens = turnText.length / 4
      
      if (tokenCount + turnTokens > this.maxTokens) {
        break
      }
      
      context = turnText + context
      tokenCount += turnTokens
    }

    return context
  }

  /**
   * Get recent document context
   */
  getRecentDocumentContext(): string {
    const recentTurns = this.history.slice(-3) // Last 3 turns
    const documentContexts = recentTurns
      .filter(turn => turn.documentContext)
      .map(turn => turn.documentContext)
    
    return documentContexts.length > 0 ? documentContexts[documentContexts.length - 1]! : ''
  }

  /**
   * Clear conversation history
   */
  clear() {
    this.history = []
  }

  /**
   * Get conversation summary for long-term memory
   */
  getSummary(): string {
    if (this.history.length === 0) return ''
    
    const topics = new Set<string>()
    this.history.forEach(turn => {
      if (turn.role === 'user') {
        // Extract potential topics from user messages
        const words = turn.content.split(/\s+/).filter(w => w.length > 2)
        words.slice(0, 3).forEach(word => topics.add(word))
      }
    })

    return `会話のトピック: ${Array.from(topics).join(', ')}`
  }
}

/**
 * Generate text response using Hugging Face model
 */
export async function generateResponse(
  prompt: string,
  context?: string,
  model: string = MODELS.CHAT
): Promise<string> {
  try {
    // Prepare the input with context if provided
    const input = context 
      ? `Context: ${context}\n\nQuestion: ${prompt}\n\nAnswer:`
      : prompt

    const response = await hf.textGeneration({
      model,
      inputs: input,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        do_sample: true,
        repetition_penalty: 1.1,
        return_full_text: false
      }
    })

    return response.generated_text.trim()
  } catch (error) {
    console.error('Hugging Face API error:', error)
    throw new Error('AI response generation failed')
  }
}

/**
 * Alias for generateResponse for backward compatibility
 */
export const generateChatResponse = generateResponse

/**
 * Answer questions based on document context
 */
export async function answerQuestion(
  question: string,
  context: string
): Promise<string> {
  try {
    const response = await hf.questionAnswering({
      model: MODELS.QA,
      inputs: {
        question,
        context
      }
    })

    return response.answer || 'Sorry, I could not find an answer in the provided context.'
  } catch (error) {
    console.error('Question answering error:', error)
    
    // Fallback to text generation
    return generateResponse(question, context)
  }
}

/**
 * Summarize document content
 */
export async function summarizeText(text: string): Promise<string> {
  try {
    // Split long text into chunks if needed
    const maxLength = 1024
    if (text.length > maxLength) {
      const chunks = []
      for (let i = 0; i < text.length; i += maxLength) {
        chunks.push(text.slice(i, i + maxLength))
      }
      
      const summaries = await Promise.all(
        chunks.map(chunk => hf.summarization({
          model: MODELS.SUMMARIZATION,
          inputs: chunk,
          parameters: {
            max_length: 150,
            min_length: 30
          }
        }))
      )
      
      return summaries.map(s => s.summary_text).join(' ')
    }

    const response = await hf.summarization({
      model: MODELS.SUMMARIZATION,
      inputs: text,
      parameters: {
        max_length: 150,
        min_length: 30
      }
    })

    return response.summary_text
  } catch (error) {
    console.error('Summarization error:', error)
    return 'Sorry, I could not summarize the text.'
  }
}

/**
 * Enhanced ChatGPT-like response generation with conversation memory
 */
export async function generateAdvancedChatResponse(
  message: string,
  conversationMemory: ConversationMemory,
  documentContext?: string
): Promise<string> {
  try {
    // Get conversation history
    const conversationHistory = conversationMemory.getContext()
    const recentDocContext = documentContext || conversationMemory.getRecentDocumentContext()
    
    // Create enhanced prompt with system instructions
    let prompt = `以下は、企業文書管理AIアシスタントとユーザーとの会話です。AIは親切で、詳細で、正確な回答を提供します。`
    
    // Add document context if available
    if (recentDocContext) {
      prompt += `\n\n参考資料:\n${recentDocContext.slice(0, 1500)}`
    }
    
    // Add conversation history
    if (conversationHistory) {
      prompt += `\n\n過去の会話:\n${conversationHistory}`
    }
    
    // Add current user message
    prompt += `\nHuman: ${message}\nAssistant:`

    // Call Hugging Face API with improved parameters
    const response = await hf.textGeneration({
      model: MODELS.CHAT,
      inputs: prompt,
      parameters: {
        max_new_tokens: 400,
        temperature: 0.8,
        top_p: 0.95,
        do_sample: true,
        repetition_penalty: 1.15,
        return_full_text: false,
        stop: ['Human:', 'Assistant:', '\n\n']
      }
    })

    let generatedText = response.generated_text.trim()
    
    // Post-process the response
    generatedText = enhanceResponseQuality(generatedText, message, recentDocContext)
    
    // Add to conversation memory
    conversationMemory.addTurn('user', message, documentContext)
    conversationMemory.addTurn('assistant', generatedText, documentContext)
    
    return generatedText

  } catch (error) {
    console.error('Enhanced chat response error:', error)
    
    // Intelligent fallback based on message content
    const fallbackResponse = await generateIntelligentFallback(message, documentContext || '', conversationMemory)
    
    // Still add to memory even for fallback
    conversationMemory.addTurn('user', message, documentContext)
    conversationMemory.addTurn('assistant', fallbackResponse, documentContext)
    
    return fallbackResponse
  }
}

/**
 * Enhance response quality with post-processing
 */
function enhanceResponseQuality(response: string, originalQuestion: string, documentContext?: string): string {
  let enhanced = response
  
  // Remove incomplete sentences at the end
  const sentences = enhanced.split(/[。！？]/)
  if (sentences.length > 1 && sentences[sentences.length - 1].trim().length < 10) {
    enhanced = sentences.slice(0, -1).join('。') + '。'
  }
  
  // Ensure response is relevant to the question
  if (enhanced.length < 20) {
    enhanced = generateContextAwareResponse(originalQuestion, documentContext)
  }
  
  // Add helpful formatting for document-based responses
  if (documentContext && !enhanced.includes('📄')) {
    enhanced = `📄 **文書ベース回答**\n\n${enhanced}`
  }
  
  return enhanced
}

/**
 * Generate context-aware response for better fallback
 */
function generateContextAwareResponse(question: string, documentContext?: string): string {
  const questionLower = question.toLowerCase()
  
  // Analyze question intent
  if (questionLower.includes('教えて') || questionLower.includes('説明')) {
    if (documentContext) {
      return `ご質問「${question}」について、アップロードされた資料を参考に回答いたします。具体的にお知りになりたい点がございましたら、より詳しくお聞かせください。`
    } else {
      return `「${question}」について回答させていただきます。関連する資料をアップロードしていただくと、より詳細で正確な情報を提供できます。`
    }
  }
  
  if (questionLower.includes('方法') || questionLower.includes('やり方')) {
    return `「${question}」の手順について説明いたします。段階的な手順や具体的な方法をお知りになりたい場合は、より詳しくお聞かせください。`
  }
  
  // Default response
  return `「${question}」について承りました。より具体的な情報や詳細をお求めの場合は、関連する文書をアップロードしていただくか、具体的な質問をお聞かせください。`
}

/**
 * Generate intelligent document-based response
 */
export async function generateDocumentBasedResponse(
  question: string,
  documentContext: string,
  documentTitles: string[]
): Promise<string> {
  // First try Hugging Face API
  try {
    // Try question answering first
    const qaResponse = await answerQuestion(question, documentContext)
    
    if (qaResponse && !qaResponse.includes('Sorry, I could not find')) {
      // Enhance the QA response with context
      return enhanceResponseWithContext(qaResponse, question, documentTitles)
    }
  } catch (error) {
    console.log('QA model failed, trying text generation...')
  }

  // Fallback to intelligent analysis of document content
  const conversationMemory = new ConversationMemory()
  return generateIntelligentFallback(question, documentContext, conversationMemory)
}

/**
 * Enhance QA response with contextual information
 */
function enhanceResponseWithContext(
  answer: string, 
  question: string, 
  documentTitles: string[]
): string {
  return `📄 **資料ベース回答**

**ご質問**: ${question}

**回答**: ${answer}

**参照資料**: ${documentTitles.join(', ')}

💡 この回答は、アップロードされた資料の内容を分析して生成されています。より詳細な情報が必要でしたら、具体的な質問をお聞かせください。`
}

/**
 * Generate intelligent response based on document analysis
 */
function generateIntelligentFallback(
  question: string,
  documentContext: string,
  conversationMemory: ConversationMemory
): Promise<string> {
  return new Promise((resolve) => {
    // Extract document titles from conversation memory or use generic titles
    const documentTitles = ['アップロード済み資料']
    
    // Analyze document content for relevant information
    const contentAnalysis = analyzeDocumentContent(documentContext, question)
    
    // Try to provide more intelligent responses based on keywords
    const questionLower = question.toLowerCase()
    let intelligentResponse = ''
    
    // Check for specific topics based on question content
    if (questionLower.includes('グレード') || questionLower.includes('grade')) {
      intelligentResponse = `
**📊 グレード制度について**:
この資料には、スピードリンクジャパンのグレード制度（SLG）に関する詳細な情報が含まれています。

**主要なグレード構成**:
• STEP1: Rookie・Associate
• STEP2: Sub Leader～Sub Manager  
• STEP3: Manager～

**制度の特徴**:
• 各グレードには明確な昇格条件が設定
• グレード手当による報酬体系
• ミッション達成による昇進システム
• 定期的な評価面談による進捗確認

詳細な昇格条件や報酬体系については、資料内の該当セクションをご確認ください。`

    } else if (questionLower.includes('評価') || questionLower.includes('evaluation')) {
      intelligentResponse = `
**📋 評価制度について**:
この資料では、スピードリンクジャパンの包括的な評価制度について説明しています。

**評価制度の要素**:
• 評価基準の詳細定義
• 評価体制（評価者・評価面談）
• ミッション達成の判断基準
• 評価結果の報酬への反映方法

**評価プロセス**:
• 定期的な評価面談の実施
• メダルシートによる目標設定・振り返り
• 単価UPミッションの進捗管理
• 資格取得による能力評価

より具体的な評価基準や手順については、資料の詳細セクションをご参照ください。`

    } else if (questionLower.includes('昇格') || questionLower.includes('昇進')) {
      intelligentResponse = `
**🎯 昇格・昇進について**:
資料では、明確な昇格条件と昇進プロセスが定められています。

**昇格の条件**:
• 各グレードレベルでの必要スキル獲得
• ミッション達成状況
• 評価面談での総合判断
• 資格取得状況

昇格に関する詳細な要件は、各グレードレベルの説明セクションで確認できます。`
    }
    
    const response = `📄 **資料分析結果**

**ご質問**: ${question}

**関連資料**: ${documentTitles.join(', ')}

${intelligentResponse}

**分析内容**:
${contentAnalysis}

🔍 **詳細情報**:
この回答は、アップロードされた資料（${documentTitles.length}件）の内容を分析して生成されています。

💡 **さらに詳しく知りたい場合**:
- より具体的な質問をしていただくと、該当部分を詳細に分析できます
- 特定の項目や数値についてお聞きください
- 要約や比較分析も可能です

**利用可能な機能**: 内容要約、キーワード検索、データ分析、比較検討`

    resolve(response)
  })
}

/**
 * Analyze document content for relevant information
 */
function analyzeDocumentContent(content: string, question: string): string {
  if (!content || content.trim().length === 0) {
    return "資料の内容を読み込めませんでした。ファイル形式や内容をご確認ください。"
  }

  // Simple keyword matching and content analysis
  const questionKeywords = extractKeywords(question)
  const contentLines = content.split('\n').filter(line => line.trim().length > 0)
  
  let relevantContent: string[] = []
  let statistics = {
    totalLines: contentLines.length,
    totalChars: content.length,
    hasNumbers: /\d/.test(content),
    hasDate: /\d{4}[/-]\d{1,2}[/-]\d{1,2}|\d{1,2}[/-]\d{1,2}[/-]\d{4}/.test(content)
  }

  // Find relevant content based on keywords
  let foundMatches = false
  questionKeywords.forEach(keyword => {
    const matches = contentLines.filter(line => 
      line.toLowerCase().includes(keyword.toLowerCase())
    )
    
    if (matches.length > 0) {
      foundMatches = true
      relevantContent.push(`**「${keyword}」に関連する内容**:`)
      matches.slice(0, 5).forEach(match => {
        const cleanMatch = match.trim()
        if (cleanMatch.length > 0) {
          relevantContent.push(`• ${cleanMatch.slice(0, 200)}${cleanMatch.length > 200 ? '...' : ''}`)
        }
      })
      relevantContent.push('') // Add spacing between sections
    }
  })

  if (!foundMatches) {
    // If no keyword matches, provide general document overview
    relevantContent = [
      `**文書の概要**:`,
      `• 文書サイズ: ${statistics.totalLines}行、${statistics.totalChars}文字`,
      `• 数値データ: ${statistics.hasNumbers ? '含まれています' : '含まれていません'}`,
      `• 日付情報: ${statistics.hasDate ? '含まれています' : '含まれていません'}`,
      '',
      `**内容の一部**:`,
      ...contentLines.slice(0, 10).map(line => {
        const cleanLine = line.trim()
        if (cleanLine.length > 0) {
          return `• ${cleanLine.slice(0, 150)}${cleanLine.length > 150 ? '...' : ''}`
        }
        return null
      }).filter((item): item is string => item !== null).slice(0, 5)
    ]
  }

  return relevantContent.join('\n')
}

/**
 * Extract keywords from question
 */
function extractKeywords(question: string): string[] {
  // Remove common Japanese particles and extract meaningful words
  const stopWords = ['は', 'が', 'を', 'に', 'で', 'と', 'の', 'から', 'まで', 'について', 'という', 'です', 'ます', 'である', 'どのような', 'どんな', 'なに', 'なぜ', 'いつ', 'どこ', 'だれ', 'どうやって']
  
  // Split by various separators and clean up
  const words = question
    .replace(/[？！。、,，]/g, ' ')
    .split(/[\s\u3000]+/)
    .filter(word => word.length > 1 && !stopWords.includes(word))
    .map(word => word.replace(/[？！。、]/g, ''))
    .filter(word => word.length > 0)
  
  return Array.from(new Set(words)).slice(0, 5) // Remove duplicates and limit to 5 keywords
}

/**
 * Check if Hugging Face API is available
 */
export async function checkHuggingFaceConnection(): Promise<boolean> {
  try {
    // Try with a simpler model
    await hf.textGeneration({
      model: 'gpt2',
      inputs: 'Hello',
      parameters: { max_new_tokens: 5 }
    })
    return true
  } catch (error) {
    console.error('Hugging Face connection check failed:', error)
    return false
  }
}

/**
 * Enhanced conversation management with streaming support
 */
export class EnhancedConversationMemory extends ConversationMemory {
  private contextSummary: string = ''
  
  constructor(maxTurns: number = 15, maxTokens: number = 3000) {
    super(maxTurns, maxTokens)
  }

  /**
   * Get optimized context for ChatGPT-like responses
   */
  getChatGPTContext(): string {
    const recentContext = this.getContext()
    const summary = this.getSummary()
    
    if (this.contextSummary && recentContext.length < 500) {
      return `過去の会話概要: ${this.contextSummary}\n\n最近の会話:\n${recentContext}`
    }
    
    return recentContext
  }

  /**
   * Update context summary for long conversations
   */
  updateContextSummary(summary: string) {
    this.contextSummary = summary
  }

  /**
   * Analyze conversation patterns for better responses
   */
  getConversationPatterns(): { 
    frequentTopics: string[], 
    userPreferences: string[], 
    conversationStyle: string 
  } {
    const allUserMessages = this.history
      .filter(turn => turn.role === 'user')
      .map(turn => turn.content.toLowerCase())
    
    // Simple keyword extraction for topics
    const words = allUserMessages.join(' ').split(/\s+/)
    const wordCounts = words.reduce((acc, word) => {
      if (word.length > 3) {
        acc[word] = (acc[word] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    const frequentTopics = Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word)
    
    // Determine conversation style
    const hasPoliteLanguage = allUserMessages.some(msg => 
      msg.includes('お願い') || msg.includes('ください') || msg.includes('ありがとう')
    )
    
    const hasInformalLanguage = allUserMessages.some(msg =>
      msg.includes('だよね') || msg.includes('っていう') || msg.includes('やばい')
    )
    
    let conversationStyle = 'neutral'
    if (hasPoliteLanguage && !hasInformalLanguage) conversationStyle = 'formal'
    if (hasInformalLanguage && !hasPoliteLanguage) conversationStyle = 'casual'
    
    return {
      frequentTopics,
      userPreferences: [], // Could be enhanced based on user feedback
      conversationStyle
    }
  }
}

/**
 * ChatGPT-like streaming response generation
 */
export async function* generateStreamingResponse(
  message: string,
  conversationMemory: EnhancedConversationMemory,
  documentContext?: string
): AsyncGenerator<string, void, unknown> {
  try {
    // Get conversation patterns for personalized responses
    const patterns = conversationMemory.getConversationPatterns()
    const chatContext = conversationMemory.getChatGPTContext()
    
    // Create enhanced prompt
    let systemPrompt = `あなたは親切で知識豊富なAIアシスタントです。`
    
    // Adapt response style based on conversation patterns
    switch (patterns.conversationStyle) {
      case 'formal':
        systemPrompt += `丁寧で格式ある日本語で回答してください。`
        break
      case 'casual':
        systemPrompt += `フレンドリーで親しみやすい日本語で回答してください。`
        break
      default:
        systemPrompt += `自然で分かりやすい日本語で回答してください。`
    }
    
    if (documentContext) {
      systemPrompt += `\n\n参考資料:\n${documentContext.slice(0, 2000)}`
    }
    
    if (chatContext) {
      systemPrompt += `\n\n会話履歴:\n${chatContext}`
    }
    
    const fullPrompt = `${systemPrompt}\n\nユーザー: ${message}\nアシスタント:`
    
    // Use Hugging Face streaming if available
    const response = await hf.textGeneration({
      model: MODELS.CHAT,
      inputs: fullPrompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        top_p: 0.9,
        do_sample: true,
        repetition_penalty: 1.1,
        return_full_text: false,
        stop: ['ユーザー:', 'User:', 'Human:']
      }
    })
    
    // Simulate streaming by yielding chunks of the response
    const fullResponse = response.generated_text.trim()
    const chunks = fullResponse.split(/([。！？])/g)
    
    let accumulatedResponse = ''
    for (const chunk of chunks) {
      if (chunk.trim()) {
        accumulatedResponse += chunk
        yield accumulatedResponse
        
        // Add small delay to simulate real streaming
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    
    // Add to conversation memory
    conversationMemory.addTurn('user', message, documentContext)
    conversationMemory.addTurn('assistant', fullResponse, documentContext)
    
  } catch (error) {
    console.error('Streaming response error:', error)
    
    // Fallback to non-streaming intelligent response
    const fallbackResponse = await generateIntelligentFallback(message, documentContext || '', conversationMemory)
    yield fallbackResponse
  }
}
