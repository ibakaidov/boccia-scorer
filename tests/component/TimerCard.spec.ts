import { render, screen } from "@testing-library/vue"
import { describe, expect, it } from "vitest"
import TimerCard from "@renderer/operator/components/TimerCard.vue"

describe("TimerCard", () => {
  it("shows remaining and elapsed time", () => {
    render(TimerCard, {
      props: {
        title: "Красные",
        tone: "red",
        timer: {
          type: "redEnd",
          maxSec: 270,
          elapsedSec: 30,
          running: false
        }
      }
    })

    expect(screen.getByText("Красные")).toBeInTheDocument()
    expect(screen.getByText("04:00")).toBeInTheDocument()
    expect(screen.getByText("Использовано: 00:30")).toBeInTheDocument()
  })
})
