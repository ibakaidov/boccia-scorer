import { createRouter, createWebHashHistory } from "vue-router"

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "dashboard", component: () => import("../views/DashboardView.vue") },
    { path: "/setup", name: "setup", component: () => import("../views/MatchSetupView.vue") },
    { path: "/warmup", name: "warmup", component: () => import("../views/WarmupView.vue") },
    { path: "/match", name: "match", component: () => import("../views/MatchView.vue") },
    { path: "/protocol", name: "protocol", component: () => import("../views/ProtocolView.vue") },
    { path: "/settings", name: "settings", component: () => import("../views/SettingsView.vue") },
    { path: "/history", name: "history", component: () => import("../views/HistoryView.vue") }
  ]
})
