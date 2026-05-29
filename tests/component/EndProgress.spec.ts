import { render } from "@testing-library/vue"
import { describe, expect, it } from "vitest"
import { createEnds } from "@shared/domain"
import EndProgress from "@renderer/operator/components/EndProgress.vue"

describe("EndProgress", () => {
  it("renders four end dots for individual and pair matches", () => {
    const { container } = render(EndProgress, {
      props: {
        ends: createEnds(4),
        activeIndex: 0
      }
    })

    expect(container.querySelectorAll(".end-dot")).toHaveLength(4)
    expect(container.querySelector(".end-progress")).toHaveAttribute("aria-label", "Энд 1 из 4")
  })

  it("renders six end dots for team matches", () => {
    const { container } = render(EndProgress, {
      props: {
        ends: createEnds(6),
        activeIndex: 3
      }
    })

    expect(container.querySelectorAll(".end-dot")).toHaveLength(6)
    expect(container.querySelector(".end-progress")).toHaveAttribute("aria-label", "Энд 4 из 6")
  })
})
