type CatalogCardView = "list" | "grid";

const CATALOG_CARD_VIEW_STORAGE_KEY = "olwlg-catalog-card-view";

function storedCatalogCardView(): CatalogCardView {
  try {
    return localStorage.getItem(CATALOG_CARD_VIEW_STORAGE_KEY) === "grid"
      ? "grid"
      : "list";
  } catch {
    return "list";
  }
}

export function configureCatalogCardView(
  toolbar: HTMLElement,
  grid: HTMLElement,
) {
  const controls = [
    ...toolbar.querySelectorAll<HTMLButtonElement>(
      ".olwlg-catalog-view-switch__option",
    ),
  ];
  if (!controls.length) return;

  const setView = (view: CatalogCardView, remember = true) => {
    grid.classList.toggle("olwlg-item-grid--compact", view === "grid");
    grid.dataset.olwlgCatalogView = view;
    grid.setAttribute(
      "aria-label",
      view === "grid"
        ? "Math trade items in compact grid view"
        : "Math trade items in detailed list view",
    );
    controls.forEach((control) => {
      const isActive = control.dataset.olwlgCatalogView === view;
      control.classList.toggle(
        "olwlg-catalog-view-switch__option--active",
        isActive,
      );
      control.setAttribute("aria-pressed", String(isActive));
    });
    if (!remember) return;
    try {
      localStorage.setItem(CATALOG_CARD_VIEW_STORAGE_KEY, view);
    } catch {
      // The view still works for this page when storage is unavailable.
    }
  };

  controls.forEach((control) => {
    control.addEventListener("click", () => {
      const view = control.dataset.olwlgCatalogView;
      if (view === "list" || view === "grid") setView(view);
    });
  });
  setView(storedCatalogCardView(), false);
}