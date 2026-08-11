import { createButton, type ButtonVariant } from "./button";

export interface IconButtonOptions {
  icon: Node;
  label: string;
  tooltip?: string;
  variant?: ButtonVariant;
  className?: string;
  onClick?: (event: MouseEvent) => void;
  document?: Document;
}

export function createIconButton({
  icon,
  label,
  tooltip,
  variant = "outline",
  className,
  onClick,
  document,
}: IconButtonOptions) {
  return createButton({
    content: icon,
    variant,
    className: ["olwlg-ui-icon-button", className].filter(Boolean).join(" "),
    ariaLabel: label,
    tooltip,
    onClick,
    document,
  });
}