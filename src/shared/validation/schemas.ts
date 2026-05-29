import { z } from "zod"

export const gameClassSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  nameRu: z.string().min(1),
  ruleName: z.string().min(1),
  kind: z.enum(["individual", "pair", "team"]),
  endsCount: z.number().int().positive(),
  endTimeSec: z.number().int().positive(),
  ballsPerAthlete: z.number().int().positive(),
  athletesPerSide: z.number().int().positive(),
  active: z.boolean(),
  sortOrder: z.number().int()
})

export const courtSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  active: z.boolean(),
  sortOrder: z.number().int()
})

export const settingsSchema = z.object({
  schemaVersion: z.literal(1),
  language: z.literal("ru"),
  server: z.object({
    enabled: z.boolean(),
    baseUrl: z.string().url()
  }),
  timers: z.object({
    warmupSec: z.number().int().positive(),
    collectBallsSec: z.number().int().positive(),
    penaltyBallSec: z.number().int().positive(),
    technicalTimeoutSec: z.number().int().positive()
  }),
  hotkeys: z.object({
    redTimer: z.string().min(1),
    blueTimer: z.string().min(1),
    pause: z.string().min(1),
    confirm: z.string().min(1),
    cancel: z.string().min(1)
  }),
  scoreboard: z
    .object({
      theme: z.enum(["dark", "split"])
    })
    .default({ theme: "dark" }),
  gameClasses: z.array(gameClassSchema).min(1),
  courts: z.array(courtSchema)
})

export const sideColorSchema = z.enum(["red", "blue"])

export const timerStateSchema = z.object({
  type: z.enum(["warmup", "collectBalls", "penaltyBall", "technicalTimeout", "redEnd", "blueEnd"]),
  maxSec: z.number().int().nonnegative(),
  elapsedSec: z.number().int().nonnegative(),
  running: z.boolean(),
  startedAt: z.string().optional(),
  pausedAt: z.string().optional()
})

export const actionLogEntrySchema = z.object({
  id: z.string().min(1),
  matchClientId: z.string().optional(),
  at: z.string().min(1),
  actor: z.enum(["operator", "system"]),
  type: z.string().min(1),
  payload: z.unknown()
})
