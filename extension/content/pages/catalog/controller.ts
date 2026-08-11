import {
  enhanceCatalogRowActions,
} from "./actions";
import {
  createCatalogCards,
  syncCatalogCardActions,
} from "./cards";
import {
  organizeCatalogPageFooter,
} from "./footer";
import {
  moneyAmountFromAlternativeTitle,
  normalizedText,
} from "./helpers";
import {
  loadCatalogImages,
} from "./images";
import {
  createCatalogInfoCard,
} from "./info-card";
import {
  enhanceCatalogMessages,
} from "./messages";
import {
  rememberCatalogModeUrls,
} from "./mode";
import {
  catalogCollectionStatuses,
  decorateCatalogGameCell,
  findCatalogTable,
  participantFromRow,
  participantUrlFromRow,
} from "./parsing";
import {
  addCatalogBackToTop,
  configureCatalogParticipation,
} from "./participation";
import {
  catalogBggId,
  catalogGameTitle,
} from "./presentation";
import {
  createCatalogToolbar,
} from "./toolbar";
import {
  type CatalogRow,
} from "./types";

export function isCatalogPage(pathname = location.pathname) {
  return pathname.endsWith("/viewlist.cgi");
}

export async function enhanceCatalogPage() {
  if (!isCatalogPage()) return;

  const table = findCatalogTable();
  if (!table || table.dataset.olwlgCatalog) return;

  table.dataset.olwlgCatalog = "true";
  table.classList.add("olwlg-catalog-table", "olwlg-catalog-table--compact");
  document.body.classList.add("olwlg-catalog-page");
  addCatalogBackToTop();
  enhanceCatalogMessages();
  rememberCatalogModeUrls();

  const headerRow = table.rows[0];
  headerRow?.classList.add("olwlg-catalog-header");
  [...(headerRow?.cells ?? [])].forEach((cell) => {
    const key = normalizedText(cell.textContent)
      .replace(/\s+/g, "")
      .toLowerCase();
    const headerLabels: Record<string, string> = {
      "gl#": "GL #",
      game: "Game",
      rank: "Rank",
      rating: "Rating",
      bayrating: "Bay Rating",
    };
    const label = headerLabels[key];
    if (label) cell.textContent = label;

    cell.setAttribute("scope", "col");
    if (label) cell.setAttribute("aria-label", `Sort by ${label}`);
    cell.tabIndex = 0;
    cell.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      cell.click();
    });
  });

  const nativeRows = [...table.rows]
    .slice(1)
    .filter((row) => row.cells.length >= 2);
  await configureCatalogParticipation(nativeRows);
  const rows: CatalogRow[] = nativeRows
    .map((element, index) => {
      element.classList.add("olwlg-catalog-row");
      element.dataset.olwlgRowNumber = String(index + 1);

      const gameCell = element.cells[1];
      gameCell?.classList.add("olwlg-catalog-game");
      if (gameCell) decorateCatalogGameCell(gameCell);
      element.cells[0]?.classList.add("olwlg-catalog-index");
      enhanceCatalogRowActions(element);

      const numericCells = [...element.cells].slice(-3);
      numericCells.forEach((cell) => {
        cell.textContent = normalizedText(cell.textContent).replace(/\s+/g, "");
        cell.classList.add("olwlg-catalog-number");
        cell.setAttribute("dir", "ltr");
      });
      const parsedRank = Number.parseFloat(numericCells[0]?.textContent ?? "");
      const parsedRating = Number.parseFloat(
        numericCells[1]?.textContent ?? "",
      );
      const parsedBayRating = Number.parseFloat(
        numericCells[2]?.textContent ?? "",
      );
      const itemText = normalizedText(gameCell?.textContent);
      const gameTitle = catalogGameTitle(gameCell);
      const isAlternative = /\balt\s+name\b/i.test(gameTitle || itemText);
      const moneyAmount = isAlternative
        ? moneyAmountFromAlternativeTitle(gameTitle)
        : undefined;
      const collectionStatuses = catalogCollectionStatuses(gameCell);
      const searchText = normalizedText(element.textContent).toLocaleLowerCase();

      element
        .querySelectorAll<HTMLInputElement | HTMLButtonElement>(
          'input[type="button"], input[type="submit"], button',
        )
        .forEach((control) => {
          const label =
            control instanceof HTMLInputElement
              ? control.value
              : control.textContent;
          if (normalizedText(label).toLowerCase() === "add")
            control.classList.add("olwlg-catalog-add");
        });

      return {
        bayRating: Number.isFinite(parsedBayRating)
          ? parsedBayRating
          : undefined,
        bggId: catalogBggId(gameCell),
        collectionStatuses,
        collectionTags: collectionStatuses.map((status) => status.label),
        element,
        gameTitle,
        glNumber:
          normalizedText(element.cells[0]?.childNodes[0]?.textContent) ||
          String(index + 1),
        itemType: moneyAmount !== undefined
          ? "money"
          : isAlternative
            ? "other"
            : "game",
        moneyAmount,
        participant: participantFromRow(element),
        participantUrl: participantUrlFromRow(element),
        rank:
          Number.isFinite(parsedRank) && parsedRank > 0
            ? parsedRank
            : undefined,
        rating: Number.isFinite(parsedRating) ? parsedRating : undefined,
        compactSearchText: searchText.replace(/\s+/g, ""),
        searchText,
      };
    });

  const wrapper = document.createElement("div");
  wrapper.className = "olwlg-catalog-scroll";
  wrapper.tabIndex = 0;
  wrapper.setAttribute(
    "aria-label",
    "Scrollable table of math trade items",
  );
  table.insertAdjacentElement("beforebegin", wrapper);
  wrapper.append(table);

  const grid = createCatalogCards(rows);
  wrapper.classList.add("olwlg-catalog-source");
  const toolbar = createCatalogToolbar(rows, wrapper, grid);
  if (toolbar) createCatalogInfoCard(toolbar);
  if (toolbar) toolbar.insertAdjacentElement("afterend", grid);
  else wrapper.insertAdjacentElement("beforebegin", grid);
  void loadCatalogImages(rows);
  organizeCatalogPageFooter();

  const rowByElement = new WeakMap<HTMLTableRowElement, CatalogRow>();
  rows.forEach((row) => rowByElement.set(row.element, row));
  const pendingActionRows = new Set<CatalogRow>();
  let actionSyncFrame = 0;
  const syncCardActions = () => {
    actionSyncFrame = 0;
    const pending = [...pendingActionRows];
    pendingActionRows.clear();
    pending.forEach((row) => {
      enhanceCatalogRowActions(row.element);
      const primaryStack = row.card?.querySelector<HTMLElement>(
        ".olwlg-item-card__primary-stack",
      );
      if (primaryStack) syncCatalogCardActions(row, primaryStack);
    });
  };
  const scheduleActionSync = () => {
    if (actionSyncFrame) return;
    actionSyncFrame = requestAnimationFrame(syncCardActions);
  };
  const queueActionRow = (element: Element) => {
    const tableRow = element.closest<HTMLTableRowElement>(
      "tr.olwlg-catalog-row",
    );
    const row = tableRow ? rowByElement.get(tableRow) : undefined;
    if (row) pendingActionRows.add(row);
  };
  const actionObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target instanceof Element)
        queueActionRow(mutation.target);
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        queueActionRow(node);
        node
          .querySelectorAll<HTMLElement>("tr.olwlg-catalog-row")
          .forEach(queueActionRow);
      });
    });
    if (pendingActionRows.size) scheduleActionSync();
  });
  actionObserver.observe(table, {
    childList: true,
    subtree: true,
  });
}
