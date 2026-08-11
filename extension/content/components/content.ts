export type ComponentContent = Node | string | null | undefined;

export function appendContent(
  parent: HTMLElement,
  content: ComponentContent | ComponentContent[],
) {
  const values = Array.isArray(content) ? content : [content];
  const NodeConstructor = parent.ownerDocument.defaultView?.Node ?? Node;
  values.forEach((value) => {
    if (value instanceof NodeConstructor) parent.append(value);
    else if (value !== null && value !== undefined)
      parent.append(parent.ownerDocument.createTextNode(value));
  });
}