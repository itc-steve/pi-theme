<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="pi-theme: cleaner code blocks and a focused editor for Pi">
</p>

# pi-theme

Personal Pi Theme — a small [Pi](https://pi.dev) package: a dark `pi-theme` palette plus cleaner code blocks and a focused editor frame.

## What changes

### Palette

After `pi install`, **pi-theme** shows up in `/settings` → Theme. Matches Noctalia's **electric-blue** palette: charcoal backgrounds, electric-blue accents, cyan highlights, gold strings, green functions. Tweak `themes/pi-theme.json` (`vars` first). This is a static palette, not automatic Noctalia sync.

### Fenceless code blocks

Fenced Markdown code renders without visible backtick fences. Syntax highlighting remains, and each line fills the available width with Pi's `toolPendingBg` theme color. Blockquotes keep italic/quote color but drop the `│` gutter, so a line select copies the text instead of the chrome.

### Boxed editor

The input editor gets a `╭─╮ │ ╰─╯` frame. Border color is Pi's live editor border: thinking-level tokens (`thinkingOff`…`thinkingMax`) or `bashMode`. Top border shows the active model and a braille spinner while Pi works. Scroll hints move into the top and bottom borders.

## Install

Review the source first: Pi extensions run with your full system permissions.

```bash
pi install npm:@itc-steve/pi-theme
```

Restart Pi after installation. Local checkout:

```bash
pi install /path/to/pi-theme
```

## Development

Requirements: Node.js with TypeScript type stripping support and Pi's core packages available as peers.

```bash
npm test
```

The package has no runtime dependencies beyond Pi.

## License

[MIT](./LICENSE) © 2026 itc-steve
