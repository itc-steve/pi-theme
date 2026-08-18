import { CustomEditor } from "@earendil-works/pi-coding-agent";
import type { EditorTheme, TUI } from "@earendil-works/pi-tui";
import { boxLines, borderLabel, isRule, ruleLabel } from "./box.ts";

/** Shared, mutable chrome state written by extension events, read at render time. */
export interface BoxState {
  working: boolean;
  tick: number;
  model?: string;
  color: (s: string) => string;
}

export class BoxedEditor extends CustomEditor {
  private chrome: BoxState;

  constructor(
    tui: TUI,
    theme: EditorTheme,
    keybindings: ConstructorParameters<typeof CustomEditor>[2],
    chrome: BoxState,
  ) {
    super(tui, theme, keybindings);
    this.chrome = chrome;
  }

  render(width: number): string[] {
    const raw = super.render(Math.max(3, width - 2));
    // Editor output: top rule, body…, bottom rule, then optional autocomplete lines.
    let bottom = raw.length - 1;
    while (bottom > 0 && !isRule(raw[bottom]!)) bottom--;
    const body = raw.slice(1, bottom);
    const extras = raw.slice(bottom + 1);

    const boxed = boxLines(
      body,
      width,
      this.chrome.color,
      borderLabel({
        working: this.chrome.working,
        tick: this.chrome.tick,
        model: this.chrome.model,
        scrollHint: ruleLabel(raw[0]!),
      }),
      ruleLabel(raw[bottom]!),
    );
    return boxed.concat(extras);
  }
}
