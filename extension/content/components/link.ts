import { appendContent, type ComponentContent } from "./content";
import { applyElementOptions, type ElementOptions } from "./element";

export interface LinkOptions extends ElementOptions {
  href: string;
  content: ComponentContent | ComponentContent[];
  variant?: "default" | "button-full" | "button-outline";
  tooltip?: string;
  external?: boolean;
  rel?: string;
  target?: string;
  onClick?: (event: MouseEvent) => void;
}

export function createLink({
  href,
  content,
  variant = "default",
  className,
  ariaLabel,
  tooltip,
  external = false,
  rel,
  target,
  onClick,
  document: ownerDocument = document,
  ...elementOptions
}: LinkOptions) {
  const link = ownerDocument.createElement("a");
  link.href = href;
  link.className = [
    "olwlg-ui-link",
    variant !== "default" && "olwlg-ui-button",
    variant === "button-full" && "olwlg-ui-button--full",
    variant === "button-outline" && "olwlg-ui-button--outline",
    className,
  ].filter(Boolean).join(" ");
  applyElementOptions(link, {
    ...elementOptions,
    ariaLabel,
    className: link.className,
    document: ownerDocument,
  });
  if (tooltip) link.dataset.olwlgTooltip = tooltip;
  if (external) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  } else {
    if (target) link.target = target;
    if (rel) link.rel = rel;
  }
  appendContent(link, content);
  if (onClick) link.addEventListener("click", onClick);
  return link;
}