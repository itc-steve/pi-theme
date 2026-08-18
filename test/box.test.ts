import { describe, it } from "node:test";
import assert from "node:assert/strict";
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
      { working: true, tick: 3, model: "gpt-5", color: plain },
    );
    ed.setText("hello");
    const out = ed.render(30);
    assert.ok(out[0]!.startsWith("╭─ ⠸ gpt-5 "));
    assert.equal(out.at(-1), "╰" + "─".repeat(28) + "╯");
    for (const l of out) assert.equal(stripAnsi(l).length, 30);
    assert.ok(stripAnsi(out[1]!).includes("hello"));
  });
});
