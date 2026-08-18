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
  const inner = Math.max(1, width - 2);
  const border = (label: string, left: string, right: string) => {
    if (!label) return color(left + "─".repeat(inner) + right);
    const text = ` ${truncateToWidth(label, Math.max(1, inner - 4))} `;
    const fill = Math.max(0, inner - 1 - visibleWidth(text));
    return color(`${left}─`) + text + color("─".repeat(fill) + right);
  };
  const lines = [border(topLabel, "╭", "╮")];
  for (const line of body) {
    const pad = " ".repeat(Math.max(0, inner - visibleWidth(line)));
    lines.push(color("│") + line + pad + color("│"));
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
