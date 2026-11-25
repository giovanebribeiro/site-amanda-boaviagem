export type FormatKind =
  "bold" | "italic" | "heading" | "list" | "quote" | "link";

export interface FormatResult {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

const LINK_PLACEHOLDER = "endereço";
const HEADING_PREFIX = "## ";
const LINE_PREFIXES = {
  heading: HEADING_PREFIX,
  list: "- ",
  quote: "> ",
} as const;
const WRAP_MARKERS = { bold: "**", italic: "*" } as const;

function wrap(
  text: string,
  start: number,
  end: number,
  marker: string,
): FormatResult {
  const before = text.slice(0, start);
  const selected = text.slice(start, end);
  const after = text.slice(end);
  const alreadyWrapped =
    before.endsWith(marker) &&
    after.startsWith(marker) &&
    !(marker === "*" && (before.endsWith("**") || after.startsWith("**")));
  if (alreadyWrapped) {
    return {
      text:
        before.slice(0, -marker.length) + selected + after.slice(marker.length),
      selectionStart: start - marker.length,
      selectionEnd: end - marker.length,
    };
  }
  return {
    text: `${before}${marker}${selected}${marker}${after}`,
    selectionStart: start + marker.length,
    selectionEnd: end + marker.length,
  };
}

function prefixLines(
  text: string,
  start: number,
  end: number,
  prefix: string,
): FormatResult {
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const newlineAfter = text.indexOf("\n", end);
  const lineEnd = newlineAfter === -1 ? text.length : newlineAfter;
  const lines = text.slice(lineStart, lineEnd).split("\n");
  const allPrefixed = lines.every((line) => line.startsWith(prefix));
  const next = lines.map((line) =>
    allPrefixed ? line.slice(prefix.length) : `${prefix}${line}`,
  );
  const replaced = next.join("\n");
  const delta = replaced.length - (lineEnd - lineStart);
  return {
    text: text.slice(0, lineStart) + replaced + text.slice(lineEnd),
    selectionStart: start,
    selectionEnd: end + delta,
  };
}

function link(text: string, start: number, end: number): FormatResult {
  const selected = text.slice(start, end);
  const inserted = `[${selected}](${LINK_PLACEHOLDER})`;
  const placeholderStart = start + selected.length + 3;
  return {
    text: text.slice(0, start) + inserted + text.slice(end),
    selectionStart: placeholderStart,
    selectionEnd: placeholderStart + LINK_PLACEHOLDER.length,
  };
}

/** Pure Markdown formatting of a text selection, for the toolbar. */
export function applyFormat(
  text: string,
  start: number,
  end: number,
  kind: FormatKind,
): FormatResult {
  if (kind === "bold" || kind === "italic") {
    return wrap(text, start, end, WRAP_MARKERS[kind]);
  }
  if (kind === "link") return link(text, start, end);
  return prefixLines(text, start, end, LINE_PREFIXES[kind]);
}
