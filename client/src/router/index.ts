import { createRouter, createWebHistory } from "vue-router";
import GuidesView from "../views/GuidesView.vue";
import GuideDetailView from "../views/GuideDetailView.vue";
import ToursView from "../views/ToursView.vue";
import TourDetailView from "../views/TourDetailView.vue";
import LoginView from "../views/LoginView.vue";
import ProfileView from "../views/ProfileView.vue";
import PhotoUploadView from "../views/PhotoUploadView.vue";
import { useAuthStore } from "../stores/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: { name: "guides" },
    },
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
      path: "/guide/:slug",
      name: "guide",
      props: true,
      component: GuideDetailView,
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
    {
      path: "/tour/:id/upload",
      name: "upload",
      props: true,
      component: PhotoUploadView,
      meta: { requiresAuth: true },
    },
    {
      path: "/profile",
      name: "profile",
      component: ProfileView,
      meta: { requiresAuth: true },
    },
  ],
});

// M8: the guard is UX, not security. Logged-out users don't get a view that
// would fail anyway. The protection is the API's 401: bypassing the guard
// still gets no data.
router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  if (auth.isLoggedIn && to.name === "login") {
    return { name: "guides" };
  }
});

export default router;
