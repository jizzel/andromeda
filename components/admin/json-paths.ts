import { syntaxTree } from "@codemirror/language";
import type { EditorState } from "@codemirror/state";
import type { SyntaxNode } from "@lezer/common";

/**
 * Maps a validation path like `packages[1].totalPrice` to a text range in the
 * CodeMirror JSON document, by walking the Lezer syntax tree. Used to place
 * schema errors inline and to jump to them from the issues list. When the
 * exact node doesn't exist (e.g. a required key is missing), returns the
 * deepest parent that does, so the error still lands somewhere sensible.
 */

type Segment = string | number;

export function parsePath(path: string): Segment[] {
  const out: Segment[] = [];
  for (const match of path.matchAll(/([^.[\]]+)|\[(\d+)\]/g)) {
    if (match[2] !== undefined) out.push(Number(match[2]));
    else if (match[1] !== undefined) out.push(match[1]);
  }
  return out;
}

const VALUE_NODES = new Set(["Object", "Array", "String", "Number", "True", "False", "Null"]);

function valueChildren(node: SyntaxNode): SyntaxNode[] {
  const out: SyntaxNode[] = [];
  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (VALUE_NODES.has(child.name)) out.push(child);
  }
  return out;
}

function propertyValue(property: SyntaxNode): SyntaxNode | null {
  for (let child = property.firstChild; child; child = child.nextSibling) {
    if (VALUE_NODES.has(child.name)) return child;
  }
  return null;
}

/** Text range for `path`; `exact` is false when only a parent node was found. */
export function rangeForPath(
  state: EditorState,
  path: string
): { from: number; to: number; exact: boolean } | null {
  const root = syntaxTree(state).topNode;
  let node: SyntaxNode | null = valueChildren(root)[0] ?? null;
  if (!node) return null;
  let keyNode: SyntaxNode | null = null;

  for (const segment of parsePath(path)) {
    let next: SyntaxNode | null = null;
    let nextKey: SyntaxNode | null = null;
    if (typeof segment === "number" && node.name === "Array") {
      next = valueChildren(node)[segment] ?? null;
    } else if (typeof segment === "string" && node.name === "Object") {
      for (let prop = node.firstChild; prop; prop = prop.nextSibling) {
        if (prop.name !== "Property") continue;
        const name = prop.getChild("PropertyName");
        if (name && state.sliceDoc(name.from, name.to) === JSON.stringify(segment)) {
          next = propertyValue(prop);
          nextKey = name;
          break;
        }
      }
    }
    if (!next) {
      // Missing key/index: point at the parent (its opening line is enough).
      const target = keyNode ?? node;
      return { from: target.from, to: Math.min(target.to, state.doc.lineAt(target.from).to), exact: false };
    }
    node = next;
    keyNode = nextKey;
  }
  // Highlight the key and value for properties, the value alone for array items.
  const from = keyNode ? keyNode.from : node.from;
  return { from, to: Math.min(node.to, state.doc.lineAt(from).to), exact: true };
}
