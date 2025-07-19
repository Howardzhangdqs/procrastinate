<template>
  <div class="chat-message" :class="message.role">
    <div class="message-avatar">
      <span v-if="message.role === 'user'">👤</span>
      <span v-else-if="message.role === 'assistant'">🤖</span>
      <span v-else>⚙️</span>
    </div>
    <div class="message-content">
      <div v-if="message.role === 'user'" class="text-content">{{ message.content }}</div>
      <div 
        v-else 
        class="markdown-content" 
        v-html="renderedContent"
      ></div>
      <div v-if="isStreaming" class="typing-indicator">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">import { computed } from 'vue';
import { marked } from 'marked';

interface Props {
  message: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  };
  isStreaming?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isStreaming: false
});

const renderedContent = computed(() => {
  return marked(props.message.content);
});
</script>

<style scoped>.chat-message {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: flex-start;
}

.chat-message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  background: #f0f0f0;
}

.chat-message.user .message-avatar {
  background: #007bff;
  color: white;
}

.chat-message.assistant .message-avatar {
  background: #28a745;
  color: white;
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.chat-message.user .message-content {
  margin-left: auto;
}

.text-content,
.markdown-content {
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  background: #f8f9fa;
  word-wrap: break-word;
}

.chat-message.user .text-content,
.chat-message.user .markdown-content {
  background: #007bff;
  color: white;
}

.markdown-content :deep(code) {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
}

.chat-message.user .markdown-content :deep(code) {
  background: rgba(255, 255, 255, 0.2);
}

.markdown-content :deep(pre) {
  background: rgba(0, 0, 0, 0.05);
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.chat-message.user .markdown-content :deep(pre) {
  background: rgba(255, 255, 255, 0.1);
}

.markdown-content :deep(blockquote) {
  border-left: 3px solid #ccc;
  margin: 0.5rem 0;
  padding-left: 1rem;
  color: #666;
}

.typing-indicator {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: #999;
  animation: typing 1.4s infinite ease-in-out;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>