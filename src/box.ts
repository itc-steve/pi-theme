import { visibleWidth, truncateToWidth } from "@earendil-works/pi-tui";

export const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");

/** A rendered line is one of the editor's own horizontal rules (plain or scroll indicator). */
export const isRule = (line: string) => /^─/.test(stripAnsi(line).trim());

/** "─── ↑ 3 more ────" → "↑ 3 more"; plain rules → "". */
export const ruleLabel = (line: string) => stripAnsi(line).replace(/─/g, "").trim();

/**
 * Wrap body lines in a closed box, with optional labels inlined in the
 * top/bottom borders. Body lines must already be padded to width - 2.
 */
export function boxLines(
  body: string[],
  width: number,
  color: (s: string) => string,
  topLabel = "",
  bottomLabel = "",
): string[] {
  if (width < 3) {
    const w = Math.max(1, width);
    const bar = color("─".repeat(w));
    return [bar, ...body.map((l) => truncateToWidth(l, w, "")), bar];
  }
  const inner = width - 2;
  const border = (label: string, left: string, right: string) => {
    const unlabeled = color(left + "─".repeat(inner) + right);
    // labeled form is left+─+" "+label+" "+fill+─+right — needs inner >= 4
    if (!label || inner < 4) return unlabeled;
    const text = ` ${truncateToWidth(label, inner - 4)} `;
    const fill = Math.max(0, inner - 1 - visibleWidth(text));
    const line = color(`${left}─`) + text + color("─".repeat(fill) + right);
    return visibleWidth(line) <= width ? line : unlabeled;
  };
  const lines = [border(topLabel, "╭", "╮")];
  for (const line of body) {
    const clipped = visibleWidth(line) > inner ? truncateToWidth(line, inner, "") : line;
    const pad = " ".repeat(Math.max(0, inner - visibleWidth(clipped)));
    lines.push(color("│") + clipped + pad + color("│"));
  }
  lines.push(border(bottomLabel, "╰", "╯"));
  return lines;
}

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
export const spinnerFrame = (tick: number) => SPINNER[Math.abs(tick) % SPINNER.length]!;

/** Top-border label: spinner while working, then model id, then any scroll hint. */
export function borderLabel(opts: {
  working: boolean;
  tick: number;
  model?: string;
  scrollHint?: string;
}): string {
  const parts = [
    opts.working ? spinnerFrame(opts.tick) : undefined,
    opts.model,
    opts.scrollHint || undefined,
  ].filter(Boolean);
  return parts.join(" ");
}
