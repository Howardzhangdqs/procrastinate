<script setup lang="ts">
import { Icon } from "@iconify/vue";
import Base64 from "../services/base64";
import { computed, nextTick } from "vue";

const props = defineProps<{
  modelValue: boolean;
  selectedProvider: any;
  apiKey: string;
  model: string;
  providers: any[];
  selectedProviderName: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:selectedProvider": [value: any];
  "update:apiKey": [value: string];
  "update:model": [value: string];
  "update:selectedProviderName": [value: string];
}>();

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
});

const selected_provider = computed({
  get: () => props.selectedProvider,
  set: (value) => emit("update:selectedProvider", value)
});

const api_key = computed({
  get: () => props.apiKey,
  set: (value) => emit("update:apiKey", value)
});

const modelValue = computed({
  get: () => props.model,
  set: (value) => emit("update:model", value)
});

const selected_provider_name = computed({
  get: () => props.selectedProviderName,
  set: (value) => emit("update:selectedProviderName", value)
});

const pasteFromClipboard = async (field: string) => {
  try {
    const text = await navigator.clipboard.readText();
    if (field === "api_key") {
      api_key.value = text;
    } else if (field === "model") {
      modelValue.value = text;
    }
  } catch (error) {
    console.error("无法读取剪贴板内容:", error);
  }
};

const pasteConfigure = async () => {
  try {
    const text = await navigator.clipboard.readText();

    // 转为 Base64 编码
    const base64Text = Base64.decode(text);

    console.log(base64Text);

    const config = JSON.parse(base64Text);
    if (config.selected_provider) selected_provider_name.value = config.selected_provider;
    await nextTick();
    if (config.api_key) api_key.value = config.api_key;
    await nextTick();
    if (config.model) modelValue.value = config.model;
  } catch (error) {
    console.error("无法读取剪贴板内容:", error);
  }
};

const copyConfigure = async () => {
  const config = {
    api_key: api_key.value || "",
    model: modelValue.value || "",
    selected_provider: selected_provider_name.value || ""
  };

  // 转为 Base64 编码
  const base64Text = Base64.encode(JSON.stringify(config));

  try {
    await navigator.clipboard.writeText(base64Text);
    console.log("配置已复制到剪贴板");
  } catch (error) {
    console.error("无法写入剪贴板:", error);
  }
};
</script>

<template>
  <v-dialog v-model="dialog" width="auto">
    <v-card title="选择模型" style="max-width: calc(100vh - 20px) !important;">
      <template v-slot:prepend>
        <v-icon>
          <Icon icon="mingcute:ai-fill"></Icon>
        </v-icon>
      </template>
      <v-card-text style="padding-bottom: 0;">
        <v-sheet>
          <v-select variant="underlined" v-model="selected_provider" label="选择模型供应商" :items="providers"
            item-title="name" :hint="`${selected_provider.name} ${selected_provider.api}`" return-object></v-select>
          <div class="d-flex align-center">
            <v-text-field variant="underlined" v-model="api_key" placeholder="sk-&&" label="API Key" class="flex-grow-1"
              append-inner-icon="mdi-content-paste" @click:append-inner="pasteFromClipboard('api_key')"
              clearable></v-text-field>
          </div>
          <v-text-field variant="underlined" v-model="modelValue" placeholder="deepseek-chat" label="模型代码"
            append-inner-icon="mdi-content-paste" @click:append-inner="pasteFromClipboard('model')"
            clearable></v-text-field>
        </v-sheet>
      </v-card-text>
      <template v-slot:actions>
        <div>
          <v-btn variant="tonal" color="primary" class="ms-auto" text="复制配置" @click="copyConfigure"
            style="margin-right: 8px;"></v-btn>
          <v-btn variant="tonal" color="primary" class="ms-auto" text="黏贴配置" @click="pasteConfigure"
            style="margin-right: 8px;"></v-btn>
          <v-btn variant="tonal" color="success" class="ms-auto" text="确认" @click="dialog = false"></v-btn>
        </div>
      </template>
    </v-card>
  </v-dialog>
</template>

<style scoped></style>
