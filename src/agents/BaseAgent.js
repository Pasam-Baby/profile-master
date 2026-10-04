import { aiService } from '../services/ai.service';

export class BaseAgent {
  constructor() {
    this.name = '';
    this.description = '';
    this.systemPrompt = '';
  }

  async processTask(userInput, context) {
    const messages = [
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

  getName() {
    return this.name;
  }

  getDescription() {
    return this.description;
  }
}
