import { createApp } from "vue"
import { createPinia } from "pinia"
import App from "./App.vue"
import { router } from "./router"
import { useScorerStore } from "./stores/scorerStore"
import "@renderer/styles/operator.css"

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)

await useScorerStore(pinia).bootstrap()

app.use(router)
app.mount("#app")
