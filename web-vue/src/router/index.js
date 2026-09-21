import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/guides",
      name: "guides",
      component: () => import("../views/GuidesView.vue"),
    },
  ],
});

export default router;
