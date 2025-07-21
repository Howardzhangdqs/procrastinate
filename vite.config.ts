import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

// 共用的代理配置函数
const setupAPIPROXY = (target: string) => ({
  target,
  changeOrigin: true,
  rewrite: (path: string) => path.replace(/^\/api\/\w+/, ""),
  configure: (proxy: any, options: any) => {
    proxy.on("proxyReq", (proxyReq: any) => {
      proxyReq.setHeader("Access-Control-Allow-Origin", "*");
      proxyReq.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      proxyReq.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    },
  },
  server: {
    proxy: {
      // API代理配置
      "/api/dashscope": setupAPIPROXY("https://dashscope.aliyuncs.com/compatible-mode/v1"),
      "/api/openai": setupAPIPROXY("https://api.openai.com/v1"),
      "/api/siliconflow": setupAPIPROXY("https://api.siliconflow.cn/v1"),
      "/api/openrouter": setupAPIPROXY("https://openrouter.ai/api/v1"),
      "/api/deepseek": setupAPIPROXY("https://api.deepseek.com"),
      "/api/internlm": setupAPIPROXY("https://chat.intern-ai.org.cn/api/v1"),
    },
  },
});
