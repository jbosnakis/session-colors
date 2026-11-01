# session-colors

Give each Claude Code conversation its own color, so you can tell them apart at a glance in split view.

- **Tinted conversation:** messages and tool rows take the color you pick.
- **Icon by the prompt:** a colored dot sits left of the model name, under the prompt. Click it to open the choices.
- **Seven colors or your own:** pick a preset or type any hex value, such as `#0f766e`.
- **Remembered per conversation:** the color comes back when you reopen it.
- **Colored titles:** the included `session-color` skill puts colored squares at the start of the title, so the color also shows in the pane header and the sidebar.

## Install

At the prompt of a terminal session:

```
/plugin install session-colors --marketplace jbosnakis/session-colors
```

Answer `y` to add the marketplace, then choose a scope. The user scope gives you the mod in every conversation.

From a shell:

```bash
claude plugin install session-colors --marketplace jbosnakis/session-colors
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `jbosnakis/session-colors`, then **Add plugin**.

Conversations that are already open pick it up after `/reload-plugins`, or when you reopen them.

## Use

- Click the dot under the prompt, or run `/color-picker`, to open the choices. They close once you pick.
- To color a title, run the `session-color` skill with a color name: red, orange, yellow, green, blue, purple, brown, black or white. `clear` removes it.

## Limits

- The app does not let a mod change the window's background or borders, so margins, the header and the side panel keep their usual color.
- Message text stays the app's own color, so dark colors read best.
- The dot is the nearest colored emoji, because buttons ignore a custom text color. Messages use your exact hex.
- The interface labels are in Greek.
- Built for the Claude Code desktop app. Mods are an early-access feature and may change between releases.

## License

MIT
