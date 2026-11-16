import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import type { Crab, Milestone, Wheel } from '../types'

import { makeColors } from './make-colors.js'

// The looks you can switch between with /look. Each one is dark and light, with its own glow, burst and crab color.
type Palette = {
  label: string
  accent: string
  glow: string
  hi: string
  // adds the pink glow rings and neon halos
  neon?: boolean
  // the color of the person's own typed messages, where the look wants them apart from Claude's text
  userInk?: string
  roles: { danger: string; success: string; warning: string; pro: string }
  light: Anchors
  dark: Anchors
}

type Anchors = { 'surface-0': string; 'text-primary': string } & Partial<
  Record<'surface-1' | 'surface-2' | 'surface-3' | 'text-secondary' | 'text-muted', string>
>


const PALETTES: Record<string, Palette> = {
  ember: {
    label: 'Ember (warm black, Claude orange)',
    accent: '#d97757',
    glow: '#e8855f',
    hi: '#f0a47f',
    roles: { danger: '#c8483c', success: '#6f9a55', warning: '#c9902b', pro: '#a5799c' },
    light: { 'surface-0': '#f3ebe0', 'surface-1': '#f8f2e8', 'surface-2': '#fcf8f1', 'text-primary': '#2b2119', 'text-secondary': '#54463a', 'text-muted': '#6b5b4d' },
    dark: { 'surface-0': '#171310', 'surface-1': '#1f1915', 'surface-2': '#27201a', 'surface-3': '#2e261f', 'text-primary': '#f3e9dd', 'text-secondary': '#d2c4b3', 'text-muted': '#ad9d8a' },
  },
  teal: {
    label: 'Teal (deep sea-green)',
    accent: '#2fa39c',
    glow: '#46c0b8',
    hi: '#8ee0d8',
    roles: { danger: '#c8483c', success: '#6f9a55', warning: '#c9902b', pro: '#9a86c6' },
    light: { 'surface-0': '#e8f1ef', 'surface-1': '#f0f7f5', 'surface-2': '#f7fbfa', 'text-primary': '#14201f', 'text-secondary': '#3a4f4d', 'text-muted': '#55706d' },
    dark: { 'surface-0': '#0f1516', 'surface-1': '#151d1e', 'surface-2': '#1b2526', 'surface-3': '#222d2f', 'text-primary': '#e6f0ef', 'text-secondary': '#bccfcd', 'text-muted': '#93aaa8' },
  },
  violet: {
    label: 'Violet (plum night)',
    accent: '#8b6fd6',
    glow: '#a68ae8',
    hi: '#c7b4f2',
    roles: { danger: '#c8483c', success: '#6f9a55', warning: '#c9902b', pro: '#c07aa8' },
    light: { 'surface-0': '#eeeaf4', 'surface-1': '#f4f1f9', 'surface-2': '#faf8fd', 'text-primary': '#1f1a2b', 'text-secondary': '#473e5a', 'text-muted': '#645a79' },
    dark: { 'surface-0': '#14111a', 'surface-1': '#1b1722', 'surface-2': '#221d2b', 'surface-3': '#292334', 'text-primary': '#ece6f5', 'text-secondary': '#cdc3de', 'text-muted': '#a89cc0' },
  },
  blue: {
    label: 'Blue (midnight ocean)',
    accent: '#4b8fe0',
    glow: '#6aa6ee',
    hi: '#a3c8f5',
    roles: { danger: '#c8483c', success: '#6f9a55', warning: '#c9902b', pro: '#a5799c' },
    light: { 'surface-0': '#e8eef6', 'surface-1': '#f0f4fa', 'surface-2': '#f7f9fd', 'text-primary': '#17202e', 'text-secondary': '#3c4a5e', 'text-muted': '#586a82' },
    dark: { 'surface-0': '#0f131a', 'surface-1': '#151b24', 'surface-2': '#1b232e', 'surface-3': '#222b38', 'text-primary': '#e5edf7', 'text-secondary': '#bccade', 'text-muted': '#93a5bf' },
  },
  tokyo: {
    label: 'Tokyo (night city, neon cyan, magenta and violet)',
    accent: '#7dcfff',
    glow: '#bb9af7',
    hi: '#ff79c6',
    neon: true,
    userInk: '#7dcfff',
    roles: { danger: '#f7768e', success: '#9ece6a', warning: '#e0af68', pro: '#bb9af7' },
    light: { 'surface-0': '#d5d6db', 'surface-1': '#e1e2e7', 'surface-2': '#e9e9ed', 'text-primary': '#1f2335', 'text-secondary': '#343b58', 'text-muted': '#4c5272' },
    dark: { 'surface-0': '#16161e', 'surface-1': '#1a1b26', 'surface-2': '#1f2335', 'surface-3': '#24283b', 'text-primary': '#e8dc78', 'text-secondary': '#c3b87a', 'text-muted': '#9a9370' },
  },
}

const paletteFor = (name: string): Palette => PALETTES[name] ?? (PALETTES.ember as Palette)

// The theme for a palette, with the line that would stop Desktop painting it, if any.
const lookFor = (name: string): { look: ThemeSetArgs; unpainted: string | undefined } => {
  const p = paletteFor(name)
  const { theme, problems } = makeColors({
    label: `Ember glow: ${name}`,
    roles: { accent: p.accent, ...p.roles },
    light: { gray: { anchors: p.light } },
    dark: { gray: { anchors: p.dark } },
  })

  return {
    look: { colors: theme, backdrop: { scene: 'ember-glow', glass: false } },
    unpainted: problems.find(line => line.startsWith("Desktop won't paint")),
  }
}

// Art lives in the outer ~18% of each side; the middle stays empty so it never sits behind messages.
const WALK_SECONDS = 72
const SLEEP_AFTER_MS = 5 * 60_000
const MILESTONE_MIN_MS = 3 * 60_000
const MILESTONE_SHOW_MS = 60_000
const DONE_WHEEL_SHOW_MS = 90_000
const MAX_WHEELS = 4

// Which look this chat uses. It lives in the session, so another chat keeps its own.
const palette = atom({ plugin: 'ember-glow', key: 'palette' } as const, { name: 'ember' }, { shape: 'palette-1' })

// Whether the crab shows in this chat; the helper wheels stay either way.
const crabSwitch = atom({ plugin: 'ember-glow', key: 'crabSwitch' } as const, { isOn: true }, { shape: 'crabswitch-1' })

const wheels = atom({ plugin: 'ember-glow', key: 'wheels' } as const, [] as Wheel[], { shape: 'wheels-2' })
const milestone = atom({ plugin: 'ember-glow', key: 'milestone' } as const, { until: 0, label: '' } as Milestone, {
  shape: 'milestone-1',
})

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Twelve rays, like the big burst, drawn small.
const RAYS = Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 6
  return `M0 0 L${(Math.sin(a) * 11).toFixed(1)} ${(-Math.cos(a) * 11).toFixed(1)}`
}).join(' ')

// One small star wheel per helper agent, at the right end of the strip. Hover names the task.
const fmtDur = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000))

  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`
}

const helperCount = (list: Wheel[]) => {
  const running = list.filter(w => w.state !== 'done').length
  const waiting = list.filter(w => w.state === 'wait').length

  if (list.length === 0) {
    return ''
  }

  return running === 0
    ? `${list.length} helper${list.length === 1 ? '' : 's'} finished`
    : `${running} helper${running === 1 ? '' : 's'} working${waiting > 0 ? ` · ${waiting} need${waiting === 1 ? 's' : ''} you` : ''}`
}

// Where the count's text ends: just left of the wheels (and the "+N").
const countEnd = (list: Wheel[]) => 880 - (Math.min(list.length, MAX_WHEELS) - 1) * 34 - 24 - (list.length > MAX_WHEELS ? 34 : 0)

// How far the crab may walk: with helpers showing, it stops short of the count text instead of walking over it.
const walkRange = (list: Wheel[]) => {
  if (list.length === 0) {
    return 600
  }
  const textStart = countEnd(list) - helperCount(list).length * 9.4

  return Math.max(80, Math.min(600, Math.round(textStart - 130)))
}

const wheelsMarkup = (list: Wheel[], now: number) => {
  const shown = list.slice(0, MAX_WHEELS)
  const extra = list.length - shown.length
  const wheelsSvg = shown
    .map((w, i) => {
      const x = 880 - i * 34
      const took = fmtDur((w.endedAt > 0 ? w.endedAt : now) - w.startedAt)
      const word = w.state === 'wait' ? `needs you, ${took}` : w.state === 'done' ? `finished in ${took}` : `working, ${took}`

      const text = `${w.label.length > 34 ? `${w.label.slice(0, 33)}…` : w.label} · ${word}`
      const width = Math.round(text.length * 8.6 + 22)

      // the hover label is drawn here, big enough to read, and sits left of its wheel
      return `<g class="wheel w-${w.state}" transform="translate(${x},25)"><circle r="15" fill="#000" fill-opacity="0.001"/><g class="wspin"><path class="ws" d="${RAYS}"/><circle class="wc" r="2.6"/></g><g class="tip"><rect x="${-24 - width}" y="-17" width="${width}" height="34" rx="9"/><text x="${-24 - width / 2}" y="6" text-anchor="middle">${esc(text)}</text></g></g>`
    })
    .reverse()
    .join('')
  const more = extra > 0 ? `<text x="${880 - MAX_WHEELS * 34}" y="30" class="wmore">+${extra}</text>` : ''

  // the count, written right in the strip beside the wheels, since the footer's status line is easy to miss
  const count = helperCount(list)
  const waiting = list.filter(w => w.state === 'wait').length
  const endX = countEnd(list)
  const countSvg = count === '' ? '' : `<text class="wcount${waiting > 0 ? ' wc-wait' : ''}" x="${endX}" y="31" text-anchor="end">${esc(count)}</text>`

  return countSvg + wheelsSvg + more
}

// A baby crab that wanders the strip for a minute after a long run.
const BABY = `<g class="baby"><g transform="translate(300,36) scale(0.2)">
  <rect class="bp" x="12" y="30" width="26" height="26"/><rect class="bp" x="122" y="30" width="26" height="26"/>
  <rect class="bp" x="40" y="40" width="80" height="46"/><rect class="bp" x="46" y="86" width="8" height="14"/><rect class="bp" x="106" y="86" width="8" height="14"/>
  <rect class="eye2" x="58" y="52" width="10" height="14"/><rect class="eye2" x="92" y="52" width="10" height="14"/>
</g></g>`

const crab = atom({ plugin: 'ember-glow', key: 'crab' } as const, { mood: 'idle', walked: 0, since: 0 } as Crab, {
  shape: 'crab-1',
})

// The status line's helper count: "2 helpers running", or clear when none are.
const showHelpers = async ($: EngineInterface) => {
  const list = await read($, wheels)
  const waiting = list.filter(w => w.state === 'wait').length
  const running = list.filter(w => w.state !== 'done').length

  if (list.length === 0) {
    $.ui.status(undefined)
  } else if (running === 0) {
    // stays up while the finished wheels do
    $.ui.status(`${list.length} helper${list.length === 1 ? '' : 's'} finished`)
  } else {
    $.ui.status(`${running} helper${running === 1 ? '' : 's'} running${waiting > 0 ? `, ${waiting} need${waiting === 1 ? 's' : ''} you` : ''}`)
  }
}

// Stop the crab where it stands: bank the walking done so far.
const stopped = (c: Crab, now: number, mood: string): Crab => ({
  mood,
  walked: c.since === 0 ? c.walked : (c.walked + (now - c.since) / 1000) % WALK_SECONDS,
  since: 0,
})

const scene = (mood: string, isGold: boolean, p: Palette) => `<svg class="m-${mood}${isGold ? ' ms' : ''}${p.neon ? ' neon' : ''}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<style>
  svg { --a: ${p.accent}; --a2: ${p.glow}; --hi: ${p.hi}; }
  .pulse { animation: pulse 9s ease-in-out infinite; transform-origin: center; }
  .pulse2 { animation: pulse 9s ease-in-out infinite; animation-delay: -4.5s; }
  .arc { fill: none; stroke: var(--a); stroke-width: 1.5; stroke-linecap: round; animation: breathe 9s ease-in-out infinite; }
  .spin { animation: spin 90s linear infinite; transform-origin: 80px 80px; }
  .line { fill: var(--a); fill-opacity: 0.12; stroke: var(--a); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-opacity: 0.75; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
  @keyframes pulseHot { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
  @keyframes breathe { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.5; } }
  .gs1 { stop-color: var(--a2); } .gs2, .gs3 { stop-color: var(--a); }
  /* A long run just finished: the burst turns gold for a minute. */
  .ms .line { fill: #e8b84a; stroke: #e8b84a; stroke-opacity: 0.9; }
  .ms .arc { stroke: #e8b84a; }
  /* Neon looks: pink rings, pink arcs, and a glowing halo on the burst. */
  .ring { fill: none; stroke: var(--hi); stroke-width: 2; opacity: 0; }
  .neon .ring { opacity: 0.4; animation: ringpulse 5s ease-in-out infinite; }
  .neon .ring2 { animation-delay: -2.5s; }
  .neon .arc { stroke: var(--hi); stroke-width: 1.5; }
  .neon .line { filter: drop-shadow(0 0 2px var(--a)) drop-shadow(0 0 5px var(--hi)); }
  @keyframes ringpulse { 0%, 100% { opacity: 0.1; stroke-width: 1.2; } 50% { opacity: 0.4; stroke-width: 2; } }
  /* Moods: working glows hotter and the burst spins faster; waiting turns amber and throbs; error goes red and dim; asleep slows right down. */
  .m-ponder .pulse, .m-ponder .pulse2 { animation-name: pulseHot; animation-duration: 3.5s; }
  .m-ponder .spin { animation-duration: 16s; }
  .m-ponder .arc { animation-duration: 3.5s; }
  .m-wait .pulse, .m-wait .pulse2 { animation-name: pulseHot; animation-duration: 1.6s; }
  .m-wait .gs1 { stop-color: #f2b441; } .m-wait .gs2, .m-wait .gs3 { stop-color: #e0a030; }
  .m-wait .spin { animation-duration: 30s; }
  .m-error .gs1 { stop-color: #dc5a50; } .m-error .gs2, .m-error .gs3 { stop-color: #c8483c; }
  .m-error .pulse, .m-error .pulse2 { animation-duration: 14s; }
  .m-sleep .pulse, .m-sleep .pulse2 { animation-duration: 18s; }
  .m-sleep .spin { animation-duration: 400s; }
  .m-sleep .arc { animation-duration: 18s; }
</style>
<defs>
  <radialGradient id="g" cx="50%" cy="50%" r="50%">
    <stop class="gs1" offset="0" stop-opacity="0.85"/>
    <stop class="gs2" offset="0.5" stop-opacity="0.36"/>
    <stop class="gs3" offset="1" stop-opacity="0"/>
  </radialGradient>
</defs>
<g class="pulse">
  <ellipse cx="-60" cy="900" rx="754" ry="667" fill="url(#g)"/>
  <ellipse cx="1660" cy="80" rx="696" ry="609" fill="url(#g)"/>
</g>
<g class="pulse2">
  <ellipse cx="1680" cy="960" rx="580" ry="522" fill="url(#g)"/>
  <ellipse cx="-80" cy="60" rx="551" ry="493" fill="url(#g)"/>
</g>
<g>
  <circle class="arc" cx="-60" cy="900" r="260"/>
  <circle class="arc" cx="-60" cy="900" r="360"/>
  <circle class="arc" cx="1660" cy="80" r="240"/>
  <circle class="arc" cx="1660" cy="80" r="340"/>
</g>
<svg x="66%" y="2%" width="15%" height="30%" viewBox="0 0 160 160" preserveAspectRatio="xMaxYMin meet">
  <g class="spin">
    <g class="line" fill="none" stroke-width="4">
      <path d="M80 80 L80 14"/><path d="M80 80 L113 23"/><path d="M80 80 L137 47"/><path d="M80 80 L146 80"/>
      <path d="M80 80 L137 113"/><path d="M80 80 L113 137"/><path d="M80 80 L80 146"/><path d="M80 80 L47 137"/>
      <path d="M80 80 L23 113"/><path d="M80 80 L14 80"/><path d="M80 80 L23 47"/><path d="M80 80 L47 23"/>
    </g>
    <circle class="ring" cx="80" cy="80" r="72"/>
    <circle class="ring ring2" cx="80" cy="80" r="58"/>
    <circle class="line" cx="80" cy="80" r="9"/>
  </g>
</svg>
</svg>`

const crabStrip = (mood: string, delay: number, isPaused: boolean, list: Wheel[], hasMilestone: boolean, now: number, p: Palette, isCrabOn: boolean) => `<svg class="m-${mood}${p.neon ? ' neon' : ''}${isCrabOn ? '' : ' nocrab'}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 50">
<style>
  .nocrab .walk, .nocrab .baby { display: none; }
  .neon .px { filter: drop-shadow(0 0 1.5px var(--a)) drop-shadow(0 0 3px var(--hi)); }
  .neon .ws, .neon .wc { filter: drop-shadow(0 0 1.5px var(--hi)); }
  svg { --a: ${p.accent}; --a2: ${p.glow}; --hi: ${p.hi}; }
  .walk { transform-box: fill-box; transform-origin: center; animation: walk 72s ease-in-out infinite; animation-delay: -${delay}s; animation-play-state: ${isPaused ? 'paused' : 'running'}; }
  @keyframes walk { 0%, 4% { transform: translateX(0); } 48%, 52% { transform: translateX(${walkRange(list)}px); } 96%, 100% { transform: translateX(0); } }
  .ws { fill: none; stroke: var(--a); stroke-width: 1.8; stroke-linecap: round; }
  .wc { fill: var(--a); }
  .wspin { transform-box: fill-box; transform-origin: center; animation: wspin 4s linear infinite; }
  .w-running .wspin { animation-duration: 1.6s; }
  .w-wait .ws, .w-wait .wc { stroke: #f2b441; fill: #f2b441; animation: wflash 0.7s steps(2) infinite; }
  .w-wait .wc { stroke: none; }
  .w-done .wspin { animation: none; }
  .w-done .ws { stroke-opacity: 0.45; } .w-done .wc { fill-opacity: 0.45; }
  .wmore { fill: var(--a); font: 600 13px sans-serif; }
  .wcount { fill: var(--a); font: 600 16px -apple-system, 'Segoe UI', sans-serif; }
  .wc-wait { fill: #f2b441; }
  .tip { opacity: 0; pointer-events: none; }
  .wheel:hover .tip { opacity: 1; }
  .tip rect { fill: #0b0b0f; fill-opacity: 0.94; stroke: var(--a); stroke-width: 1.5; }
  .tip text { fill: #f5f5f7; font: 600 17px -apple-system, 'Segoe UI', sans-serif; }
  @keyframes wspin { to { transform: rotate(360deg); } }
  @keyframes wflash { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
  .bp { fill: #e8b84a; }
  .baby { animation: babywalk 16s ease-in-out infinite; }
  @keyframes babywalk { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(380px); } }
  .px { fill: var(--a); fill-opacity: 0.9; }
  .eye2 { fill: #171310; animation: blink 7s ease-in-out infinite; }
  .bob { animation: bob 6s ease-in-out infinite; }
  .clawL { animation: snap 3s ease-in-out infinite; transform-box: fill-box; transform-origin: 80% 80%; }
  .clawR { animation: snap 3s ease-in-out infinite; animation-delay: -1.5s; transform-box: fill-box; transform-origin: 20% 80%; }
  @keyframes snap { 0%, 80%, 100% { transform: rotate(0deg); } 90% { transform: rotate(-12deg); } }
  @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  @keyframes blink { 0%, 94%, 100% { opacity: 0.9; } 97% { opacity: 0.15; } }
  .bubble { opacity: 0; }
  .m-ponder .bubble { opacity: 0.9; }
  .d1, .d2, .d3 { animation: dot 1.8s ease-in-out infinite; }
  .d2 { animation-delay: 0.3s; } .d3 { animation-delay: 0.6s; }
  @keyframes dot { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
  .m-ponder .bob { animation: none; }
  .m-ponder .clawL { animation: none; transform: rotate(-35deg); }
  .m-ponder .eye2 { transform: translateY(-4px); animation: none; }
  .m-cheer .bob { animation: hop 0.55s ease-out 6; }
  @keyframes hop { 0%, 100% { transform: translateY(0); } 40% { transform: translateY(-26px); } 70% { transform: translateY(0); } 85% { transform: translateY(-5px); } }
  .spark { opacity: 0; fill: var(--hi); }
  .m-cheer .spark { animation: tw 0.55s ease-out 6; }
  @keyframes tw { 0% { opacity: 0; } 40% { opacity: 1; } 100% { opacity: 0; } }
  .alert, .zz { opacity: 0; }
  .m-wait .alert { opacity: 1; animation: nudge 0.8s ease-in-out infinite; }
  .m-wait .bob { animation: none; }
  .m-wait .clawL { animation: wave 0.7s ease-in-out infinite; }
  .m-wait .clawR { animation: wave 0.7s ease-in-out infinite; animation-delay: -0.35s; }
  @keyframes wave { 0%, 100% { transform: rotate(-45deg); } 50% { transform: rotate(-5deg); } }
  @keyframes nudge { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
  .m-error .bob { animation: none; transform: rotate(180deg); transform-box: fill-box; transform-origin: center; }
  .m-error .px { fill: #c8483c; }
  .m-error .eye2 { animation: none; opacity: 1; }
  .m-error .clawL, .m-error .clawR { animation: none; }
  .m-sleep .bob { animation: none; }
  .m-sleep .eye2 { animation: none; opacity: 1; transform: scaleY(0.15); transform-box: fill-box; transform-origin: center; }
  .m-sleep .clawL { animation: none; transform: rotate(18deg); }
  .m-sleep .clawR { animation: none; transform: rotate(-18deg); }
  .m-sleep .zz { opacity: 0.85; }
  .z1, .z2, .z3 { animation: zup 3.6s ease-in-out infinite; }
  .z2 { animation-delay: 1.2s; } .z3 { animation-delay: 2.4s; }
  @keyframes zup { 0% { opacity: 0; transform: translateY(8px); } 30% { opacity: 1; } 100% { opacity: 0; transform: translateY(-14px); } }
</style>
<g class="walk"><g class="bob"><g transform="translate(40,16) scale(0.34)">
  <g class="clawL"><rect class="px" x="12" y="30" width="26" height="26"/><rect class="px" x="12" y="30" width="10" height="12" fill-opacity="0.4"/><rect class="px" x="30" y="52" width="14" height="8"/></g>
  <g class="clawR"><rect class="px" x="122" y="30" width="26" height="26"/><rect class="px" x="138" y="30" width="10" height="12" fill-opacity="0.4"/><rect class="px" x="116" y="52" width="14" height="8"/></g>
  <rect class="px" x="40" y="40" width="80" height="46"/>
  <rect class="eye2" x="58" y="52" width="10" height="14"/>
  <rect class="eye2" x="92" y="52" width="10" height="14"/>
  <g class="bubble"><rect class="px" x="128" y="4" width="6" height="6"/><rect class="px" x="138" y="-8" width="10" height="10"/><rect class="px" fill-opacity="0.18" x="130" y="-50" width="64" height="38"/><rect class="d1 px" x="140" y="-34" width="8" height="8"/><rect class="d2 px" x="156" y="-34" width="8" height="8"/><rect class="d3 px" x="172" y="-34" width="8" height="8"/></g>
  <g class="alert"><rect class="px" x="86" y="-52" width="12" height="28"/><rect class="px" x="86" y="-16" width="12" height="12"/></g>
  <g class="zz">
    <path class="px z1" d="M128 14 h14 v5 l-9 12 h9 v5 h-14 v-5 l9 -12 h-9 z"/>
    <path class="px z2" d="M146 -6 h18 v6 l-11 15 h11 v6 h-18 v-6 l11 -15 h-11 z"/>
    <path class="px z3" d="M168 -30 h22 v7 l-13 18 h13 v7 h-22 v-7 l13 -18 h-13 z"/>
  </g>
  <g><rect class="spark" x="6" y="6" width="8" height="8"/><rect class="spark" x="146" y="0" width="8" height="8"/><rect class="spark" x="76" y="-14" width="8" height="8"/></g>
  <g><rect class="px" x="46" y="86" width="8" height="14"/><rect class="px" x="62" y="86" width="8" height="14"/><rect class="px" x="90" y="86" width="8" height="14"/><rect class="px" x="106" y="86" width="8" height="14"/></g>
</g></g></g>
${hasMilestone ? BABY : ''}
${wheelsMarkup(list, now)}
</svg>`

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const { name } = await read($, palette)
    const { look, unpainted } = lookFor(name)

    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }
    const set = await $.theme.set(look)

    if (!set.isDrawn) {
      $.ui.status(set.reason)
    }
    await $.command.register({ name: 'crab', description: 'Turn the crab off or on for this chat: /crab, /crab on, /crab off' })
    await $.command.register({
      name: 'look',
      description: `Switch this chat's look: ${Object.keys(PALETTES).join(', ')} (e.g. /look teal). /look alone lists them.`,
    })

    // A fresh session: the crab starts walking, and falls asleep after five quiet minutes.
    const start = await $.clock.now()
    await update($, crab, c => (c.since === 0 && c.mood === 'idle' ? { ...c, since: start } : c))
    $.clock.every(15_000, () => {
      void (async () => {
        const now = await $.clock.now()
        const c = await read($, crab)

        if ((c.mood === 'idle' || c.mood === 'cheer') && c.since > 0 && now - c.since > SLEEP_AFTER_MS) {
          await update($, crab, cur => stopped(cur, now, 'sleep'))
        }

        // finished wheels fade out, and the milestone glow and baby crab end after their minute
        const list = await read($, wheels)

        if (list.some(w => w.endedAt > 0 && now - w.endedAt > DONE_WHEEL_SHOW_MS)) {
          await update($, wheels, cur => cur.filter(w => w.endedAt === 0 || now - w.endedAt <= DONE_WHEEL_SHOW_MS))
        }
        const m = await read($, milestone)

        if (m.until > 0 && now > m.until) {
          await update($, milestone, () => ({ until: 0, label: '' }))
        }

        // keep the hover run times fresh while helpers are working, and the count in the status line
        if (list.some(w => w.state !== 'done')) {
          $.ui.invalidate('ui.render')
        }
        await showHelpers($)
      })()
    })

    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      const now = await $.clock.now()
      await update($, crab, c => (c.mood === 'ponder' ? c : stopped(c, now, 'ponder')))
    } else {
      // a helper agent started: it gets its own small star wheel
      const id = e.agentId
      const known = (await $.agent.list()).find(a => a.id === id)
      const label = known ? known.description || known.name || known.type : 'helper agent'
      const now = await $.clock.now()
      await update($, wheels, list => [...list.filter(w => w.id !== id), { id, label, state: 'running', startedAt: now, endedAt: 0 }])
      await showHelpers($)
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) {
      const id = e.agentId
      const now = await $.clock.now()
      await update($, wheels, list => list.map(w => (w.id === id ? { ...w, state: 'done', endedAt: now } : w)))
      await showHelpers($)
    } else {
      const now = await $.clock.now()

      // a long, successful run: gold burst and a baby crab for a minute
      if (e.reason === 'answer' && e.durationMs >= MILESTONE_MIN_MS) {
        const mins = Math.round(e.durationMs / 60_000)
        await update($, milestone, () => ({ until: now + MILESTONE_SHOW_MS, label: `Finished a ${mins}-minute run` }))
      }

      if (e.reason === 'error' || e.reason === 'refusal') {
        await update($, crab, c => stopped(c, now, 'error'))
      } else {
        // an answer earns a hop; an interruption just lets the crab carry on
        const mood = e.reason === 'answer' ? 'cheer' : 'idle'
        await update($, crab, c => ({ mood, walked: c.walked, since: now }))
      }
    }

    return next(e)
  })

  // A tool call the person has to approve: the crab waves for attention until the tool runs.
  on('tool.check', async ($, e, next) => {
    const verdict = await next(e)

    if (verdict.decision === 'ask') {
      const now = await $.clock.now()
      const id = e.agentId

      if (id === undefined) {
        await update($, crab, c => (c.mood === 'wait' ? c : stopped(c, now, 'wait')))
      } else {
        // a helper agent is waiting on you: its wheel flashes
        await update($, wheels, list => list.map(w => (w.id === id ? { ...w, state: 'wait' } : w)))
      }
    }

    return verdict
  })

  // Back to thinking once the tool has run.
  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    const id = e.agentId

    if (id === undefined) {
      await update($, crab, c => (c.mood === 'wait' ? { ...c, mood: 'ponder' } : c))
    } else {
      await update($, wheels, list => list.map(w => (w.id === id && w.state === 'wait' ? { ...w, state: 'running' } : w)))
    }

    return ran
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }

    const { Svg } = $.ui.resolve(e)
    const { mood } = await read($, crab)
    const m = await read($, milestone)
    const { name } = await read($, palette)
    const now = await $.clock.now()

    return <Svg source={scene(mood, m.until > now, paletteFor(name))} alt="A soft orange glow slowly pulsing at the corners" isInteractive />
  })

  // The crab lives in its own strip right above the usage row, so it stays on the bar at any window size.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || !(e.plugin ?? '').startsWith('ember-glow') || e.props.hasSurvey) {
      return next(e)
    }

    const { Svg } = $.ui.resolve(e)
    const c = await read($, crab)
    const now = await $.clock.now()
    const walked = c.since === 0 ? c.walked : (c.walked + (now - c.since) / 1000) % WALK_SECONDS
    const list = [...(await read($, wheels))].sort((a, b) => Number(b.state === 'wait') - Number(a.state === 'wait'))
    const { isOn } = await read($, crabSwitch)

    // crab off and no helpers to show: no strip at all, so the chat gets its room back
    if (!isOn && list.length === 0) {
      return next(e)
    }
    const m = await read($, milestone)
    const { name } = await read($, palette)

    return <Svg source={crabStrip(c.mood, walked, c.since === 0, list, m.until > now, now, paletteFor(name), isOn)} alt="A small pixel crab walking along the usage bar, with a star wheel for each helper agent" width={900} height={50} isInteractive />
  })

  // Looks with a `userInk` draw the person's own typed messages in it, apart from Claude's text.
  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    const { name } = await read($, palette)
    const ink = paletteFor(name).userInk

    // the desktop app talks to the session as an SDK host, so its typed prompts arrive as 'sdk' (a phone's as 'bridge')
    const kind = e.props.origin.kind

    if (ink === undefined || (kind !== 'composer' && kind !== 'sdk' && kind !== 'bridge')) {
      return next(e)
    }
    const { Text } = $.ui.resolve(e)

    return <Text color={ink}>{e.props.text}</Text>
  })

  // /crab, /crab on, /crab off: hide or show the crab in this chat. Helper wheels still show while helpers run.
  on('command.run', { command: 'crab' }, async ($, e) => {
    const word = e.args.trim().toLowerCase()
    const { isOn } = await read($, crabSwitch)
    const next = word === 'on' ? true : word === 'off' ? false : !isOn
    await update($, crabSwitch, () => ({ isOn: next }))

    return { text: next ? 'The crab is back.' : 'The crab is off for this chat. Helper wheels will still show while helpers run. Type /crab to bring him back.' }
  })

  // /look <name>: switch this chat's palette. It is kept in the session, so other chats keep their own.
  on('command.run', { command: 'look' }, async ($, e) => {
    const want = e.args.trim().toLowerCase()
    const names = Object.keys(PALETTES)

    if (!(want in PALETTES)) {
      const lines = names.map(n => `  ${n}: ${PALETTES[n]?.label}`).join('\n')

      return { text: `Looks for this chat (type /look <name>):\n${lines}` }
    }
    const { look, unpainted } = lookFor(want)
    await update($, palette, () => ({ name: want }))
    const set = await $.theme.set(look)

    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }

    return { text: set.isDrawn ? `This chat now uses the ${want} look.` : `Saved ${want} for this chat, but nothing draws it here: ${set.reason}` }
  })

  // Put the crab strip above the other rows (the usage meter's), so it stands on top of them.
  on('ui.render', { component: 'AbovePromptList' }, async ($, e, next) => {
    const mine = e.props.rows.filter(r => r.plugin.startsWith('ember-glow'))
    const others = e.props.rows.filter(r => !r.plugin.startsWith('ember-glow'))

    return next({ ...e, props: { ...e.props, rows: [...mine, ...others] } })
  })
}
