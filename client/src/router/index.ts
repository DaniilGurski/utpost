import { createRouter, createWebHistory } from "vue-router";
import GuidesView from "../views/GuidesView.vue";
import ToursView from "../views/ToursView.vue";
import TourDetailView from "../views/TourDetailView.vue";
import LoginView from "../views/LoginView.vue";
import { useSessionStore } from "../stores/session.js";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginView,
    },
    {
      path: "/guides",
      name: "guides",
      component: GuidesView,
    },
    {
      path: "/tours",
      name: "tours",
      component: ToursView,
    },
    {
      path: "/tour/:id",
      name: "tour",
      props: true,
      component: TourDetailView,
    },
  ],
});

router.beforeEach((to, _) => {
  const store = useSessionStore();

  if (!store.loggedIn && to.name !== "login") {
    return { name: "login" };
  }

  if (store.loggedIn && to.name === "login") {
    return { name: "guides" };
  }
});

export default router;
