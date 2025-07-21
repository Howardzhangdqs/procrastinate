import "./assets/main.css";

import "@mdi/font/css/materialdesignicons.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import { createApp } from "vue";
import App from "./App.vue";

import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

const vuetify = createVuetify({
  components,
  directives,
});

createApp(App).use(vuetify).mount("#app");
