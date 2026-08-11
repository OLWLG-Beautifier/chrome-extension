export interface ButtonsBlockOptions {
  buttons?: HTMLElement[];
  ariaLabel?: string;
  className?: string;
  document?: Document;
}

export function createButtonsBlock({
  buttons = [],
  ariaLabel,
  className,
  document: ownerDocument = document,
}: ButtonsBlockOptions = {}) {
  const block = ownerDocument.createElement("div");
  block.className = ["olwlg-ui-buttons-block", className]
    .filter(Boolean)
    .join(" ");
  if (ariaLabel) {
    block.setAttribute("role", "group");
    block.setAttribute("aria-label", ariaLabel);
  }
  block.append(...buttons);
  return block;
}