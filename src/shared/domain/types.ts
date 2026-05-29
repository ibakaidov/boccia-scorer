export type ISODateString = string

export type GameClassKind = "individual" | "pair" | "team"

export type GameClass = {
  id: string
  code: string
  nameRu: string
  ruleName: string
  kind: GameClassKind
  endsCount: number
  endTimeSec: number
  ballsPerAthlete: number
  athletesPerSide: number
  active: boolean
  sortOrder: number
}

export type Participant = {
  id: string
  fullName: string
  shortName: string
  gender: "male" | "female"
  gameClassId: string
  regionId?: string | undefined
  teamId?: string | undefined
  countryId?: string | undefined
  active: boolean
}

export type Court = {
  id: string
  name: string
  active: boolean
  sortOrder: number
}

export type Region = { id: string; name: string }
export type Team = { id: string; name: string }
export type Country = { id: string; name: string; code?: string | undefined }

export type Dictionaries = {
  gameClasses: GameClass[]
  courts: Court[]
  participants?: Participant[] | undefined
  regions?: Region[] | undefined
  teams?: Team[] | undefined
  countries?: Country[] | undefined
  syncedAt: ISODateString
  version: number
}

export type SideColor = "red" | "blue"
export type SideDisplayNames = Partial<Record<SideColor, string>>

export type ParticipantRef = {
  participantId: string
  box?: number | undefined
}

export type Side = {
  color: SideColor
  label: "Красные" | "Синие"
  displayName?: string | undefined
  participants?: ParticipantRef[] | undefined
}

export type EndStatus = "notStarted" | "inProgress" | "completed"

export type End = {
  index: number
  redScore: number
  blueScore: number
  redTimeUsedSec: number
  blueTimeUsedSec: number
  status: EndStatus
  startedAt?: ISODateString | undefined
  completedAt?: ISODateString | undefined
}

export type TieBreakEnd = {
  index: number
  firstSide: SideColor
  redScore: number
  blueScore: number
  redTimeUsedSec: number
  blueTimeUsedSec: number
  winner?: SideColor | undefined
  status: EndStatus
  startedAt?: ISODateString | undefined
  completedAt?: ISODateString | undefined
}

export type MatchStatus = "draft" | "active" | "completed" | "cancelled"
export type MatchPhase =
  | "setup"
  | "warmup"
  | "end"
  | "collectBalls"
  | "tieBreak"
  | "protocol"
  | "completed"

export type MatchOfficials = {
  courtReferee?: string | undefined
  timerReferee?: string | undefined
}

export type Match = {
  id: string
  clientId: string
  serverId?: string | undefined
  status: MatchStatus
  courtId?: string | undefined
  gameClassId: string
  redSide: Side
  blueSide: Side
  officials?: MatchOfficials | undefined
  ends: End[]
  tieBreaks: TieBreakEnd[]
  activeEndIndex: number
  phase: MatchPhase
  createdAt: ISODateString
  updatedAt: ISODateString
  completedAt?: ISODateString | undefined
}

export type TimerType =
  | "warmup"
  | "collectBalls"
  | "penaltyBall"
  | "technicalTimeout"
  | "redEnd"
  | "blueEnd"

export type TimerState = {
  type: TimerType
  maxSec: number
  elapsedSec: number
  running: boolean
  startedAt?: ISODateString | undefined
  pausedAt?: ISODateString | undefined
}

export type TimerView = {
  maxSec: number
  elapsedSec: number
  remainingSec: number
  running: boolean
  label: string
}

export type ScoreboardMode = "idle" | "warmup" | "end" | "collectBalls" | "tieBreak" | "protocol"

export type ScoreboardSide = {
  color: SideColor
  label: string
  timer: TimerView
  endScore: number
  totalScore: number
  participantsLabel: string
}

export type ScoreboardEndProgressItem = {
  index: number
  status: EndStatus
}

export type ScoreboardState = {
  mode: ScoreboardMode
  courtName: string
  gameClassCode: string
  currentEndLabel: string
  red: ScoreboardSide
  blue: ScoreboardSide
  activeTimer?: SideColor | "solo" | undefined
  soloTimer?: TimerView | undefined
  statusLabel: string
  syncLabel: string
  endProgress: ScoreboardEndProgressItem[]
  completedEnds: End[]
  tieBreaks: TieBreakEnd[]
}

export type MatchSnapshot = {
  match: Match
  timers: Record<TimerType, TimerState>
  scoreboard: ScoreboardState
  savedAt: ISODateString
}

export type SyncQueueItem = {
  id: string
  matchClientId: string
  type: "startMatch" | "sendEnd" | "finishMatch" | "actionLog"
  payload: unknown
  status: "pending" | "sending" | "synced" | "failed"
  attempts: number
  lastError?: string | undefined
  createdAt: ISODateString
  updatedAt: ISODateString
}

export type ActionLogEntry = {
  id: string
  matchClientId?: string | undefined
  at: ISODateString
  actor: "operator" | "system"
  type: string
  payload: unknown
}

export type ServerSettings = {
  enabled: boolean
  baseUrl: string
}

export type TimerSettings = {
  warmupSec: number
  collectBallsSec: number
  penaltyBallSec: number
  technicalTimeoutSec: number
}

export type HotkeySettings = {
  redTimer: string
  blueTimer: string
  pause: string
  confirm: string
  cancel: string
}

export type AppSettings = {
  schemaVersion: number
  language: "ru"
  server: ServerSettings
  timers: TimerSettings
  hotkeys: HotkeySettings
  gameClasses: GameClass[]
  courts: Court[]
}

export type AppStatus = {
  appVersion: string
  serverOnline: boolean
  pendingSync: number
  failedSync: number
  lastDictionarySync?: ISODateString | undefined
}
