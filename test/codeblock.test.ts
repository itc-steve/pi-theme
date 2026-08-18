import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderCodeBlockLines } from "../index.ts";

const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");

describe("renderCodeBlockLines", () => {
  it("omits fences and pads every line to width", () => {
    const lines = renderCodeBlockLines("a\nbb", 10);
    assert.deepEqual(lines, ["  a       ", "  bb      "]);
  });

  it("keeps highlight ANSI and wraps long lines, still padded", () => {
    const lines = renderCodeBlockLines("xxxxxxxx", 6, {
      highlight: (c) => [`\x1b[31m${c}\x1b[39m`],
      bg: (t) => `\x1b[48;5;8m${t}\x1b[49m`,
    });
    assert.ok(lines.length > 1);
    for (const l of lines) assert.equal(strip(l).length, 6);
    assert.ok(lines[0]!.includes("\x1b[31m"));
    assert.equal(strip(lines.join("")).trim().replace(/\s+/g, ""), "xxxxxxxx");
  });
});
