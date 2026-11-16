export type Limit = { kind: string; percentUsed: number; resetsAt?: string }
export type Extras = {
  resets?: { count: number; expires: string }
  credit?: { left: number; total: number; expires: string }
  updated?: string
}

declare module 'claude-code' {
  interface PluginState {
    'usage-meter': { limits: Limit[]; now: number; extras: Extras }
  }
}
