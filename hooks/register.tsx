import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { SessionColor } from '../types'

const PALETTE: (SessionColor & { glyph: string })[] = [
  { hex: '#7f1d1d', text: '#fee2e2', label: 'Κόκκινο', glyph: '🔴' },
  { hex: '#7c2d12', text: '#ffedd5', label: 'Πορτοκαλί', glyph: '🟠' },
  { hex: '#713f12', text: '#fef9c3', label: 'Κίτρινο', glyph: '🟡' },
  { hex: '#14532d', text: '#dcfce7', label: 'Πράσινο', glyph: '🟢' },
  { hex: '#1e3a8a', text: '#dbeafe', label: 'Μπλε', glyph: '🔵' },
  { hex: '#581c87', text: '#f3e8ff', label: 'Μωβ', glyph: '🟣' },
  { hex: '#3f2a1d', text: '#f5e6d3', label: 'Καφέ', glyph: '🟤' },
]

const TINTED = new Set<string>([
  'UserMessage',
  'AssistantMessage',
  'ToolGroup',
  'ToolUse',
  'ToolResult',
  'ToolProgress',
  'CommandOutput',
  'InfoNotice',
  'TurnDuration',
])

// `#abc`, `abc`, `#aabbcc` or `aabbcc`, with text that reads on it.
const parseCustom = (value: string): SessionColor | null => {
  const raw = value.trim().replace(/^#/, '').toLowerCase()

  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/.test(raw)) {
    return null
  }

  const six = raw.length === 3 ? raw.replace(/./g, c => c + c) : raw
  const [r, g, b] = [0, 2, 4].map(at => parseInt(six.slice(at, at + 2), 16)) as [
    number,
    number,
    number,
  ]
  const brightness = (r * 299 + g * 587 + b * 114) / 1000

  return {
    hex: `#${six}`,
    text: brightness > 140 ? '#111111' : '#ffffff',
    label: `#${six}`,
  }
}

// A native button draws its label in the app's own color, so the icon is an
// emoji: the one nearest the chosen hue.
const rgbOf = (hex: string) =>
  [1, 3, 5].map(at => parseInt(hex.slice(at, at + 2), 16)) as [number, number, number]

const hueOf = (hex: string) => {
  const rgb = rgbOf(hex)
  const top = Math.max(...rgb, 1)

  return rgb.map(part => part / top)
}

const glyphOf = (hex: string) => {
  const hue = hueOf(hex)
  const gap = (other: string) =>
    hueOf(other).reduce((sum, part, at) => sum + (part - (hue[at] ?? 0)) ** 2, 0)

  return [...PALETTE, { hex: '#ffffff', glyph: '⚪' }].reduce((best, one) =>
    gap(one.hex) < gap(best.hex) ? one : best,
  ).glyph
}

const color = atom({ plugin: 'session-colors', key: 'color' } as const, null)
const isPicking = atom(
  { plugin: 'session-colors', key: 'isPicking' } as const,
  false,
)

export const register: Register = on => {
  on('ui.render', async ($, e, next) => {
    const drawn = await next(e)

    if (!TINTED.has(e.component)) {
      return drawn
    }

    const current = await read($, color)

    if (current === null) {
      return drawn
    }

    const { Box } = $.ui.resolve(e)

    // Size and padding props around an engine node are refused.
    return (
      <Box
        backgroundColor={current.hex}
        borderColor={current.hex}
        borderStyle="bold"
      >
        {drawn}
      </Box>
    )
  })

  on('session.start', async ($, e, next) => {
    const ran = await next(e)
    await $.command.register({
      name: 'color-picker',
      description: 'Άνοιξε τις επιλογές χρώματος αυτής της συζήτησης',
    })
    const saved = await $.store.get(`color:${await $.session.id()}`)

    if (saved !== undefined) {
      await update($, color, () => saved as SessionColor)
    }

    return ran
  })

  on('command.run', { command: 'color-picker' }, async $ => {
    await update($, isPicking, open => !open)

    return { text: 'Επιλογές χρώματος.' }
  })

  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    const drawn = await next(e)
    const { Box, Button } = $.ui.resolve(e)
    const current = await read($, color)

    return (
      <Box>
        <Button
          key="dot"
          label={current === null ? '○' : glyphOf(current.hex)}
          plain
          onPress={() => update($, isPicking, open => !open)}
        />
        {drawn}
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || !(await read($, isPicking))) {
      return next(e)
    }

    const table = $.ui.resolve(e)
    const { Box, Button } = table
    const Input = 'Input' in table ? table.Input : undefined
    const current = await read($, color)

    const pick = async (chosen: SessionColor | null) => {
      const key = `color:${await $.session.id()}`

      if (chosen === null) {
        await $.store.delete(key)
      } else {
        await $.store.set(key, chosen)
      }

      await update($, color, () => chosen)
      await update($, isPicking, () => false)
    }

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexWrap="wrap" gap={1}>
          {PALETTE.map(one => (
            <Button
              key={one.hex}
              label={one.glyph}
              plain
              onPress={() => pick({ hex: one.hex, text: one.text, label: one.label })}
            />
          ))}
          {current !== null && (
            <Button key="clear" label="Χωρίς χρώμα" plain onPress={() => pick(null)} />
          )}
        </Box>
        {Input !== undefined && (
          <Input
            key="custom"
            placeholder="Δικό σου χρώμα, π.χ. #0f766e"
            submitLabel="Εφαρμογή"
            onSubmit={value => {
              const custom = parseCustom(value)

              if (custom === null) {
                $.ui.toast('Γράψε χρώμα hex, π.χ. #0f766e')

                return
              }

              return pick(custom)
            }}
          />
        )}
      </Box>
    )
  })
}
