import { describe, expect, it } from "vitest";
import { applyFormat } from "../../src/common/markdown-format";

describe("applyFormat", () => {
  it("wraps the selection in bold markers and keeps it selected", () => {
    expect(applyFormat("um texto aqui", 3, 8, "bold")).toEqual({
      text: "um **texto** aqui",
      selectionStart: 5,
      selectionEnd: 10,
    });
  });

  it("unwraps an already bold selection", () => {
    expect(applyFormat("um **texto** aqui", 5, 10, "bold")).toEqual({
      text: "um texto aqui",
      selectionStart: 3,
      selectionEnd: 8,
    });
  });

  it("wraps in italic markers", () => {
    expect(applyFormat("abc", 0, 3, "italic").text).toBe("*abc*");
  });

  it("inserts markers around an empty selection with the cursor between", () => {
    expect(applyFormat("ab", 1, 1, "bold")).toEqual({
      text: "a****b",
      selectionStart: 3,
      selectionEnd: 3,
    });
  });

  it("turns the current line into a heading", () => {
    expect(applyFormat("linha 1\nlinha 2", 9, 9, "heading").text).toBe(
      "linha 1\n## linha 2",
    );
  });

  it("removes the heading marker when already a heading", () => {
    expect(applyFormat("## titulo", 4, 4, "heading").text).toBe("titulo");
  });

  it("prefixes every selected line in a list", () => {
    expect(applyFormat("a\nb\nc", 0, 5, "list").text).toBe("- a\n- b\n- c");
  });

  it("prefixes lines as a quote", () => {
    expect(applyFormat("citação", 0, 0, "quote").text).toBe("> citação");
  });

  it("turns the selection into a link with the address placeholder selected", () => {
    const result = applyFormat("veja aqui", 5, 9, "link");
    expect(result.text).toBe("veja [aqui](endereço)");
    expect(result.text.slice(result.selectionStart, result.selectionEnd)).toBe(
      "endereço",
    );
  });
});
