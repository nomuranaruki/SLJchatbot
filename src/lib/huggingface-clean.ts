import { HfInference } from '@huggingface/inference'

// Hugging Face API client initialization
export const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

// Available models for different tasks
export const MODELS = {
  SIMPLE_CHAT: 'microsoft/DialoGPT-medium', 
  QA: 'deepset/roberta-base-squad2',
  SUMMARIZATION: 'facebook/bart-large-cnn',
  FAST_QA: 'distilbert-base-cased-distilled-squad'
}

/**
 * Generate natural, conversational responses
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
  // Create a detailed conversation prompt with citation requirements
  let systemPrompt = `あなたは親切で知識豊富なAIアシスタントです。以下の要件に従って回答してください：

1. 詳細で具体的な回答を提供する
2. 資料がある場合は、関連する箇所を引用して詳細に説明する
3. 具体例や実用的なアドバイスを含める
4. 段落分けして読みやすくする
5. 追加質問を促すような結び方をする
6. 資料から得た情報は「資料によると」「文書には」などの表現で明示する`
  
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
    .replace(/^【.*?】\s*/gm, '')
    .replace(/^\*\*.*?\*\*\s*/gm, '')
    .replace(/^#+\s*/gm, '')
    .replace(/📄|📂|📋|🎯|📊|💬|📈|🔍|💡|🤝|✅|❌|🎉|🔧|📱|🏢|💰|🎁|📝|🔒|🚀|🎨|📋|📈|📊/g, '')
    .replace(/^\s*[•\-\*]\s*/gm, '')
    .replace(/^(:\s*|：\s*)/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // Ensure reasonable length
  if (natural.length > 400) {
    const sentences = natural.split(/[。！？]/)
    natural = sentences.slice(0, 3).join('。') + '。'
  }

  // Ensure the response starts naturally
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
 * Generate detailed document-based response with citations
 */
function generateSimpleDocumentResponse(message: string, documentContext: string): string {
  const context = documentContext.slice(0, 1500)
  const messageLC = message.toLowerCase()
  
  // Create detailed, citation-rich responses
  if (messageLC.includes('評価') || messageLC.includes('人事')) {
    let response = '評価制度についてお答えしますね。\n\n'
    
    // Extract specific information from context and cite it
    if (context.includes('グレード') || context.includes('STEP')) {
      const gradeInfo = extractRelevantSection(context, ['グレード', 'STEP', '昇格'])
      response += '**グレード制度について：**\n'
      if (gradeInfo) {
        response += `資料によると：「${gradeInfo.substring(0, 200)}...」\n\n`
      }
      response += '段階的なキャリアアップが可能な制度になっています。\n\n'
    }
    
    if (context.includes('メダルシート') || context.includes('medal')) {
      const medalInfo = extractRelevantSection(context, ['メダルシート', 'medal', '目標'])
      response += '**メダルシート制度について：**\n'
      if (medalInfo) {
        response += `文書には：「${medalInfo.substring(0, 200)}...」と記載されています。\n\n`
      }
      response += 'このシステムで個人の目標設定と達成度管理を行っています。\n\n'
    }
    
    if (context.includes('評価面談') || context.includes('面談')) {
      response += '**評価面談について：**\n定期的な面談で上司との対話を通じて成長をサポートしています。\n\n'
    }
    
    response += '他にも具体的に知りたい制度や手続きがありましたら、遠慮なくお聞きください。どの部分について詳しく説明いたしましょうか？'
    return response
  }
  
  if (messageLC.includes('メダルシート')) {
    const medalInfo = extractRelevantSection(context, ['メダルシート', 'medal', '目標', '評価'])
    let response = 'メダルシートについて詳しく説明いたします。\n\n'
    
    if (medalInfo) {
      response += `**資料からの引用：**\n「${medalInfo.substring(0, 300)}...」\n\n`
    }
    
    response += '**メダルシートの主な機能：**\n'
    response += '• 個人目標の設定と管理\n'
    response += '• 売上や単価などの数値目標追跡\n'
    response += '• 資格取得の進捗管理\n'
    response += '• 定期的な振り返りと評価\n\n'
    
    response += '**具体的な使用方法：**\n'
    if (context.includes('単価')) {
      response += '• 単価目標の設定と追跡\n'
    }
    if (context.includes('資格')) {
      response += '• 資格取得計画の管理\n'
    }
    if (context.includes('振り返り')) {
      response += '• 定期的な自己評価と振り返り\n'
    }
    
    response += '\nメダルシートの具体的な記入方法や評価基準について、さらに詳しくお聞きしたいことはありますか？'
    return response
  }
  
  // General detailed response for any document-based query
  const relevantInfo = extractRelevantSection(context, message.split(' '))
  let response = `「${message}」についてお答えします。\n\n`
  
  if (relevantInfo) {
    response += `**資料からの該当箇所：**\n「${relevantInfo.substring(0, 250)}...」\n\n`
  }
  
  response += '**詳細説明：**\n'
  response += `資料を確認したところ、${message}に関連する情報が含まれています。\n\n`
  
  response += 'より具体的な質問をいただければ、該当する箇所を詳しく説明いたします。どの部分について深く知りたいでしょうか？'
  
  return response
}

/**
 * Extract relevant section from context based on keywords
 */
function extractRelevantSection(context: string, keywords: string[]): string | null {
  const sentences = context.split(/[。．\n]/).filter(s => s.trim().length > 0)
  
  for (const sentence of sentences) {
    for (const keyword of keywords) {
      if (sentence.includes(keyword)) {
        // Find surrounding sentences for better context
        const index = sentences.indexOf(sentence)
        const start = Math.max(0, index - 1)
        const end = Math.min(sentences.length, index + 2)
        return sentences.slice(start, end).join('。') + '。'
      }
    }
  }
  
  return null
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
