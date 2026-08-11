import { createLink } from "../../components";
import { normalizeWhitespace } from "../../core/dom";
import type { CatalogTradeState } from "./types";

export type CatalogListMode = "full" | "new" | "wants";

const CATALOG_LIST_MODE_LABELS: Record<CatalogListMode, string> = {
  full: "Full list",
  new: "New items",
  wants: "My wants",
};

export function catalogListId() {
  return new URL(location.href).searchParams.get("listid");
}

function catalogTradeStateStorageKey(listId: string) {
  return `olwlg-trade-state-${listId}`;
}

export function rememberCatalogTradeState(
  listId: string,
  state: CatalogTradeState,
) {
  try {
    localStorage.setItem(
      catalogTradeStateStorageKey(listId),
      state === "ended" ? "ended" : "active",
    );
  } catch {
    // State inference still works when storage is unavailable.
  }
}

export function rememberedCatalogTradeState() {
  const listId = catalogListId();
  if (!listId) return undefined;
  try {
    return localStorage.getItem(catalogTradeStateStorageKey(listId)) ??
      undefined;
  } catch {
    return undefined;
  }
}

export function fullCatalogUrl() {
  const listId = catalogListId();
  if (!listId) return undefined;
  const url = new URL("/olwlg/viewlist.cgi", location.origin);
  url.search = new URLSearchParams({ listid: listId, viewall: "1" }).toString();
  return url.href;
}

function newItemsCatalogUrl() {
  const listId = catalogListId();
  if (!listId) return undefined;
  const url = new URL(location.href);
  url.search = new URLSearchParams({ listid: listId }).toString();
  return url.href;
}

function wantsCatalogUrl() {
  const listId = catalogListId();
  if (!listId) return undefined;
  const url = new URL(location.href);
  url.search = new URLSearchParams({
    listid: listId,
    viewmywants: "1",
  }).toString();
  return url.href;
}

function catalogModeStorageKey(mode: CatalogListMode) {
  const listId = catalogListId();
  return listId ? `olwlg-catalog-${mode}-${listId}` : undefined;
}

function catalogModeLink(mode: CatalogListMode) {
  const links = [...document.querySelectorAll<HTMLAnchorElement>("a[href]")];
  if (mode === "full") {
    return links.find((link) =>
      /view (?:the )?(?:entire|full) list|entire list/i.test(
        normalizeWhitespace(link.parentElement?.textContent),
      )
    );
  }
  if (mode === "wants") {
    return links.find((link) =>
      /one more pass viewing only items that are on your wish\/want\/etc lists/i
        .test(normalizeWhitespace(link.parentElement?.textContent))
    );
  }
  return undefined;
}

export function activeCatalogMode(): CatalogListMode {
  const url = new URL(location.href);
  const isViewingMyWants = url.searchParams
    .getAll("viewmywants")
    .some((value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0;
    });
  if (isViewingMyWants) return "wants";

  if (
    [...document.querySelectorAll<HTMLElement>(".olwlg-message--info")].some(
      (message) =>
        /you are only viewing new items added since you last viewed/i.test(
          normalizeWhitespace(message.textContent),
        ),
    )
  )
    return "new";

  if (url.searchParams.get("viewall") === "1") return "full";
  return "new";
}

function catalogModeUrl(mode: CatalogListMode) {
  if (mode === activeCatalogMode()) return location.href;

  const key = catalogModeStorageKey(mode);
  const remembered = key ? sessionStorage.getItem(key) : undefined;
  if (remembered) return remembered;

  const nativeLink = catalogModeLink(mode);
  if (nativeLink) return nativeLink.href;

  if (mode === "full") return fullCatalogUrl();
  if (mode === "new") return newItemsCatalogUrl();
  return wantsCatalogUrl();
}

export function rememberCatalogModeUrls() {
  const currentKey = catalogModeStorageKey(activeCatalogMode());
  if (currentKey) sessionStorage.setItem(currentKey, location.href);

  (["full", "wants"] as CatalogListMode[]).forEach((mode) => {
    const link = catalogModeLink(mode);
    const key = catalogModeStorageKey(mode);
    if (!link || !key) return;
    sessionStorage.setItem(key, link.href);
    link.addEventListener("click", () => sessionStorage.setItem(key, link.href));
  });
}

export function addCatalogModeSwitch(toolbar: HTMLElement) {
  const heading = toolbar.querySelector<HTMLElement>(
    ".olwlg-catalog-toolbar__heading",
  );
  if (!heading) return;

  const switcher = document.createElement("nav");
  switcher.className = "olwlg-catalog-mode-switch";
  switcher.setAttribute("aria-label", "Catalog list mode");
  const currentMode = activeCatalogMode();

  (["full", "new", "wants"] as const).forEach((mode) => {
    const href = catalogModeUrl(mode);
    const tooltip = mode === "full"
      ? "View every item in this math trade."
      : mode === "new"
        ? "View items added since your previous visit."
        : "View only items on your wish and want lists.";
    const control = href
      ? createLink({
        attributes: { "aria-current": mode === currentMode ? "page" : "false" },
        className:
          "olwlg-catalog-mode-switch__option olwlg-tooltip-target",
        content: CATALOG_LIST_MODE_LABELS[mode],
        dataset: { olwlgCatalogMode: mode },
        href,
        target: "_self",
        tooltip,
      })
      : document.createElement("span");
    if (!href) {
      control.className =
        "olwlg-catalog-mode-switch__option olwlg-tooltip-target";
      control.dataset.olwlgCatalogMode = mode;
      control.dataset.olwlgTooltip = tooltip;
      control.textContent = CATALOG_LIST_MODE_LABELS[mode];
      control.setAttribute(
        "aria-current",
        mode === currentMode ? "page" : "false",
      );
      control.classList.add("is-unavailable");
      control.setAttribute("aria-disabled", "true");
    }
    switcher.append(control);
  });
  heading.append(switcher);
}

export function restoreNewItemsNotice(toolbar: HTMLElement) {
  const notice = [
    ...document.querySelectorAll<HTMLElement>(".olwlg-message--info"),
  ].find((message) =>
    /you are only viewing new items added since you last viewed/i.test(
      normalizeWhitespace(message.textContent),
    )
  );
  if (!notice) return;
  notice.classList.add("olwlg-catalog-new-items-note");
  toolbar.prepend(notice);
}