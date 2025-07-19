import axios, { type AxiosResponse } from 'axios';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMConfig {
  baseUrl: string;
  token: string;
  model?: string;
  provider?: string;
}

export const PROVIDERS = [
  {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini']
  },
  {
    name: 'Alibaba Dashscope',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-max-longcontext']
  },
  {
    name: 'SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    models: ['deepseek-ai/DeepSeek-V2.5', 'deepseek-ai/DeepSeek-Coder-V2-Instruct', 'meta-llama/Meta-Llama-3.1-8B-Instruct']
  },
  {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: ['openai/gpt-3.5-turbo', 'anthropic/claude-3.5-sonnet', 'google/gemini-pro', 'meta-llama/llama-3.1-8b-instruct']
  },
  {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    models: ['deepseek-chat', 'deepseek-coder']
  },
  {
    name: 'InternLM',
    baseUrl: 'https://chat.intern-ai.org.cn/api/v1',
    models: ['internlm2-latest', 'internlm2-20b', 'internlm2-7b']
  },
  {
    name: 'Custom',
    baseUrl: '',
    models: []
  }
];

export interface StreamResponse {
  content: string;
  isComplete: boolean;
  error?: string;
}

class LLMService {
  private config: LLMConfig = {
    baseUrl: 'https://api.openai.com/v1',
    token: '',
    model: 'gpt-3.5-turbo',
    provider: 'OpenAI'
  };

  setConfig(config: Partial<LLMConfig>) {
    this.config = { ...this.config, ...config };
  }

  getConfig(): LLMConfig {
    return { ...this.config };
  }

  async *streamChat(
    messages: ChatMessage[],
    onError?: (error: string) => void
  ): AsyncGenerator<StreamResponse, void, unknown> {
    if (!this.config.token) {
      const error = 'API token is required';
      onError?.(error);
      yield { content: '', isComplete: true, error };
      return;
    }

    // Use proxy URL for Netlify deployment to handle CORS
    const isLocal = window.location.hostname === 'localhost';
    const apiUrl = isLocal ? this.config.baseUrl : '/api';

    try {
      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.token}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = `HTTP ${response.status}: ${errorText}`;
        onError?.(error);
        yield { content: '', isComplete: true, error };
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        const error = 'No response body';
        onError?.(error);
        yield { content: '', isComplete: true, error };
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          yield { content: '', isComplete: true };
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              yield { content: '', isComplete: true };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                yield { content, isComplete: false };
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(errorMessage);
      yield { content: '', isComplete: true, error: errorMessage };
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.config.token) return false;

    const isLocal = window.location.hostname === 'localhost';
    const apiUrl = isLocal ? this.config.baseUrl : '/api';

    try {
      const response = await axios.get(`${apiUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
        },
        timeout: 5000,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async getModels(): Promise<string[]> {
    if (!this.config.token) return [];

    const isLocal = window.location.hostname === 'localhost';
    const apiUrl = isLocal ? this.config.baseUrl : '/api';

    try {
      const response = await axios.get(`${apiUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
        },
      });

      return response.data.data
        .filter((model: any) => model.id.includes('gpt') || model.id.includes('claude') || model.id.includes('llama'))
        .map((model: any) => model.id)
        .sort();
    } catch {
      return [];
    }
  }
}

export const llmService = new LLMService();
