import type { ExtensionAPI, Theme } from "@earendil-works/pi-coding-agent";
import { Markdown, visibleWidth, wrapTextWithAnsi } from "@earendil-works/pi-tui";
import { BoxedEditor, type BoxState } from "./src/editor.ts";

/** Blue box chrome. ponytail: fixed ANSI blue, wire to a theme color if you add one. */
const BLUE = (s: string) => `\x1b[38;5;39m${s}\x1b[39m`;

type CodeToken = { type: string; text: string; lang?: string };

/** Render a fenced code block as a padded, background-filled block without the fences. */
export function renderCodeBlockLines(
  code: string,
  width: number,
  opts: {
    indent?: string;
    highlight?: (code: string, lang?: string) => string[];
    lang?: string;
    bg?: (text: string) => string;
  } = {},
): string[] {
  const indent = opts.indent ?? "  ";
  const highlighted = opts.highlight?.(code, opts.lang) ?? code.split("\n");
  const lines: string[] = [];
  for (const hlLine of highlighted) {
    // Pre-wrap so Markdown.render() never re-wraps (which would break padding/bg).
    for (const wrapped of wrapTextWithAnsi(hlLine, Math.max(1, width - indent.length))) {
      const line = indent + wrapped;
      const pad = " ".repeat(Math.max(0, width - visibleWidth(line)));
      lines.push(opts.bg ? opts.bg(line + pad) : line + pad);
    }
  }
  return lines;
}

const PATCHED = Symbol.for("pi-theme.markdown.codeblock");

export default function (pi: ExtensionAPI) {
  // Read theme lazily so /theme switches take effect.
  let ui: { theme: Theme } | undefined;

  const state: BoxState = { working: false, tick: 0, color: BLUE };
  let repaint: (() => void) | undefined;
  let timer: NodeJS.Timeout | undefined;

  const setWorking = (working: boolean) => {
    state.working = working;
    clearInterval(timer);
    timer = undefined;
    if (working) {
      timer = setInterval(() => {
        state.tick++;
        repaint?.();
      }, 100);
      timer.unref?.();
    }
    repaint?.();
  };

  pi.on("session_start", async (_event, ctx) => {
    ui = ctx.ui;
    state.model = ctx.model?.id;
    ctx.ui.setEditorComponent((tui, theme, keybindings) => {
      repaint = () => tui.requestRender();
      return new BoxedEditor(tui, theme, keybindings, state);
    });
  });
  pi.on("model_select", async (event) => {
    state.model = event.model.id;
    repaint?.();
  });
  pi.on("agent_start", async () => setWorking(true));
  // agent_end can be followed by auto-retry/compaction; settled means truly done.
  pi.on("agent_settled", async () => setWorking(false));
  pi.on("session_shutdown", async () => setWorking(false));

  const proto = Markdown.prototype as unknown as Record<string | symbol, unknown> & {
    renderToken(token: unknown, width: number, nextType?: string, styleContext?: unknown): string[];
    theme: { highlightCode?: (code: string, lang?: string) => string[]; codeBlockIndent?: string };
  };
  if (proto[PATCHED]) return;
  proto[PATCHED] = true;

  const original = proto.renderToken;
  proto.renderToken = function (token, width, nextType, styleContext) {
    const t = token as CodeToken;
    if (t?.type !== "code") return original.call(this, token, width, nextType, styleContext);

    const lines = renderCodeBlockLines(t.text, width, {
      indent: this.theme.codeBlockIndent,
      highlight: this.theme.highlightCode?.bind(this.theme),
      lang: t.lang,
      bg: ui ? (text: string) => ui!.theme.bg("toolPendingBg", text) : undefined,
    });
    if (nextType && nextType !== "space") lines.push("");
    return lines;
  };
}
