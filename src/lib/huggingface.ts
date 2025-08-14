import { HfInference } from '@huggingface/inference'

// Hugging Face API client initialization
export const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

// Available models for different tasks
export const MODELS = {
  // Text generation models
  TEXT_GENERATION: 'microsoft/DialoGPT-large',
  CHAT: 'microsoft/DialoGPT-medium',
  QA: 'deepset/roberta-base-squad2',
  SUMMARIZATION: 'facebook/bart-large-cnn',
  
  // Alternative models
  LLAMA: 'meta-llama/Llama-2-7b-chat-hf',
  MISTRAL: 'mistralai/Mistral-7B-Instruct-v0.1',
  CODELLAMA: 'codellama/CodeLlama-7b-Python-hf'
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
 * Generate chat response with conversation history
 */
export async function generateChatResponse(
  message: string,
  conversationHistory: Array<{ role: 'user' | 'assistant', content: string }> = [],
  documentContext?: string
): Promise<string> {
  try {
    // Build conversation context
    let conversationText = ''
    conversationHistory.forEach(msg => {
      conversationText += `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}\n`
    })
    
    // Add document context if provided
    if (documentContext) {
      conversationText = `Document Context: ${documentContext}\n\n${conversationText}`
    }
    
    conversationText += `Human: ${message}\nAssistant:`

    const response = await hf.textGeneration({
      model: MODELS.CHAT,
      inputs: conversationText,
      parameters: {
        max_new_tokens: 300,
        temperature: 0.8,
        do_sample: true,
        repetition_penalty: 1.2,
        return_full_text: false,
        stop: ['Human:', 'Assistant:', '\n\n']
      }
    })

    return response.generated_text.trim()
  } catch (error) {
    console.error('Chat response error:', error)
    return 'Sorry, I encountered an error while processing your request. Please try again.'
  }
}

/**
 * Check if Hugging Face API is available
 */
export async function checkHuggingFaceConnection(): Promise<boolean> {
  try {
    await hf.textGeneration({
      model: MODELS.CHAT,
      inputs: 'Hello',
      parameters: { max_new_tokens: 10 }
    })
    return true
  } catch (error) {
    console.error('Hugging Face connection check failed:', error)
    return false
  }
}
