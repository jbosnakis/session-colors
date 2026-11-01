import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const BAND = {
  plugin: 'session-colors',
  component: 'AbovePrompt',
  surface: 'desktop',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 60,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

const FOOTER = {
  plugin: 'session-colors',
  component: 'SessionMode',
  surface: 'desktop',
  props: { modes: [] },
} as const

const engine = (on: On) => {
  mock.store(on)
  on('session.id', () => ({ value: 'one' }))
  on('ui.toast', () => ({ value: undefined }))
  on('command.register', () => ({ value: { command: 'color-picker' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })
}

test('the footer icon opens the choices, and a pick closes them and is kept', async ($, on) => {
  engine(on)

  const band = await $.ui.mount(BAND)
  const footer = await $.ui.mount(FOOTER)

  expect(await band.find({ type: 'Button', key: '#1e3a8a' })).toBeFalsy()
  expect(await band.find({ type: 'Text', text: /engine/ })).toBeTruthy()
  expect((await footer.find({ type: 'Button', key: 'dot' }))?.text).toBe('○')
  expect(await footer.find({ type: 'Text', text: /engine/ })).toBeTruthy()

  await footer.press({ key: 'dot' })
  await band.press({ key: '#1e3a8a' })

  expect(await band.find({ type: 'Button', key: '#7f1d1d' })).toBeFalsy()
  expect((await footer.find({ type: 'Button', key: 'dot' }))?.text).toBe('🔵')
  await band.unmount()
  await footer.unmount()

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const again = await $.ui.mount(FOOTER)

  expect((await again.find({ type: 'Button', key: 'dot' }))?.text).toBe('🔵')
  await again.unmount()
})

test('a custom hex takes the nearest icon, and a bad one changes nothing', async ($, on) => {
  engine(on)

  const band = await $.ui.mount(BAND)
  const footer = await $.ui.mount(FOOTER)

  await footer.press({ key: 'dot' })
  await band.input({ key: 'custom', text: 'not a color' })
  expect((await footer.find({ type: 'Button', key: 'dot' }))?.text).toBe('○')

  await band.input({ key: 'custom', text: '1D3A49' })
  expect((await footer.find({ type: 'Button', key: 'dot' }))?.text).toBe('🔵')
  await band.unmount()
  await footer.unmount()
})

test('the command opens the choices', async ($, on) => {
  engine(on)

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.command.run({ command: 'color-picker' } as never)

  const band = await $.ui.mount(BAND)

  expect(await band.find({ type: 'Button', key: '#1e3a8a' })).toBeTruthy()
  await band.unmount()
})

test('a survey keeps the band', async ($, on) => {
  engine(on)

  const ui = await $.ui.mount({
    ...BAND,
    props: { ...BAND.props, hasSurvey: true },
  })

  expect(await ui.find({ type: 'Text', text: /engine/ })).toBeTruthy()
  await ui.unmount()
})
