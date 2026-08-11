import { normalizeWhitespace } from "../../core/dom";

export interface TradeSummaryLine {
  nodes: Node[];
  text: string;
}

export function tradeSummaryLines(container: HTMLElement) {
  const ownerDocument = container.ownerDocument;
  const view = ownerDocument.defaultView;
  const lines: TradeSummaryLine[] = [];
  let nodes: Node[] = [];
  const appendLine = () => {
    const text = normalizeWhitespace(
      nodes.map((node) => node.textContent).join(" "),
    );
    lines.push({ nodes, text });
    nodes = [];
  };
  const visit = (node: Node) => {
    if (view && node instanceof view.HTMLBRElement) {
      appendLine();
      return;
    }
    if (view && node instanceof view.Text) {
      node.data.split(/\r?\n/).forEach((part, index) => {
        if (index) appendLine();
        if (part) nodes.push(ownerDocument.createTextNode(part));
      });
      return;
    }
    if (view && node instanceof view.HTMLAnchorElement) {
      nodes.push(node.cloneNode(true));
      return;
    }
    node.childNodes.forEach(visit);
    if (
      view &&
      node instanceof view.HTMLElement &&
      /^(?:DIV|P|H[1-6]|LI|PRE)$/.test(node.tagName) &&
      nodes.length
    )
      appendLine();
  };
  container.childNodes.forEach(visit);
  if (nodes.length) appendLine();
  return lines.filter((line) => line.text);
}

export function tradeSummarySource(ownerDocument: Document = document) {
  const headingPattern =
    /:\s*\(\s*\d+\s+trades?\s+of\s+\d+\s*,\s*\d+%\s*\)/i;
  return [...ownerDocument.body.querySelectorAll<HTMLElement>("*")]
    .filter(
      (element) =>
        !element.closest("#navbar, .olwlg-app-page-footer") &&
        Boolean(element.querySelector("br")) &&
        (normalizeWhitespace(element.textContent).match(
          new RegExp(headingPattern.source, "gi"),
        )?.length ?? 0) >= 2,
    )
    .sort(
      (left, right) =>
        normalizeWhitespace(left.textContent).length -
        normalizeWhitespace(right.textContent).length,
    )[0];
}