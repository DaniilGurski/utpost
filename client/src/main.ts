import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";
import urql from "@urql/vue";
import { client } from "./urql";

const app = createApp(App);

// M8: Pinia before the router, the guard reads the auth store
app.use(createPinia());
app.use(router);
app.use(urql, client);

app.mount("#app");
