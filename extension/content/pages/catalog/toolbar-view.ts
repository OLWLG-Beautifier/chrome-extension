import { createButton, createInput, createSelect } from "../../components";

export function createCatalogToolbarView() {
  const toolbar = document.createElement("section");
  toolbar.className = "olwlg-catalog-toolbar";
  toolbar.setAttribute("aria-label", "Trade item filters");
  toolbar.innerHTML = `
    <div class="olwlg-catalog-toolbar__heading">
      <div>
        <p class="olwlg-catalog-eyebrow">Current trade items</p>
        <h2>Browse offered items</h2>
      </div>
      <p class="olwlg-catalog-count" aria-live="polite"></p>
      <div class="olwlg-catalog-view-switch" role="group" aria-label="Item layout">
        <div class="olwlg-catalog-view-switch__options">
          <span data-olwlg-control="list-view">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M8 6h13M8 12h13M8 18h13"></path>
              <path d="M3 6h.01M3 12h.01M3 18h.01"></path>
            </svg>
            <span>Detailed List</span>
          </span>
          <span data-olwlg-control="grid-view">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none"
              stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1"></rect>
              <rect x="14" y="3" width="7" height="7" rx="1"></rect>
              <rect x="3" y="14" width="7" height="7" rx="1"></rect>
              <rect x="14" y="14" width="7" height="7" rx="1"></rect>
            </svg>
            <span>Compact Grid</span>
          </span>
        </div>
      </div>
      <span data-olwlg-control="filter-collapse">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round">
          <path d="M4 6h16"></path>
          <path d="M7 12h10"></path>
          <path d="M10 18h4"></path>
        </svg>
        <span>Minimize filters</span>
      </span>
    </div>
    <details class="olwlg-catalog-filters" open>
      <summary class="olwlg-catalog-filters__summary">
        <span>Filters</span>
      </summary>
      <div class="olwlg-catalog-controls">
      <label class="olwlg-catalog-search">
        <span>Search items</span>
        <span data-olwlg-control="search"></span>
      </label>
      <label class="olwlg-catalog-participant">
        <span>Participant</span>
        <span data-olwlg-control="participant"></span>
      </label>
      <label>
        <span>Item type</span>
        <span data-olwlg-control="type"></span>
      </label>
      <fieldset class="olwlg-catalog-money olwlg-control-unavailable">
        <legend>Money range</legend>
        <span data-olwlg-control="money-min"></span>
        <span>to</span>
        <span data-olwlg-control="money-max"></span>
      </fieldset>
      <label>
        <span>BGG rank</span>
        <span data-olwlg-control="rank"></span>
      </label>
      <label class="olwlg-catalog-collection-label">
        <span>Collection status</span>
        <span data-olwlg-control="collection"></span>
      </label>
      <label>
        <span>Sort cards</span>
        <span data-olwlg-control="sort"></span>
      </label>
      <span data-olwlg-control="clear"></span>
      </div>
    </details>
    <div class="olwlg-catalog-loader" role="status">
      <span class="olwlg-catalog-spinner" aria-hidden="true"></span>
      <span>Updating items…</span>
    </div>
  `;

  const mountControl = (name: string, control: HTMLElement) => {
    toolbar
      .querySelector<HTMLElement>(`[data-olwlg-control="${name}"]`)
      ?.replaceWith(control);
  };
  const mountButton = (
    name: string,
    options: Omit<Parameters<typeof createButton>[0], "content"> & {
      content?: Parameters<typeof createButton>[0]["content"];
    },
  ) => {
    const mount = toolbar.querySelector<HTMLElement>(
      `[data-olwlg-control="${name}"]`,
    );
    mountControl(name, createButton({
      ...options,
      content: options.content ?? [...(mount?.childNodes ?? [])],
    }));
  };
  mountButton("list-view", {
    attributes: { "aria-pressed": "true" },
    className: "olwlg-catalog-view-switch__option",
    dataset: { olwlgCatalogView: "list" },
    variant: "custom",
  });
  mountButton("grid-view", {
    attributes: { "aria-pressed": "false" },
    className: "olwlg-catalog-view-switch__option",
    dataset: { olwlgCatalogView: "grid" },
    variant: "custom",
  });
  mountButton("filter-collapse", {
    ariaLabel: "Minimize item filters",
    attributes: { "aria-expanded": "true" },
    className: "olwlg-catalog-filter-collapse olwlg-tooltip-target",
    tooltip: "Minimize item filters",
    variant: "custom",
  });
  mountControl("search", createInput({
    autocomplete: "off",
    placeholder: "Game, description, or participant…",
    type: "search",
    variant: "custom",
  }));
  mountControl("participant", createSelect({
    options: [{ label: "All participants", value: "" }],
  }));
  mountControl("type", createSelect({
    className: "olwlg-catalog-type",
    options: [
      { label: "All item types", value: "" },
      { label: "Board games", value: "game" },
      { label: "Money", value: "money" },
      { label: "Other alternative items", value: "other" },
    ],
  }));
  mountControl("money-min", createInput({
    className: "olwlg-money-min",
    inputMode: "decimal",
    min: 0,
    placeholder: "Min",
    step: "any",
    type: "number",
    variant: "custom",
  }));
  mountControl("money-max", createInput({
    className: "olwlg-money-max",
    inputMode: "decimal",
    min: 0,
    placeholder: "Max",
    step: "any",
    type: "number",
    variant: "custom",
  }));
  mountControl("rank", createSelect({
    className: "olwlg-catalog-rank",
    options: [
      { label: "Any rank", value: "" },
      { label: "Top 100", value: "100" },
      { label: "Top 500", value: "500" },
      { label: "Top 1,000", value: "1000" },
      { label: "All ranked games", value: "ranked" },
      { label: "Unranked", value: "unranked" },
    ],
  }));
  mountControl("collection", createSelect({
    className: "olwlg-catalog-collection",
    options: [{ label: "Any collection status", value: "" }],
  }));
  mountControl("sort", createSelect({
    className: "olwlg-catalog-sort",
    options: [
      { label: "GL number", value: "gl" },
      { label: "Game title", value: "title" },
      { label: "BGG rank", value: "rank" },
      { label: "Rating (high first)", value: "rating" },
      { label: "Bay rating (high first)", value: "bay" },
    ],
  }));
  mountButton("clear", {
    className: "olwlg-catalog-clear",
    content: "Clear filters",
    disabled: true,
    variant: "custom",
  });

  const collapseFilters = toolbar.querySelector<HTMLButtonElement>(
    ".olwlg-catalog-filter-collapse",
  );
  const filterDock = createButton({
    ariaLabel: "Show item filters",
    className: "olwlg-catalog-filter-dock olwlg-tooltip-target",
    content: [],
    hidden: true,
    tooltip: "Show item filters",
    variant: "custom",
  });
  filterDock.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round">
      <path d="M4 6h16"></path>
      <path d="M7 12h10"></path>
      <path d="M10 18h4"></path>
    </svg>
  `;
  document.body.append(filterDock);

  const setFiltersCollapsed = (collapsed: boolean) => {
    toolbar.classList.toggle("olwlg-catalog-toolbar--collapsed", collapsed);
    toolbar.setAttribute("aria-hidden", String(collapsed));
    collapseFilters?.setAttribute("aria-expanded", String(!collapsed));
    filterDock.hidden = !collapsed;
  };
  collapseFilters?.addEventListener("click", () => setFiltersCollapsed(true));
  filterDock.addEventListener("click", () => setFiltersCollapsed(false));

  return toolbar;
}

export function createCatalogPaginationView(wrapper: HTMLDivElement) {
  const emptyState = document.createElement("div");
  emptyState.className = "olwlg-catalog-empty";
  emptyState.hidden = true;
  emptyState.innerHTML =
    "<strong>No matching items</strong><span>Try a broader search or clear the participant filter.</span>";
  wrapper.insertAdjacentElement("afterend", emptyState);

  const paginator = document.createElement("nav");
  paginator.className = "olwlg-catalog-pagination";
  paginator.setAttribute("aria-label", "Catalog pagination");
  paginator.innerHTML = `
    <label class="olwlg-catalog-page-size">
      <span>Items per page</span>
      <span data-olwlg-control="page-size"></span>
    </label>
    <div class="olwlg-catalog-page-navigation">
      <span data-olwlg-control="previous-page"></span>
      <div class="olwlg-catalog-page-numbers" aria-label="Choose a catalog page"></div>
      <span data-olwlg-control="next-page"></span>
      <div class="olwlg-catalog-page-jump">
        <label for="olwlg-catalog-page-jump">Page</label>
        <span data-olwlg-control="page-jump"></span>
        <span data-olwlg-control="page-jump-button"></span>
      </div>
    </div>
    <p class="olwlg-catalog-page-status" aria-live="polite" aria-atomic="true"></p>
  `;
  const mountPaginationControl = (name: string, control: HTMLElement) => {
    paginator
      .querySelector<HTMLElement>(`[data-olwlg-control="${name}"]`)
      ?.replaceWith(control);
  };
  mountPaginationControl("page-size", createSelect({
    ariaLabel: "Items per page",
    options: [
      { label: "25", value: "25" },
      { label: "50", value: "50" },
    ],
  }));
  mountPaginationControl("previous-page", createButton({
    ariaLabel: "Previous page",
    className: "olwlg-catalog-page-previous",
    content: "Previous",
    variant: "custom",
  }));
  mountPaginationControl("next-page", createButton({
    ariaLabel: "Next page",
    className: "olwlg-catalog-page-next",
    content: "Next",
    variant: "custom",
  }));
  mountPaginationControl("page-jump", createInput({
    id: "olwlg-catalog-page-jump",
    inputMode: "numeric",
    min: 1,
    step: 1,
    type: "number",
    variant: "custom",
  }));
  mountPaginationControl("page-jump-button", createButton({
    ariaLabel: "Go to page",
    content: "Go",
    variant: "custom",
  }));

  return {
    emptyState,
    nextPage: paginator.querySelector<HTMLButtonElement>(
      ".olwlg-catalog-page-next",
    )!,
    pageJump: paginator.querySelector<HTMLInputElement>(
      ".olwlg-catalog-page-jump input",
    )!,
    pageJumpButton: paginator.querySelector<HTMLButtonElement>(
      ".olwlg-catalog-page-jump button",
    )!,
    pageNavigation: paginator.querySelector<HTMLElement>(
      ".olwlg-catalog-page-navigation",
    )!,
    pageNumbers: paginator.querySelector<HTMLElement>(
      ".olwlg-catalog-page-numbers",
    )!,
    pageSize: paginator.querySelector<HTMLSelectElement>("select")!,
    pageStatus: paginator.querySelector<HTMLElement>(
      ".olwlg-catalog-page-status",
    )!,
    paginator,
    previousPage: paginator.querySelector<HTMLButtonElement>(
      ".olwlg-catalog-page-previous",
    )!,
  };
}