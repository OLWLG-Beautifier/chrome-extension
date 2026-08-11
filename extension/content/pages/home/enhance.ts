import { createButtonsBlock } from "../../components";
import { normalizeWhitespace } from "../../core/dom";
import {
  rememberCatalogTradeState,
  type CatalogTradeState,
} from "../catalog";
import { isHomePage } from "./mode";

export interface HomePageDependencies {
  createDecorativeIcon: (svgName: string, className?: string) => HTMLElement;
  iconTooltip: (image: HTMLImageElement) => string | undefined;
}

function findTradeListAfter(heading: Element) {
  let sibling = heading.nextElementSibling;
  while (sibling && !sibling.matches("h2, h3")) {
    if (sibling instanceof HTMLUListElement) return sibling;
    sibling = sibling.nextElementSibling;
  }
  return undefined;
}

function decorateTradeCard(
  card: HTMLLIElement,
  sectionState: CatalogTradeState,
) {
  if (card.dataset.olwlgTradeCard) return;
  const text = card.textContent?.toLowerCase() ?? "";
  const state = text.includes("ended:") ? "ended" : sectionState;
  const title = card.querySelector<HTMLAnchorElement>(
    'a[href*="viewlist.cgi"][href*="listid="]',
  );

  card.dataset.olwlgTradeCard = state;
  card.classList.add("olwlg-trade-card", `olwlg-trade-card--${state}`);
  const listId = title ? new URL(title.href).searchParams.get("listid") : null;
  if (listId) rememberCatalogTradeState(listId, state);
  if (card.querySelector('img[src$="arrow.gif"]'))
    card.classList.add("olwlg-trade-card--wants-open");

  title?.classList.add("olwlg-trade-title");
  card.querySelectorAll<HTMLElement>('font[color="green"]').forEach(
    (element) =>
      element.classList.add("olwlg-trade-count", "olwlg-trade-count--items"),
  );
  card.querySelectorAll<HTMLElement>('font[color="red"]').forEach(
    (element) =>
      element.classList.add("olwlg-trade-count", "olwlg-trade-count--users"),
  );
  card.querySelectorAll<HTMLElement>("i").forEach((element) =>
    element.classList.add("olwlg-trade-organizer")
  );
  card.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
    if (link !== title) link.classList.add("olwlg-trade-action");
  });

  const secondaryActions = [
    ...card.querySelectorAll<HTMLAnchorElement>("a.olwlg-trade-action"),
  ].filter((action) => !action.querySelector("img"));
  if (!secondaryActions.length) return;
  const actionRow = createButtonsBlock({
    buttons: secondaryActions,
    className: "olwlg-trade-action-row",
    ariaLabel: "Trade reports and want-list tools",
  });
  [...card.childNodes].forEach((node) => {
    if (node instanceof Text && /^[\[\]()\s]+$/.test(node.data)) node.remove();
  });
  card.append(actionRow);
}

export function enhanceTradeListings() {
  document.querySelectorAll("h2, h3").forEach((heading) => {
    const title = heading.textContent?.trim().toLowerCase() ?? "";
    let state: CatalogTradeState | undefined;
    if (title.includes("your active math trade")) state = "mine";
    else if (title.includes("other active")) state = "active";
    else if (
      title.includes("recently ended math trade") ||
      title.includes("previous math trades")
    )
      state = "ended";
    if (!state) return;

    const list = findTradeListAfter(heading);
    if (!list) return;
    heading.classList.add(
      "olwlg-trade-section-title",
      `olwlg-trade-section-title--${state}`,
    );
    list.classList.add("olwlg-trade-list", `olwlg-trade-list--${state}`);
    list.querySelectorAll<HTMLLIElement>(":scope > li").forEach((card) =>
      decorateTradeCard(card, state)
    );
  });
}

function enhanceHomeIconGuide(
  details: HTMLDetailsElement,
  dependencies: HomePageDependencies,
) {
  if (details.dataset.olwlgIconGuide) return;
  const summary = details.querySelector(":scope > summary");
  const images = [...details.querySelectorAll<HTMLImageElement>("img")];
  if (!summary || images.length === 0) return;

  const textSource = details.cloneNode(true) as HTMLDetailsElement;
  textSource.querySelector(":scope > summary")?.remove();
  textSource.querySelectorAll("br").forEach((breakElement) =>
    breakElement.replaceWith(document.createTextNode("\n"))
  );
  textSource.querySelectorAll("img, input").forEach((element) =>
    element.remove()
  );
  const descriptions = (textSource.textContent ?? "")
    .split(/\s*(?:,|\n+)\s*/)
    .map((description) =>
      normalizeWhitespace(description).replace(/^[=\-–—:\s]+/, "")
    )
    .filter(Boolean);

  const guide = document.createElement("div");
  guide.className = "olwlg-home-icon-guide";
  guide.setAttribute("role", "list");
  images.forEach((image, index) => {
    const item = document.createElement("div");
    const icon = document.createElement("span");
    const copy = document.createElement("span");
    const fallback = dependencies.iconTooltip(image) ??
      (normalizeWhitespace(image.title || image.alt) || "Icon guide item");
    item.className = "olwlg-home-icon-guide__item";
    item.setAttribute("role", "listitem");
    icon.className = "olwlg-home-icon-guide__icon";
    copy.className = "olwlg-home-icon-guide__copy";
    copy.textContent = descriptions[index] ?? fallback;
    icon.append(image);
    item.append(icon, copy);
    guide.append(item);
  });

  [...details.childNodes]
    .filter((node) => node !== summary)
    .forEach((node) => node.remove());
  details.append(guide);
  details.dataset.olwlgIconGuide = "true";
}

function enhanceNoticesPanel(
  main: HTMLElement,
  dependencies: HomePageDependencies,
) {
  const panel = main.querySelector<HTMLElement>("#messages");
  if (!panel || panel.dataset.olwlgNotices) return;
  panel.dataset.olwlgNotices = "true";
  panel.classList.add("olwlg-notices");

  const heading = [
    ...panel.querySelectorAll<HTMLElement>("b, strong, h1, h2, h3, h4"),
  ].find((element) => /^notices$/i.test(normalizeWhitespace(element.textContent)));
  const markAllControl = [
    ...panel.querySelectorAll<HTMLElement>("a, button, input"),
  ].find((control) =>
    /mark all notices as read/i.test(
      normalizeWhitespace(
        control instanceof HTMLInputElement
          ? control.value
          : control.textContent,
      ),
    )
  );
  const list = panel.querySelector("ul");
  const listItems = list
    ? [...list.children].filter(
        (child): child is HTMLLIElement => child instanceof HTMLLIElement,
      )
    : [];
  const items = listItems.filter((item) =>
    Boolean(
      normalizeWhitespace(item.textContent) ||
        item.querySelector(
          "img[alt]:not([alt='']), input[value]:not([value=''])",
        ),
    )
  );
  listItems.filter((item) => !items.includes(item)).forEach((item) =>
    item.remove()
  );
  if (!list || items.length === 0) {
    panel.hidden = true;
    return;
  }

  const header = document.createElement("div");
  const title = document.createElement("p");
  header.className = "olwlg-notices__header";
  title.className = "olwlg-notices__title";
  title.append(
    dependencies.createDecorativeIcon("bell", "olwlg-notices__title-icon"),
    document.createTextNode(
      normalizeWhitespace(heading?.textContent) || "Notices",
    ),
  );
  heading?.remove();
  header.append(title);
  if (markAllControl) {
    markAllControl.classList.add("olwlg-notices__mark-all");
    header.append(markAllControl);
  }
  panel.prepend(header);

  list.classList.add("olwlg-notices__list");
  items.forEach((item) => {
    item.classList.add("olwlg-notices__item");
    if (item.querySelector("s, strike, del, [style*='line-through']"))
      item.classList.add("olwlg-notices__item--resolved");
    else if (item.querySelector("[style*='background']"))
      item.classList.add("olwlg-notices__item--featured");
  });

  const olderItems = items.slice(5);
  if (olderItems.length === 0) return;
  const olderList = document.createElement("ul");
  const toggle = document.createElement("details");
  const toggleSummary = document.createElement("summary");
  olderList.className = "olwlg-notices__list olwlg-notices__list--older";
  olderItems.forEach((item) => olderList.append(item));
  toggle.className = "olwlg-notices__older";
  toggleSummary.textContent =
    `Show ${olderItems.length} older notice${olderItems.length === 1 ? "" : "s"}`;
  toggle.append(toggleSummary, olderList);
  list.after(toggle);
}

export function enhanceHomePage(dependencies: HomePageDependencies) {
  if (!isHomePage()) return;
  const main = [...document.body.children].find(
    (element): element is HTMLElement =>
      element instanceof HTMLElement &&
      element.id !== "navbar" &&
      /math trade want list generator/i.test(
        normalizeWhitespace(element.textContent),
      ),
  );
  if (!main || main.dataset.olwlgHome) return;

  main.dataset.olwlgHome = "true";
  main.classList.add("olwlg-home");
  document.body.classList.add("olwlg-home-page");
  const title = [...main.querySelectorAll<HTMLElement>("h2, h3")].find(
    (heading) =>
      /math trade want list generator/i.test(
        normalizeWhitespace(heading.textContent),
      ),
  );
  const welcome = [...main.querySelectorAll<HTMLElement>("h2")].find(
    (heading) => /^welcome\b/i.test(normalizeWhitespace(heading.textContent)),
  );
  if (title) {
    const hero = document.createElement("header");
    const eyebrow = document.createElement("p");
    const heading = document.createElement("h1");
    const subtitle = document.createElement("p");
    hero.className = "olwlg-home__hero";
    eyebrow.className = "olwlg-home__eyebrow";
    eyebrow.textContent = "Math trade dashboard";
    heading.textContent = normalizeWhitespace(title.textContent);
    subtitle.className = "olwlg-home__subtitle";
    subtitle.textContent =
      "Browse active trades, manage your offers, and prepare your want list.";
    hero.append(eyebrow, heading, subtitle);
    if (welcome) {
      welcome.classList.add("olwlg-home__welcome");
      hero.append(welcome);
    }
    const titleContainer = title.closest("center");
    (titleContainer ?? title).remove();
    main.prepend(hero);
  }

  const panelTypes = [
    ["active olwlg threads", "threads", "messages-square", "activity"],
    ["need help", "help", "life-buoy", "activity"],
    ["collection data", "resync", "refresh-cw", "activity"],
    ["icons? guide", "icons-guide", "image", "settings"],
    ["donations?", "donations", "gift", "settings"],
    ["change (?:where you|your) ship", "ship-from", "truck", "settings"],
    ["important notes? for .*organizers?", "organizer-notes", "megaphone", "settings"],
  ] as const;
  main.querySelectorAll<HTMLDetailsElement>("details").forEach((details) => {
    details.classList.add("olwlg-home__panel");
    const summary = details.querySelector("summary");
    const summaryText = normalizeWhitespace(summary?.textContent);
    const type = panelTypes.find(([pattern]) =>
      new RegExp(pattern, "i").test(summaryText)
    );
    if (!type) return;
    const [, modifier, icon, group] = type;
    details.classList.add(`olwlg-home__panel--${modifier}`);
    if (group === "settings")
      details.classList.add("olwlg-home__panel--settings-group");
    if (summary && !summary.querySelector(".olwlg-home__panel-icon"))
      summary.prepend(dependencies.createDecorativeIcon(icon));
    if (modifier === "icons-guide")
      enhanceHomeIconGuide(details, dependencies);
  });

  main.querySelector<HTMLDetailsElement>(
    ".olwlg-home__panel--settings-group",
  )?.classList.add("olwlg-home__panel--group-start");
  enhanceNoticesPanel(main, dependencies);
}