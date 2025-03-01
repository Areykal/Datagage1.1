// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import DashboardPage from "../pages/DashboardPage.vue";
import DataSourcesPage from "../pages/DataSourcesPage.vue";
import InsightsPage from "../pages/InsightsPage.vue";
import SettingsPage from "../pages/SettingsPage.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/dashboard",
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: DashboardPage,
      meta: {
        title: "Dashboard",
        icon: "mdi-view-dashboard",
      },
    },
    {
      path: "/datasources",
      name: "datasources",
      component: DataSourcesPage,
      meta: {
        title: "Data Sources",
        icon: "mdi-database",
      },
    },
    {
      path: "/insights",
      name: "insights",
      component: InsightsPage,
      meta: {
        title: "Insights",
        icon: "mdi-lightbulb",
      },
    },
    {
      path: "/settings",
      name: "settings",
      component: SettingsPage,
      meta: {
        title: "Settings",
        icon: "mdi-cog",
      },
    },
  ],
});

// Update document title based on route
router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || "Home"} | Qwen2.5 Data Viz`;
  next();
});

export default router;
