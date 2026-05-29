import { render, screen } from "@testing-library/vue"
import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it } from "vitest"
import SettingsView from "@renderer/operator/views/SettingsView.vue"

beforeEach(() => {
  setActivePinia(createPinia())
})

describe("SettingsView", () => {
  it("renders settings from the reactive store", () => {
    render(SettingsView)

    expect(screen.getByRole("heading", { name: "Классы, времена и сервер" })).toBeInTheDocument()
    expect(screen.getByLabelText("Включить server-mode")).toBeInTheDocument()
    expect(screen.getByText("Большое табло")).toBeInTheDocument()
  })
})
