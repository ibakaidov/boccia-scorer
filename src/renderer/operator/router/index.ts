import { createRouter, createWebHashHistory } from "vue-router"
import { useScorerStore } from "../stores/scorerStore"
import type { Match } from "@shared/domain"

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

router.beforeEach((to) => {
  const store = useScorerStore()
  const match = store.match

  if (to.path === "/match") {
    if (!match) return "/setup"
    if (isCompleted(match) || match.phase === "protocol") return "/protocol"
    if (match.phase === "setup" || match.phase === "warmup") return "/warmup"
  }

  if (to.path === "/warmup") {
    if (!match) return "/setup"
    if (isCompleted(match)) return "/protocol"
    if (match.phase !== "setup" && match.phase !== "warmup") return match.phase === "protocol" ? "/protocol" : "/match"
  }

  if (to.path === "/protocol" && match && !canOpenProtocol(match)) {
    if (match.phase === "setup" || match.phase === "warmup") return "/warmup"
    return "/match"
  }

  return true
})

function isCompleted(match: Match): boolean {
  return match.status === "completed" || match.phase === "completed"
}

function canOpenProtocol(match: Match): boolean {
  return match.phase === "protocol" || match.phase === "tieBreak" || isCompleted(match)
}
