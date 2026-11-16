import { test, expect } from 'claude-code/testing'
import { untilText, line, tone, bar, ordered, parseDate, applyArgs, extrasLine } from './meter'

const now = Date.parse('2026-10-12T12:00:00Z')

test('countdowns read like the person asked', () => {
  expect(untilText('2026-10-12T15:30:00Z', now)).toBe('3h 30m')
  expect(untilText('2026-10-17T15:00:00Z', now)).toBe('5d 3h')
  expect(untilText('2026-10-12T12:12:00Z', now)).toBe('12m')
  expect(untilText(undefined, now)).toBe('')
})

test('5-hour first, then weekly, in one line', () => {
  const ls = [
    { kind: 'seven_day', percentUsed: 7, resetsAt: '2026-10-17T15:00:00Z' },
    { kind: 'five_hour', percentUsed: 30, resetsAt: '2026-10-12T15:30:00Z' },
  ]
  expect(ordered(ls)[0].kind).toBe('five_hour')
  expect(line(ls, now)).toBe('5-hr 30% · resets 3h 30m   Weekly 7% · resets 5d 3h')
})

test('colors and bar', () => {
  expect(tone(30)).toBe('success')
  expect(tone(65)).toBe('warning')
  expect(tone(91)).toBe('error')
  expect(bar(30)).toBe('███░░░░░░░')
})

test('dates as Ben types them', () => {
  expect(parseDate('10.22', now)).toBe('2026-10-22')
  expect(parseDate('11/5', now)).toBe('2026-11-05')
  expect(parseDate('Nov 5', now)).toBe('2026-11-05')
  expect(parseDate('1.3', now)).toBe('2027-01-03')
  expect(parseDate('2026-10-22', now)).toBe('2026-10-22')
  expect(parseDate('soon', now)).toBe(null)
})

test('/meter resets and credit', () => {
  let r = applyArgs('resets 1 10.22', {}, now)
  expect(r.reply).toBe('Saved: 1 full reset, expires Oct 22 (in 10 days).')
  r = applyArgs('credit 242 250 11.5', r.extras, now)
  expect(r.extras.credit).toEqual({ left: 242, total: 250, expires: '2026-11-05' })
  expect(extrasLine(r.extras, now)).toBe('Full resets: 1 · expires Oct 22 (in 10 days)   Cloud credit: $242 of $250 · expires Nov 5 (in 24 days)')
  expect(applyArgs('clear', r.extras, now).extras).toEqual({})
  expect(applyArgs('resets lots', r.extras, now).reply.startsWith('Use: /meter')).toBe(true)
})
