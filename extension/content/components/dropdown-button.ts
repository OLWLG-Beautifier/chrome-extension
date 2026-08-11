import { normalizeWhitespace } from "../core/dom";
import { createButton } from "./button";
import { createInput } from "./input";
import { createSelect } from "./select";

let dropdownId = 0;
const dropdownSync = new WeakMap<HTMLSelectElement, () => void>();
const dropdownDocuments = new WeakSet<Document>();

export interface DropdownButtonOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DropdownButtonOptions {
  label: string;
  options: DropdownButtonOption[];
  value?: string;
  name?: string;
  className?: string;
  disabled?: boolean;
  onChange?: (value: string, event: Event) => void;
  document?: Document;
}

function closeDropdownButtons(document: Document, except?: HTMLElement) {
  document
    .querySelectorAll<HTMLElement>(".olwlg-custom-select.is-open")
    .forEach((dropdown) => {
      if (dropdown === except) return;
      dropdown.classList.remove("is-open");
      dropdown
        .querySelector<HTMLElement>(".olwlg-custom-select__panel")
        ?.setAttribute("hidden", "");
      dropdown
        .querySelector<HTMLElement>(".olwlg-custom-select__trigger")
        ?.setAttribute("aria-expanded", "false");
    });
}

export function enhanceSearchableSelect(select: HTMLSelectElement) {
  if (dropdownSync.has(select)) {
    dropdownSync.get(select)?.();
    return;
  }

  const document = select.ownerDocument;
  const view = document.defaultView;
  const wrapper = document.createElement("div");
  const triggerLabel = document.createElement("span");
  const panel = document.createElement("div");
  const options = document.createElement("div");
  const selectId = `olwlg-custom-select-${++dropdownId}`;
  const fieldLabel = normalizeWhitespace(
    select
      .closest("label")
      ?.querySelector<HTMLElement>(":scope > span")
      ?.textContent,
  ) || "options";

  wrapper.className = "olwlg-custom-select";
  const trigger = createButton({
    attributes: {
      "aria-controls": `${selectId}-options`,
      "aria-expanded": "false",
      "aria-haspopup": "listbox",
    },
    className: "olwlg-custom-select__trigger",
    content: triggerLabel,
    document,
    role: "combobox",
    variant: "custom",
  });
  triggerLabel.className = "olwlg-custom-select__value";
  panel.className = "olwlg-custom-select__panel";
  panel.id = `${selectId}-panel`;
  panel.hidden = true;
  const search = createInput({
    ariaLabel: `Search ${fieldLabel}`,
    autocomplete: "off",
    className: "olwlg-custom-select__search",
    document,
    placeholder: `Search ${fieldLabel.toLocaleLowerCase()}…`,
    type: "search",
  });
  options.className = "olwlg-custom-select__options";
  options.id = `${selectId}-options`;
  options.setAttribute("role", "listbox");
  panel.append(search, options);
  wrapper.append(trigger, panel);
  select.classList.add("olwlg-custom-select__native");
  select.insertAdjacentElement("afterend", wrapper);

  const renderOptions = () => {
    const query = normalizeWhitespace(search.value).toLocaleLowerCase();
    options.replaceChildren();
    const matchingOptions = [...select.options].filter((option) =>
      normalizeWhitespace(option.textContent).toLocaleLowerCase().includes(query)
    );
    matchingOptions.forEach((option) => {
      const control = createButton({
        attributes: {
          "aria-selected": option.value === select.value ? "true" : "false",
        },
        className: "olwlg-custom-select__option",
        content: option.textContent,
        disabled: option.disabled,
        document,
        role: "option",
        variant: "custom",
      });
      control.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        select.value = option.value;
        select.dispatchEvent(
          new (view?.Event ?? Event)("change", { bubbles: true }),
        );
        closeDropdownButtons(document);
        trigger.focus();
      });
      options.append(control);
    });
    if (!matchingOptions.length) {
      const empty = document.createElement("p");
      empty.className = "olwlg-custom-select__empty";
      empty.textContent = "No matching options";
      options.append(empty);
    }
  };
  const sync = () => {
    const selected =
      [...select.options].find((option) => option.value === select.value) ??
      select.options[0];
    triggerLabel.textContent = selected?.textContent || "Select an option";
    trigger.disabled = select.disabled || select.options.length <= 1;
    renderOptions();
  };
  const open = () => {
    if (trigger.disabled) return;
    closeDropdownButtons(document, wrapper);
    wrapper.classList.add("is-open");
    panel.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    search.value = "";
    renderOptions();
    window.setTimeout(() => search.focus(), 0);
  };
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    if (wrapper.classList.contains("is-open")) {
      closeDropdownButtons(document);
      return;
    }
    open();
  });
  trigger.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "Enter" && event.key !== " ")
      return;
    event.preventDefault();
    open();
  });
  search.addEventListener("input", renderOptions);
  search.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDropdownButtons(document);
      trigger.focus();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      options
        .querySelector<HTMLButtonElement>(
          ".olwlg-custom-select__option:not(:disabled)",
        )
        ?.focus();
    }
  });
  panel.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    closeDropdownButtons(document);
    trigger.focus();
  });
  select.addEventListener("change", sync);
  dropdownSync.set(select, sync);
  sync();

  if (!dropdownDocuments.has(document)) {
    dropdownDocuments.add(document);
    document.addEventListener("pointerdown", (event) => {
      const target = event.target;
      if (!view || !(target instanceof view.Node)) return;
      const openSelect = document.querySelector<HTMLElement>(
        ".olwlg-custom-select.is-open",
      );
      if (openSelect && !openSelect.contains(target))
        closeDropdownButtons(document);
    });
  }
}

export function syncSearchableSelects(root: ParentNode) {
  root.querySelectorAll<HTMLSelectElement>("select").forEach((select) => {
    dropdownSync.get(select)?.();
  });
}

export function createDropdownButton({
  label,
  options,
  value,
  name,
  className,
  disabled = false,
  onChange,
  document: ownerDocument = document,
}: DropdownButtonOptions) {
  const field = ownerDocument.createElement("label");
  const caption = ownerDocument.createElement("span");

  field.className = ["olwlg-ui-dropdown-field", className]
    .filter(Boolean)
    .join(" ");
  caption.textContent = label;
  const select = createSelect({
    ariaLabel: label,
    disabled,
    document: ownerDocument,
    name,
    onChange,
    options,
    value,
  });
  field.append(caption, select);
  enhanceSearchableSelect(select);
  return { field, select };
}