export type SessionColor = { hex: string; text: string; label: string }

declare module 'claude-code' {
  interface PluginState {
    'session-colors': { color: SessionColor | null; isPicking: boolean }
  }
}
