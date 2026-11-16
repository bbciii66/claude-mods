import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Extras, Limit } from '../types'
import { applyArgs, bar, extrasLine, label, line, ordered, tone, untilText, withFiveHour } from './meter'

const limits = atom({ plugin: 'usage-meter', key: 'limits' } as const, [] as Limit[])
const now = atom({ plugin: 'usage-meter', key: 'now' } as const, 0)
const extras = atom({ plugin: 'usage-meter', key: 'extras' } as const, {} as Extras)

function statusText(ls: Limit[], x: Extras, t: number): string | undefined {
  const text = [ls.length ? line(ls, t) : '', extrasLine(x, t)].filter(Boolean).join('   ')
  return text || undefined
}

async function refresh($: EngineInterface) {
  const u = await $.session.usage()
  const t = await $.clock.now()
  const ls = u.rateLimits.map(r => ({ kind: r.kind, percentUsed: r.percentUsed, resetsAt: r.resetsAt }))
  await update($, limits, () => ls)
  await update($, now, () => t)
  $.ui.status(statusText(ls, await read($, extras), t))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    // first run starts empty; /meter fills it in
    let saved = (await $.store.get('extras')) as Extras | undefined
    if (saved === undefined) {
      saved = {}
      await $.store.set('extras', saved)
    }
    await update($, extras, () => saved)
    await $.command.register({
      name: 'meter',
      description: 'Usage meter: enter your limit resets and cloud credit, e.g. /meter resets 2  or  /meter fable 2  or  /meter credit 242 250 11.5',
    })
    await refresh($)
    $.clock.every(60_000, () => {
      void refresh($)
    })
    return r
  })

  on('command.run', { command: 'meter' }, async ($, e) => {
    const t = await $.clock.now()
    const res = applyArgs(e.args, await read($, extras), t)
    await $.store.set('extras', res.extras)
    await update($, extras, () => res.extras)
    await refresh($)
    return { text: res.reply }
  })

  on('session.measure', async ($, e, next) => {
    const t = await $.clock.now()
    const ls = e.rateLimits.map(r => ({ kind: r.kind, percentUsed: r.percentUsed, resetsAt: r.resetsAt }))
    await update($, limits, () => ls)
    await update($, now, () => t)
    $.ui.status(statusText(ls, await read($, extras), t))
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const ls = await read($, limits)
    const x = await read($, extras)
    if (e.props.hasSurvey || (ls.length === 0 && !x.resets && !x.fable && !x.credit)) {
      return next(e)
    }
    const t = await read($, now)
    const more = extrasLine(x, t)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Box flexDirection="row" flexWrap="wrap" gap={3}>
          {ordered(withFiveHour(ls)).map(l => {
            const isIdle = l.kind === 'five_hour' && !l.resetsAt
            const u = isIdle ? 'idle, no window running' : untilText(l.resetsAt, t)
            return (
              <Box key={l.kind} flexDirection="row" gap={1}>
                <Text bold>{label(l.kind)}</Text>
                <Text color={tone(l.percentUsed)}>{bar(l.percentUsed)}</Text>
                <Text color={tone(l.percentUsed)} bold>{`${Math.round(l.percentUsed)}%`}</Text>
                {u ? <Text dimColor>{isIdle ? u : `resets in ${u}`}</Text> : null}
              </Box>
            )
          })}
        </Box>
        {more ? <Text dimColor>{more}</Text> : null}
      </Box>
    )
  })
}
