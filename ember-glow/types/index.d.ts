export type Crab = {
  // 'idle' | 'ponder' | 'cheer'
  mood: string
  // seconds of the walk already done when the crab last stopped
  walked: number
  // epoch ms when it last started walking; 0 while it stands still
  since: number
}

declare module 'claude-code' {
  interface PluginState {
    'ember-glow': { crab: Shaped<Crab> }
  }
}
