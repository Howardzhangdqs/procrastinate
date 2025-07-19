<template>
  <div class="chat-interface">
    <div class="chat-header">
      <h1>AI Chat Assistant</h1>
      <p class="subtitle">Powered by your favorite LLM</p>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div v-if="messages.length === 0" class="welcome-message">
        <h2>Welcome to AI Chat!</h2>
        <p>Start a conversation with your AI assistant.</p>
        <p class="hint">💡 Click the ⚙️ icon to configure your API settings.</p>
      </div>

      <ChatMessage v-for="(message, index) in messages" :key="index" :message="message"
        :is-streaming="index === messages.length - 1 && isStreaming" />

      <div v-if="error" class="error-message">
        <span>⚠️ {{ error }}</span>
        <button @click="clearError" class="clear-error">✕</button>
      </div>
    </div>

    <div class="chat-input-container">
      <div class="input-wrapper">
        <textarea v-model="inputMessage" @keydown.enter.prevent="handleSend" placeholder="Type your message here..."
          class="chat-input" :disabled="isStreaming" rows="1" ref="inputRef"></textarea>

        <button @click="handleSend" :disabled="!inputMessage.trim() || isStreaming" class="send-button">
          {{ isStreaming ? '⏳' : '➤' }}
        </button>
      </div>

      <div class="input-actions">
        <button @click="clearChat" class="clear-button">
          🗑️ Clear Chat
        </button>
        <button @click="regenerateLast" :disabled="!canRegenerate">
          🔄 Regenerate
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">import { ref, nextTick, onMounted, computed, watch } from 'vue';
import ChatMessage from './ChatMessage.vue';
import { llmService, type ChatMessage as Message } from '@/services/llm';

const messages = ref<Message[]>([]);
const inputMessage = ref('');
const isStreaming = ref(false);
const error = ref('');
const messagesContainer = ref<HTMLElement>();
const inputRef = ref<HTMLTextArea>();

const canRegenerate = computed(() => {
  return messages.value.length > 0 &&
    messages.value[messages.value.length - 1].role === 'assistant' &&
    !isStreaming.value;
});

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const handleSend = async () => {
  const message = inputMessage.value.trim();
  if (!message || isStreaming.value) return;

  // Add user message
  messages.value.push({ role: 'user', content: message });
  inputMessage.value = '';
  error.value = '';

  await scrollToBottom();

  // Add empty assistant message for streaming
  messages.value.push({ role: 'assistant', content: '' });
  isStreaming.value = true;

  try {
    const generator = llmService.streamChat(
      messages.value.slice(0, -1),
      (err) => error.value = err
    );

    let assistantMessage = '';

    for await (const response of generator) {
      if (response.error) {
        error.value = response.error;
        // Remove the empty assistant message on error
        messages.value.pop();
        break;
      }

      if (response.content) {
        assistantMessage += response.content;
        messages.value[messages.value.length - 1].content = assistantMessage;
        await scrollToBottom();
      }

      if (response.isComplete) {
        isStreaming.value = false;
        break;
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to send message';
    messages.value.pop(); // Remove empty assistant message
    isStreaming.value = false;
  }

  // Focus input after sending
  inputRef.value?.focus();
};

const clearChat = () => {
  messages.value = [];
  error.value = '';
};

const clearError = () => {
  error.value = '';
};

const regenerateLast = async () => {
  if (!canRegenerate.value) return;

  // Remove last assistant message
  messages.value.pop();

  // Get last user message
  const lastUserMessage = messages.value[messages.value.length - 1];
  if (lastUserMessage.role === 'user') {
    // Regenerate response
    isStreaming.value = true;
    error.value = '';

    // Add empty assistant message
    messages.value.push({ role: 'assistant', content: '' });

    try {
      const generator = llmService.streamChat(
        messages.value.slice(0, -1),
        (err) => error.value = err
      );

      let assistantMessage = '';

      for await (const response of generator) {
        if (response.error) {
          error.value = response.error;
          messages.value.pop();
          break;
        }

        if (response.content) {
          assistantMessage += response.content;
          messages.value[messages.value.length - 1].content = assistantMessage;
          await scrollToBottom();
        }

        if (response.isComplete) {
          isStreaming.value = false;
          break;
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to regenerate';
      messages.value.pop();
      isStreaming.value = false;
    }
  }
};

// Handle textarea auto-resize
const handleInput = () => {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto';
    inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 120) + 'px';
  }
};

// Watch for input changes
watch(inputMessage, () => {
  nextTick(handleInput);
});

onMounted(() => {
  inputRef.value?.addEventListener('input', handleInput);
  inputRef.value?.focus();
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'l') {
    e.preventDefault();
    clearChat();
  }
});
</script>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.chat-header {
  background: white;
  padding: 1.5rem;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chat-header h1 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.subtitle {
  margin: 0.5rem 0 0 0;
  color: #666;
  font-size: 0.9rem;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.welcome-message {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.welcome-message h2 {
  color: #333;
  margin-bottom: 1rem;
}

.hint {
  font-style: italic;
  color: #007bff;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.clear-error {
  background: none;
  border: none;
  color: #721c24;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-error:hover {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
}

.chat-input-container {
  background: white;
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
}

.input-wrapper {
  display: flex;
  gap: 0.5rem;
  max-width: 800px;
  margin: 0 auto;
}

.chat-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 1.5rem;
  resize: none;
  font-family: inherit;
  font-size: 1rem;
  outline: none;
  min-height: 3rem;
  max-height: 120px;
}

.chat-input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.send-button {
  width: 3rem;
  height: 3rem;
  border: none;
  border-radius: 50%;
  background: #007bff;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s ease;
}

.send-button:hover:not(:disabled) {
  background: #0056b3;
  transform: scale(1.05);
}

.send-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.input-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 0.5rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.clear-button,
.regenerate-button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 1rem;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.clear-button:hover,
.regenerate-button:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #007bff;
}

.regenerate-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive design */
@media (max-width: 768px) {
  .chat-messages {
    padding: 0.5rem;
  }

  .chat-input-container {
    padding: 0.75rem;
  }

  .input-wrapper {
    margin: 0 0.5rem;
  }
}
</style>
