import { atom, read, update } from 'claude-code'
import type { Register, ThemeSetArgs } from 'claude-code'

import type { Crab } from '../types'

import { makeColors } from './make-colors.js'

// Warm black by night, warm cream by day, Claude orange throughout.
const { theme, problems } = makeColors({
  label: 'Ember glow',
  roles: { accent: '#d97757', danger: '#c8483c', success: '#6f9a55', warning: '#c9902b', pro: '#a5799c' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#f3ebe0',
        'surface-1': '#f8f2e8',
        'surface-2': '#fcf8f1',
        'text-primary': '#2b2119',
        'text-secondary': '#54463a',
        'text-muted': '#6b5b4d',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#171310',
        'surface-1': '#1f1915',
        'surface-2': '#27201a',
        'surface-3': '#2e261f',
        'text-primary': '#f3e9dd',
        'text-secondary': '#d2c4b3',
        'text-muted': '#ad9d8a',
      },
    },
  },
})

const LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: 'ember-glow', glass: false },
}

// Art lives in the outer ~18% of each side; the middle stays empty so it never sits behind messages.
const WALK_SECONDS = 72

const crab = atom({ plugin: 'ember-glow', key: 'crab' } as const, { mood: 'idle', walked: 0, since: 0 } as Crab, {
  shape: 'crab-1',
})

// Stop the crab where it stands: bank the walking done so far.
const stopped = (c: Crab, now: number, mood: string): Crab => ({
  mood,
  walked: c.since === 0 ? c.walked : (c.walked + (now - c.since) / 1000) % WALK_SECONDS,
  since: 0,
})

const scene = (mood: string, delay: number, isPaused: boolean) => `<svg class="m-${mood}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<style>
  .pulse { animation: pulse 9s ease-in-out infinite; transform-origin: center; }
  .pulse2 { animation: pulse 9s ease-in-out infinite; animation-delay: -4.5s; }
  .arc { fill: none; stroke: #d97757; stroke-width: 1.5; stroke-linecap: round; animation: breathe 9s ease-in-out infinite; }
  .bob { animation: bob 6s ease-in-out infinite; }
  .spin { animation: spin 90s linear infinite; transform-origin: 80px 80px; }
  .eye { fill: #f0a47f; animation: blink 7s ease-in-out infinite; transform-origin: center; }
  .line { fill: #d97757; fill-opacity: 0.12; stroke: #d97757; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-opacity: 0.75; }
  .walk { transform-box: fill-box; transform-origin: center; animation: walk 72s ease-in-out infinite; animation-delay: -${delay}s; animation-play-state: ${isPaused ? "paused" : "running"}; }
  @keyframes walk { 0%, 4% { transform: translateX(0); } 48%, 52% { transform: translateX(950px); } 96%, 100% { transform: translateX(0); } }
  .px { fill: #d97757; fill-opacity: 0.85; }
  .eye2 { fill: #171310; animation: blink 7s ease-in-out infinite; }
  .clawL { animation: snap 3s ease-in-out infinite; transform-box: fill-box; transform-origin: 80% 80%; }
  .clawR { animation: snap 3s ease-in-out infinite; animation-delay: -1.5s; transform-box: fill-box; transform-origin: 20% 80%; }
  @keyframes snap { 0%, 80%, 100% { transform: rotate(0deg); } 90% { transform: rotate(-12deg); } }
  @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes blink { 0%, 94%, 100% { opacity: 0.9; } 97% { opacity: 0.15; } }
  @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
  @keyframes breathe { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.5; } }
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
  .spark { opacity: 0; fill: #f0a47f; }
  .m-cheer .spark { animation: tw 0.55s ease-out 6; }
  @keyframes tw { 0% { opacity: 0; } 40% { opacity: 1; } 100% { opacity: 0; } }
</style>
<defs>
  <radialGradient id="g" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#e8855f" stop-opacity="0.85"/>
    <stop offset="0.5" stop-color="#d97757" stop-opacity="0.36"/>
    <stop offset="1" stop-color="#d97757" stop-opacity="0"/>
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
<svg x="0" y="74.5%" width="100%" height="11%" viewBox="0 0 1600 110" preserveAspectRatio="xMinYMax meet">
  <g class="walk"><g class="bob"><g transform="translate(300,65) scale(0.35)">
    <g class="clawL"><rect class="px" x="12" y="30" width="26" height="26"/><rect class="px" x="12" y="30" width="10" height="12" fill-opacity="0.4"/><rect class="px" x="30" y="52" width="14" height="8"/></g>
    <g class="clawR"><rect class="px" x="122" y="30" width="26" height="26"/><rect class="px" x="138" y="30" width="10" height="12" fill-opacity="0.4"/><rect class="px" x="116" y="52" width="14" height="8"/></g>
    <rect class="px" x="40" y="40" width="80" height="46"/>
    <rect class="eye2" x="58" y="52" width="10" height="14"/>
    <rect class="eye2" x="92" y="52" width="10" height="14"/>
        <g class="bubble"><rect class="px" x="128" y="4" width="6" height="6"/><rect class="px" x="138" y="-8" width="10" height="10"/><rect class="px" fill-opacity="0.18" x="130" y="-50" width="64" height="38"/><rect class="d1 px" x="140" y="-34" width="8" height="8"/><rect class="d2 px" x="156" y="-34" width="8" height="8"/><rect class="d3 px" x="172" y="-34" width="8" height="8"/></g>
    <g><rect class="spark" x="6" y="6" width="8" height="8"/><rect class="spark" x="146" y="0" width="8" height="8"/><rect class="spark" x="76" y="-14" width="8" height="8"/></g>
    <g class="legs"><rect class="px" x="46" y="86" width="8" height="14"/><rect class="px" x="62" y="86" width="8" height="14"/><rect class="px" x="90" y="86" width="8" height="14"/><rect class="px" x="106" y="86" width="8" height="14"/></g>
    </g></g></g>
</svg>
<svg x="66%" y="2%" width="15%" height="30%" viewBox="0 0 160 160" preserveAspectRatio="xMaxYMin meet">
  <g class="spin">
    <g class="line" fill="none" stroke-width="4">
      <path d="M80 80 L80 14"/><path d="M80 80 L113 23"/><path d="M80 80 L137 47"/><path d="M80 80 L146 80"/>
      <path d="M80 80 L137 113"/><path d="M80 80 L113 137"/><path d="M80 80 L80 146"/><path d="M80 80 L47 137"/>
      <path d="M80 80 L23 113"/><path d="M80 80 L14 80"/><path d="M80 80 L23 47"/><path d="M80 80 L47 23"/>
    </g>
    <circle class="line" cx="80" cy="80" r="9"/>
  </g>
</svg>
</svg>`

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))

    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }
    const set = await $.theme.set(LOOK)

    if (!set.isDrawn) {
      $.ui.status(set.reason)
    }

    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      const now = await $.clock.now()
      await update($, crab, c => (c.mood === 'ponder' ? c : stopped(c, now, 'ponder')))
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      const now = await $.clock.now()
      const isDone = e.reason === 'answer'
      await update($, crab, c => ({ mood: isDone ? 'cheer' : 'idle', walked: c.walked, since: now }))
    }

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }

    const { Svg } = $.ui.resolve(e)
    const c = await read($, crab)
    const now = await $.clock.now()
    const walked = c.since === 0 ? c.walked : (c.walked + (now - c.since) / 1000) % WALK_SECONDS

    return <Svg source={scene(c.mood, walked, c.since === 0)} alt="A soft orange glow slowly pulsing at the corners" isInteractive />
  })
}
