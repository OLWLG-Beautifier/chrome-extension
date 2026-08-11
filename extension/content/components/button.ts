import { appendContent, type ComponentContent } from "./content";
import { applyElementOptions, type ElementOptions } from "./element";

export type ButtonVariant = "custom" | "full" | "outline";

export interface ButtonOptions extends ElementOptions {
  content: ComponentContent | ComponentContent[];
  variant?: ButtonVariant;
  tooltip?: string;
  disabled?: boolean;
  type?: "button" | "reset" | "submit";
  value?: string;
  onClick?: (event: MouseEvent) => void;
}

export function createButton({
  content,
  variant = "full",
  className,
  ariaLabel,
  tooltip,
  disabled = false,
  type = "button",
  value,
  onClick,
  document: ownerDocument = document,
  ...elementOptions
}: ButtonOptions) {
  const button = ownerDocument.createElement("button");
  button.type = type;
  button.className = variant === "custom"
    ? className ?? ""
    : [
      "olwlg-ui-button",
      `olwlg-ui-button--${variant}`,
      className,
    ].filter(Boolean).join(" ");
  button.disabled = disabled;
  if (value !== undefined) button.value = value;
  applyElementOptions(button, {
    ...elementOptions,
    ariaLabel,
    className: button.className,
    document: ownerDocument,
  });
  if (tooltip) button.dataset.olwlgTooltip = tooltip;
  appendContent(button, content);
  if (onClick) button.addEventListener("click", onClick);
  return button;
}