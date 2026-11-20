import { CustomEditor } from "@earendil-works/pi-coding-agent";
import type { EditorTheme, TUI } from "@earendil-works/pi-tui";
import { boxLines, borderLabel, isRule, ruleLabel } from "./box.ts";

/** Shared, mutable chrome state written by extension events, read at render time. */
export interface BoxState {
  working: boolean;
  tick: number;
  model?: string;
}

export class BoxedEditor extends CustomEditor {
  private chrome: BoxState;

  constructor(
    tui: TUI,
    theme: EditorTheme,
    keybindings: ConstructorParameters<typeof CustomEditor>[2],
    chrome: BoxState,
  ) {
    // Stock Pi editor embeds the working loader in the top border so the dock
    // height does not jump when a turn ends. Without this, Pi parks a 2-line
    // loader above the editor and clears it on settle — Roamgate mobile wraps.
    super(tui, theme, keybindings, { embedWorkingStatus: true });
    this.chrome = chrome;
  }

  render(width: number): string[] {
    const raw = super.render(Math.max(1, width - 2));
    // Editor output: top rule, body…, bottom rule, then optional autocomplete lines.
    let bottom = raw.length - 1;
    while (bottom > 0 && !isRule(raw[bottom]!)) bottom--;
    const body = raw.slice(1, bottom);
    const extras = raw.slice(bottom + 1);
    const topHint = ruleLabel(raw[0]!);

    // Pi writes thinking/bash into this.borderColor (updateEditorBorderColor).
    const boxed = boxLines(
      body,
      width,
      this.borderColor,
      borderLabel({
        working: this.chrome.working,
        tick: this.chrome.tick,
        model: this.chrome.model,
        scrollHint: /[↑↓]/.test(topHint) ? topHint : undefined,
      }),
      ruleLabel(raw[bottom]!),
    );
    return boxed.concat(extras);
  }
}
