import type { Node, Program } from "acorn";

/** Structural checks over the learner's code, based on the Acorn AST. */
export interface AstHelpers {
  readonly program: Program;
  /** Every node of the given ESTree type, e.g. `IfStatement`. */
  findAll(type: string, predicate?: (node: AnyNode) => boolean): AnyNode[];
  has(type: string, predicate?: (node: AnyNode) => boolean): boolean;
  count(type: string): number;
  /**
   * How a top-level name is declared: `const`, `let`, `var`, `function` or
   * `class`; `undefined` when not declared at the top level.
   */
  declarationKind(name: string): "const" | "let" | "var" | "function" | "class" | undefined;
  /** True if `name` is a function declaration or a variable holding a function/arrow. */
  definesFunction(name: string): boolean;
  /** True if the code calls `name(...)`, `x.name(...)` or the dotted path, e.g. `console.log`. */
  calls(name: string): boolean;
}

// Acorn's Node type does not model child properties; treat nodes loosely.
export type AnyNode = Node & Record<string, unknown>;

function isNode(value: unknown): value is AnyNode {
  return typeof value === "object" && value !== null && typeof (value as { type?: unknown }).type === "string";
}

export function walk(root: Node, visit: (node: AnyNode) => void): void {
  const stack: unknown[] = [root];
  while (stack.length) {
    const current = stack.pop();
    if (Array.isArray(current)) {
      for (let i = current.length - 1; i >= 0; i--) stack.push(current[i]);
      continue;
    }
    if (!isNode(current)) continue;
    visit(current);
    for (const key of Object.keys(current)) {
      if (key === "loc" || key === "start" || key === "end" || key === "range") continue;
      const child = current[key];
      if (typeof child === "object" && child !== null) stack.push(child);
    }
  }
}

function memberPath(node: AnyNode): string | undefined {
  if (node.type === "Identifier") return node.name as string;
  if (node.type === "MemberExpression" && !node.computed) {
    const object = memberPath(node.object as AnyNode);
    const property = (node.property as AnyNode).name as string | undefined;
    return object && property ? `${object}.${property}` : property;
  }
  return undefined;
}

export function createAstHelpers(program: Program): AstHelpers {
  const all: AnyNode[] = [];
  walk(program, (node) => all.push(node));

  const findAll = (type: string, predicate?: (node: AnyNode) => boolean) =>
    all.filter((node) => node.type === type && (!predicate || predicate(node)));

  const topLevel = program.body as unknown as AnyNode[];

  function topLevelDeclarator(name: string): { kind: "const" | "let" | "var"; init?: AnyNode } | undefined {
    for (const statement of topLevel) {
      if (statement.type !== "VariableDeclaration") continue;
      for (const declarator of statement.declarations as AnyNode[]) {
        const id = declarator.id as AnyNode;
        if (id.type === "Identifier" && id.name === name) {
          return {
            kind: statement.kind as "const" | "let" | "var",
            init: (declarator.init as AnyNode | null) ?? undefined,
          };
        }
      }
    }
    return undefined;
  }

  return {
    program,
    findAll,
    has: (type, predicate) => findAll(type, predicate).length > 0,
    count: (type) => findAll(type).length,
    declarationKind(name) {
      for (const statement of topLevel) {
        const id = statement.id as AnyNode | undefined;
        if (statement.type === "FunctionDeclaration" && id?.name === name) return "function";
        if (statement.type === "ClassDeclaration" && id?.name === name) return "class";
      }
      return topLevelDeclarator(name)?.kind;
    },
    definesFunction(name) {
      const hasDeclaration = findAll(
        "FunctionDeclaration",
        (node) => (node.id as AnyNode | null)?.name === name,
      ).length > 0;
      if (hasDeclaration) return true;
      return (
        findAll("VariableDeclarator", (node) => {
          const id = node.id as AnyNode;
          const init = node.init as AnyNode | null;
          return (
            id.type === "Identifier" &&
            id.name === name &&
            !!init &&
            (init.type === "FunctionExpression" || init.type === "ArrowFunctionExpression")
          );
        }).length > 0
      );
    },
    calls(name) {
      return (
        findAll("CallExpression", (node) => {
          const callee = node.callee as AnyNode;
          const path = memberPath(callee);
          if (!path) return false;
          if (name.includes(".")) return path === name || path.endsWith(`.${name}`);
          return path === name || path.endsWith(`.${name}`);
        }).length > 0
      );
    },
  };
}
