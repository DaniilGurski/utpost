import { createRouter, createWebHistory } from "vue-router";
import GuidesView from "../views/GuidesView.vue";
import ToursView from "../views/ToursView.vue";
import TourDetailView from "../views/TourDetailView.vue";
import LoginView from "../views/LoginView.vue";

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

export default router;
