import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";
import urql from "@urql/vue";
import { client } from "./urql";

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(urql, client);

app.mount("#app");
