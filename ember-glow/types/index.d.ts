export type Crab = {
  // 'idle' | 'ponder' | 'cheer' | 'wait' | 'error' | 'sleep'
  mood: string
  // seconds of the walk already done when the crab last stopped
  walked: number
  // epoch ms when it last started walking; 0 while it stands still
  since: number
}

// One helper agent running in this session, drawn as a small star wheel.
export type Wheel = {
  id: string
  label: string
  // 'running' | 'wait' | 'done'
  state: string
  // epoch ms it started
  startedAt: number
  // epoch ms it finished; 0 while it is still going
  endedAt: number
}

// A long run that just finished: gold burst and a baby crab until `until` (epoch ms).
export type Milestone = { until: number; label: string }

// The look this chat uses: 'ember', 'teal', 'violet', 'blue' or 'tokyo'.
export type PaletteChoice = { name: string }

// Which half of the look to draw in this chat: 'auto' follows the app, or force 'dark' or 'light'.
export type SchemeChoice = { value: string }

// Whether the crab is shown in this chat (/crab on, /crab off). The helper wheels stay either way.
export type CrabSwitch = { isOn: boolean }

declare module 'claude-code' {
  interface PluginState {
    'ember-glow': {
      crab: Shaped<Crab>
      wheels: Shaped<Wheel[]>
      milestone: Shaped<Milestone>
      palette: Shaped<PaletteChoice>
      crabSwitch: Shaped<CrabSwitch>
      scheme: Shaped<SchemeChoice>
    }
  }
}
