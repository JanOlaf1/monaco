/**
 * Template tag for authoring multi-line content (markdown, code, test code).
 *
 * - Removes the common leading indentation so content can be indented with
 *   the surrounding TypeScript.
 * - Trims leading and trailing blank lines.
 *
 * Uses the "cooked" template strings, so write a literal backtick as \` and a
 * literal `${` as \${ (needed for JavaScript template literals in content).
 * Fenced code blocks may use ~~~ instead of ``` to avoid escaping.
 */
export function dedent(strings: TemplateStringsArray, ...values: unknown[]): string {
  let text = strings[0];
  for (let i = 0; i < values.length; i++) {
    text += String(values[i]) + strings[i + 1];
  }
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  while (lines.length && lines[0].trim() === "") lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
  const indents = lines
    .filter((line) => line.trim() !== "")
    .map((line) => line.match(/^[ \t]*/)?.[0].length ?? 0);
  const minIndent = indents.length ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(minIndent)).join("\n");
}

/** Markdown content. */
export const md = dedent;
/** Source code (starter files, test code). Same behaviour as `md`. */
export const code = dedent;
