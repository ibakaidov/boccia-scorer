import { fireEvent, render, screen } from "@testing-library/vue"
import { describe, expect, it } from "vitest"
import ScoreControls from "@renderer/operator/components/ScoreControls.vue"

describe("ScoreControls", () => {
  it("disables score buttons when editing is not allowed", async () => {
    const rendered = render(ScoreControls, {
      props: {
        color: "red",
        label: "Красные",
        score: 1,
        total: 2,
        disabled: true
      }
    })

    await fireEvent.click(screen.getByRole("button", { name: "+" }))

    expect(screen.getByRole("button", { name: "-" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "+" })).toBeDisabled()
    expect(rendered.emitted("change")).toBeUndefined()
  })
})
