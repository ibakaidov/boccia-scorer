/// <reference types="vite/client" />

import type { BocciaApi } from "./src/shared/ipc/api"

declare global {
  interface Window {
    bocciaApi: BocciaApi
  }
}

export {}
