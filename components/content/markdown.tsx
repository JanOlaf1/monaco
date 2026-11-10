import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { parseInline, parseMarkdown, type InlineNode } from "@/lib/content/markdown";

function renderInline(nodes: InlineNode[], keyPrefix = "i"): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    switch (node.type) {
      case "text":
        return node.value;
      case "code":
        return (
          <code
            key={key}
            className="rounded border border-line bg-code px-1 py-px font-mono text-[0.86em] text-fg wrap-anywhere"
          >
            {node.value}
          </code>
        );
      case "strong":
        return (
          <strong key={key} className="font-semibold text-fg">
            {renderInline(node.children, key)}
          </strong>
        );
      case "em":
        return <em key={key}>{renderInline(node.children, key)}</em>;
    }
  });
}

/** Renders lesson markdown safely (no raw HTML). */
export function Markdown({ source, className }: { source: string; className?: string }) {
  const blocks = parseMarkdown(source);
  return (
    <div className={cn("space-y-3 text-[14.5px] leading-relaxed text-fg-muted", className)}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "paragraph":
            return <p key={index}>{renderInline(block.children, `p${index}`)}</p>;
          case "heading": {
            const Tag = block.level === 3 ? "h3" : "h4";
            return (
              <Tag key={index} className="pt-1 text-sm font-semibold text-fg">
                {renderInline(block.children, `h${index}`)}
              </Tag>
            );
          }
          case "code":
            return (
              <pre
                key={index}
                className="overflow-x-auto rounded-lg border border-line bg-code px-3.5 py-3 font-mono text-[13px] leading-6 text-fg"
              >
                <code>{block.value}</code>
              </pre>
            );
          case "list": {
            const Tag = block.ordered ? "ol" : "ul";
            return (
              <Tag
                key={index}
                className={cn("space-y-1.5 pl-5", block.ordered ? "list-decimal" : "list-disc", "marker:text-fg-subtle")}
              >
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{renderInline(item, `l${index}-${itemIndex}`)}</li>
                ))}
              </Tag>
            );
          }
        }
      })}
    </div>
  );
}

/** Inline-only markdown for short strings like test labels and hints. */
export function InlineMarkdown({ source }: { source: string }) {
  return <>{renderInline(parseInline(source))}</>;
}
