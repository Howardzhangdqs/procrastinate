<template>
  <div class="settings-panel" :class="{ open: isOpen }">
    <button class="settings-toggle" @click="toggleSettings">
      <span class="icon">{{ isOpen ? '✕' : '⚙️' }}</span>
    </button>

    <div class="settings-content" v-if="isOpen">
      <h3>Settings</h3>
      
      <div class="setting-group">
        <label>Provider:</label>
        <select v-model="localConfig.provider" @change="onProviderChange">
          <option v-for="provider in PROVIDERS" :key="provider.name" :value="provider.name">
            {{ provider.name }}
          </option>
        </select>
      </div>

      <div class="setting-group">
        <label>Base URL:</label>
        <input
          v-model="localConfig.baseUrl"
          type="url"
          placeholder="https://api.openai.com/v1"
          :readonly="selectedProvider?.name !== 'Custom'"
          @change="updateConfig"
        >/>
      </div>

      <div class="setting-group">
        <label>API Token:</label>
        <div class="token-input-wrapper">
          <input
            v-model="localConfig.token"
            :type="showToken ? 'text' : 'password'"
            placeholder="sk-..."
            @change="updateConfig"
          >/>
          <button
            type="button"
            class="toggle-visibility"
            @click="showToken = !showToken"
          >
            {{ showToken ? '👁️' : '👁️‍🗨️' }}
          </button>
        </div>
      </div>

      <div class="setting-group">
        <label>Model:</label>
        <select v-model="localConfig.model" @change="updateConfig">
          <option value="" disabled>Select a model</option>
          <option v-for="model in models" :key="model" :value="model">
            {{ model }}
          </option>
        </select>
      </div>

      <div class="setting-actions">
        <button @click="testConnection" :disabled="testing"
          :class="{ success: testResult === true, error: testResult === false }"
        >
          {{ testing ? 'Testing...' : testResult === true ? '✓ Connected' : testResult === false ? '✗ Failed' : 'Test Connection' }}
        </button>
        <button @click="refreshModels" :disabled="loadingModels">
          {{ loadingModels ? 'Loading...' : 'Refresh Models' }}
        </button>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">import { ref, reactive, watch, computed } from 'vue';
import { llmService, PROVIDERS } from '@/services/llm';

const isOpen = ref(false);
const showToken = ref(false);
const testing = ref(false);
const testResult = ref<boolean | null>(null);
const loadingModels = ref(false);
const error = ref('');
const models = ref<string[]>([]);

const localConfig = reactive({
  baseUrl: llmService.getConfig().baseUrl,
  token: llmService.getConfig().token,
  model: llmService.getConfig().model,
  provider: llmService.getConfig().provider || 'OpenAI'
});

const selectedProvider = computed(() => 
  PROVIDERS.find(p => p.name === localConfig.provider)
);

const availableModels = computed(() => {
  const provider = selectedProvider.value;
  if (!provider) return [];
  
  if (provider.name === 'Custom') {
    // For custom provider, we need to fetch models from the API
    return models.value;
  }
  
  return provider.models;
});

const toggleSettings = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    loadModels();
  }
};

const updateConfig = () => {
  llmService.setConfig({
    baseUrl: localConfig.baseUrl,
    token: localConfig.token,
    model: localConfig.model,
    provider: localConfig.provider
  });
  testResult.value = null;
};

const testConnection = async () => {
  testing.value = true;
  error.value = '';
  
  try {
    const result = await llmService.testConnection();
    testResult.value = result;
    if (result) {
      await loadModels();
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Connection failed';
    testResult.value = false;
  } finally {
    testing.value = false;
  }
};

const loadModels = async () => {
  loadingModels.value = true;
  error.value = '';
  
  try {
    const availableModels = await llmService.getModels();
    models.value = availableModels;
    
    if (availableModels.length > 0 && !localConfig.model) {
      localConfig.model = availableModels[0];
      updateConfig();
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load models';
  } finally {
    loadingModels.value = false;
  }
};

const refreshModels = () => {
  loadModels();
};

watch(isOpen, (open) => {
  if (open) {
    localConfig.baseUrl = llmService.getConfig().baseUrl;
    localConfig.token = llmService.getConfig().token;
    localConfig.model = llmService.getConfig().model;
  }
});
</script>

<style scoped>.settings-panel {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
}

.settings-toggle {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: none;
  background: #007bff;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.settings-toggle:hover {
  background: #0056b3;
  transform: scale(1.1);
}

.settings-content {
  position: absolute;
  top: 3.5rem;
  right: 0;
  width: 300px;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
}

.settings-content h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.setting-group {
  margin-bottom: 1rem;
}

.setting-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
}

.setting-group input,
.setting-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  font-size: 0.9rem;
}

.setting-group input:focus,
.setting-group select:focus {
  outline: none;
  border-color: #007bff;
}

.token-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.token-input-wrapper input {
  flex: 1;
  padding-right: 2.5rem;
}

.toggle-visibility {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1rem;
}

.setting-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.setting-actions button {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.setting-actions button:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #007bff;
}

.setting-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.setting-actions button.success {
  background: #28a745;
  color: white;
  border-color: #28a745;
}

.setting-actions button.error {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f8d7da;
  border-radius: 0.25rem;
}
</style>