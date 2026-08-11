export interface ElementOptions {
  ariaLabel?: string;
  attributes?: Record<string, string>;
  className?: string;
  dataset?: Record<string, string>;
  document?: Document;
  hidden?: boolean;
  id?: string;
  role?: string;
  title?: string;
}

export function applyElementOptions<T extends HTMLElement>(
  element: T,
  options: ElementOptions,
) {
  if (options.ariaLabel) element.setAttribute("aria-label", options.ariaLabel);
  if (options.className) element.className = options.className;
  if (options.hidden !== undefined) element.hidden = options.hidden;
  if (options.id) element.id = options.id;
  if (options.role) element.setAttribute("role", options.role);
  if (options.title) element.title = options.title;
  Object.entries(options.attributes ?? {}).forEach(([name, value]) =>
    element.setAttribute(name, value)
  );
  Object.entries(options.dataset ?? {}).forEach(([name, value]) => {
    element.dataset[name] = value;
  });
  return element;
}