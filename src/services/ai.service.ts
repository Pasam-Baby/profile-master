export type AIServiceProvider = 'openai' | 'openrouter';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  text: string;
  usage?: {
    totalTokens: number;
  };
}

class AIService {
  private apiKey: string | null = null;
  private provider: AIServiceProvider = 'openai';

  constructor() {
    this.apiKey = import.meta.env.VITE_AI_API_KEY || null;
    this.provider = (import.meta.env.VITE_AI_PROVIDER as AIServiceProvider) || 'openai';
  }

  async chat(messages: ChatMessage[]): Promise<AIResponse> {
    if (!this.apiKey) {
      // Simulate response if no API key is provided
      console.warn("AI API Key missing. Simulating response.");
      return {
        text: "I am a simulated AI response. Please provide an API key in your environment variables to enable real AI features.",
      };
    }

    const url = this.provider === 'openai' 
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://openrouter.ai/api/v1/chat/completions';

    const body = {
      model: this.provider === 'openai' ? 'gpt-4o' : 'openai/gpt-3.5-turbo',
      messages,
      temperature: 0.7,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`AI API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        text: data.choices[0].message.content,
        usage: {
          totalTokens: data.usage.total_tokens,
        },
      };
    } catch (error) {
      console.error("AI Service Error:", error);
      throw error;
    }
  }
}

export const aiService = new AIService();
