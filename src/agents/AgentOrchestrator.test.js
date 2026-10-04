import { describe, it, expect, vi } from 'vitest';
import { orchestrator } from './AgentOrchestrator';
import { aiService } from '../services/ai.service';

vi.mock('../services/ai.service', () => ({
  aiService: {
    chat: vi.fn(),
  },
}));

describe('AgentOrchestrator', () => {
  it('should run resume analysis and return parsed data', async () => {
    // Mock the AI response to simulate ResumeAgent parsing
    aiService.chat.mockResolvedValueOnce({
      text: JSON.stringify({
        score: 85,
        skills: ['React', 'JavaScript'],
        gaps: ['TypeScript'],
        suggestions: ['Learn TypeScript'],
      }),
    });

    const result = await orchestrator.runResumeAnalysis('Dummy resume text');
    expect(result.score).toBe(85);
    expect(result.skills).toContain('React');
    expect(aiService.chat).toHaveBeenCalled();
  });
});
