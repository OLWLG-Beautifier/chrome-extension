import {
  createButton,
  enhanceSearchableSelect,
  syncSearchableSelects,
} from "../../components";
import {
  filterCatalogRows,
} from "./filters";
import {
  COLLECTION_STATUS_LABELS,
  normalizedText,
} from "./helpers";
import {
  addCatalogModeSwitch,
  restoreNewItemsNotice,
} from "./mode";
import {
  catalogPageNumbers,
} from "./pagination";
import {
  sortCatalogCards,
} from "./sorting";
import {
  createCatalogPaginationView,
  createCatalogToolbarView,
} from "./toolbar-view";
import {
  type CatalogRow,
} from "./types";
import {
  configureCatalogCardView,
} from "./view";

export function createCatalogToolbar(
  rows: CatalogRow[],
  wrapper: HTMLDivElement,
  grid: HTMLElement,
) {
  const toolbar = createCatalogToolbarView();

  restoreNewItemsNotice(toolbar);
  addCatalogModeSwitch(toolbar);
  configureCatalogCardView(toolbar, grid);

  const search = toolbar.querySelector<HTMLInputElement>('input[type="search"]');
  const participant =
    toolbar.querySelector<HTMLSelectElement>("select");
  const itemType =
    toolbar.querySelector<HTMLSelectElement>(".olwlg-catalog-type");
  const rank = toolbar.querySelector<HTMLSelectElement>(".olwlg-catalog-rank");
  const moneyRange =
    toolbar.querySelector<HTMLElement>(".olwlg-catalog-money");
  const moneyMin = toolbar.querySelector<HTMLInputElement>(".olwlg-money-min");
  const moneyMax = toolbar.querySelector<HTMLInputElement>(".olwlg-money-max");
  const collection = toolbar.querySelector<HTMLSelectElement>(
    ".olwlg-catalog-collection",
  );
  const sort = toolbar.querySelector<HTMLSelectElement>(".olwlg-catalog-sort");
  const count = toolbar.querySelector<HTMLElement>(".olwlg-catalog-count");
  const loader = toolbar.querySelector<HTMLElement>(".olwlg-catalog-loader");
  const clear = toolbar.querySelector<HTMLButtonElement>(".olwlg-catalog-clear");
  if (
    !search ||
    !participant ||
    !itemType ||
    !rank ||
    !moneyRange ||
    !moneyMin ||
    !moneyMax ||
    !collection ||
    !sort ||
    !count ||
    !loader ||
    !clear
  )
    return;

  const participants = [...new Set(rows.map((row) => row.participant))]
    .filter((name) => name !== "Unknown participant")
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  for (const name of participants) {
    const option = document.createElement("option");
    option.value = name.toLocaleLowerCase();
    option.textContent = name;
    participant.append(option);
  }

  const collectionTags = [
    ...new Set([
      ...COLLECTION_STATUS_LABELS,
      ...rows.flatMap((row) => row.collectionTags),
    ]),
  ];
  for (const tag of collectionTags) {
    const option = document.createElement("option");
    option.value = tag.toLocaleLowerCase();
    option.textContent = tag.replace(/\b\w/g, (letter) =>
      letter.toLocaleUpperCase()
    );
    collection.append(option);
  }

  const moneyAmounts = rows
    .map((row) => row.moneyAmount)
    .filter((amount): amount is number => amount !== undefined);
  if (moneyAmounts.length) {
    moneyMin.placeholder = String(Math.min(...moneyAmounts));
    moneyMax.placeholder = String(Math.max(...moneyAmounts));
  }

  const {
    emptyState,
    nextPage,
    pageJump,
    pageJumpButton,
    pageNavigation,
    pageNumbers,
    pageSize,
    pageStatus,
    paginator,
    previousPage,
  } = createCatalogPaginationView(wrapper);

  let currentPage = 1;
  let renderedTotalPages = 1;
  let orderedRows = rows;

  const scrollToCatalogStart = () => {
    grid.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  };

  const render = () => {
    const query = normalizedText(search.value).toLocaleLowerCase();
    const compactQuery = query.replace(/\s+/g, "");
    const selectedParticipant = participant.value;
    const selectedType = itemType.value;
    const selectedRank = rank.value;
    const selectedCollection = collection.value;
    const minimumMoney =
      moneyMin.value === "" ? undefined : Number(moneyMin.value);
    const maximumMoney =
      moneyMax.value === "" ? undefined : Number(moneyMax.value);
    const filteredRows = filterCatalogRows(orderedRows, {
      compactQuery,
      maximumMoney,
      minimumMoney,
      query,
      selectedCollection,
      selectedParticipant,
      selectedRank,
      selectedType,
    });

    const size = Number(pageSize.value);
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / size));
    renderedTotalPages = totalPages;
    currentPage = Math.min(currentPage, totalPages);
    const startIndex = (currentPage - 1) * size;
    const pageRows = new Set(filteredRows.slice(startIndex, startIndex + size));
    orderedRows.forEach((row) => {
      const hidden = !pageRows.has(row);
      row.element.hidden = hidden;
      if (row.card) row.card.hidden = hidden;
    });

    paginator.hidden = filteredRows.length === 0;
    pageNavigation.hidden = totalPages <= 1;
    previousPage.disabled = currentPage === 1;
    nextPage.disabled = currentPage === totalPages;
    pageJump.max = String(totalPages);
    pageJump.placeholder = String(currentPage);
    pageNumbers.replaceChildren();
    catalogPageNumbers(currentPage, totalPages).forEach((page) => {
      if (page === "ellipsis") {
        const ellipsis = document.createElement("span");
        ellipsis.className = "olwlg-catalog-page-ellipsis";
        ellipsis.textContent = "…";
        ellipsis.setAttribute("aria-hidden", "true");
        pageNumbers.append(ellipsis);
        return;
      }
      const button = createButton({
        ariaLabel: `Go to page ${page}`,
        className: "olwlg-catalog-page-number",
        content: String(page),
        onClick: () => {
          currentPage = page;
          render();
          scrollToCatalogStart();
        },
        variant: "custom",
      });
      if (page === currentPage) {
        button.setAttribute("aria-current", "page");
        button.disabled = true;
      }
      pageNumbers.append(button);
    });

    const participantLabel =
      participants.length === 1 ? "participant" : "participants";
    const firstVisible = filteredRows.length === 0 ? 0 : startIndex + 1;
    const lastVisible = Math.min(startIndex + size, filteredRows.length);
    const hasFilters = Boolean(
      query ||
        selectedParticipant ||
        selectedType ||
        moneyMin.value ||
        moneyMax.value ||
        selectedRank ||
        selectedCollection,
    );
    count.textContent = hasFilters
      ? `Showing ${firstVisible}–${lastVisible} of ${filteredRows.length} matching items · ${rows.length} total · ${participants.length} ${participantLabel}`
      : `Showing ${firstVisible}–${lastVisible} of ${rows.length} items · ${participants.length} ${participantLabel}`;
    pageStatus.textContent = filteredRows.length
      ? `Page ${currentPage} of ${totalPages}. Showing items ${firstVisible} through ${lastVisible} of ${filteredRows.length}.`
      : "No matching catalog items.";
    emptyState.hidden = filteredRows.length !== 0;
    clear.disabled =
      !query &&
      !selectedParticipant &&
      !selectedType &&
      !moneyMin.value &&
      !moneyMax.value &&
      !selectedRank &&
      !selectedCollection;
  };

  let renderTimer: number | undefined;
  const scheduleRender = () => {
    currentPage = 1;
    loader.hidden = false;
    toolbar.setAttribute("aria-busy", "true");
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(() => {
      render();
      loader.hidden = true;
      toolbar.removeAttribute("aria-busy");
    }, 60);
  };

  search.addEventListener("input", scheduleRender);
  participant.addEventListener("change", scheduleRender);
  itemType.addEventListener("change", () => {
    moneyRange.classList.toggle(
      "olwlg-control-unavailable",
      itemType.value !== "money",
    );
    scheduleRender();
  });
  moneyMin.addEventListener("input", scheduleRender);
  moneyMax.addEventListener("input", scheduleRender);
  rank.addEventListener("change", scheduleRender);
  collection.addEventListener("change", scheduleRender);
  sort.addEventListener("change", () => {
    currentPage = 1;
    orderedRows = sortCatalogCards(rows, grid, sort.value);
    render();
  });
  pageSize.addEventListener("change", () => {
    currentPage = 1;
    render();
  });
  previousPage.addEventListener("click", () => {
    if (currentPage <= 1) return;
    currentPage -= 1;
    render();
    scrollToCatalogStart();
  });
  nextPage.addEventListener("click", () => {
    if (currentPage >= renderedTotalPages) return;
    currentPage += 1;
    render();
    scrollToCatalogStart();
  });
  const jumpToPage = () => {
    const requestedPage = Number.parseInt(pageJump.value, 10);
    if (!Number.isFinite(requestedPage)) return;
    currentPage = Math.min(Math.max(requestedPage, 1), renderedTotalPages);
    pageJump.value = "";
    render();
    scrollToCatalogStart();
  };
  pageJumpButton.addEventListener("click", jumpToPage);
  pageJump.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    jumpToPage();
  });
  clear.addEventListener("click", () => {
    search.value = "";
    participant.value = "";
    itemType.value = "";
    moneyMin.value = "";
    moneyMax.value = "";
    moneyRange.classList.add("olwlg-control-unavailable");
    rank.value = "";
    collection.value = "";
    sort.value = "gl";
    currentPage = 1;
    orderedRows = sortCatalogCards(rows, grid, sort.value);
    syncSearchableSelects(toolbar);
    render();
    search.focus();
  });

  toolbar.querySelectorAll<HTMLSelectElement>("select").forEach(
    enhanceSearchableSelect,
  );
  wrapper.insertAdjacentElement("beforebegin", toolbar);
  toolbar.insertAdjacentElement("afterend", paginator);
  render();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      loader.hidden = true;
    });
  });
  return toolbar;
}
