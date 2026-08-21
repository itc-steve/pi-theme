import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Markdown } from "@earendil-works/pi-tui";
import { installPatches, stripQuotePrefix } from "../index.ts";

const id = (s: string) => s;
const theme = {
  heading: id,
  link: id,
  linkUrl: id,
  code: id,
  codeBlock: id,
  codeBlockBorder: id,
  quote: id,
  quoteBorder: id,
  hr: id,
  listBullet: id,
  bold: id,
  italic: id,
  strikethrough: id,
  underline: id,
};

describe("stripQuotePrefix", () => {
  it("drops box-drawing and ascii quote gutters", () => {
    assert.equal(stripQuotePrefix("│ hello"), "hello");
    assert.equal(stripQuotePrefix("| hello"), "hello");
    assert.equal(stripQuotePrefix("│hello"), "hello");
  });

  it("keeps leading ANSI, drops only the gutter", () => {
    assert.equal(stripQuotePrefix("\x1b[38;5;242m│ \x1b[39mhello"), "\x1b[38;5;242m\x1b[39mhello");
  });

  it("leaves non-quote lines alone", () => {
    assert.equal(stripQuotePrefix("hello"), "hello");
  });
});

describe("blockquote render", () => {
  it("renders quoted markdown without a gutter char", () => {
    installPatches();
    const md = new Markdown("> I've confirmed with Fortinet", 0, 0, theme);
    const lines = md.render(60).map((l) => l.replace(/\x1b\[[0-9;]*m/g, "").trimEnd());
    assert.ok(lines.some((l) => l.includes("I've confirmed with Fortinet")));
    for (const l of lines) {
      assert.equal(l.startsWith("│"), false);
      assert.equal(l.startsWith("|"), false);
    }
  });
});
