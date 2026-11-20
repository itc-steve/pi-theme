import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { visibleWidth } from "@earendil-works/pi-tui";
import { boxLines, borderLabel, isRule, ruleLabel, stripAnsi, spinnerFrame } from "../src/box.ts";

const plain = (s: string) => s;

describe("boxLines", () => {
  it("closes the box and keeps every line at width", () => {
    const out = boxLines(["ab"], 8, plain);
    assert.deepEqual(out, ["╭──────╮", "│ab    │", "╰──────╯"]);
  });

  it("inlines labels in the borders without changing width", () => {
    const out = boxLines(["x"], 20, plain, "⠋ gpt-5", "↓ 2 more");
    assert.ok(out[0]!.startsWith("╭─ ⠋ gpt-5 ─"));
    assert.ok(out.at(-1)!.startsWith("╰─ ↓ 2 more ─"));
    for (const l of out) assert.equal(stripAnsi(l).length, 20);
  });

  it("truncates a label too long for the box", () => {
    const out = boxLines([""], 12, plain, "a-very-long-model-name");
    assert.equal(stripAnsi(out[0]!).length, 12);
  });

  it("never exceeds requested width, even with a label on a tiny box", () => {
    for (const w of [1, 2, 5, 8]) {
      const out = boxLines(["hi"], w, plain, "model");
      for (const l of out) assert.ok(visibleWidth(l) <= Math.max(1, w));
    }
  });
});

describe("editor rule parsing", () => {
  it("detects plain and scroll rules", () => {
    assert.ok(isRule("─".repeat(10)));
    assert.ok(isRule("─── ↑ 3 more ─────"));
    assert.ok(!isRule("│ hello"));
    assert.equal(ruleLabel("─── ↑ 3 more ─────"), "↑ 3 more");
    assert.equal(ruleLabel("─".repeat(10)), "");
  });
});

describe("borderLabel", () => {
  it("shows spinner only while working", () => {
    assert.equal(borderLabel({ working: false, tick: 0, model: "gpt-5" }), "gpt-5");
    assert.equal(borderLabel({ working: true, tick: 1, model: "gpt-5" }), `${spinnerFrame(1)} gpt-5`);
    assert.equal(borderLabel({ working: false, tick: 0 }), "");
  });
});

describe("BoxedEditor", () => {
  it("wraps the editor body in a closed box with spinner + model", async () => {
    const { BoxedEditor } = await import("../src/editor.ts");
    const tui = { terminal: { rows: 40, columns: 80 }, requestRender() {} };
    const ed = new BoxedEditor(
      tui as never,
      { borderColor: plain, selectList: {} } as never,
      { matches: () => false } as never,
      { working: true, tick: 3, model: "gpt-5" },
    );
    ed.setText("hello");
    const out = ed.render(30);
    assert.ok(out[0]!.startsWith("╭─ ⠸ gpt-5 "));
    assert.equal(out.at(-1), "╰" + "─".repeat(28) + "╯");
    for (const l of out) assert.equal(stripAnsi(l).length, 30);
    assert.ok(stripAnsi(out[1]!).includes("hello"));
  });

  it("stays within a 5-column render when a model label is set", async () => {
    const { BoxedEditor } = await import("../src/editor.ts");
    const tui = { terminal: { rows: 40, columns: 5 }, requestRender() {} };
    const ed = new BoxedEditor(
      tui as never,
      { borderColor: plain, selectList: {} } as never,
      { matches: () => false } as never,
      { working: false, tick: 0, model: "model" },
    );
    ed.setText("hello");
    for (const l of ed.render(5)) assert.ok(visibleWidth(l) <= 5);
  });

  it("uses live borderColor so Pi thinking/bash updates show", async () => {
    const { BoxedEditor } = await import("../src/editor.ts");
    const tui = { terminal: { rows: 40, columns: 80 }, requestRender() {} };
    const ed = new BoxedEditor(
      tui as never,
      { borderColor: plain, selectList: {} } as never,
      { matches: () => false } as never,
      { working: false, tick: 0 },
    );
    ed.setText("hello");
    ed.borderColor = (s) => `\x1b[32m${s}\x1b[39m`;
    const out = ed.render(20);
    assert.ok(out[0]!.startsWith("\x1b[32m╭"));
    assert.ok(out.at(-1)!.includes("\x1b[32m"));
    assert.ok(stripAnsi(out[1]!).includes("hello"));
  });
});
