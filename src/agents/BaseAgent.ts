import { aiService } from '../services/ai.service';
import type { ChatMessage } from '../services/ai.service';

export abstract class BaseAgent {
  protected abstract name: string;
  protected abstract description: string;
  protected abstract systemPrompt: string;

  async processTask(userInput: string, context?: any): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: userInput }
    ];

    if (context) {
      messages.unshift({ 
        role: 'system', 
        content: `Current Context: ${JSON.stringify(context)}` 
      });
    }

    const response = await aiService.chat(messages);
    return response.text;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }
}
