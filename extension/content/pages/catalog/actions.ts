import {
  createButton,
} from "../../components";
import {
  imageFilename,
} from "../../core/guide-parser";
import {
  ICONS,
} from "../../core/icon-definitions";
import {
  createModernIcon,
} from "../../core/icon-system";
import {
  normalizedText,
} from "./helpers";
import {
  openCatalogModal,
} from "./modal";
import {
  actionCandidateFromCell,
  addedCandidateFromCell,
  participantFromRow,
} from "./parsing";
import {
  catalogIsReadOnly,
  catalogLoggedInUsername,
} from "./participation";

export function markCatalogRowAdded(row: HTMLTableRowElement) {
  row.classList.add("olwlg-catalog-row--added");
  row.dataset.olwlgAdded = "true";
  row
    .querySelectorAll<HTMLElement>(
      ".olwlg-catalog-primary-action, .olwlg-catalog-add-action",
    )
    .forEach((control) => control.remove());

  const rowNumber = row.dataset.olwlgRowNumber;
  if (!rowNumber) return;
  const card = document.querySelector<HTMLElement>(
    `.olwlg-item-card[data-olwlg-row-number="${CSS.escape(rowNumber)}"]`,
  );
  card?.classList.add("olwlg-item-card--added");
  card
    ?.querySelectorAll<HTMLElement>(
      ".olwlg-catalog-primary-action, .olwlg-catalog-add-action",
    )
    .forEach((control) => control.remove());
}

export function syncCatalogAddedItems() {
  document
    .querySelectorAll<HTMLTableRowElement>(".olwlg-catalog-row")
    .forEach((row) => {
      if (catalogRowHasSavedWant(row)) markCatalogRowAdded(row);
    });
}

export function createCatalogAction(
  original: HTMLElement,
  name: "add" | "added",
  mount = original,
) {
  if (
    original.closest(".olwlg-catalog-primary-action") ||
    mount.parentElement?.querySelector(
      ".olwlg-catalog-primary-action[data-olwlg-for-control]",
    )
  )
    return;

  const definition = ICONS[name];
  const label = document.createElement("span");
  const icon = createModernIcon(name);
  label.textContent = name === "add" ? "Add" : "Item Added";
  icon.removeAttribute("aria-label");
  icon.removeAttribute("data-olwlg-tooltip");
  const button = createButton({
    ariaLabel: definition.label,
    className: `olwlg-catalog-primary-action olwlg-catalog-primary-action--${name} olwlg-icon-control`,
    content: [icon, label],
    dataset: { olwlgForControl: original.id || "legacy" },
    onClick: () => activateCatalogAction(original),
    tooltip: definition.tooltip,
    variant: "custom",
  });
  original.dataset.olwlgEnhanced = "catalog-action";
  original.classList.add("olwlg-catalog-original-action");
  mount.insertAdjacentElement("beforeend", button);
}

export function createCatalogPanelAction(
  panel: HTMLElement,
  mount: HTMLElement,
) {
  if (mount.querySelector(".olwlg-catalog-primary-action")) return;

  const label = document.createElement("span");
  const icon = createModernIcon("add");
  icon.removeAttribute("aria-label");
  icon.removeAttribute("data-olwlg-tooltip");
  label.textContent = "Add";
  const button = createButton({
    ariaLabel: "Add",
    className:
      "olwlg-catalog-primary-action olwlg-catalog-primary-action--add olwlg-icon-control",
    content: [icon, label],
    dataset: { olwlgForControl: panel.id || "row-panel" },
    onClick: () => {
      openCatalogModal("Choose games to offer", panel, true);
    },
    tooltip: "Choose which of your games you would trade for this item.",
    variant: "custom",
  });
  mount.append(button);
}

export function activateCatalogAction(original: HTMLElement) {
  original.click();
  let opened = false;
  const openNativePanel = () => {
    if (opened) return;
    const panel =
      wantPanelForControl(original) ?? offerPanelForControl(original);
    if (!panel) return;
    opened = true;
    openCatalogModal("Choose games to offer", panel, true);
  };
  openNativePanel();
  [0, 40, 160, 360].forEach((delay) => {
    window.setTimeout(openNativePanel, delay);
  });
}

export function offerPanelForControl(original: HTMLElement) {
  const isVisible = (element: HTMLElement) => {
    const style = getComputedStyle(element);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      element.getClientRects().length > 0
    );
  };

  const describe = (element: HTMLElement) =>
    normalizedText(
      `${element.textContent} ${element.getAttribute("aria-label")} ${element.getAttribute("title")}`,
    );

  return [...document.body.querySelectorAll<HTMLElement>("div, form, section, table, fieldset, ul, ol")]
    .map((element) => {
      const text = describe(element);
      const checkboxCount = element.querySelectorAll('input[type="checkbox"]').length;
      const hasSaveCancel = /\bsave\b|\bcancel\b/i.test(text);
      const hasPopupCue = /choose games to offer|available games|offer listings|which of your games would you trade/i.test(
        text,
      );
      if (!hasPopupCue && !hasSaveCancel && checkboxCount === 0) return undefined;
      return {
        element,
        score:
          text.length +
          checkboxCount * 100 +
          (hasPopupCue ? 800 : 0) +
          (hasSaveCancel ? 200 : 0),
      };
    })
    .filter((entry): entry is { element: HTMLElement; score: number } =>
      Boolean(entry && isVisible(entry.element)),
    )
    .sort((left, right) => right.score - left.score)[0]?.element;
}

export function activateCatalogOfferAction(original: HTMLElement) {
  original.click();
  window.setTimeout(syncCatalogAddedItems, 80);
  window.setTimeout(syncCatalogAddedItems, 350);
}

export function createCatalogOfferAction(original: HTMLElement, mount = original) {
  if (
    original.closest(".olwlg-catalog-add-action") ||
    mount.parentElement?.querySelector(
      ".olwlg-catalog-add-action[data-olwlg-for-control]",
    )
  )
    return;

  const label = document.createElement("span");
  const icon = createModernIcon("add");
  icon.removeAttribute("aria-label");
  icon.removeAttribute("data-olwlg-tooltip");
  label.textContent = "Add to list";
  const button = createButton({
    ariaLabel: "Add directly to wants list",
    className: "olwlg-catalog-add-action olwlg-icon-control",
    content: [icon, label],
    dataset: { olwlgForControl: original.id || "legacy" },
    onClick: () => activateCatalogOfferAction(original),
    tooltip: "Add this item directly to your wants list.",
    variant: "custom",
  });
  original.dataset.olwlgEnhanced = "catalog-add-action";
  original.classList.add("olwlg-catalog-original-action");
  mount.insertAdjacentElement("beforeend", button);
}

export function wantPanelForControl(original: HTMLElement) {
  const sources = [
    original,
    ...original.querySelectorAll<HTMLElement>("*"),
  ];
  const identifiers = sources.flatMap((source) =>
    [
      source.id.match(/imgcw(\d+)/i)?.[1],
      catalogNativeActionContext(source).match(
        /(?:^|[^\w])clickwant\s*\(\s*(\d+)/i,
      )?.[1],
    ].filter((value): value is string => Boolean(value))
  );
  for (const identifier of identifiers) {
    const panel = document.getElementById(`cw${identifier}`);
    if (panel instanceof HTMLElement) return panel;
  }
  return undefined;
}

export function catalogActionImageSource(element: HTMLElement) {
  const image =
    element instanceof HTMLImageElement ||
      (element instanceof HTMLInputElement &&
        element.type.toLocaleLowerCase() === "image")
      ? element
      : element.querySelector<HTMLImageElement | HTMLInputElement>(
        'img, input[type="image"]',
      );
  return image?.src ?? "";
}

export function catalogNativeActionContext(element: HTMLElement) {
  const assignedClickHandler =
    typeof element.onclick === "function" ? element.onclick.toString() : "";
  const eventAttributes = [...element.attributes]
    .filter(
      (attribute) =>
        /^on/i.test(attribute.name) ||
        /^(?:href|src|alt|title|value|aria-label)$/i.test(attribute.name),
    )
    .map((attribute) => attribute.value)
    .join(" ");
  const semanticContext = [
    element.className,
    ...Object.entries(element.dataset).flat(),
    element.getAttribute("role"),
  ].join(" ");

  return normalizedText(
    `${element.id} ${semanticContext} ${eventAttributes} ${assignedClickHandler} ${
      catalogActionImageSource(element)
    }`,
  );
}

export function catalogNativeActionControls(row: HTMLTableRowElement) {
  return [row, ...row.querySelectorAll<HTMLElement>("*")].filter(
    (element) =>
      element.matches(
        "a, button, input, img, [onclick], [onmousedown], [onmouseup], [href]",
      ) ||
      typeof element.onclick === "function",
  );
}

export function catalogWantControl(row: HTMLTableRowElement) {
  const controls = catalogNativeActionControls(row);
  return controls.find(
    (element) => {
      const context = catalogNativeActionContext(element);
      return (
        (/(?:^|[^\w])clickwant\s*\(/i.test(context) ||
          /\badd[-_\s]?(?:item|want(?:list)?)\b/i.test(context)) &&
        !/(?:^|[^\w])oneclickwant\s*\(|\bone[-_\s]?click\b|\bdirect[-_\s]?want/i.test(
          context,
        )
      ) || /^imgcw\d+$/i.test(element.id);
    },
  ) ??
    controls.find(
      (element) =>
        (element instanceof HTMLImageElement ||
          (element instanceof HTMLInputElement &&
            element.type.toLocaleLowerCase() === "image")) &&
        /(?:^|\/)(?:hello|add|additem)\.(?:gif|png)(?:[?#]|$)/i.test(
          catalogActionImageSource(element),
        ),
    );
}

export function catalogDirectWantControl(row: HTMLTableRowElement) {
  const controls = catalogNativeActionControls(row);
  return controls.find((element) => {
    const context = catalogNativeActionContext(element);
    return /(?:^|[^\w])oneclickwant\s*\(|\bone[-_\s]?click(?:[-_\s]?(?:add|want))?\b|\bdirect[-_\s]?want|\badd[-_\s]?to[-_\s]?(?:list|want)/i.test(
      context,
    );
  }) ??
    controls.find(
      (element) =>
        (element instanceof HTMLImageElement ||
          (element instanceof HTMLInputElement &&
            element.type.toLocaleLowerCase() === "image")) &&
        /(?:^|\/)1click\.png(?:[?#]|$)/i.test(
          catalogActionImageSource(element),
        ),
    );
}

export function catalogWantPanelForRow(row: HTMLTableRowElement) {
  const control = catalogWantControl(row);
  const linkedPanel = control ? wantPanelForControl(control) : undefined;
  if (linkedPanel) return linkedPanel;

  const containedPanel = row.querySelector<HTMLElement>(
    ".cw, [id^='cw']",
  );
  if (containedPanel) return containedPanel;

  const rowNumber = [...row.parentElement?.children ?? []].indexOf(row);
  if (rowNumber < 0) return undefined;
  return [...document.querySelectorAll<HTMLElement>(".cw, [id^='cw']")]
    .filter((panel) => /^cw\d+$/i.test(panel.id) || panel.classList.contains("cw"))
    [rowNumber - 1];
}

export function catalogRowHasSavedWant(row: HTMLTableRowElement) {
  const cell = row.cells[0];
  if (cell && addedCandidateFromCell(cell)) return true;

  const panel = catalogWantPanelForRow(row);
  return Boolean(
    panel?.querySelector(
      'input[type="checkbox"]:checked, input[type="radio"]:checked',
    ),
  );
}

export function showAddedFeedback(button: HTMLElement, idleLabel: string) {
  if (button.classList.contains("olwlg-catalog-primary-action--added")) return;
  const label = button.querySelector("span:last-child");
  const currentIcon = button.querySelector(".olwlg-modern-icon");
  const addedIcon = createModernIcon("added");
  addedIcon.removeAttribute("aria-label");
  addedIcon.removeAttribute("data-olwlg-tooltip");
  currentIcon?.replaceWith(addedIcon);
  if (label) label.textContent = "Item Added";
  button.classList.add(
    "olwlg-catalog-primary-action--added",
    "olwlg-catalog-primary-action--confirmed",
  );
  button.setAttribute("aria-label", "Item added");

  window.setTimeout(() => {
    const addIcon = createModernIcon("add");
    addIcon.removeAttribute("aria-label");
    addIcon.removeAttribute("data-olwlg-tooltip");
    button.querySelector(".olwlg-modern-icon")?.replaceWith(addIcon);
    if (label) label.textContent = idleLabel;
    button.classList.remove(
      "olwlg-catalog-primary-action--added",
      "olwlg-catalog-primary-action--confirmed",
    );
    button.setAttribute("aria-label", idleLabel);
  }, 2800);
}

export function catalogRowBelongsToLoggedInUser(row: HTMLTableRowElement) {
  const username = catalogLoggedInUsername();
  const participant = participantFromRow(row);
  return Boolean(
    username &&
      participant !== "Unknown participant" &&
      participant.localeCompare(username, undefined, {
        sensitivity: "base",
      }) === 0,
  );
}

export function ensureCatalogOwnItemIndicator(mount: HTMLElement) {
  if (mount.querySelector(".olwlg-catalog-own-item-action")) return;

  const indicator = document.createElement("span");
  const label = document.createElement("span");
  const icon = createModernIcon("myItems");
  indicator.className =
    "olwlg-catalog-own-item-action olwlg-tooltip-target";
  indicator.dataset.olwlgTooltip =
    "This item is offered by you, so it cannot be added to your want list.";
  indicator.setAttribute("role", "status");
  indicator.setAttribute("aria-label", "Your own item; cannot be added");
  indicator.tabIndex = 0;
  icon.removeAttribute("aria-label");
  icon.removeAttribute("data-olwlg-tooltip");
  label.textContent = "Your own item";
  indicator.append(icon, label);
  mount.append(indicator);
}

export function restrictCatalogOwnItemActions(row: HTMLTableRowElement) {
  row.dataset.olwlgOwnOffer = "true";
  row.classList.add("olwlg-catalog-row--own-offer");

  const cell = row.cells[0];
  if (!cell) return;
  const nativeWantControls = new Set<HTMLElement>([
    catalogWantControl(row),
    catalogDirectWantControl(row),
    actionCandidateFromCell(cell),
    ...row.querySelectorAll<HTMLElement>(
      "[onclick*='clickwant' i], a[href*='mywants.cgi'], a[href*='step4']",
    ),
  ].filter((control): control is HTMLElement => Boolean(control)));
  nativeWantControls.forEach((control) => {
    control.classList.add(
      "olwlg-catalog-original-action",
      "olwlg-catalog-own-item-control",
    );
    control.setAttribute("aria-disabled", "true");
    control.tabIndex = -1;
    if (
      control instanceof HTMLButtonElement ||
      control instanceof HTMLInputElement
    )
      control.disabled = true;
    if (control.dataset.olwlgOwnItemGuard === "true") return;
    control.dataset.olwlgOwnItemGuard = "true";
    control.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  });
  cell
    .querySelectorAll<HTMLElement>(
      ".olwlg-catalog-primary-action, .olwlg-catalog-add-action",
    )
    .forEach((control) => control.remove());
  ensureCatalogOwnItemIndicator(cell);
}

export function enhanceCatalogRowActions(row: HTMLTableRowElement) {
  const cell = row.cells[0];
  if (!cell) return;
  if (
    row.dataset.olwlgOwnOffer === "true" ||
    catalogRowBelongsToLoggedInUser(row)
  ) {
    restrictCatalogOwnItemActions(row);
    return;
  }
  if (catalogIsReadOnly()) {
    const nativeWantControls = new Set<HTMLElement>([
      catalogWantControl(row),
      catalogDirectWantControl(row),
      ...row.querySelectorAll<HTMLElement>(
        "[onclick*='clickwant' i], a[href*='mywants.cgi'], a[href*='step4']",
      ),
    ].filter((control): control is HTMLElement => Boolean(control)));
    nativeWantControls.forEach((control) => {
      control.classList.add("olwlg-catalog-read-only-control");
      control.setAttribute("aria-disabled", "true");
      control.tabIndex = -1;
      if (
        control instanceof HTMLButtonElement ||
        control instanceof HTMLInputElement
      )
        control.disabled = true;
    });
    cell
      .querySelectorAll<HTMLElement>(
        ".olwlg-catalog-primary-action, .olwlg-catalog-add-action",
      )
      .forEach((control) => control.remove());
    return;
  }

  const clickWant = catalogWantControl(row);
  const directWant = catalogDirectWantControl(row);
  const added =
    Boolean(addedCandidateFromCell(cell)) ||
    Boolean(
      catalogWantPanelForRow(row)?.querySelector(
          'input[type="checkbox"]:checked, input[type="radio"]:checked',
        ),
    );
  if (added) {
    markCatalogRowAdded(row);
    return;
  }

  if (clickWant) {
    createCatalogAction(clickWant, "add", cell);
  } else {
    const panel = catalogWantPanelForRow(row);
    if (panel) createCatalogPanelAction(panel, cell);
  }
  if (directWant) {
    createCatalogOfferAction(directWant, cell);
  }

  const add =
    row.querySelector<HTMLElement>(".olwlg-catalog-add") ??
    actionCandidateFromCell(cell);
  if (add) {
    const legacyAddParts = [
      ...cell.querySelectorAll<HTMLElement>("input, button, img"),
    ].filter((element) => {
      if (
        element.closest(
          ".olwlg-catalog-primary-action, .olwlg-catalog-add-action",
        )
      )
        return false;
      const filename =
        element instanceof HTMLImageElement ? imageFilename(element) ?? "" : "";
      const label =
        element instanceof HTMLInputElement
          ? `${element.value} ${element.alt} ${element.title}`
          : `${element.textContent ?? ""} ${element.title} ${
              element instanceof HTMLImageElement ? element.alt : ""
            }`;
      return (
        !/check|added|selected/i.test(`${filename} ${label}`) &&
        /add|plus/i.test(`${filename} ${label}`)
      );
    });
    if (!clickWant && add !== directWant)
      createCatalogAction(add, "add", cell);
    legacyAddParts.forEach((element) => {
      element.dataset.olwlgEnhanced = "catalog-action";
      element.classList.add("olwlg-catalog-original-action");
    });
  }
}
