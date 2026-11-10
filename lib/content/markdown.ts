/**
 * A deliberately small Markdown subset for lesson content. It produces a
 * plain data structure that is rendered as React elements, so content can
 * never inject HTML.
 *
 * Supported: paragraphs, `###`/`####` headings, fenced code blocks (``` or ~~~),
 * "-" / "*" bullet lists, "1." ordered lists, `inline code`, **bold**, *italic*
 * and backslash escapes.
 */

export type InlineNode =
  | { type: "text"; value: string }
  | { type: "code"; value: string }
  | { type: "strong"; children: InlineNode[] }
  | { type: "em"; children: InlineNode[] };

export type BlockNode =
  | { type: "paragraph"; children: InlineNode[] }
  | { type: "heading"; level: 3 | 4; children: InlineNode[] }
  | { type: "code"; language: string; value: string }
  | { type: "list"; ordered: boolean; items: InlineNode[][] };

const ESCAPABLE = /[\\`*_{}[\]()#+\-.!~>|]/;

export function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let buffer = "";
  const flush = () => {
    if (buffer) nodes.push({ type: "text", value: buffer });
    buffer = "";
  };

  let i = 0;
  while (i < text.length) {
    const char = text[i];

    if (char === "\\" && i + 1 < text.length && ESCAPABLE.test(text[i + 1])) {
      buffer += text[i + 1];
      i += 2;
      continue;
    }

    if (char === "`") {
      let run = 1;
      while (text[i + run] === "`") run++;
      const fence = "`".repeat(run);
      let search = i + run;
      let end = -1;
      while (search < text.length) {
        const found = text.indexOf(fence, search);
        if (found === -1) break;
        if (text[found + run] !== "`") {
          end = found;
          break;
        }
        search = found + run + 1;
      }
      if (end !== -1) {
        flush();
        let value = text.slice(i + run, end);
        if (value.length > 2 && value.startsWith(" ") && value.endsWith(" ")) value = value.slice(1, -1);
        nodes.push({ type: "code", value });
        i = end + run;
        continue;
      }
      buffer += fence;
      i += run;
      continue;
    }

    if (text.startsWith("**", i)) {
      const end = text.indexOf("**", i + 2);
      if (end > i + 2) {
        flush();
        nodes.push({ type: "strong", children: parseInline(text.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }

    if (char === "*" && text[i + 1] !== " " && text[i + 1] !== "*") {
      const end = text.indexOf("*", i + 1);
      if (end > i + 1 && text[end - 1] !== " ") {
        flush();
        nodes.push({ type: "em", children: parseInline(text.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }

    buffer += char;
    i++;
  }
  flush();
  return nodes;
}

const FENCE = /^(`{3,}|~{3,})\s*([\w+-]*)\s*$/;
const HEADING = /^(#{3,4})\s+(.+)$/;
const BULLET = /^\s{0,3}[-*]\s+(.*)$/;
const ORDERED = /^\s{0,3}\d+[.)]\s+(.*)$/;

export function parseMarkdown(source: string): BlockNode[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: BlockNode[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", children: parseInline(paragraph.join(" ")) });
      paragraph = [];
    }
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    const fence = FENCE.exec(line.trim());
    if (fence) {
      flushParagraph();
      const marker = fence[1];
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(marker)) {
        body.push(lines[i]);
        i++;
      }
      i++; // closing fence
      blocks.push({ type: "code", language: fence[2] ?? "", value: body.join("\n") });
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      i++;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flushParagraph();
      blocks.push({ type: "heading", level: heading[1].length as 3 | 4, children: parseInline(heading[2]) });
      i++;
      continue;
    }

    const bullet = BULLET.exec(line);
    const ordered = ORDERED.exec(line);
    if (bullet || ordered) {
      flushParagraph();
      const isOrdered = !bullet;
      const pattern = isOrdered ? ORDERED : BULLET;
      const items: string[] = [];
      while (i < lines.length) {
        const match = pattern.exec(lines[i]);
        if (match) {
          items.push(match[1]);
        } else if (items.length && /^\s{2,}\S/.test(lines[i])) {
          items[items.length - 1] += ` ${lines[i].trim()}`;
        } else {
          break;
        }
        i++;
      }
      blocks.push({ type: "list", ordered: isOrdered, items: items.map(parseInline) });
      continue;
    }

    paragraph.push(line.trim());
    i++;
  }
  flushParagraph();
  return blocks;
}
