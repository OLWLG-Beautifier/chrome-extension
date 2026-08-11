import { applyElementOptions, type ElementOptions } from "./element";

export interface SelectOption {
  disabled?: boolean;
  label: string;
  selected?: boolean;
  value: string;
}

export interface SelectOptions extends ElementOptions {
  disabled?: boolean;
  name?: string;
  onChange?: (value: string, event: Event) => void;
  options?: SelectOption[];
  value?: string;
}

export function createSelect({
  disabled = false,
  name,
  onChange,
  options = [],
  value,
  document: ownerDocument = document,
  ...elementOptions
}: SelectOptions = {}) {
  const select = ownerDocument.createElement("select");
  select.disabled = disabled;
  if (name) select.name = name;
  applyElementOptions(select, {
    ...elementOptions,
    document: ownerDocument,
  });
  options.forEach((item) => {
    const option = ownerDocument.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    option.disabled = item.disabled ?? false;
    option.selected = item.selected ?? false;
    select.append(option);
  });
  if (value !== undefined) select.value = value;
  if (onChange)
    select.addEventListener("change", (event) =>
      onChange(select.value, event)
    );
  return select;
}