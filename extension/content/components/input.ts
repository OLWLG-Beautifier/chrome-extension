import { applyElementOptions, type ElementOptions } from "./element";

export interface InputOptions extends ElementOptions {
  type?: string;
  value?: string;
  placeholder?: string;
  autocomplete?: AutoFill;
  name?: string;
  disabled?: boolean;
  checked?: boolean;
  inputMode?: HTMLInputElement["inputMode"];
  max?: number | string;
  min?: number | string;
  readOnly?: boolean;
  step?: number | string;
  variant?: "custom" | "default";
  onInput?: (event: Event) => void;
  onChange?: (event: Event) => void;
}

export function createInput({
  type = "text",
  value,
  placeholder,
  ariaLabel,
  autocomplete,
  className,
  name,
  disabled = false,
  checked,
  inputMode,
  max,
  min,
  readOnly,
  step,
  variant = "default",
  onInput,
  onChange,
  document: ownerDocument = document,
  ...elementOptions
}: InputOptions) {
  const input = ownerDocument.createElement("input");
  input.type = type;
  if (value !== undefined) input.value = value;
  if (placeholder) input.placeholder = placeholder;
  if (autocomplete) input.autocomplete = autocomplete;
  input.className = [variant === "default" && "olwlg-ui-input", className]
    .filter(Boolean)
    .join(" ");
  if (name) input.name = name;
  input.disabled = disabled;
  if (checked !== undefined) input.checked = checked;
  if (inputMode) input.inputMode = inputMode;
  if (max !== undefined) input.max = String(max);
  if (min !== undefined) input.min = String(min);
  if (readOnly !== undefined) input.readOnly = readOnly;
  if (step !== undefined) input.step = String(step);
  applyElementOptions(input, {
    ...elementOptions,
    ariaLabel,
    className: input.className,
    document: ownerDocument,
  });
  if (onInput) input.addEventListener("input", onInput);
  if (onChange) input.addEventListener("change", onChange);
  return input;
}

export interface LabeledInputOptions extends InputOptions {
  label: string;
  fieldClassName?: string;
}

export function createLabeledInput(options: LabeledInputOptions) {
  const ownerDocument = options.document ?? document;
  const field = ownerDocument.createElement("label");
  const caption = ownerDocument.createElement("span");
  const input = createInput(options);
  if (options.fieldClassName) field.className = options.fieldClassName;
  caption.textContent = options.label;
  field.append(caption, input);
  return { field, input };
}