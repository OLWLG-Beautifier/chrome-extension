import { createButton } from "../../components";
import { catalogIsReadOnly, normalizedText } from "../catalog";

export function createWantListTabs(toolbar: HTMLElement) {
  const allDefinitions = [
    {
      label: "Table",
      detail: "Edit format",
      pattern: /^table\s*\(edit format\)$/i,
      panelId: "table",
    },
    { label: "Summary", pattern: /^summary$/i, panelId: "lists" },
    {
      label: "Duplicate Protection",
      pattern: /^duplicate protection$/i,
      panelId: "dummy",
    },
    {
      label: "Official Format",
      pattern: /^official format$/i,
      panelId: "official",
    },
  ];
  const definitions = catalogIsReadOnly()
    ? allDefinitions.filter(({ panelId }) => panelId !== "dummy")
    : allDefinitions;
  if (catalogIsReadOnly()) {
    document.getElementById("dummy")?.classList.add("olwlg-read-only-hidden");
  }
  const candidates = [
    ...document.querySelectorAll<HTMLElement>(
      "a, button, input, [onclick], .tab, td, span",
    ),
  ];
  const sources = definitions.map((definition) => {
    const match = candidates
      .filter(
        (control) =>
          !control.closest(
            "#navbar, .olwlg-want-matrix-toolbar, .olwlg-want-tabs",
          ),
      )
      .sort(
        (left, right) =>
          normalizedText(
            left instanceof HTMLInputElement ? left.value : left.textContent,
          ).length -
          normalizedText(
            right instanceof HTMLInputElement ? right.value : right.textContent,
          ).length,
      )
      .find((control) =>
        definition.pattern.test(
          normalizedText(
            control instanceof HTMLInputElement
              ? control.value
              : control.textContent,
          ),
        )
      );
    return {
      ...definition,
      source: match?.closest<HTMLElement>(".tab, [onclick]") ?? match,
    };
  });
  if (sources.filter(({ source }) => source).length < 3) return;

  const tabs = document.createElement("nav");
  tabs.className = "olwlg-want-tabs";
  tabs.setAttribute("aria-label", "Want-list views");
  tabs.setAttribute("role", "tablist");
  const panelIds = sources.map(({ panelId }) => panelId);
  const activateTab = (activeTab: HTMLElement) => {
    tabs
      .querySelectorAll<HTMLElement>(".olwlg-want-tabs__item")
      .forEach((item) => {
        const isActive = item === activeTab;
        item.classList.toggle("olwlg-want-tabs__item--active", isActive);
        item.setAttribute("aria-selected", String(isActive));
        item.tabIndex = isActive ? 0 : -1;
        if (isActive) item.setAttribute("aria-current", "page");
        else item.removeAttribute("aria-current");
      });
  };
  sources.forEach(({ detail, label, source }, index) => {
    if (!source) return;
    const tabLabel = document.createElement("span");
    tabLabel.textContent = label;
    const tab = createButton({
      attributes: { "aria-controls": panelIds[index] },
      className: "olwlg-want-tabs__item",
      content: tabLabel,
      id: `olwlg-want-tab-${panelIds[index]}`,
      onClick: () => {
        source.click();
        activateTab(tab);
      },
      role: "tab",
      variant: "custom",
    });
    if (detail) {
      const tabDetail = document.createElement("small");
      tabDetail.textContent = detail;
      tab.append(tabDetail);
    }
    if (index === 0) {
      tab.classList.add("olwlg-want-tabs__item--active");
      tab.setAttribute("aria-current", "page");
      tab.setAttribute("aria-selected", "true");
      tab.tabIndex = 0;
    } else {
      tab.setAttribute("aria-selected", "false");
      tab.tabIndex = -1;
    }
    tabs.append(tab);
  });
  tabs.addEventListener("keydown", (event) => {
    if (
      !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
    )
      return;
    const items = [
      ...tabs.querySelectorAll<HTMLElement>(".olwlg-want-tabs__item"),
    ];
    const current = Math.max(0, items.indexOf(document.activeElement as HTMLElement));
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : (current + (event.key === "ArrowRight" ? 1 : -1) + items.length) %
            items.length;
    event.preventDefault();
    items[next]?.focus();
    items[next]?.click();
  });

  const legacyPatterns = [
    ...allDefinitions.map(({ pattern }) => pattern),
    /^how to submit your lists$/i,
  ];
  candidates.forEach((candidate) => {
    if (candidate.closest("#navbar, .olwlg-want-tabs")) return;
    const label = normalizedText(
      candidate instanceof HTMLInputElement
        ? candidate.value
        : candidate.textContent,
    );
    if (!legacyPatterns.some((pattern) => pattern.test(label))) return;
    const legacyControl =
      candidate.closest<HTMLElement>(".tab, [onclick]") ?? candidate;
    legacyControl.classList.add("olwlg-want-tabs__source");
  });

  panelIds.forEach((panelId, index) => {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.add(
      "olwlg-want-tab-panel",
      `olwlg-want-tab-panel--${panelId}`,
    );
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", `olwlg-want-tab-${panelId}`);
    if (index > 0) panel.tabIndex = 0;
  });
  const initiallyVisiblePanel = panelIds.find((panelId) => {
    const panel = document.getElementById(panelId);
    return panel && getComputedStyle(panel).display !== "none";
  });
  const initiallyActiveTab = initiallyVisiblePanel
    ? tabs.querySelector<HTMLElement>(
      `#olwlg-want-tab-${initiallyVisiblePanel}`,
    )
    : undefined;
  if (initiallyActiveTab) activateTab(initiallyActiveTab);

  const tabLabels = new Set(
    sources.map(({ label }) => normalizedText(label).toLocaleLowerCase()),
  );
  toolbar
    .querySelectorAll<HTMLElement>(".olwlg-want-matrix-navigation__item")
    .forEach((item) => {
      const label = normalizedText(item.textContent)
        .replace(/\s*\(edit format\)\s*/i, "")
        .toLocaleLowerCase();
      if (tabLabels.has(label)) item.remove();
    });
  const toolbarNavigation = toolbar.querySelector<HTMLElement>(
    ".olwlg-want-matrix-navigation",
  );
  if (toolbarNavigation && !toolbarNavigation.childElementCount)
    toolbarNavigation.remove();

  const switchablePanel = toolbar.closest<HTMLElement>(
    "#table, #lists, #traditional, #itemids, #official, #dummy",
  );
  if (switchablePanel?.parentElement) {
    switchablePanel.parentElement.insertBefore(tabs, switchablePanel);
  } else toolbar.insertAdjacentElement("beforebegin", tabs);
}

