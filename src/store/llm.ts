import { ref, shallowRef } from "vue";

type Provider = {
  name: string;
  base_url: string;
  model: string;
  api: string;
};

const providers: Provider[] = [
  {
    name: "深度求索 DeepSeek",
    base_url: "/api/deepseek/",
    model: "deepseek-chat",
    api: "https://api.deepseek.com/"
  },
  {
    name: "书生浦语",
    base_url: "/api/internlm/",
    model: "internlm3-latest",
    api: "https://chat.intern-ai.org.cn/api/v1/"
  },
  {
    name: "阿里云 DashScope",
    base_url: "/api/dashscope/",
    model: "qwen-plus-latest",
    api: "https://dashscope.aliyuncs.com/compatible-mode/v1/"
  },
  {
    name: "Kimi",
    base_url: "/api/kimi/",
    model: "kimi-k2-0711-preview",
    api: "https://api.moonshot.cn/v1/"
  },
  {
    name: "OpenAI",
    base_url: "/api/openai/",
    model: "gpt-4.1",
    api: "https://api.openai.com/v1/"
  },
  {
    name: "胜算云",
    base_url: "/api/ssy/",
    model: "moonshot/kimi-latest",
    api: "https://router.shengsuanyun.com/api/v1/"
  },
  {
    name: "硅基流动 SiliconFlow",
    base_url: "/api/siliconflow/",
    model: "siliconflow-model-latest",
    api: "https://api.siliconflow.cn/v1/"
  },
  {
    name: "OpenRouter",
    base_url: "/api/openrouter/",
    model: "api/v1", // 根据你的网页内容，这个模型不可用
    api: "https://openrouter.ai/api/v1/"
  }
];

const api_key = ref<string>(localStorage.getItem("llm_api_key") || "");
const model = ref<string>(localStorage.getItem("llm_model") || providers[0].model);
const selected_provider_name = ref<string>(localStorage.getItem("selected_provider") || providers[0].name);
const selected_provider = shallowRef<Provider>(providers.find(provider => provider.name === selected_provider_name.value) || providers[0]);
const base_url = ref<string>(localStorage.getItem("llm_base_url") || providers[0].base_url);

console.log(api_key, model, selected_provider_name, base_url);

// 监听并存储到 localStorage
import { watch } from "vue";

watch(selected_provider_name, (val) => {
  base_url.value = providers.find(provider => provider.name === val)?.base_url || "";
  model.value = providers.find(provider => provider.name === val)?.model || "";

  console.log("Selected provider changed:", val);
  localStorage.setItem("selected_provider", val || "");
});

watch(api_key, (val) => {
  console.log("API key changed:", val);
  localStorage.setItem("llm_api_key", val || "");
});

watch(model, (val) => {
  console.log("Model changed:", val);
  localStorage.setItem("llm_model", val || "");
});

watch(selected_provider, (val) => {
  console.log("Selected provider object changed:", val);
  base_url.value = val.base_url;
  model.value = val.model;
  selected_provider_name.value = val.name;
});

export { providers, selected_provider, selected_provider_name, base_url, api_key, model };

export default {
  providers,
  selected_provider_name,
  selected_provider,
  base_url,
  api_key,
  model
};
