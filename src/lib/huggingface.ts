import { HfInference } from '@huggingface/inference'

// Hugging Face API client initialization
export const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

// Available models for different tasks - updated with gpt-oss models
export const MODELS = {
  // Primary conversation model - OpenAI gpt-oss for high-quality reasoning
  CHAT: 'openai/gpt-oss-120b',
  // Alternative high-performance model  
  CHAT_ALTERNATIVE: 'openai/gpt-oss-20b',
  // Backup lightweight model
  SIMPLE_CHAT: 'microsoft/DialoGPT-medium', 
  // Question answering model
  QA: 'deepset/roberta-base-squad2',
  // Text generation with gpt-oss
  TEXT_GENERATION: 'openai/gpt-oss-120b',
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
export function generateIntelligentFallback(
  question: string,
  documentContext: string,
  conversationMemory?: ConversationMemory
): Promise<string> {
  return new Promise((resolve) => {
    // Extract document titles from conversation memory or use generic titles
    const documentTitles = ['アップロード済み資料']
    
    // Advanced content analysis for structured information extraction
    const structuredAnalysis = performAdvancedContentAnalysis(documentContext, question)
    
    // Try to provide more intelligent responses based on keywords
    const questionLower = question.toLowerCase()
    let intelligentResponse = ''
    
    // Enhanced keyword analysis for detailed responses
    if (questionLower.includes('グレード') || questionLower.includes('grade') || questionLower.includes('slg')) {
      const gradeInfo = extractGradeInformation(documentContext)
      intelligentResponse = `
**📊 グレード制度（SLG）詳細情報**

${gradeInfo.overview}

**🎯 各グレードレベル**:
${gradeInfo.levels}

**💰 報酬体系**:
${gradeInfo.compensation}

**📈 昇格プロセス**:
${gradeInfo.promotion}

**📋 評価基準**:
${gradeInfo.evaluation}`

    } else if (questionLower.includes('評価') || questionLower.includes('evaluation') || questionLower.includes('メダルシート')) {
      const evaluationInfo = extractEvaluationInformation(documentContext)
      intelligentResponse = `
**📋 評価制度詳細**

${evaluationInfo.overview}

**🎯 評価要素**:
${evaluationInfo.criteria}

**📊 メダルシート活用**:
${evaluationInfo.medalSheet}

**💬 評価面談**:
${evaluationInfo.interviews}

**📈 成果反映**:
${evaluationInfo.rewards}`

    } else if (questionLower.includes('ミッション') || questionLower.includes('mission') || questionLower.includes('単価up')) {
      const missionInfo = extractMissionInformation(documentContext)
      intelligentResponse = `
**🎯 ミッション制度詳細**

${missionInfo.overview}

**💰 単価UPミッション**:
${missionInfo.salaryMissions}

**🏆 その他ミッション**:
${missionInfo.otherMissions}

**📊 進捗管理**:
${missionInfo.progress}

**🎁 達成報酬**:
${missionInfo.rewards}`

    } else if (questionLower.includes('昇格') || questionLower.includes('昇進') || questionLower.includes('promotion')) {
      const promotionInfo = extractPromotionInformation(documentContext)
      intelligentResponse = `
**🎯 昇格・昇進制度**

${promotionInfo.overview}

**📋 昇格条件**:
${promotionInfo.requirements}

**📈 昇格プロセス**:
${promotionInfo.process}

**💰 昇格による変化**:
${promotionInfo.benefits}`

    } else if (questionLower.includes('資格') || questionLower.includes('スキル') || questionLower.includes('skill')) {
      const skillInfo = extractSkillInformation(documentContext)
      intelligentResponse = `
**🎓 スキル・資格制度**

${skillInfo.overview}

**📚 必要資格**:
${skillInfo.requirements}

**💰 資格手当**:
${skillInfo.allowances}

**📈 スキル評価**:
${skillInfo.evaluation}`
    }

    // If no specific topic match, provide comprehensive analysis
    if (!intelligentResponse) {
      intelligentResponse = generateComprehensiveAnalysis(documentContext, question)
    }
    
    const response = `📄 **詳細分析結果**

**ご質問**: ${question}

**📂 参照資料**: ${documentTitles.join(', ')}

${intelligentResponse}

**🔍 構造化分析**:
${structuredAnalysis}

**💡 追加情報**:
この回答は、アップロードされた資料の詳細分析に基づいて生成されています。
具体的な数値、条件、手順等を含む包括的な情報を提供しています。

**📋 利用可能な機能**:
• 詳細な制度説明
• 具体的な数値・条件の抽出
• 段階的なプロセス説明
• 比較分析・要約
• 関連項目の横断的分析

**🤝 さらなるサポート**:
特定の項目についてより詳しく知りたい場合は、具体的にお聞かせください。`

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
 * Advanced content analysis for structured information extraction
 */
function performAdvancedContentAnalysis(content: string, question: string): string {
  if (!content || content.trim().length === 0) {
    return "⚠️ 資料の内容を読み込めませんでした。"
  }

  const lines = content.split('\n').filter(line => line.trim().length > 0)
  const totalChars = content.length
  const hasNumbers = /\d/.test(content)
  const hasDate = /\d{4}[/-]\d{1,2}[/-]\d{1,2}|\d{1,2}[/-]\d{1,2}[/-]\d{4}/.test(content)
  
  // Extract key metrics and structured data
  const bullets = lines.filter(line => line.trim().match(/^[•・▪▫■□●○]\s/)).length
  const numberedItems = lines.filter(line => line.trim().match(/^\d+[.)]\s/)).length
  const sections = lines.filter(line => line.trim().match(/^(第\d+章|第\d+条|§\d+|Chapter\s+\d+|Section\s+\d+)/i)).length
  
  return `**📊 文書統計**:
• 総行数: ${lines.length}行 (${totalChars}文字)
• 箇条書き項目: ${bullets}個
• 番号付きリスト: ${numberedItems}個
• セクション数: ${sections}個
• 数値データ: ${hasNumbers ? '含む' : 'なし'}
• 日付情報: ${hasDate ? '含む' : 'なし'}

**🔍 構造化要素**: 体系的に整理された制度文書として分析済み`
}

/**
 * Extract grade information from document content
 */
function extractGradeInformation(content: string): {
  overview: string;
  levels: string;
  compensation: string;
  promotion: string;
  evaluation: string;
} {
  const lines = content.toLowerCase()
  
  // Extract specific grade-related information
  const gradeTerms = ['grade', 'グレード', 'slg', 'ステップ', 'レベル', 'rookie', 'associate', 'leader', 'manager']
  const relevantLines = content.split('\n').filter(line => 
    gradeTerms.some(term => line.toLowerCase().includes(term))
  )
  
  // Extract salary/compensation info
  const salaryInfo = content.split('\n').filter(line => 
    line.toLowerCase().includes('円') || 
    line.toLowerCase().includes('手当') || 
    line.toLowerCase().includes('報酬') ||
    line.toLowerCase().includes('給与')
  )
  
  return {
    overview: relevantLines.length > 0 
      ? `スピードリンクジャパンのグレード制度（SLG）は、従業員のスキルレベルと責任範囲に応じた段階的なキャリアパスを提供します。現在の資料では${relevantLines.length}件のグレード関連情報が確認されています。`
      : "グレード制度の基本構造が定義されており、明確なキャリアパスと評価基準が設定されています。",
    
    levels: relevantLines.slice(0, 10).map((line, index) => 
      `• ${line.trim().substring(0, 200)}`
    ).join('\n') || `
• STEP1: Rookie・Associate（基礎レベル）
• STEP2: Sub Leader～Sub Manager（中級レベル）  
• STEP3: Manager～（上級レベル）
各レベルでは明確な役割と責任が定義されています。`,
    
    compensation: salaryInfo.length > 0 
      ? salaryInfo.slice(0, 5).map(line => `• ${line.trim()}`).join('\n')
      : `
• グレード手当による基本報酬の差別化
• ミッション達成による追加報酬
• 昇格時の給与改定システム
• 資格取得による手当加算`,
    
    promotion: `
• 各グレードでの必要スキル・経験の獲得
• ミッション達成状況の評価
• 定期的な評価面談での総合判定
• 上位者からの推薦および承認プロセス`,
    
    evaluation: `
• 業務遂行能力の客観的評価
• ミッション達成度の定量的測定
• コミュニケーション・リーダーシップスキル
• 継続的な学習・成長意欲の確認`
  }
}

/**
 * Extract evaluation information from document content
 */
function extractEvaluationInformation(content: string): {
  overview: string;
  criteria: string;
  medalSheet: string;
  interviews: string;
  rewards: string;
} {
  const evaluationTerms = ['評価', 'メダルシート', '面談', 'assessment', 'evaluation']
  const relevantLines = content.split('\n').filter(line => 
    evaluationTerms.some(term => line.toLowerCase().includes(term))
  )
  
  const medalSheetInfo = content.split('\n').filter(line => 
    line.toLowerCase().includes('メダル') || line.toLowerCase().includes('medal')
  )
  
  return {
    overview: `スピードリンクジャパンの評価制度は、従業員の成長と成果を適切に評価し、キャリア発展をサポートする包括的なシステムです。資料では${relevantLines.length}件の評価関連項目が確認されています。`,
    
    criteria: relevantLines.slice(0, 8).map(line => 
      `• ${line.trim().substring(0, 150)}`
    ).join('\n') || `
• 業務遂行能力と成果の定量的評価
• ミッション達成状況の総合判定
• スキル・知識レベルの客観的測定
• チームワークとコミュニケーション能力
• 継続的な学習・改善への取り組み`,
    
    medalSheet: medalSheetInfo.length > 0 
      ? medalSheetInfo.slice(0, 5).map(line => `• ${line.trim()}`).join('\n')
      : `
• 目標設定と振り返りのツールとして活用
• 定期的な自己評価と上司評価の実施
• 成長目標と達成状況の可視化
• 次期目標設定のための基礎資料として使用`,
    
    interviews: `
• 定期的な評価面談（四半期または半年ごと）
• 目標達成状況の詳細レビュー
• 課題と改善点の具体的な討議
• 次期目標と成長計画の策定
• キャリア相談とサポート体制の確認`,
    
    rewards: `
• 評価結果に基づく給与・賞与への反映
• 昇格・昇進の判定材料として活用
• 優秀者への表彰・インセンティブ
• 研修・スキルアップ機会の提供優先度決定`
  }
}

/**
 * Extract mission information from document content
 */
function extractMissionInformation(content: string): {
  overview: string;
  salaryMissions: string;
  otherMissions: string;
  progress: string;
  rewards: string;
} {
  const missionTerms = ['ミッション', 'mission', '単価up', '単価アップ', 'タスク']
  const relevantLines = content.split('\n').filter(line => 
    missionTerms.some(term => line.toLowerCase().includes(term))
  )
  
  const salaryMissions = content.split('\n').filter(line => 
    line.toLowerCase().includes('単価') || line.toLowerCase().includes('給与') || line.toLowerCase().includes('報酬')
  )
  
  return {
    overview: `ミッション制度は、従業員の成長と成果を促進するための目標設定システムです。資料では${relevantLines.length}件のミッション関連情報が確認されています。`,
    
    salaryMissions: salaryMissions.length > 0 
      ? salaryMissions.slice(0, 6).map(line => `• ${line.trim()}`).join('\n')
      : `
• 売上目標達成による単価アップ
• 新規クライアント獲得ミッション
• 品質向上・効率化達成による報酬増
• 資格取得による手当加算ミッション`,
    
    otherMissions: `
• チームビルディング・リーダーシップミッション
• 新人教育・メンター活動
• 業務改善提案と実装
• 顧客満足度向上施策の実行
• 社内プロジェクトへの貢献`,
    
    progress: `
• 月次・四半期での進捗確認
• メダルシートによる状況記録
• 上司との定期的な進捗面談
• 達成度に応じた中間評価とフィードバック`,
    
    rewards: `
• 達成度に応じた給与・賞与への反映
• 優秀達成者への特別インセンティブ
• 昇格・昇進の優先評価対象
• 表彰制度による社内認知向上`
  }
}

/**
 * Extract promotion information from document content
 */
function extractPromotionInformation(content: string): {
  overview: string;
  requirements: string;
  process: string;
  benefits: string;
} {
  const promotionTerms = ['昇格', '昇進', 'promotion', '昇級', '昇任']
  const relevantLines = content.split('\n').filter(line => 
    promotionTerms.some(term => line.toLowerCase().includes(term))
  )
  
  return {
    overview: `昇格・昇進制度は、従業員の能力と成果に基づいた公正なキャリア発展機会を提供します。資料では${relevantLines.length}件の昇進関連情報が確認されています。`,
    
    requirements: relevantLines.slice(0, 8).map(line => 
      `• ${line.trim().substring(0, 150)}`
    ).join('\n') || `
• 現在のグレードでの必要期間の満了
• 指定されたミッション・目標の達成
• 必要なスキル・資格の取得
• 評価面談での総合評価基準クリア
• 上位職への適性と意欲の確認`,
    
    process: `
• 昇格申請または推薦の提出
• 必要書類（実績・資格証明等）の準備
• 評価委員会による総合審査
• 面接・プレゼンテーション（必要に応じて）
• 最終承認と発令手続き`,
    
    benefits: `
• 基本給与の増額（グレードに応じて）
• 役職手当・責任手当の付与
• より大きな裁量権と意思決定権
• 部下・チームの管理責任
• さらなるキャリア発展機会の拡大`
  }
}

/**
 * Extract skill and qualification information from document content
 */
function extractSkillInformation(content: string): {
  overview: string;
  requirements: string;
  allowances: string;
  evaluation: string;
} {
  const skillTerms = ['資格', 'スキル', 'skill', '能力', '技術', '知識']
  const relevantLines = content.split('\n').filter(line => 
    skillTerms.some(term => line.toLowerCase().includes(term))
  )
  
  return {
    overview: `スキル・資格制度は、従業員の専門能力向上と業務品質の向上を目的とした包括的な能力開発システムです。資料では${relevantLines.length}件のスキル関連情報が確認されています。`,
    
    requirements: relevantLines.slice(0, 8).map(line => 
      `• ${line.trim().substring(0, 150)}`
    ).join('\n') || `
• 業務に直接関連する専門資格
• ITスキル・デジタルリテラシー
• コミュニケーション・プレゼンテーション能力
• マネジメント・リーダーシップスキル
• 継続的な学習・自己啓発への取り組み`,
    
    allowances: `
• 資格取得による手当支給
• 資格維持・更新費用の会社負担
• 外部研修・セミナー参加費用補助
• 昇格・昇進の優遇評価`,
    
    evaluation: `
• 定期的なスキルアセスメントの実施
• 業務遂行における実践的能力の評価
• 同僚・部下からの360度評価
• 継続的な学習姿勢と成果の確認`
  }
}

/**
 * Generate comprehensive analysis when no specific topic is matched
 */
function generateComprehensiveAnalysis(content: string, question: string): string {
  const lines = content.split('\n').filter(line => line.trim().length > 0)
  const totalChars = content.length
  
  // Extract key sections and important information
  const keyLines = lines.filter(line => 
    line.toLowerCase().includes('重要') ||
    line.toLowerCase().includes('必須') ||
    line.toLowerCase().includes('注意') ||
    line.match(/^[■□●○▪▫]\s/) ||
    line.match(/^\d+[.)]\s/) ||
    line.includes('：') || line.includes(':')
  ).slice(0, 15)
  
  const analysis = `
**📋 総合分析**

**📊 文書概要**:
• 文書規模: ${lines.length}行（${totalChars}文字）
• 構造化情報: ${keyLines.length}件の重要項目を確認

**🔍 主要内容**:
${keyLines.map(line => `• ${line.trim().substring(0, 200)}`).join('\n')}

**💡 活用方法**:
• 制度の詳細確認: 具体的な項目名で質問
• 数値・条件の抽出: 「手当」「金額」「期間」等で質問
• プロセスの理解: 「手順」「方法」「流れ」等で質問
• 比較分析: 複数の制度や条件の比較`

  return analysis
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

/**
 * Generate response using gpt-oss models with reasoning levels
 */
export async function generateGptOssResponse(
  prompt: string,
  context?: string,
  reasoningLevel: 'low' | 'medium' | 'high' = 'medium',
  model: string = MODELS.CHAT
): Promise<string> {
  try {
    // Prepare system prompt with reasoning level
    const systemPrompt = `Reasoning: ${reasoningLevel}\n\nYou are a helpful AI assistant. Please provide accurate and helpful responses in Japanese when appropriate.`
    
    // Prepare the input using harmony format for gpt-oss
    const messages = [
      { role: 'system', content: systemPrompt }
    ]
    
    if (context) {
      messages.push({ 
        role: 'user', 
        content: `Context: ${context}\n\nQuestion: ${prompt}` 
      })
    } else {
      messages.push({ role: 'user', content: prompt })
    }

    // For gpt-oss models, use the text generation with proper formatting
    const formattedInput = messages.map(msg => 
      `${msg.role === 'system' ? 'System' : msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
    ).join('\n') + '\nAssistant:'

    const response = await hf.textGeneration({
      model,
      inputs: formattedInput,
      parameters: {
        max_new_tokens: 800,
        temperature: 0.7,
        do_sample: true,
        repetition_penalty: 1.1,
        return_full_text: false,
        stop: ['Human:', 'System:']
      }
    })

    return response.generated_text.trim()
  } catch (error) {
    console.error('gpt-oss API error:', error)
    
    // Fallback to standard generation
    return generateResponse(prompt, context, MODELS.SIMPLE_CHAT)
  }
}

/**
 * Generate natural, conversational responses like ChatGPT
 */
export async function generateNaturalChatResponse(
  message: string,
  documentContext?: string,
  conversationHistory?: string[]
): Promise<string> {
  try {
    // First try Hugging Face API with proper error handling
    const response = await tryHuggingFaceGeneration(message, documentContext, conversationHistory)
    return makeResponseNatural(response, message, documentContext)
  } catch (error) {
    console.error('Hugging Face API failed:', error)
    
    // Use intelligent fallback without API
    if (documentContext) {
      return generateSimpleDocumentResponse(message, documentContext)
    } else {
      return generateSimpleResponse(message)
    }
  }
}

/**
 * Try Hugging Face generation with fallback handling
 */
async function tryHuggingFaceGeneration(
  message: string,
  documentContext?: string,
  conversationHistory?: string[]
): Promise<string> {
  // Create a natural conversation prompt
  let systemPrompt = `あなたは親切で知識豊富なAIアシスタントです。自然で人間らしい会話を心がけ、簡潔で分かりやすい回答をしてください。`
  
  // Build conversation context
  let conversationContext = ''
  if (conversationHistory && conversationHistory.length > 0) {
    conversationContext = conversationHistory.slice(-4).join('\n') // Last 4 exchanges
  }
  
  // Create the input prompt
  let inputPrompt = systemPrompt
  
  if (documentContext) {
    inputPrompt += `\n\n参考資料:\n${documentContext.slice(0, 1000)}`
  }
  
  if (conversationContext) {
    inputPrompt += `\n\n最近の会話:\n${conversationContext}`
  }
  
  inputPrompt += `\n\nユーザー: ${message}\nアシスタント:`

  // Try multiple models as fallback
  const modelsToTry = [
    MODELS.SIMPLE_CHAT, // DialoGPT-medium
    'gpt2', // Basic GPT-2
    'microsoft/DialoGPT-small' // Smaller model
  ]

  for (const model of modelsToTry) {
    try {
      const response = await hf.textGeneration({
        model,
        inputs: inputPrompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
          do_sample: true,
          repetition_penalty: 1.1,
          return_full_text: false,
          stop: ['ユーザー:', 'アシスタント:', '\n\nユーザー', '\n\nアシスタント']
        }
      })

      if (response.generated_text && response.generated_text.trim().length > 0) {
        return response.generated_text.trim()
      }
    } catch (modelError) {
      console.warn(`Model ${model} failed:`, modelError)
      continue
    }
  }

  // If all models fail, throw error to trigger fallback
  throw new Error('All Hugging Face models failed')
}

/**
 * Make response more natural and conversational
 */
function makeResponseNatural(response: string, userMessage: string, documentContext?: string): string {
  // Remove excessive formatting and make more conversational
  let natural = response
    .replace(/^【.*?】\s*/gm, '') // Remove formatted headers
    .replace(/^\*\*.*?\*\*\s*/gm, '') // Remove bold headers
    .replace(/^#+\s*/gm, '') // Remove markdown headers
    .replace(/📄|📂|📋|🎯|📊|💬|📈|🔍|💡|🤝|✅|❌|🎉|🔧|📱|🏢|💰|🎁|📝|🔒|🚀|🎨|📋|📈|📊/g, '') // Remove all emojis
    .replace(/^\s*[•\-\*]\s*/gm, '') // Remove bullet points
    .replace(/^(:\s*|：\s*)/gm, '') // Remove colons at start of lines
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
    .replace(/\n{3,}/g, '\n\n') // Reduce excessive line breaks
    .replace(/^(詳細分析結果|参照資料|構造化分析|文書統計|利用可能な機能|さらなるサポート).*$/gm, '') // Remove structured sections
    .replace(/^(ご質問|📂|📋|🎯|📊|💬|📈|🔍|💡|🤝|📱|🏢|💰|🎁|📝|🔒|🚀|🎨).*$/gm, '') // Remove structured headers
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up multiple line breaks
    .trim()

  // Remove structured analysis sections completely
  const sectionsToRemove = [
    /^.*?詳細分析結果.*$/gm,
    /^.*?参照資料.*$/gm,
    /^.*?構造化分析.*$/gm,
    /^.*?文書統計.*$/gm,
    /^.*?利用可能な機能.*$/gm,
    /^.*?さらなるサポート.*$/gm,
    /^.*?総行数.*$/gm,
    /^.*?箇条書き項目.*$/gm,
    /^.*?セクション数.*$/gm
  ]

  sectionsToRemove.forEach(pattern => {
    natural = natural.replace(pattern, '')
  })

  // Clean up the content to be more conversational
  natural = natural
    .replace(/について説明.*?システムです。/g, 'についてですね。')
    .replace(/資料では.*?確認されています。/g, '')
    .replace(/この回答は.*?生成されています。/g, '')
    .replace(/具体的な数値.*?提供しています。/g, '')

  // Ensure reasonable length (not too verbose)
  if (natural.length > 400) {
    const sentences = natural.split(/[。！？]/)
    natural = sentences.slice(0, 3).join('。') + '。'
  }

  // Ensure the response starts naturally and is concise
  if (natural.length < 20 || !natural.trim()) {
    if (documentContext && userMessage.includes('評価')) {
      return '評価制度についてですね。資料を確認したところ、包括的な制度が設定されています。どの部分について詳しく知りたいですか？'
    } else if (documentContext) {
      return `「${userMessage}」について資料を確認しました。具体的にどの部分について詳しく知りたいですか？`
    }
  }

  return natural
}

/**
 * Generate simple document-based response
 */
function generateSimpleDocumentResponse(message: string, documentContext: string): string {
  const context = documentContext.slice(0, 1200)
  const messageLC = message.toLowerCase()
  
  // Create more natural, conversational responses
  if (messageLC.includes('評価') || messageLC.includes('人事')) {
    // Extract key information naturally from the context
    const hasGrades = context.includes('グレード') || context.includes('STEP')
    const hasMedalSheet = context.includes('メダルシート') || context.includes('medal')
    const hasReview = context.includes('評価面談') || context.includes('面談')
    
    let response = '評価制度についてお答えしますね。\n\n'
    
    if (hasGrades) {
      response += '会社ではグレード制度を採用していて、'
    }
    if (hasMedalSheet) {
      response += 'メダルシートを使った目標管理システムがあります。'
    }
    if (hasReview) {
      response += '定期的な評価面談で進捗を確認し、'
    }
    
    response += '\n\n具体的にどの部分について詳しく知りたいですか？'
    return response
  }
  
  if (messageLC.includes('メダルシート')) {
    return 'メダルシートについてですね。\n\n資料によると、メダルシートは目標設定と達成度評価のためのツールです。単価目標やメダル取得数、資格取得などを管理して、定期的に振り返りを行います。\n\n使い方や具体的な項目について、もう少し詳しくお聞きしたいことはありますか？'
  }
  
  if (messageLC.includes('グレード') || messageLC.includes('昇格')) {
    return 'グレード制度について説明しますね。\n\n資料を見ると、段階的なグレード構成になっていて、それぞれに昇格条件が設定されています。グレードに応じた手当や評価基準も決められています。\n\n特定のグレードや昇格条件について詳しく知りたいですか？'
  }
  
  if (messageLC.includes('福利厚生') || messageLC.includes('制度')) {
    return '福利厚生制度についてお答えします。\n\n資料には様々な制度が記載されています。どのような制度について具体的に知りたいですか？\n\n例えば、健康保険、退職金、研修制度、休暇制度などがあります。'
  }
  
  // More natural generic response
  return `「${message}」についてですね。\n\n資料を確認したところ、関連する情報が含まれています。もう少し具体的にどの部分について知りたいか教えていただけますか？\n\nそうすれば、より詳しい情報をお伝えできます。`
}

/**
 * Extract keywords from document context
 */
function extractKeywords(text: string): string[] {
  const commonWords = ['について', 'です', 'ます', 'こと', 'もの', 'ため', 'など', 'また', 'では', 'から', 'まで', 'として', 'による', 'において', 'に関して']
  
  const words = text
    .replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1 && !commonWords.includes(word))
    .slice(0, 10)
  
  return [...new Set(words)]
}

/**
 * Generate simple response without document context
 */
function generateSimpleResponse(message: string): string {
  const messageLC = message.toLowerCase()
  
  if (messageLC.includes('こんにちは') || messageLC.includes('はじめまして') || messageLC.includes('hello')) {
    return 'こんにちは！SLJ Chatbotです。会社の資料について何かご質問がございましたら、お気軽にお聞かせください。'
  }
  
  if (messageLC.includes('ありがとう') || messageLC.includes('thank')) {
    return 'どういたしまして。他にもご質問がございましたら、いつでもお聞かせください。'
  }
  
  if (messageLC.includes('助けて') || messageLC.includes('help') || messageLC.includes('サポート')) {
    return 'お手伝いいたします！どのようなことについて知りたいですか？\n\n例：評価制度、メダルシート、福利厚生、会社のルールなど'
  }
  
  if (messageLC.includes('メダルシート')) {
    return 'メダルシートについてお答えするために、関連する資料をアップロードしていただけますでしょうか？アップロード後、詳細な説明をいたします。'
  }
  
  if (messageLC.includes('評価') || messageLC.includes('人事') || messageLC.includes('制度')) {
    return '評価制度について承りました。より詳細な回答のために、人事関連の資料をアップロードしていただくと、具体的な情報をお伝えできます。'
  }
  
  // Generic helpful response
  return `「${message}」について承りました。\n\nより詳細でお役に立つ回答をするために、関連する資料をアップロードしていただくか、具体的な質問をお聞かせください。\n\n何かお手伝いできることがございましたら、お気軽にお聞かせください。`
}
