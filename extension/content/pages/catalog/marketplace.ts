import {
  createButton,
  createInput,
  createLink,
  createSelect,
  enhanceSearchableSelect,
  syncSearchableSelects,
} from "../../components";
import {
  normalizedText,
} from "./helpers";

export type MarketplaceSectionKind = "sold" | "active";

export function marketplaceCondition(value: string) {
  const compact = normalizedText(value)
    .toLocaleLowerCase()
    .replace(/[\s_-]+/g, "");
  const known: Record<string, string> = {
    acceptable: "Acceptable",
    good: "Good",
    likenew: "Like New",
    mint: "Mint",
    new: "New",
    verygood: "Very Good",
  };
  return known[compact] ??
    normalizedText(value)
      .toLocaleLowerCase()
      .replace(/\b\w/g, (letter) => letter.toLocaleUpperCase());
}

export function marketplaceCurrency(value: string) {
  const price = normalizedText(value);
  if (/^(?:US\$|USD\b)/i.test(price)) return "USD";
  if (/^(?:CA\$|CAD\b)/i.test(price)) return "CAD";
  if (/^(?:A\$|AU\$|AUD\b)/i.test(price)) return "AUD";
  if (/^(?:NZ\$|NZD\b)/i.test(price)) return "NZD";
  if (/^(?:€|EUR\b)/i.test(price)) return "EUR";
  if (/^(?:£|GBP\b)/i.test(price)) return "GBP";
  if (/^(?:₪|ILS\b)/i.test(price)) return "ILS";
  if (/^(?:¥|JPY\b)/i.test(price)) return "JPY";
  if (/^\$/.test(price)) return "USD";
  return price.match(/^([A-Z]{2,3})(?:\$|\b)/)?.[1] ?? "Other";
}

export function marketplaceDate(value: string) {
  const parsed = Date.parse(normalizedText(value));
  if (!Number.isFinite(parsed)) return "";
  const date = new Date(parsed);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function marketplaceTables(root: ParentNode) {
  return [...root.querySelectorAll<HTMLTableElement>("table")].filter(
    (candidate) => {
      const headings = [...candidate.rows[0]?.cells ?? []].map((cell) =>
        normalizedText(cell.textContent).toLocaleLowerCase(),
      );
      return (
        headings.includes("price") &&
        headings.some((heading) => /^cond(?:ition)?$/.test(heading)) &&
        headings.includes("listed")
      );
    },
  );
}

export function marketplaceTableKind(
  table: HTMLTableElement,
): MarketplaceSectionKind {
  const headings = [...table.rows[0]?.cells ?? []].map((cell) =>
    normalizedText(cell.textContent).toLocaleLowerCase(),
  );
  return headings.some((heading) => /^sold$/.test(heading))
    ? "sold"
    : "active";
}

export function removeLegacyMarketplaceHeadings(root: ParentNode) {
  root
    .querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6, p, center, b, strong")
    .forEach((element) => {
      if (
        element.classList.contains(
          "olwlg-price-history__marketplace-heading",
        )
      )
        return;
      if (
        !/^following are copies in the bgg marketplace for sale\b/i.test(
          normalizedText(element.textContent),
        )
      )
        return;
      const container = element.closest<HTMLElement>(
        "h1, h2, h3, h4, h5, h6, p, center",
      );
      (container ?? element).remove();
    });
}

export function createMarketplaceSection(
  document: Document,
  table: HTMLTableElement,
  kind: MarketplaceSectionKind,
) {
  const details = document.createElement("details");
  const sectionSummary = document.createElement("summary");
  const panel = document.createElement("div");
  const headerRow = table.rows[0];
  const sourceHeaderCells = [...headerRow?.cells ?? []];
  const headingIndex = (pattern: RegExp) =>
    sourceHeaderCells.findIndex((cell) =>
      pattern.test(normalizedText(cell.textContent).toLocaleLowerCase()),
    );
  const priceIndex = headingIndex(/^price$/);
  const conditionIndex = headingIndex(/^cond(?:ition)?$/);
  const listedIndex = headingIndex(/^listed$/);
  const soldIndex = headingIndex(/^sold$/);
  const notesIndex = headingIndex(/^notes?$/);
  if (priceIndex < 0 || conditionIndex < 0 || listedIndex < 0)
    return undefined;

  const listingHeader = document.createElement("th");
  listingHeader.className = "olwlg-price-history__listing-heading";
  listingHeader.scope = "col";
  listingHeader.textContent = "Listing";
  headerRow?.append(listingHeader);
  const headerCells = [...headerRow?.cells ?? []];
  const listingIndex = headerCells.length - 1;

  details.className =
    `olwlg-price-history__section olwlg-price-history__section--${kind}`;
  sectionSummary.className = "olwlg-price-history__section-summary";
  panel.className = "olwlg-price-history__section-panel";
  table.classList.add("olwlg-price-history__table");
  table.querySelector("colgroup")?.remove();
  const columnGroup = document.createElement("colgroup");
  const notesWidth = kind === "sold" ? 34 : 38;
  const listingWidth = 9;
  const remainingColumns = Math.max(1, headerCells.length - 2);
  headerCells.forEach((_, index) => {
    const column = document.createElement("col");
    column.style.width =
      index === notesIndex
        ? `${notesWidth}%`
        : index === listingIndex
          ? `${listingWidth}%`
          : `${(100 - notesWidth - listingWidth) / remainingColumns}%`;
    columnGroup.append(column);
  });
  table.prepend(columnGroup);

  const rows = [...table.rows].slice(1).filter((row) => row.cells.length > 1);
  sectionSummary.textContent =
    `${kind === "sold" ? "Sold listings" : "Active marketplace listings"} (${rows.length})`;
  const currencies = new Set<string>();
  const conditions = new Set<string>();
  rows.forEach((row) => {
    const priceCell = row.cells[priceIndex];
    const conditionCell = row.cells[conditionIndex];
    const listedCell = row.cells[listedIndex];
    const soldCell = soldIndex >= 0 ? row.cells[soldIndex] : undefined;
    const notesCell = notesIndex >= 0 ? row.cells[notesIndex] : undefined;
    const listingCell = document.createElement("td");
    const noteLinks = notesCell
      ? [...notesCell.querySelectorAll<HTMLAnchorElement>("a[href]")]
      : [];
    const listingLink =
      noteLinks.find((link) =>
        /(?:marketplace|geekmarket|listing|item)/i.test(
          `${link.href} ${link.textContent}`,
        ),
      ) ??
      noteLinks.find((link) =>
        /^(?:link|view|listing|item)$/i.test(normalizedText(link.textContent)),
      );
    const currency = marketplaceCurrency(priceCell?.textContent ?? "");
    const condition = marketplaceCondition(conditionCell?.textContent ?? "");
    row.dataset.olwlgCurrency = currency;
    row.dataset.olwlgCondition = condition;
    row.dataset.olwlgDate =
      marketplaceDate(
        (kind === "sold" ? soldCell : listedCell)?.textContent ?? "",
      ) || marketplaceDate(listedCell?.textContent ?? "");
    currencies.add(currency);
    if (condition) conditions.add(condition);
    priceCell?.classList.add("olwlg-price-history__price");
    conditionCell?.classList.add("olwlg-price-history__condition");
    if (conditionCell) conditionCell.textContent = condition;
    listedCell?.classList.add("olwlg-price-history__date");
    soldCell?.classList.add("olwlg-price-history__date");
    notesCell?.classList.add("olwlg-price-history__notes");
    listingCell.className = "olwlg-price-history__listing";
    if (listingLink) {
      const action = createLink({
        ariaLabel: "View BGG marketplace listing",
        className: "olwlg-price-history__listing-link",
        content: [],
        dataset: { tooltip: "View BGG marketplace listing" },
        external: true,
        href: listingLink.href,
        title: "View BGG marketplace listing",
      });
      action.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14 5h5v5M19 5l-9 9M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      const linkWrapper = listingLink.parentElement;
      listingLink.remove();
      if (
        linkWrapper &&
        linkWrapper !== notesCell &&
        !normalizedText(linkWrapper.textContent) &&
        !linkWrapper.querySelector("img, svg")
      )
        linkWrapper.remove();
      notesCell?.normalize();
      action.addEventListener("click", (event) => event.stopPropagation());
      listingCell.append(action);
    } else {
      const empty = document.createElement("span");
      empty.className = "olwlg-price-history__listing-empty";
      empty.textContent = "—";
      empty.setAttribute("aria-label", "No BGG listing link available");
      listingCell.append(empty);
    }
    row.append(listingCell);
  });

  let activeSort: HTMLTableCellElement | undefined;
  let sortDirection: "asc" | "desc" = "asc";
  headerCells.forEach((cell, columnIndex) => {
    cell.removeAttribute("onclick");
    cell.querySelectorAll<HTMLElement>("[onclick]").forEach((element) => {
      element.removeAttribute("onclick");
    });
    if (columnIndex === notesIndex || columnIndex === listingIndex) {
      cell.classList.remove("olwlg-price-history__sortable");
      cell.removeAttribute("role");
      cell.removeAttribute("tabindex");
      cell.removeAttribute("aria-sort");
      return;
    }
    cell.classList.add("olwlg-price-history__sortable");
    cell.tabIndex = 0;
    cell.setAttribute("role", "button");
    cell.setAttribute(
      "aria-label",
      `Sort by ${normalizedText(cell.textContent)}`,
    );
    const sortRows = () => {
      if (activeSort === cell)
        sortDirection = sortDirection === "asc" ? "desc" : "asc";
      else {
        activeSort = cell;
        sortDirection = "asc";
      }
      headerCells.forEach((header) => {
        header.removeAttribute("data-olwlg-sort");
        header.setAttribute("aria-sort", "none");
      });
      cell.dataset.olwlgSort = sortDirection;
      cell.setAttribute(
        "aria-sort",
        sortDirection === "asc" ? "ascending" : "descending",
      );
      const valueFor = (row: HTMLTableRowElement) => {
        const text = normalizedText(row.cells[columnIndex]?.textContent);
        if (columnIndex === priceIndex) {
          const numeric = Number.parseFloat(
            text.replace(/[^\d.,-]/g, "").replace(",", "."),
          );
          return Number.isFinite(numeric) ? numeric : -Infinity;
        }
        if (columnIndex === listedIndex || columnIndex === soldIndex) {
          const timestamp = Date.parse(text);
          return Number.isFinite(timestamp) ? timestamp : -Infinity;
        }
        return text.toLocaleLowerCase();
      };
      rows
        .slice()
        .sort((left, right) => {
          const leftValue = valueFor(left);
          const rightValue = valueFor(right);
          const comparison =
            typeof leftValue === "number" && typeof rightValue === "number"
              ? leftValue - rightValue
              : String(leftValue).localeCompare(String(rightValue), undefined, {
                  numeric: true,
                  sensitivity: "base",
                });
          return sortDirection === "asc" ? comparison : -comparison;
        })
        .forEach((row) => table.tBodies[0]?.append(row));
    };
    cell.addEventListener("click", sortRows);
    cell.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      sortRows();
    });
  });

  const filters = document.createElement("section");
  const currency = createSelect({
    options: [
      { label: "All currencies", value: "" },
      ...[...currencies].sort().map((value) => ({ label: value, value })),
    ],
  });
  const condition = createSelect({
    options: [
      { label: "All conditions", value: "" },
      ...[...conditions].sort().map((value) => ({ label: value, value })),
    ],
  });
  const startDate = createInput({ type: "date", variant: "custom" });
  const endDate = createInput({ type: "date", variant: "custom" });
  const clear = createButton({
    className: "olwlg-price-history__clear",
    content: "Clear filters",
    variant: "custom",
  });
  const resultSummary = document.createElement("p");
  filters.className = "olwlg-price-history__filters";
  filters.setAttribute(
    "aria-label",
    `${kind === "sold" ? "Sold" : "Active"} listing filters`,
  );
  resultSummary.className = "olwlg-price-history__summary";
  resultSummary.setAttribute("aria-live", "polite");
  const filterControl = (text: string, control: HTMLElement) => {
    const label = document.createElement("label");
    const labelText = document.createElement("span");
    label.className = "olwlg-price-history__filter";
    labelText.textContent = text;
    label.append(labelText, control);
    return label;
  };
  const dateType = kind === "sold" ? "sold" : "listed";
  filters.append(
    filterControl("Currency", currency),
    filterControl("Condition", condition),
    filterControl(`Start ${dateType} date`, startDate),
    filterControl(`End ${dateType} date`, endDate),
    clear,
    resultSummary,
  );

  const emptyRow = document.createElement("tr");
  const emptyCell = document.createElement("td");
  emptyRow.hidden = true;
  emptyRow.className = "olwlg-price-history__empty-row";
  emptyCell.className = "olwlg-price-history__empty";
  emptyCell.colSpan = headerCells.length;
  emptyCell.textContent = "No marketplace listings match these filters.";
  emptyRow.append(emptyCell);
  table.tBodies[0]?.append(emptyRow);
  const render = () => {
    let visible = 0;
    rows.forEach((row) => {
      const rowDate = row.dataset.olwlgDate ?? "";
      const matches =
        (!currency.value || row.dataset.olwlgCurrency === currency.value) &&
        (!condition.value ||
          row.dataset.olwlgCondition === condition.value) &&
        (!startDate.value || (rowDate && rowDate >= startDate.value)) &&
        (!endDate.value || (rowDate && rowDate <= endDate.value));
      row.hidden = !matches;
      if (matches) visible += 1;
    });
    emptyRow.hidden = visible > 0;
    resultSummary.textContent =
      `${visible} of ${rows.length} listings displayed`;
    clear.disabled =
      !currency.value &&
      !condition.value &&
      !startDate.value &&
      !endDate.value;
  };
  [currency, condition, startDate, endDate].forEach((control) => {
    control.addEventListener("change", render);
  });
  clear.addEventListener("click", () => {
    currency.value = "";
    condition.value = "";
    startDate.value = "";
    endDate.value = "";
    syncSearchableSelects(filters);
    render();
  });
  enhanceSearchableSelect(currency);
  enhanceSearchableSelect(condition);
  render();

  if (kind === "active") {
    const marketplaceHeading = document.createElement("p");
    marketplaceHeading.className =
      "olwlg-price-history__marketplace-heading";
    marketplaceHeading.textContent =
      "Following are copies in the BGG Marketplace for sale";
    panel.append(marketplaceHeading);
  }
  panel.append(filters, table);
  details.append(sectionSummary, panel);
  return details;
}

export function enhanceCatalogMarketplaceSections(frame: HTMLIFrameElement) {
  try {
    const document = frame.contentDocument;
    const body = document?.body;
    if (!document || !body) return false;
    if (body.querySelector(".olwlg-price-history__sections")) return true;

    const localTables = marketplaceTables(body);
    if (!localTables.length) return false;
    body.classList.add("olwlg-price-history");
    const sections = document.createElement("div");
    sections.className = "olwlg-price-history__sections";
    const slots: Record<MarketplaceSectionKind, HTMLElement> = {
      sold: document.createElement("div"),
      active: document.createElement("div"),
    };
    slots.sold.className = "olwlg-price-history__slot";
    slots.active.className = "olwlg-price-history__slot";
    sections.append(slots.sold, slots.active);
    localTables[0].insertAdjacentElement("beforebegin", sections);

    const installedKinds = new Set<MarketplaceSectionKind>();
    localTables.forEach((table) => {
      const kind = marketplaceTableKind(table);
      if (installedKinds.has(kind)) return;
      const section = createMarketplaceSection(document, table, kind);
      if (!section) return;
      slots[kind].replaceChildren(section);
      installedKinds.add(kind);
    });
    removeLegacyMarketplaceHeadings(body);

    const missingKinds = (["sold", "active"] as const).filter(
      (kind) => !installedKinds.has(kind),
    );
    missingKinds.forEach((missingKind) => {
      const alternatePattern =
        missingKind === "active" ? /for-?sale/i : /^sold\b/i;
      const alternateLink = [...body.querySelectorAll<HTMLAnchorElement>("a")]
        .find((link) =>
          alternatePattern.test(normalizedText(link.textContent)),
        );
      const loadingDetails = document.createElement("details");
      const loadingSummary = document.createElement("summary");
      const loadingMessage = document.createElement("p");
      loadingDetails.className =
        `olwlg-price-history__section olwlg-price-history__section--${missingKind}`;
      loadingSummary.className = "olwlg-price-history__section-summary";
      loadingSummary.textContent =
        missingKind === "sold"
          ? "Sold listings"
          : "Active marketplace listings";
      loadingMessage.className = "olwlg-price-history__section-loading";
      loadingMessage.textContent = "Loading marketplace listings…";
      loadingDetails.append(loadingSummary, loadingMessage);
      slots[missingKind].append(loadingDetails);

      if (!alternateLink) {
        loadingMessage.textContent =
          "No additional marketplace listings are available.";
        return;
      }
      const alternateUrl = new URL(
        alternateLink.getAttribute("href") ?? "",
        frame.contentWindow?.location.href ?? location.href,
      );
      fetch(alternateUrl, { credentials: "include" })
        .then((response) => {
          if (!response.ok) throw new Error(String(response.status));
          return response.text();
        })
        .then((html) => {
          const parsed = new DOMParser().parseFromString(html, "text/html");
          const alternateTable = marketplaceTables(parsed).find(
            (table) => marketplaceTableKind(table) === missingKind,
          );
          if (!alternateTable) throw new Error("Marketplace table not found");
          alternateTable.querySelectorAll<HTMLAnchorElement>("a[href]")
            .forEach((link) => {
              link.href = new URL(
                link.getAttribute("href") ?? "",
                alternateUrl,
              ).href;
            });
          const importedTable = document.importNode(alternateTable, true);
          const section = createMarketplaceSection(
            document,
            importedTable,
            missingKind,
          );
          if (!section) throw new Error("Marketplace table is invalid");
          slots[missingKind].replaceChildren(section);
        })
        .catch(() => {
          loadingMessage.textContent =
            "The additional marketplace listings could not be loaded.";
        });
    });

    body.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
      const context = normalizedText(
        `${image.src} ${image.alt} ${image.title} ${image.getAttribute("onclick")}`,
      );
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      if (
        /close|cancel|redx|hide(?:game)?desc|\/x\.(?:gif|png)/i.test(
          context,
        ) ||
        (width > 0 && height > 0 && width <= 56 && height <= 56)
      )
        image.closest("a, button")?.remove() ?? image.remove();
    });
    return installedKinds.size > 0;
  } catch {
    return false;
  }
}
