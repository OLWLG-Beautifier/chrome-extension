const ROOT_CLASS = "olwlg-beautified";
const CATALOG_BOOT_CLASS = "olwlg-catalog-booting";

declare const __OLWLG_ICONIFY_ICONS__: Record<string, string>;

let enhancementsInitialized = false;
let preferenceEnabled = false;

function pageNeedsEnhancementCover() {
  return (
    location.pathname === "/olwlg" ||
    location.pathname.startsWith("/olwlg/")
  );
}

if (pageNeedsEnhancementCover()) {
  document.documentElement.classList.add(ROOT_CLASS, CATALOG_BOOT_CLASS);
}

function applyPreference(enabled: boolean, restoreOriginalPage = false) {
  const wasEnabled = document.documentElement.classList.contains(ROOT_CLASS);
  document.documentElement.classList.toggle(ROOT_CLASS, enabled);
  if (enabled && pageNeedsEnhancementCover())
    document.documentElement.classList.add(CATALOG_BOOT_CLASS);
  if (!enabled) {
    document.documentElement.classList.remove(CATALOG_BOOT_CLASS);
    if (wasEnabled) hideTooltip();
    if (restoreOriginalPage && wasEnabled && enhancementsInitialized)
      location.reload();
  }
}

function startEnhancements() {
  if (enhancementsInitialized) return;
  const start = () => {
    if (enhancementsInitialized || !preferenceEnabled) return;
    enhancementsInitialized = true;
    void initializeEnhancements();
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}

chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
  preferenceEnabled = Boolean(enabled);
  applyPreference(preferenceEnabled);
  if (preferenceEnabled) startEnhancements();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync" || !changes.enabled) return;
  preferenceEnabled = Boolean(changes.enabled.newValue);
  applyPreference(preferenceEnabled, true);
  if (preferenceEnabled) startEnhancements();
});

type IconName =
  | "add"
  | "added"
  | "cart"
  | "discussion"
  | "externalList"
  | "myItems"
  | "open"
  | "logout"
  | "statistics"
  | "users"
  | "wants";

interface IconDefinition {
  label: string;
  tooltip: string;
  svg: string;
}

const ICONS: Record<IconName, IconDefinition> = {
  open: {
    label: "Want-list submission is open",
    tooltip:
      "Want lists are open. You can choose and submit the trades you would accept.",
    svg: __OLWLG_ICONIFY_ICONS__["circle-chevron-right"],
  },
  add: {
    label: "Offer items",
    tooltip: "Add or offer items in this math trade.",
    svg: __OLWLG_ICONIFY_ICONS__["package-plus"],
  },
  added: {
    label: "Added to your wants",
    tooltip:
      "This item is already attached to your want list. Select it to review or change what you would trade for it.",
    svg: __OLWLG_ICONIFY_ICONS__["circle-check-big"],
  },
  wants: {
    label: "Edit wants",
    tooltip:
      "Edit your want list and choose which offered items you would accept.",
    svg: __OLWLG_ICONIFY_ICONS__["list-checks"],
  },
  logout: {
    label: "Log out",
    tooltip: "Log out of your OLWLG account.",
    svg: __OLWLG_ICONIFY_ICONS__["log-out"],
  },
  externalList: {
    label: "Open GeekList",
    tooltip: "Open the original math-trade GeekList on BoardGameGeek.",
    svg: __OLWLG_ICONIFY_ICONS__["square-arrow-out-up-right"],
  },
  discussion: {
    label: "Open discussion",
    tooltip: "Open this math trade’s discussion thread on BoardGameGeek.",
    svg: __OLWLG_ICONIFY_ICONS__["messages-square"],
  },
  cart: {
    label: "Your added items",
    tooltip: "View the items you have already added to this math trade.",
    svg: __OLWLG_ICONIFY_ICONS__["shopping-cart"],
  },
  myItems: {
    label: "Your offered items",
    tooltip: "View your own items in this math trade.",
    svg: __OLWLG_ICONIFY_ICONS__.package,
  },
  statistics: {
    label: "Trade statistics",
    tooltip: "View statistics for this math trade.",
    svg: __OLWLG_ICONIFY_ICONS__["chart-no-axes-column-increasing"],
  },
  users: {
    label: "Participants",
    tooltip:
      "View participants, submission status, and want-list submission times.",
    svg: __OLWLG_ICONIFY_ICONS__["users-round"],
  },
};

const FILE_ICONS: Record<string, IconName> = {
  "arrow.gif": "open",
  "plusbox.png": "add",
  "added.gif": "added",
  "check.gif": "added",
  "checked.gif": "added",
  "checkmark.gif": "added",
  "ok.gif": "added",
  "step4.gif": "wants",
  "geeklist.gif": "externalList",
  "forum.gif": "discussion",
  "cart.png": "cart",
  "myown.gif": "myItems",
  "stats.gif": "statistics",
  "users.gif": "users",
};

const colorGuideLabels = new Map<string, string>();
const iconGuideLabels = new Map<string, string>();

const COLLECTION_STATUS_LABELS = [
  "expansion for a game you own",
  "sweetener not marked in your collection",
  "previously owned",
  "want in trade",
  "want to play",
  "notify sales",
  "want to buy",
  "preordered",
  "wishlist",
  "own it",
  "owned",
  "sold",
];

function collectionStatusLabel(value: string | null | undefined) {
  const text = normalizedText(value).toLocaleLowerCase();
  return COLLECTION_STATUS_LABELS.find((label) => text === label);
}

function embeddedCollectionStatusLabel(element: HTMLElement) {
  const context = [
    element.className,
    element.id,
    element.title,
    element.getAttribute("aria-label"),
    element.getAttribute("data-status"),
    element.getAttribute("data-collection-status"),
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLocaleLowerCase();
  if (/prev(?:iously)?[\s_-]*owned|prevowned/.test(context))
    return "previously owned";
  if (/\bpre[\s_-]*ordered\b/.test(context)) return "preordered";
  if (/\bwant[\s_-]*to[\s_-]*play\b/.test(context)) return "want to play";
  if (/\bwant[\s_-]*to[\s_-]*buy\b/.test(context)) return "want to buy";
  if (/\bwant[\s_-]*in[\s_-]*trade\b/.test(context)) return "want in trade";
  if (/\bwishlist\b/.test(context)) return "wishlist";
  if (/\bown(?:ed)?\b/.test(context)) return "own it";
  return undefined;
}

function backgroundColorKeys(element: HTMLElement) {
  const keys = new Set<string>();
  const add = (value: string | null | undefined) => {
    const key = normalizedText(value).toLocaleLowerCase().replace(/\s+/g, "");
    if (
      key &&
      key !== "transparent" &&
      key !== "rgba(0,0,0,0)" &&
      key !== "initial" &&
      key !== "inherit"
    )
      keys.add(key);
  };
  add(getComputedStyle(element).backgroundColor);
  add(element.style.backgroundColor);
  add(element.getAttribute("bgcolor"));
  const inlineBackground = element.style.background;
  if (inlineBackground && !/gradient/i.test(inlineBackground))
    add(inlineBackground);
  return [...keys];
}

function cssColorChannels(value: string) {
  const color = value.toLocaleLowerCase().replace(/\s+/g, "");
  const shortHex = color.match(/^#([\da-f])([\da-f])([\da-f])(?:[\da-f])?$/i);
  if (shortHex) {
    return shortHex.slice(1, 4).map((channel) =>
      Number.parseInt(`${channel}${channel}`, 16)
    );
  }
  const longHex = color.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})(?:[\da-f]{2})?$/i);
  if (longHex) {
    return longHex.slice(1, 4).map((channel) =>
      Number.parseInt(channel, 16)
    );
  }
  const rgb = color.match(
    /^rgba?\((\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)(?:,[\d.]+)?\)$/,
  );
  return rgb
    ? rgb.slice(1, 4).map((channel) => Number.parseFloat(channel))
    : undefined;
}

function isValueOrderWarningColor(value: string) {
  if (["yellow", "#ff0", "#ffff00"].includes(value)) return true;
  const channels = cssColorChannels(value);
  if (!channels) return false;
  const [red, green, blue] = channels;
  return (
    red >= 210 &&
    green >= 175 &&
    blue <= 205 &&
    Math.min(red, green) - blue >= 35 &&
    Math.abs(red - green) <= 80
  );
}

function registerColorGuideSample(
  sample: HTMLElement,
  fallbackLabel?: string,
) {
  const label =
    collectionStatusLabel(sample.textContent) ??
    collectionStatusLabel(fallbackLabel) ??
    normalizedText(sample.textContent || fallbackLabel);
  if (!label || label.length > 120) return;
  backgroundColorKeys(sample).forEach((color) => {
    colorGuideLabels.set(color, label);
  });
}

function imageFilename(image: HTMLImageElement) {
  return new URL(image.src, location.href).pathname
    .split("/")
    .pop()
    ?.toLowerCase();
}

function nearestGuideLabel(image: HTMLImageElement) {
  if (image.title || image.alt) return normalizedText(image.title || image.alt);

  let sibling = image.nextSibling;
  let label = "";
  while (sibling && !(sibling instanceof HTMLBRElement)) {
    label += ` ${sibling.textContent ?? ""}`;
    sibling = sibling.nextSibling;
  }
  if (normalizedText(label)) return normalizedText(label);

  return normalizedText(
    image.closest("li, tr")?.textContent,
  );
}

function readPageGuides() {
  document.querySelectorAll("details").forEach((details) => {
    const heading =
      details.querySelector("summary")?.textContent?.toLowerCase() ?? "";

    if (heading.includes("icon") && heading.includes("guide")) {
      details.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
        const filename = imageFilename(image);
        const label = nearestGuideLabel(image);
        if (filename && label) iconGuideLabels.set(filename, label);
      });
    }

    if (heading.includes("color") && heading.includes("coding")) {
      details
        .querySelectorAll<HTMLElement>("[style*='background'], [bgcolor]")
        .forEach((sample) => {
          registerColorGuideSample(
            sample,
            sample.closest("li, tr")?.textContent ?? undefined,
          );
        });
    }
  });

  document
    .querySelectorAll<HTMLElement>("[style*='background'], [bgcolor]")
    .forEach((sample) => {
      if (collectionStatusLabel(sample.textContent))
        registerColorGuideSample(sample);
    });
}

function inferIcon(image: HTMLImageElement): IconName | undefined {
  const filename = imageFilename(image);

  const description =
    `${filename ?? ""} ${image.alt} ${image.title}`.toLowerCase();

  if (description.includes("wantlist submission window")) return "open";
  if (
    description.includes("already added") ||
    description.includes("added to your want")
  )
    return "added";
  if (description.includes("add games") || description.includes("offer items"))
    return "add";
  if (description.includes("step 4") || description.includes("edit your wants"))
    return "wants";
  if (description.includes("actual geeklist")) return "externalList";
  if (description.includes("discussion forum")) return "discussion";
  if (description.includes("what you added")) return "cart";
  if (description.includes("my items")) return "myItems";
  if (description.includes("statistics")) return "statistics";
  if (description.includes("users in math trade")) return "users";

  if (
    filename === "arrow.gif" &&
    image.closest<HTMLAnchorElement>("a")?.href.includes("boardgamegeek.com")
  )
    return "externalList";

  if (filename && FILE_ICONS[filename]) return FILE_ICONS[filename];

  return undefined;
}

function createModernIcon(name: IconName) {
  const definition = ICONS[name];
  const icon = document.createElement("span");
  icon.className = `olwlg-modern-icon olwlg-modern-icon--${name}`;
  icon.dataset.olwlgTooltip = definition.tooltip;
  icon.setAttribute("aria-label", definition.label);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.innerHTML = definition.svg;
  icon.append(svg);

  return icon;
}

function createDecorativeIcon(svgName: string, className = "olwlg-home__panel-icon") {
  const icon = document.createElement("span");
  icon.className = `olwlg-modern-icon ${className}`;
  icon.setAttribute("aria-hidden", "true");

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.innerHTML = __OLWLG_ICONIFY_ICONS__[svgName] ?? "";
  icon.append(svg);

  return icon;
}

function enhanceImage(image: HTMLImageElement) {
  if (image.dataset.olwlgEnhanced) return;
  if (image.closest("#navbar")) return;

  const filename = imageFilename(image);
  const name = inferIcon(image);
  if (!name) {
    const link = image.closest<HTMLAnchorElement>("a");
    const isFlag = new URL(image.src, location.href).pathname.includes("/flags/");
    const inCatalog = image.closest(".olwlg-catalog-game");
    const description =
      image.title ||
      image.alt ||
      link?.title ||
      (filename ? iconGuideLabels.get(filename) : undefined);

    if (
      link &&
      description &&
      !isFlag &&
      image.closest(".olwlg-trade-card")
    ) {
      image.dataset.olwlgEnhanced = "tooltip";
      link.classList.add(
        "olwlg-icon-control",
        "olwlg-icon-control--legacy",
      );
      link.dataset.olwlgTooltip = description;
      link.setAttribute("aria-label", description);
      image.removeAttribute("title");
    } else if (inCatalog && description && !isFlag) {
      image.dataset.olwlgEnhanced = "guide";
      image.classList.add(
        "olwlg-catalog-guide-icon",
        "olwlg-tooltip-target",
      );
      image.dataset.olwlgTooltip = description;
      image.setAttribute("aria-label", description);
      image.tabIndex = 0;
      image.removeAttribute("title");
    }
    return;
  }

  const definition = ICONS[name];
  const icon = createModernIcon(name);
  const link = image.closest("a");

  image.dataset.olwlgEnhanced = name;
  image.classList.add("olwlg-legacy-icon");
  image.insertAdjacentElement("afterend", icon);

  if (link) {
    const hasVisibleLabel = normalizedText(link.textContent).length > 0;
    link.classList.add("olwlg-icon-control");
    link.dataset.olwlgTooltip = definition.tooltip;
    link.setAttribute("aria-label", definition.label);
    icon.removeAttribute("aria-label");

    if (name === "wants" && hasVisibleLabel) {
      const label = document.createElement("span");
      label.className = "olwlg-wants-cta__label";
      label.textContent = "Edit your wants";
      link.classList.add("olwlg-wants-cta");
      link.replaceChildren(image, icon, label);
    }
  } else {
    icon.classList.add("olwlg-icon-control");
    icon.tabIndex = 0;
    icon.setAttribute("role", "img");
  }

  image.removeAttribute("title");
}

function enhanceIcons(root: ParentNode = document) {
  root.querySelectorAll<HTMLImageElement>("img").forEach(enhanceImage);
  root
    .querySelectorAll<HTMLInputElement>('input[type="image"]')
    .forEach(enhanceImageInput);
}

function enhanceImageInput(input: HTMLInputElement) {
  if (input.dataset.olwlgEnhanced) return;

  const filename = new URL(input.src, location.href).pathname
    .split("/")
    .pop()
    ?.toLowerCase();
  const description =
    `${filename ?? ""} ${input.alt} ${input.title} ${input.value}`.toLowerCase();

  let name = filename ? FILE_ICONS[filename] : undefined;
  if (!name && (description.includes("add") || description.includes("offer")))
    name = "add";
  if (!name) return;

  const definition = ICONS[name];
  const wrapper = document.createElement("span");
  const label = document.createElement("span");
  const icon = createModernIcon(name);

  wrapper.className = `olwlg-image-button olwlg-image-button--${name} olwlg-icon-control`;
  wrapper.dataset.olwlgTooltip = definition.tooltip;
  wrapper.setAttribute("aria-label", definition.label);
  label.className = "olwlg-image-button__label";
  label.textContent = name === "add" ? "Add item" : definition.label;
  icon.removeAttribute("aria-label");
  icon.removeAttribute("data-olwlg-tooltip");

  input.dataset.olwlgEnhanced = name;
  input.removeAttribute("title");
  input.insertAdjacentElement("beforebegin", wrapper);
  wrapper.append(input, icon, label);
}

type TradeState = "active" | "ended" | "mine";

function findTradeListAfter(heading: Element) {
  let sibling = heading.nextElementSibling;

  while (sibling && !sibling.matches("h2, h3")) {
    if (sibling instanceof HTMLUListElement) return sibling;
    sibling = sibling.nextElementSibling;
  }

  return undefined;
}

function decorateTradeCard(card: HTMLLIElement, sectionState: TradeState) {
  if (card.dataset.olwlgTradeCard) return;

  const text = card.textContent?.toLowerCase() ?? "";
  const state = text.includes("ended:") ? "ended" : sectionState;
  const title = card.querySelector<HTMLAnchorElement>(
    'a[href*="viewlist.cgi"][href*="listid="]',
  );

  card.dataset.olwlgTradeCard = state;
  card.classList.add("olwlg-trade-card", `olwlg-trade-card--${state}`);
  const listId = title
    ? new URL(title.href).searchParams.get("listid")
    : undefined;
  if (listId) rememberCatalogTradeState(listId, state);
  if (card.querySelector('img[src$="arrow.gif"]'))
    card.classList.add("olwlg-trade-card--wants-open");

  title?.classList.add("olwlg-trade-title");
  card
    .querySelectorAll<HTMLElement>('font[color="green"]')
    .forEach((element) =>
      element.classList.add("olwlg-trade-count", "olwlg-trade-count--items"),
    );
  card
    .querySelectorAll<HTMLElement>('font[color="red"]')
    .forEach((element) =>
      element.classList.add("olwlg-trade-count", "olwlg-trade-count--users"),
    );
  card
    .querySelectorAll<HTMLElement>("i")
    .forEach((element) => element.classList.add("olwlg-trade-organizer"));
  card
    .querySelectorAll<HTMLAnchorElement>("a")
    .forEach((link) => {
      if (link !== title) link.classList.add("olwlg-trade-action");
    });

  const secondaryActions = [
    ...card.querySelectorAll<HTMLAnchorElement>("a.olwlg-trade-action"),
  ].filter((action) => !action.querySelector("img"));
  if (secondaryActions.length) {
    const actionRow = document.createElement("div");
    actionRow.className = "olwlg-trade-action-row";
    actionRow.setAttribute("aria-label", "Trade reports and want-list tools");
    secondaryActions.forEach((action) => actionRow.append(action));
    [...card.childNodes].forEach((node) => {
      if (
        node instanceof Text &&
        /^[\[\]()\s]+$/.test(node.data)
      )
        node.remove();
    });
    card.append(actionRow);
  }
}

function enhanceTradeListings() {
  document.querySelectorAll("h2, h3").forEach((heading) => {
    const title = heading.textContent?.trim().toLowerCase() ?? "";
    let state: TradeState | undefined;

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
    list
      .querySelectorAll<HTMLLIElement>(":scope > li")
      .forEach((card) => decorateTradeCard(card, state));
  });
}

function enhanceHomeIconGuide(details: HTMLDetailsElement) {
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
      normalizedText(description).replace(/^[=\-–—:\s]+/, "")
    )
    .filter(Boolean);

  const guide = document.createElement("div");
  guide.className = "olwlg-home-icon-guide";
  guide.setAttribute("role", "list");
  images.forEach((image, index) => {
    const item = document.createElement("div");
    const icon = document.createElement("span");
    const copy = document.createElement("span");
    const iconName = inferIcon(image);
    const fallback = iconName
      ? ICONS[iconName].tooltip
      : normalizedText(image.title || image.alt) || "Icon guide item";
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

function enhanceHomePage() {
  if (!/\/olwlg\/?$/.test(location.pathname)) return;

  const main = [...document.body.children].find(
    (element): element is HTMLElement =>
      element instanceof HTMLElement &&
      element.id !== "navbar" &&
      /math trade want list generator/i.test(
        normalizedText(element.textContent),
      ),
  );
  if (!main || main.dataset.olwlgHome) return;

  main.dataset.olwlgHome = "true";
  main.classList.add("olwlg-home");
  document.body.classList.add("olwlg-home-page");

  const title = [...main.querySelectorAll<HTMLElement>("h2, h3")].find(
    (heading) =>
      /math trade want list generator/i.test(
        normalizedText(heading.textContent),
      ),
  );
  const welcome = [...main.querySelectorAll<HTMLElement>("h2")].find(
    (heading) => /^welcome\b/i.test(normalizedText(heading.textContent)),
  );
  if (title) {
    const hero = document.createElement("header");
    const eyebrow = document.createElement("p");
    const heading = document.createElement("h1");
    const subtitle = document.createElement("p");
    hero.className = "olwlg-home__hero";
    eyebrow.className = "olwlg-home__eyebrow";
    eyebrow.textContent = "Math trade dashboard";
    heading.textContent = normalizedText(title.textContent);
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

  const panelTypes: {
    match: RegExp;
    modifier: string;
    icon: string;
    group?: "activity" | "settings";
  }[] = [
    {
      match: /active olwlg threads/i,
      modifier: "threads",
      icon: "messages-square",
      group: "activity",
    },
    {
      match: /need help/i,
      modifier: "help",
      icon: "life-buoy",
      group: "activity",
    },
    {
      match: /collection data (?:was )?last (?:re)?synced|resync/i,
      modifier: "resync",
      icon: "refresh-cw",
      group: "activity",
    },
    {
      match: /icons? guide/i,
      modifier: "icons-guide",
      icon: "image",
      group: "settings",
    },
    {
      match: /donations?/i,
      modifier: "donations",
      icon: "gift",
      group: "settings",
    },
    {
      match: /change (?:where you|your) ship(?:ping)? from/i,
      modifier: "ship-from",
      icon: "truck",
      group: "settings",
    },
    {
      match: /important notes? for .*organizers?/i,
      modifier: "organizer-notes",
      icon: "megaphone",
      group: "settings",
    },
  ];

  main.querySelectorAll<HTMLDetailsElement>("details").forEach((details) => {
    details.classList.add("olwlg-home__panel");
    const summary = details.querySelector("summary");
    const summaryText = normalizedText(summary?.textContent);
    const type = panelTypes.find((entry) => entry.match.test(summaryText));
    if (!type) return;
    details.classList.add(`olwlg-home__panel--${type.modifier}`);
    if (type.group === "settings")
      details.classList.add("olwlg-home__panel--settings-group");
    if (summary && !summary.querySelector(".olwlg-home__panel-icon"))
      summary.prepend(createDecorativeIcon(type.icon));
    if (type.modifier === "icons-guide") enhanceHomeIconGuide(details);
  });

  const settingsPanels = [
    ...main.querySelectorAll<HTMLDetailsElement>(
      ".olwlg-home__panel--settings-group",
    ),
  ];
  settingsPanels[0]?.classList.add("olwlg-home__panel--group-start");

  enhanceNoticesPanel(main);
}

function enhanceNoticesPanel(main: HTMLElement) {
  const panel = main.querySelector<HTMLElement>("#messages");
  if (!panel || panel.dataset.olwlgNotices) return;
  panel.dataset.olwlgNotices = "true";
  panel.classList.add("olwlg-notices");

  const heading = [
    ...panel.querySelectorAll<HTMLElement>("b, strong, h1, h2, h3, h4"),
  ].find((element) => /^notices$/i.test(normalizedText(element.textContent)));
  const markAllControl = [
    ...panel.querySelectorAll<HTMLElement>("a, button, input"),
  ].find((control) =>
    /mark all notices as read/i.test(
      normalizedText(
        control instanceof HTMLInputElement
          ? control.value
          : control.textContent,
      ),
    ),
  );
  const list = panel.querySelector("ul");
  const listItems = list
    ? [...list.children].filter(
        (child): child is HTMLLIElement => child instanceof HTMLLIElement,
      )
    : [];
  const items = listItems.filter((item) =>
    Boolean(
      normalizedText(item.textContent) ||
        item.querySelector(
          "img[alt]:not([alt='']), input[value]:not([value=''])",
        ),
    )
  );
  listItems
    .filter((item) => !items.includes(item))
    .forEach((item) => item.remove());
  if (!list || items.length === 0) {
    panel.hidden = true;
    return;
  }

  const header = document.createElement("div");
  const title = document.createElement("p");
  header.className = "olwlg-notices__header";
  title.className = "olwlg-notices__title";
  title.append(
    createDecorativeIcon("bell", "olwlg-notices__title-icon"),
    document.createTextNode(normalizedText(heading?.textContent) || "Notices"),
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

  const visibleCount = 5;
  const olderItems = items.slice(visibleCount);
  if (olderItems.length === 0) return;

  const olderList = document.createElement("ul");
  const toggle = document.createElement("details");
  const toggleSummary = document.createElement("summary");
  olderList.className = "olwlg-notices__list olwlg-notices__list--older";
  olderItems.forEach((item) => olderList.append(item));
  toggle.className = "olwlg-notices__older";
  toggleSummary.textContent = `Show ${olderItems.length} older notice${olderItems.length === 1 ? "" : "s"}`;
  toggle.append(toggleSummary, olderList);
  list.after(toggle);
}

interface CatalogRow {
  bayRating?: number;
  bggId?: string;
  collectionStatuses: CatalogCollectionStatus[];
  card?: HTMLElement;
  collectionTags: string[];
  element: HTMLTableRowElement;
  gameTitle: string;
  glNumber: string;
  itemType: "game" | "money" | "other";
  moneyAmount?: number;
  participant: string;
  participantUrl?: string;
  rank?: number;
  rating?: number;
  compactSearchText: string;
  searchText: string;
}

interface CatalogCollectionStatus {
  color: string;
  label: string;
}

function normalizedText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function moneyAmountFromText(text: string) {
  const currencyFirst = text.match(
    /(?:[$€£₪]|usd|eur|gbp|ils|nis)\s*([0-9]+(?:[.,][0-9]{1,2})?)/i,
  );
  const currencyLast = text.match(
    /([0-9]+(?:[.,][0-9]{1,2})?)\s*(?:[$€£₪]|usd|eur|gbp|ils|nis|dollars?|euros?|pounds?|shekels?|דולר(?:ים)?|ש["״']?ח)/i,
  );
  const value = currencyFirst?.[1] ?? currencyLast?.[1];
  if (!value) return undefined;

  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function moneyAmountFromAlternativeTitle(title: string) {
  const alternativeTitle = normalizedText(title)
    .replace(/^.*?\balt\s+name\s*:\s*/i, "");
  const moneyPrefix = alternativeTitle.match(
    /^(?:(?:[$€£₪]|usd|eur|gbp|ils|nis)\s*[0-9]+(?:[.,][0-9]{1,2})?|[0-9]+(?:[.,][0-9]{1,2})?\s*(?:[$€£₪]|usd|eur|gbp|ils|nis|dollars?|euros?|pounds?|shekels?|דולר(?:ים)?|ש["״']?ח))/i,
  )?.[0];
  return moneyPrefix ? moneyAmountFromText(moneyPrefix) : undefined;
}

function promoteCatalogMessage(needle: string, variant: "info" | "warning") {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let textNode: Text | undefined;

  while (walker.nextNode()) {
    const current = walker.currentNode as Text;
    if (normalizedText(current.data).toLowerCase().includes(needle)) {
      textNode = current;
      break;
    }
  }
  if (!textNode?.parentElement) return;

  const parent = textNode.parentElement;
  if (
    parent !== document.body &&
    normalizedText(parent.textContent).length < 500
  ) {
    parent.classList.add(
      "olwlg-message",
      `olwlg-message--${variant}`,
    );
    return;
  }

  const message = document.createElement("aside");
  message.className = `olwlg-message olwlg-message--${variant}`;
  message.setAttribute("role", variant === "warning" ? "alert" : "status");
  parent.insertBefore(message, textNode);

  let node: ChildNode | null = textNode;
  while (node) {
    const next: ChildNode | null = node.nextSibling;
    if (node instanceof HTMLBRElement) {
      node.remove();
      break;
    }
    if (
      node !== textNode &&
      node instanceof HTMLElement &&
      /^(H[1-6]|TABLE|DETAILS|FORM)$/i.test(node.tagName)
    )
      break;
    message.append(node);
    node = next;
  }
}

function enhanceCatalogMessages() {
  promoteCatalogMessage(
    "you are only viewing new items added since you last viewed",
    "info",
  );
  promoteCatalogMessage("note: submission window is open", "warning");
  promoteCatalogMessage(
    "you have made changes/edits to your want lists after your last submission",
    "warning",
  );
  promoteCatalogMessage(
    "of your offerings has/have geeklist comments to which you have not replied",
    "warning",
  );

  const resubmissionWarning = [
    ...document.querySelectorAll<HTMLElement>(".olwlg-message, [role='alert']"),
  ].find((message) =>
    /made changes(?:\/edits| or edits)? to your want lists? after your last submission/i.test(
      normalizedText(message.textContent),
    )
  );
  if (resubmissionWarning) {
    const heading = document.createElement("strong");
    const copy = document.createElement("span");
    heading.className = "olwlg-message__title";
    heading.textContent = "Your latest changes are not submitted";
    copy.className = "olwlg-message__copy";
    copy.textContent =
      "Your want list changed after your last submission. Resubmit it before the deadline for the latest changes to be used.";
    resubmissionWarning.replaceChildren(heading, copy);
    resubmissionWarning.classList.add(
      "olwlg-message--warning",
      "olwlg-message--resubmission-warning",
    );
    resubmissionWarning.setAttribute("role", "alert");
    resubmissionWarning.setAttribute("aria-live", "polite");
  }
}

function removeCatalogItemCountFromMessage(message: HTMLElement) {
  const itemCountPattern =
    /\b\d[\d,]*\s+items?\s*\(\s*\d[\d,]*\s+unique\s+games?\s*\[\s*items?\s*(?:&|and)\s*sweeteners?\s*\]\s*\)/gi;
  const walker = document.createTreeWalker(message, NodeFilter.SHOW_TEXT);
  const matches: Text[] = [];
  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text;
    itemCountPattern.lastIndex = 0;
    if (itemCountPattern.test(textNode.data)) matches.push(textNode);
  }
  matches.forEach((textNode) => {
    itemCountPattern.lastIndex = 0;
    const remainingText = textNode.data.replace(itemCountPattern, "");
    if (normalizedText(remainingText)) {
      textNode.data = remainingText;
      return;
    }

    const container = textNode.parentElement?.closest<HTMLElement>(
      "p, li, div, span, font, strong, b",
    );
    itemCountPattern.lastIndex = 0;
    const containsOnlyItemCount =
      Boolean(container) &&
      !normalizedText(container?.textContent).replace(itemCountPattern, "");
    if (
      container &&
      container !== message &&
      containsOnlyItemCount &&
      !container.querySelector("a, button, input, img")
    ) {
      container.remove();
    } else textNode.parentNode?.removeChild(textNode);
  });
}

function findCatalogTable(root: ParentNode = document) {
  return [...root.querySelectorAll<HTMLTableElement>("table")].find(
    (table) => {
      const firstRow = table.rows[0];
      if (!firstRow || table.rows.length < 2) return false;

      const headings = [...firstRow.cells].map((cell) =>
        normalizedText(cell.textContent).toLowerCase(),
      );
      return (
        headings.some((heading) => heading.replace(/\s/g, "") === "gl#") &&
        headings.includes("game") &&
        headings.some((heading) => heading === "rank")
      );
    },
  );
}

function catalogParticipantCandidate(value: string | null | undefined) {
  const candidate = normalizedText(value).replace(/^@/, "");
  if (!candidate || candidate.length > 80) return undefined;
  if (/^[+-]?\d+(?:\.\d+)?$/.test(candidate)) return undefined;
  if (
    /^(?:your\s+)?(?:rating|rank|bay\s+rating)\s*[:=]/i.test(candidate) ||
    /^(?:trade\s+rating|registered|country|name|ships?\s+from|designer|version)\s*:/i.test(
      candidate,
    ) ||
    /^(?:own it|previously owned|want(?:ed)?|for trade|wishlist)$/i.test(
      candidate,
    )
  )
    return undefined;
  return candidate;
}

function participantFromRow(row: HTMLTableRowElement) {
  const gameCell = row.cells[1];
  if (!gameCell) return "Unknown participant";

  const ownerElement = gameCell.querySelector<HTMLElement>(
    ".owner, .username, [data-username], [data-geekname]",
  );
  const ownerName = catalogParticipantCandidate(
    ownerElement?.dataset.username ??
      ownerElement?.dataset.geekname ??
      ownerElement?.textContent,
  );
  if (ownerName) return ownerName;

  const userLinks = [...gameCell.querySelectorAll<HTMLAnchorElement>("a")].filter(
    (link) => /\/user\/|geekname=|username=/i.test(link.href),
  );
  const linkedUser = userLinks.find((link) => !link.querySelector("img"));
  const linkedUserName = catalogParticipantCandidate(linkedUser?.textContent);
  if (linkedUserName) return linkedUserName;
  const linkedUrl = userLinks[0]
    ? new URL(userLinks[0].getAttribute("href") ?? "", location.origin)
    : undefined;
  const pathName = linkedUrl?.pathname.match(/\/user\/([^/?#]+)/i)?.[1];
  const queryName =
    linkedUrl?.searchParams.get("geekname") ??
    linkedUrl?.searchParams.get("username");
  const encodedName = pathName ?? queryName;
  if (encodedName) {
    try {
      const decodedName = catalogParticipantCandidate(
        decodeURIComponent(encodedName),
      );
      if (decodedName) return decodedName;
    } catch {
      const undecodedName = catalogParticipantCandidate(encodedName);
      if (undecodedName) return undecodedName;
    }
  }

  const userInformationAction = [
    ...gameCell.querySelectorAll<HTMLElement>("[onclick], a[href^='javascript:']"),
  ].map((element) =>
    `${element.getAttribute("onclick") ?? ""} ${
      element instanceof HTMLAnchorElement
        ? element.getAttribute("href") ?? ""
        : ""
    }`
  ).find((context) => /showuserinfo\s*\(/i.test(context));
  const actionMatch = userInformationAction?.match(
    /showuserinfo\s*\(\s*(?:(["'])(.*?)\1|([^,\s)]+))/i,
  );
  const actionUsername = catalogParticipantCandidate(
    actionMatch?.[2] ?? actionMatch?.[3],
  );
  if (actionUsername) return actionUsername;

  const legacyOwner = [...gameCell.querySelectorAll<HTMLElement>("i, em")]
    .map((element) => catalogParticipantCandidate(element.textContent))
    .find((candidate): candidate is string => Boolean(candidate));
  if (legacyOwner) return legacyOwner;

  const userDetails = normalizedText(
    [...gameCell.querySelectorAll<HTMLElement>("a, img, button")]
      .map(
        (element) =>
          `${element.textContent} ${element.title} ${element.getAttribute("alt")}`,
      )
      .join(" "),
  );
  const namedUser = catalogParticipantCandidate(
    userDetails.match(/\bname\s*:\s*([^,|]+)(?:,|\||$)/i)?.[1],
  );
  if (namedUser) return namedUser;
  return "Unknown participant";
}

function participantUrlFromRow(row: HTMLTableRowElement) {
  const linkedProfile = [
    ...row.cells[1]?.querySelectorAll<HTMLAnchorElement>("a") ?? [],
  ].find(
    (link) => /\/user\/|geekname=|username=/i.test(link.href),
  )?.href;
  if (linkedProfile) return linkedProfile;

  const participant = participantFromRow(row);
  return participant === "Unknown participant"
    ? undefined
    : `https://boardgamegeek.com/user/${encodeURIComponent(participant)}`;
}

function decorateCatalogGameCell(cell: HTMLTableCellElement) {
  const titleLink = catalogTitleLink(cell);
  [
    cell.parentElement,
    cell,
    titleLink?.parentElement,
    titleLink,
    ...cell.querySelectorAll<HTMLElement>("[style*='background'], [bgcolor]"),
  ].filter((element): element is HTMLElement => element instanceof HTMLElement)
    .forEach((element) => {
      const colorKeys = backgroundColorKeys(element);
      const matchedColor = colorKeys.find((color) =>
        colorGuideLabels.has(color),
      );
      const label = matchedColor
        ? colorGuideLabels.get(matchedColor)
        : embeddedCollectionStatusLabel(element);
      element.classList.add("olwlg-catalog-color-code");
      if (label) {
        element.dataset.olwlgCollectionColor =
          matchedColor ?? backgroundColorKeys(element)[0] ?? "#d9dced";
        element.dataset.olwlgCollectionTag = label;
        element.dataset.olwlgTooltip = label;
        element.classList.add("olwlg-tooltip-target");
        element.tabIndex = 0;
      }
    });

  cell.querySelectorAll<HTMLElement>("div, p, span, font").forEach((element) => {
    const text = normalizedText(element.textContent).toLowerCase();
    if (text.startsWith("designer:"))
      element.classList.add("olwlg-catalog-metadata");
    if (text.startsWith("version "))
      element.classList.add("olwlg-catalog-version");
  });
}

function catalogCollectionStatuses(
  cell: HTMLTableCellElement | undefined,
): CatalogCollectionStatus[] {
  if (!cell) return [];

  const statuses = new Map<string, CatalogCollectionStatus>();
  cell
    .querySelectorAll<HTMLElement>("[data-olwlg-collection-tag]")
    .forEach((element) => {
      const label = normalizedText(element.dataset.olwlgCollectionTag);
      const key = label.toLocaleLowerCase();
      if (!label || statuses.has(key)) return;
      const color =
        element.dataset.olwlgCollectionColor ||
        getComputedStyle(element).backgroundColor;
      if (!color || color === "rgba(0, 0, 0, 0)") return;
      statuses.set(key, { color, label });
    });
  return [...statuses.values()];
}

function actionCandidateFromCell(cell: HTMLTableCellElement) {
  const controls = [
    cell,
    ...cell.querySelectorAll<HTMLElement>("*"),
  ];

  const labeled = controls.find((control) => {
    if (
      control.closest(
        ".olwlg-catalog-primary-action, .olwlg-catalog-add-action",
      )
    )
      return false;
    if (
      control instanceof HTMLAnchorElement &&
      /boardgamegeek\.com/i.test(control.href)
    )
      return false;

    const image =
      control instanceof HTMLImageElement
        ? control
        : control.querySelector<HTMLImageElement>("img");
    const filename = image ? imageFilename(image) ?? "" : "";
    const label =
      control instanceof HTMLInputElement
        ? `${control.value} ${control.alt} ${control.title}`
        : `${control.textContent ?? ""} ${control.title} ${
            control instanceof HTMLImageElement ? control.alt : image?.alt ?? ""
          } ${catalogNativeActionContext(control)}`;
    return (
      !/check|added|selected/i.test(`${filename} ${label}`) &&
      /add|plus/i.test(`${filename} ${label}`)
    );
  });
  if (labeled) return labeled;

  return controls.find(
    (control) =>
      !control.closest(
        ".olwlg-catalog-primary-action, .olwlg-catalog-add-action",
      ) &&
      (
        (control instanceof HTMLInputElement &&
          /^(button|submit|image)$/i.test(control.type)) ||
        control instanceof HTMLButtonElement ||
        /(?:^|[^\w])clickwant\s*\(/i.test(
          catalogNativeActionContext(control),
        )
      ),
  );
}

function addedCandidateFromCell(cell: HTMLTableCellElement) {
  // Wishlist state is rendered in the GL # cell. Looking through the entire
  // row also sees unrelated game tools (for example a "Mark item" control)
  // whose check/selected wording can otherwise make every listing look added.
  const controls = [
    ...cell.querySelectorAll<HTMLElement>("img, input, button, a"),
  ];

  const controlMatch = controls.find((control) => {
    if (
      control instanceof HTMLAnchorElement &&
      /boardgamegeek\.com/i.test(control.href)
    )
      return false;

    const image =
      control instanceof HTMLImageElement
        ? control
        : control.querySelector<HTMLImageElement>("img");
    const filename = image ? imageFilename(image) ?? "" : "";
    const label =
      control instanceof HTMLInputElement
        ? `${control.value} ${control.alt} ${control.title}`
        : `${control.textContent ?? ""} ${control.title} ${
            control instanceof HTMLImageElement ? control.alt : image?.alt ?? ""
          } ${control.getAttribute("onclick") ?? ""}`;
    return /^(?:ok|added)\.(?:gif|png)$/i.test(filename) ||
      /already added|added to (?:your )?want|already attached|in your want list/i.test(
        `${filename} ${label}`,
      );
  });
  if (controlMatch) return controlMatch;

  const text = normalizedText(cell.textContent);
  return /already attached|in your want list|selected for your want|added to your want/i.test(
    text,
  );
}

function markCatalogRowAdded(row: HTMLTableRowElement) {
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

function syncCatalogAddedItems() {
  document
    .querySelectorAll<HTMLTableRowElement>(".olwlg-catalog-row")
    .forEach((row) => {
      if (catalogRowHasSavedWant(row)) markCatalogRowAdded(row);
    });
}

function createCatalogAction(
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
  const button = document.createElement("button");
  const label = document.createElement("span");
  const icon = createModernIcon(name);

  button.type = "button";
  button.className = `olwlg-catalog-primary-action olwlg-catalog-primary-action--${name} olwlg-icon-control`;
  button.dataset.olwlgForControl = original.id || "legacy";
  button.dataset.olwlgTooltip = definition.tooltip;
  button.setAttribute("aria-label", definition.label);
  label.textContent = name === "add" ? "Add" : "Item Added";
  icon.removeAttribute("aria-label");
  icon.removeAttribute("data-olwlg-tooltip");
  button.append(icon, label);

  button.addEventListener("click", () => activateCatalogAction(original));
  original.dataset.olwlgEnhanced = "catalog-action";
  original.classList.add("olwlg-catalog-original-action");
  mount.insertAdjacentElement("beforeend", button);
}

function createCatalogPanelAction(
  panel: HTMLElement,
  mount: HTMLElement,
) {
  if (mount.querySelector(".olwlg-catalog-primary-action")) return;

  const button = document.createElement("button");
  const label = document.createElement("span");
  const icon = createModernIcon("add");
  button.type = "button";
  button.className =
    "olwlg-catalog-primary-action olwlg-catalog-primary-action--add olwlg-icon-control";
  button.dataset.olwlgForControl = panel.id || "row-panel";
  button.dataset.olwlgTooltip =
    "Choose which of your games you would trade for this item.";
  button.setAttribute("aria-label", "Add");
  icon.removeAttribute("aria-label");
  icon.removeAttribute("data-olwlg-tooltip");
  label.textContent = "Add";
  button.append(icon, label);
  button.addEventListener("click", () => {
    openCatalogModal("Choose games to offer", panel, true);
  });
  mount.append(button);
}

function activateCatalogAction(original: HTMLElement) {
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

function offerPanelForControl(original: HTMLElement) {
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

function activateCatalogOfferAction(original: HTMLElement) {
  original.click();
  window.setTimeout(syncCatalogAddedItems, 80);
  window.setTimeout(syncCatalogAddedItems, 350);
}

function createCatalogOfferAction(original: HTMLElement, mount = original) {
  if (
    original.closest(".olwlg-catalog-add-action") ||
    mount.parentElement?.querySelector(
      ".olwlg-catalog-add-action[data-olwlg-for-control]",
    )
  )
    return;

  const button = document.createElement("button");
  const label = document.createElement("span");
  const icon = createModernIcon("add");

  button.type = "button";
  button.className = "olwlg-catalog-add-action olwlg-icon-control";
  button.dataset.olwlgForControl = original.id || "legacy";
  button.dataset.olwlgTooltip =
    "Add this item directly to your wants list.";
  button.setAttribute("aria-label", "Add directly to wants list");
  icon.removeAttribute("aria-label");
  icon.removeAttribute("data-olwlg-tooltip");
  label.textContent = "Add to list";
  button.append(icon, label);

  button.addEventListener("click", () => activateCatalogOfferAction(original));
  original.dataset.olwlgEnhanced = "catalog-add-action";
  original.classList.add("olwlg-catalog-original-action");
  mount.insertAdjacentElement("beforeend", button);
}

function wantPanelForControl(original: HTMLElement) {
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

function catalogActionImageSource(element: HTMLElement) {
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

function catalogNativeActionContext(element: HTMLElement) {
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

function catalogNativeActionControls(row: HTMLTableRowElement) {
  return [row, ...row.querySelectorAll<HTMLElement>("*")].filter(
    (element) =>
      element.matches(
        "a, button, input, img, [onclick], [onmousedown], [onmouseup], [href]",
      ) ||
      typeof element.onclick === "function",
  );
}

function catalogWantControl(row: HTMLTableRowElement) {
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

function catalogDirectWantControl(row: HTMLTableRowElement) {
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

function catalogWantPanelForRow(row: HTMLTableRowElement) {
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

function catalogRowHasSavedWant(row: HTMLTableRowElement) {
  const cell = row.cells[0];
  if (cell && addedCandidateFromCell(cell)) return true;

  const panel = catalogWantPanelForRow(row);
  return Boolean(
    panel?.querySelector(
      'input[type="checkbox"]:checked, input[type="radio"]:checked',
    ),
  );
}

let modalReturnMarker: Comment | undefined;
let modalMovedContent: HTMLElement | undefined;

function getCatalogModal() {
  let modal = document.querySelector<HTMLElement>(".olwlg-catalog-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.className = "olwlg-catalog-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="olwlg-catalog-modal__backdrop" data-olwlg-modal-close></div>
    <section class="olwlg-catalog-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="olwlg-modal-title">
      <header>
        <div>
          <p>Math trade item</p>
          <h2 id="olwlg-modal-title"></h2>
        </div>
        <button type="button" class="olwlg-catalog-modal__close" data-olwlg-modal-close aria-label="Close dialog">×</button>
      </header>
      <div class="olwlg-catalog-modal__body"></div>
    </section>
  `;
  modal.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLElement>("button, input");
    const buttonLabel =
      button instanceof HTMLInputElement
        ? button.value
        : button?.textContent ?? "";
    if (
      target.closest("[data-olwlg-modal-close]") ||
      buttonLabel.trim().toLowerCase() === "cancel"
    ) {
      closeCatalogModal();
      return;
    }
    if (buttonLabel.trim().toLowerCase() === "save") {
      window.setTimeout(syncCatalogAddedItems, 80);
      window.setTimeout(syncCatalogAddedItems, 350);
      window.setTimeout(closeCatalogModal, 0);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal?.hidden) closeCatalogModal();
  });
  document.body.append(modal);
  return modal;
}

function closeCatalogModal() {
  const modal = document.querySelector<HTMLElement>(".olwlg-catalog-modal");
  if (!modal) return;
  if (modalMovedContent && modalReturnMarker?.parentNode) {
    modalReturnMarker.parentNode.insertBefore(
      modalMovedContent,
      modalReturnMarker,
    );
    modalMovedContent.style.visibility = "hidden";
    modalReturnMarker.remove();
  }
  const body = modal.querySelector<HTMLElement>(".olwlg-catalog-modal__body");
  body?.classList.remove("olwlg-catalog-modal__body--frame-loading");
  body?.replaceChildren();
  modalMovedContent = undefined;
  modalReturnMarker = undefined;
  modal.hidden = true;
  document.body.classList.remove("olwlg-modal-open");
}

function decorateCatalogWantPanel(panel: HTMLElement) {
  if (panel.dataset.olwlgWantPanelDecorated === "true") return;

  const checkboxTables = new Set<HTMLTableElement>();
  panel
    .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    .forEach((checkbox) => {
      let table = checkbox.closest<HTMLTableElement>("table");
      while (table && panel.contains(table)) {
        checkboxTables.add(table);
        table = table.parentElement?.closest<HTMLTableElement>("table") ?? null;
      }
    });
  const offerTables = [...checkboxTables];
  offerTables
    .filter((table) => {
      const ancestor =
        table.parentElement?.closest<HTMLTableElement>("table");
      return !ancestor || !checkboxTables.has(ancestor);
    })
    .forEach((table) => table.classList.add("olwlg-want-offers"));
  offerTables
    .filter(
      (table) =>
        ![...table.querySelectorAll<HTMLTableElement>("table")].some(
          (nested) => checkboxTables.has(nested),
        ),
    )
    .forEach((table) => table.classList.add("olwlg-want-offers__group"));

  const actionLabel = (control: HTMLElement) =>
    normalizedText(
      control instanceof HTMLInputElement
        ? `${control.value} ${control.title} ${control.getAttribute("aria-label")}`
        : `${control.textContent} ${control.title} ${control.getAttribute("aria-label")}`,
    );
  const actionControls = [
    ...panel.querySelectorAll<HTMLElement>(
      "a, button, input:not([type='checkbox']):not([type='radio'])",
    ),
  ].filter((control) =>
    /\bsave\b|\bcancel\b|\bcheck all\b|\buncheck all\b|optional value/i.test(
      actionLabel(control),
    )
  );
  actionControls.forEach((control) => {
    const label = actionLabel(control).toLowerCase();
    if (/\b(?:save|cancel)\b/.test(label))
      control.classList.add("olwlg-want-panel__primary-action");
    if (/\b(?:check all|uncheck all)\b/.test(label)) {
      control.classList.add("olwlg-want-panel__bulk-action");
      if (/\bcheck all\b/.test(label) && !/\buncheck all\b/.test(label))
        control.classList.add("olwlg-want-panel__bulk-action--start");
    }
  });

  actionControls.forEach((control) => {
    let container = control.parentElement;
    while (container && container !== panel) {
      const labels = [
        ...container.querySelectorAll<HTMLElement>("a, button, input"),
      ].map(actionLabel).join(" ");
      if (
        !container.querySelector('input[type="checkbox"]') &&
        /\b(?:save|cancel)\b/i.test(labels) &&
        /\b(?:check all|uncheck all)\b/i.test(labels)
      ) {
        container.classList.add("olwlg-want-panel__actions");
        break;
      }
      container = container.parentElement;
    }
  });

  const actionContainers = new Set<HTMLElement>([panel]);
  actionControls.forEach((control) => {
    let container = control.parentElement;
    while (container && panel.contains(container)) {
      if (container.matches("form, div, center"))
        actionContainers.add(container);
      if (container === panel) break;
      container = container.parentElement;
    }
  });
  [...actionContainers].reverse().forEach((container) => {
    let segment: ChildNode[] = [];
    const wrapSegment = () => {
      if (!segment.length) return;
      const labels = segment
        .flatMap((node) => {
          if (!(node instanceof HTMLElement)) return [];
          const controls = node.matches("a, button, input")
            ? [node]
            : [...node.querySelectorAll<HTMLElement>("a, button, input")];
          return controls.map(actionLabel);
        })
        .join(" ");
      if (
        /\b(?:save|cancel)\b/i.test(labels) &&
        /\b(?:check all|uncheck all)\b/i.test(labels) &&
        !segment.some(
          (node) =>
            node instanceof Element &&
            node.closest(".olwlg-want-panel__actions"),
        )
      ) {
        const actions = document.createElement("div");
        actions.className = "olwlg-want-panel__actions";
        container.insertBefore(actions, segment[0]);
        segment.forEach((node) => actions.append(node));
      }
      segment = [];
    };

    [...container.childNodes].forEach((node) => {
      const containsOffers =
        node instanceof Element &&
        Boolean(node.querySelector('input[type="checkbox"]'));
      if (containsOffers) {
        wrapSegment();
        return;
      }
      segment.push(node);
    });
    wrapSegment();
  });

  const promptText = "which of your games would you trade";
  const prompt = [
    ...panel.querySelectorAll<HTMLElement>("p, div, strong, b, span"),
  ]
    .filter((element) =>
      normalizedText(element.textContent).toLowerCase().includes(promptText)
    )
    .sort(
      (left, right) =>
        normalizedText(left.textContent).length -
        normalizedText(right.textContent).length,
    )[0];
  if (prompt) {
    prompt.classList.add("olwlg-want-panel__prompt");
  } else {
    const walker = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = walker.currentNode as Text;
      if (!normalizedText(text.data).toLowerCase().includes(promptText))
        continue;
      const wrapper = document.createElement("div");
      wrapper.className = "olwlg-want-panel__prompt";
      text.parentNode?.insertBefore(wrapper, text);
      wrapper.append(text);
      break;
    }
  }

  panel.dataset.olwlgWantPanelDecorated = "true";
}

function openCatalogModal(
  title: string,
  content: HTMLElement,
  moveContent = false,
) {
  closeCatalogModal();
  const modal = getCatalogModal();
  const heading = modal.querySelector<HTMLElement>("#olwlg-modal-title");
  const body = modal.querySelector<HTMLElement>(".olwlg-catalog-modal__body");
  if (!heading || !body) return;

  heading.textContent = title;
  body.replaceChildren();
  if (moveContent) {
    modalReturnMarker = document.createComment("olwlg-modal-return");
    content.parentNode?.insertBefore(modalReturnMarker, content);
    modalMovedContent = content;
    content.style.visibility = "visible";
    if (!content.classList.contains("olwlg-catalog-legacy-source"))
      content.classList.add("olwlg-want-panel");
    if (content.classList.contains("olwlg-want-panel"))
      decorateCatalogWantPanel(content);
    body.append(content);
  } else {
    body.append(content);
  }
  modal.hidden = false;
  document.body.classList.add("olwlg-modal-open");
  modal
    .querySelector<HTMLButtonElement>(".olwlg-catalog-modal__close")
    ?.focus();
}

function showAddedFeedback(button: HTMLElement, idleLabel: string) {
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

function catalogRowBelongsToLoggedInUser(row: HTMLTableRowElement) {
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

function ensureCatalogOwnItemIndicator(mount: HTMLElement) {
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

function restrictCatalogOwnItemActions(row: HTMLTableRowElement) {
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

function enhanceCatalogRowActions(row: HTMLTableRowElement) {
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

const NAV_ICON_LABELS: Record<string, string> = {
  "auction.png": "Auctions",
  "cart.png": "Added items",
  "forum.gif": "Discussion",
  "geeklist.gif": "GeekList",
  "help.png": "Help",
  "home.png": "Home",
  "myown.gif": "My items",
  "plusbox.png": "Add items",
  "profile.png": "Profile",
  "stats.gif": "Statistics",
  "step4.gif": "Edit wants",
  "tipjar.png": "Tip",
  "users.gif": "Participants",
};

function conciseNavLabel(link: HTMLAnchorElement, image: HTMLImageElement) {
  const href = link.href.toLowerCase();
  const filename = imageFilename(image) ?? "";
  const description = normalizedText(
    link.title || image.alt || image.title,
  );

  if (/bgglogin/.test(href)) return "Log in";
  if (/profile/.test(href)) return "Profile";
  if (/addmygames|addgames/.test(href)) return "Add items";
  if (/mywants|step4/.test(href)) return "Edit wants";
  if (/viewlist/.test(href)) return "Browse items";
  if (/mtusers|users/.test(href)) return "Participants";
  if (/stats|statistics/.test(href)) return "Statistics";
  if (/auction/.test(href)) return "Auctions";
  if (/guild|wiki|help/.test(href)) return "Help";
  if (/geekgold\/transfer|tip/.test(href)) return "Tip";
  if (/boardgamearena/.test(href)) return "Play online";
  if (/result/.test(href)) return "Results";
  if (NAV_ICON_LABELS[filename]) return NAV_ICON_LABELS[filename];

  if (description) {
    const shortened = description.split(/[—–|:(]/)[0].trim();
    return shortened.length <= 28
      ? shortened
      : `${shortened.slice(0, 25).trim()}…`;
  }

  return filename
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Open";
}

function enhanceNavbar() {
  const navbar = document.querySelector<HTMLElement>("#navbar");
  if (!navbar || navbar.dataset.olwlgEnhanced) return;

  navbar.dataset.olwlgEnhanced = "true";
  navbar.classList.add("olwlg-navbar");

  const brand = document.createElement("a");
  const brandLogo = document.createElement("img");
  const brandLabel = document.createElement("span");
  brand.className = "olwlg-navbar__brand";
  brandLogo.className = "olwlg-navbar__logo";
  brandLogo.src =
    typeof chrome.runtime?.getURL === "function"
      ? chrome.runtime.getURL("icons/icon.svg")
      : "";
  brandLogo.alt = "";
  brandLabel.textContent = "OLWLG";
  brand.append(brandLogo, brandLabel);
  brand.href = new URL("/olwlg/", location.origin).href;
  brand.target = "_self";
  brand.setAttribute("aria-label", "OLWLG home");
  navbar.prepend(brand);

  for (const node of [...navbar.childNodes]) {
    if (!(node instanceof Text)) continue;

    const text = normalizedText(node.data);
    if (!text || /^navigation:?$/i.test(text) || text === "-") {
      node.remove();
      continue;
    }

    if (/logged in as|you are not logged in/i.test(text)) {
      const account = document.createElement("span");
      account.className = "olwlg-navbar__account";
      account.textContent = text;
      node.replaceWith(account);
    }
  }

  navbar.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
    if (link === brand) return;
    const image = link.querySelector<HTMLImageElement>("img");
    if (!image) {
      link.classList.add("olwlg-nav-text-link");
      return;
    }

    const labelText = conciseNavLabel(link, image);
    const label = document.createElement("span");
    label.className = "olwlg-nav-item__label";
    label.textContent = labelText;
    link.classList.add("olwlg-nav-item");
    link.setAttribute("aria-label", labelText);
    link.append(label);
  });

  navbar.querySelectorAll<HTMLFormElement>("form").forEach((form) => {
    const submit = form.querySelector<HTMLInputElement>(
      'input[type="image"], input[type="submit"]',
    );
    if (!submit) return;

    const label = document.createElement("span");
    label.className = "olwlg-nav-item__label";
    label.textContent = "Donate";
    form.classList.add("olwlg-nav-donate");
    form.setAttribute("aria-label", "Donate");
    form.append(label);
  });

  const menus = document.createElement("nav");
  const user = document.createElement("div");
  menus.className = "olwlg-navbar__menus";
  menus.setAttribute("aria-label", "Primary navigation");
  user.className = "olwlg-navbar__user";

  const groups = new Map<string, HTMLElement[]>([
    ["Trade", []],
    ["Insights", []],
    ["Resources", []],
    ["Support", []],
  ]);
  const accountLabels = /profile|log in|log out|logout|sign out|account/i;
  let profileLink: HTMLElement | undefined;
  let logoutLink: HTMLElement | undefined;
  let editWantsLink: HTMLElement | undefined;
  const isCatalogPage = location.pathname.endsWith("/viewlist.cgi");
  const catalogEditWantsItems = isCatalogPage
    ? [...navbar.querySelectorAll<HTMLElement>(".olwlg-nav-item")].filter(
        (item) =>
          /edit (?:your )?wants/i.test(
            normalizedText(
              item.querySelector(".olwlg-nav-item__label")?.textContent,
            ),
          ),
      )
    : [];
  editWantsLink =
    catalogEditWantsItems.find((item) => {
      const image = item.querySelector<HTMLImageElement>("img");
      return (
        (image && imageFilename(image) === "step4.gif") ||
        (item instanceof HTMLAnchorElement && /step4/i.test(item.href))
      );
    }) ?? catalogEditWantsItems[0];

  navbar.querySelectorAll<HTMLElement>(".olwlg-nav-item").forEach((item) => {
    const label = normalizedText(
      item.querySelector(".olwlg-nav-item__label")?.textContent,
    );
    if (isCatalogPage && /edit (?:your )?wants/i.test(label)) {
      if (item !== editWantsLink) item.remove();
      return;
    }
    if (accountLabels.test(label)) {
      const href = item instanceof HTMLAnchorElement ? item.href : "";
      if (/log\s*out|logout|sign\s*out/i.test(`${label} ${href}`))
        logoutLink ??= item;
      else profileLink ??= item;
      return;
    }

    const category = /statistics|participants|results/i.test(label)
      ? "Insights"
      : /help|geeklist|discussion|play online/i.test(label)
        ? "Resources"
        : /tip|auction/i.test(label)
          ? "Support"
          : "Trade";
    groups.get(category)?.push(item);
  });

  const accountText = navbar.querySelector<HTMLElement>(
    ".olwlg-navbar__account",
  );
  const accountLinks = [
    ...navbar.querySelectorAll<HTMLAnchorElement>(".olwlg-nav-text-link"),
  ];
  if (isCatalogPage && !editWantsLink) {
    editWantsLink = accountLinks.find(
      (link) =>
        /mywants|step4/i.test(link.href) ||
        /edit (?:your )?wants/i.test(normalizedText(link.textContent)),
    );
  }
  if (editWantsLink) {
    navbar
      .querySelectorAll<HTMLAnchorElement>("a")
      .forEach((link) => {
        if (
          link !== editWantsLink &&
          (/mywants|step4/i.test(link.href) ||
            /edit (?:your )?wants/i.test(normalizedText(link.textContent)))
        )
          link.remove();
      });
  }
  const logoutTextLink = accountLinks.find((link) =>
    /log\s*out|logout|sign\s*out/i.test(
      `${normalizedText(link.textContent)} ${link.href}`,
    )
  );
  const logoutControl = logoutLink ?? logoutTextLink;
  const profileTextLinks = accountLinks.filter(
    (link) =>
      link !== editWantsLink &&
      link !== logoutControl &&
      link.isConnected,
  );
  const usernameLink = profileTextLinks.find((link) =>
    /\/user\/|geekname=|username=|profile/i.test(link.href),
  ) ?? profileTextLinks[0];
  navbar
    .querySelectorAll<HTMLElement>(".olwlg-nav-donate")
    .forEach((item) => groups.get("Support")?.push(item));

  for (const [category, items] of groups) {
    if (!items.length) continue;

    const dropdown = document.createElement("details");
    const summary = document.createElement("summary");
    const panel = document.createElement("div");
    dropdown.className = "olwlg-nav-dropdown";
    summary.textContent = category;
    panel.className = "olwlg-nav-dropdown__panel";
    panel.append(...items);
    dropdown.append(summary, panel);
    menus.append(dropdown);
  }

  const brandElement = navbar.querySelector(".olwlg-navbar__brand");
  brandElement?.insertAdjacentElement("afterend", menus);

  if (editWantsLink) {
    editWantsLink.classList.remove("olwlg-nav-text-link");
    editWantsLink.classList.add("olwlg-nav-item", "olwlg-navbar__edit-wants");
    editWantsLink.querySelectorAll("img").forEach((image) => image.remove());
    let label = editWantsLink.querySelector(".olwlg-nav-item__label");
    if (!label) {
      label = document.createElement("span");
      label.className = "olwlg-nav-item__label";
      editWantsLink.replaceChildren(label);
    }
    const icon = createModernIcon("wants");
    icon.removeAttribute("aria-label");
    icon.removeAttribute("data-olwlg-tooltip");
    label.textContent = "Edit your wants";
    editWantsLink.prepend(icon);
    editWantsLink.setAttribute("aria-label", "Edit your wants");
    user.append(editWantsLink);
  }

  if (usernameLink || profileLink || logoutControl) {
    const accountMenu = document.createElement("details");
    const summary = document.createElement("summary");
    const panel = document.createElement("div");
    const heading = document.createElement("div");
    const avatar = createModernIcon("users");
    const username =
      normalizedText(usernameLink?.textContent) ||
      normalizedText(profileLink?.textContent) ||
      "Account";

    accountMenu.className = "olwlg-profile-menu";
    summary.className = "olwlg-profile-menu__trigger";
    panel.className = "olwlg-profile-menu__panel";
    heading.className = "olwlg-profile-menu__heading";
    avatar.classList.add("olwlg-profile-menu__avatar");
    avatar.removeAttribute("data-olwlg-tooltip");
    avatar.removeAttribute("aria-label");
    summary.setAttribute("aria-label", `Open ${username} account menu`);
    summary.append(avatar, document.createTextNode(username));

    const panelAvatar = createModernIcon("users");
    const identity = document.createElement("div");
    panelAvatar.classList.add("olwlg-profile-menu__avatar");
    panelAvatar.removeAttribute("data-olwlg-tooltip");
    panelAvatar.removeAttribute("aria-label");
    identity.innerHTML =
      `<strong>${username}</strong><span>Logged in as: ${username}</span>`;
    heading.append(panelAvatar, identity);
    panel.append(heading);

    if (usernameLink) {
      usernameLink.classList.add("olwlg-profile-menu__link");
      usernameLink.textContent = "View BGG profile";
      panel.append(usernameLink);
    }
    if (profileLink) {
      profileLink.classList.add("olwlg-profile-menu__link");
      const label = profileLink.querySelector(".olwlg-nav-item__label");
      if (label) label.textContent = "OLWLG profile settings";
      panel.append(profileLink);
    }
    if (logoutControl instanceof HTMLAnchorElement) {
      const logoutIcon = createModernIcon("logout");
      const logoutLabel = document.createElement("span");
      logoutControl.classList.remove("olwlg-nav-item", "olwlg-nav-text-link");
      logoutControl.classList.add(
        "olwlg-profile-menu__link",
        "olwlg-profile-menu__link--logout",
      );
      logoutIcon.removeAttribute("data-olwlg-tooltip");
      logoutIcon.removeAttribute("aria-label");
      logoutLabel.textContent = "Log out";
      logoutControl.replaceChildren(logoutIcon, logoutLabel);
      logoutControl.setAttribute("aria-label", "Log out");
      panel.append(logoutControl);
    }
    accountText?.remove();
    profileTextLinks
      .filter((link) => link !== usernameLink)
      .forEach((link) => panel.append(link));
    accountMenu.append(summary, panel);
    user.append(accountMenu);
  } else {
    if (accountText) user.append(accountText);
    profileTextLinks.forEach((link) => user.append(link));
  }

  const accountTextWalker = document.createTreeWalker(
    navbar,
    NodeFilter.SHOW_TEXT,
  );
  const accountTextNodes: Text[] = [];
  while (accountTextWalker.nextNode())
    accountTextNodes.push(accountTextWalker.currentNode as Text);
  accountTextNodes.forEach((textNode) => {
    textNode.data = textNode.data.replace(/logged\s+in\s+as\s*:\s*/gi, "");
  });

  for (const node of [...navbar.childNodes]) {
    if (
      node === brandElement ||
      node === menus ||
      node === user ||
      user.contains(node)
    )
      continue;
    if (node instanceof Text && !normalizedText(node.data)) {
      node.remove();
      continue;
    }
    user.append(node);
  }
  navbar.append(user);

  navbar.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const selected = event.target.closest(".olwlg-nav-dropdown__panel a");
    if (selected) selected.closest<HTMLDetailsElement>("details")?.removeAttribute("open");
  });
  const navDropdowns = [
    ...navbar.querySelectorAll<HTMLDetailsElement>(".olwlg-nav-dropdown"),
  ];
  navDropdowns.forEach((dropdown) => {
    let closeTimer: number | undefined;
    const cancelScheduledClose = () => {
      window.clearTimeout(closeTimer);
      closeTimer = undefined;
    };
    const scheduleClose = () => {
      cancelScheduledClose();
      closeTimer = window.setTimeout(() => {
        dropdown.removeAttribute("open");
      }, 240);
    };
    const closeOtherMenus = () => {
      navDropdowns
        .filter((other) => other !== dropdown)
        .forEach((other) => other.removeAttribute("open"));
      navbar
        .querySelector<HTMLDetailsElement>(".olwlg-profile-menu[open]")
        ?.removeAttribute("open");
    };
    dropdown.addEventListener("toggle", () => {
      if (dropdown.open) closeOtherMenus();
    });
    dropdown.addEventListener("mouseenter", () => {
      cancelScheduledClose();
      closeOtherMenus();
      dropdown.setAttribute("open", "");
    });
    dropdown.addEventListener("mouseleave", () => {
      scheduleClose();
    });
    dropdown
      .querySelector(".olwlg-nav-dropdown__panel")
      ?.addEventListener("mouseenter", cancelScheduledClose);
  });
  document.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Node && navbar.contains(event.target)) return;
    navbar
      .querySelectorAll<HTMLDetailsElement>(
        ".olwlg-nav-dropdown[open], .olwlg-profile-menu[open]",
      )
      .forEach((dropdown) => dropdown.removeAttribute("open"));
  });
}

function catalogBggLink(cell: HTMLTableCellElement | undefined) {
  if (!cell) return undefined;
  return [...cell.querySelectorAll<HTMLAnchorElement>("a")].find((link) =>
    /boardgamegeek\.com\/(?:boardgame|boardgameexpansion|thing)\//i.test(
      link.href,
    ),
  )?.href;
}

function catalogBggId(cell: HTMLTableCellElement | undefined) {
  return catalogBggLink(cell)?.match(
    /boardgamegeek\.com\/(?:boardgame|boardgameexpansion|thing)\/(\d+)/i,
  )?.[1];
}

function catalogTitleLink(cell: HTMLTableCellElement | undefined) {
  if (!cell) return undefined;
  return [...cell.querySelectorAll<HTMLAnchorElement>("a")].find((link) =>
    /boardgamegeek\.com\/(?:boardgame|boardgameexpansion|thing)\//i.test(
      link.href,
    ),
  );
}

function catalogGameTitle(cell: HTMLTableCellElement | undefined) {
  const linkedTitle = normalizedText(catalogTitleLink(cell)?.textContent);
  const source = linkedTitle ||
    normalizedText(cell?.textContent)
      .replace(/^boardgame:\s*/i, "")
      .split(/\s+(?:rank=|rating=|ships from)\b/i)[0];
  return source
    .replace(/^["“”']+|["“”']+$/g, "")
    .replace(/\s+(?:rank|rating)\s*=\s*[\d.]+.*$/i, "")
    .trim() || "Trade item";
}

function removeCloneIds(element: HTMLElement) {
  element.removeAttribute("id");
  element.querySelectorAll<HTMLElement>("[id]").forEach((child) => {
    child.removeAttribute("id");
  });
}

function catalogStat(label: string, value: number | undefined) {
  const item = document.createElement("span");
  item.className = "olwlg-item-card__stat";
  item.innerHTML = `<small>${label}</small><strong>${
    value === undefined ? "—" : value
  }</strong>`;
  return item;
}

function cloneElement(element: HTMLElement) {
  const clone = element.cloneNode(true) as HTMLElement;
  removeCloneIds(clone);
  return clone;
}

function catalogSection(
  cell: HTMLTableCellElement,
  selector: string,
  className: string,
) {
  const source = cell.querySelector<HTMLElement>(selector);
  if (!source) return undefined;
  const section = cloneElement(source);
  section.className = className;
  return section;
}

function cleanDescription(container: HTMLElement) {
  container
    .querySelectorAll<HTMLElement>("script, style, .olwlg-catalog-metadata, .olwlg-catalog-version")
    .forEach((element) => element.remove());
  container.querySelectorAll<HTMLElement>("a, button, img").forEach((element) => {
    const image =
      element instanceof HTMLImageElement
        ? element
        : element.querySelector<HTMLImageElement>("img");
    const label = normalizedText(
      `${element.textContent} ${element.getAttribute("title")} ${image?.alt} ${image?.title}`,
    );
    const filename = image ? imageFilename(image) ?? "" : "";
    if (
      /show line breaks|bgg no longer supports icons|unsupported icons/i.test(
        label,
      ) ||
      filename === "arrow.gif" ||
      /bgg.*icon|icon.*bgg|nobgg/i.test(filename)
    )
      element.remove();
  });
  container.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
    const wrapper = image.closest("a");
    if (wrapper && normalizedText(wrapper.textContent) === "") wrapper.remove();
    else image.remove();
  });
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
  textNodes.forEach((node) => {
    node.data = node.data
      .replace(/\(?\s*show line breaks\s*\)?/gi, "")
      .replace(/\(?\s*bgg no longer supports icons[^)]*\)?/gi, "");
  });
}

function catalogDescription(cell: HTMLTableCellElement) {
  const marker =
    cell.querySelector<HTMLElement>(".olwlg-catalog-version") ??
    cell.querySelector<HTMLElement>(".olwlg-catalog-metadata");
  if (!marker) return undefined;

  const range = document.createRange();
  range.setStartAfter(marker);
  range.setEnd(cell, cell.childNodes.length);
  const description = document.createElement("div");
  description.className = "olwlg-item-card__description";
  description.append(range.cloneContents());
  cleanDescription(description);
  return normalizedText(description.textContent) ||
      description.querySelector("img")
    ? description
    : undefined;
}

function toolLabel(element: HTMLElement) {
  const image = element instanceof HTMLImageElement
    ? element
    : element.querySelector<HTMLImageElement>("img");
  const filename = image ? imageFilename(image) ?? "" : "";
  const guideLabel = filename ? iconGuideLabels.get(filename) ?? "" : "";
  const nestedAction = element.querySelector<HTMLElement>("[onclick]");
  const context = normalizedText(
    `${element.textContent} ${element.title} ${image?.alt} ${image?.title} ${filename} ${guideLabel} ${
      element instanceof HTMLAnchorElement ? element.href : ""
    } ${element.getAttribute("onclick")} ${nestedAction?.getAttribute("onclick")} ${
      element.getAttribute("target") ?? ""
    }`,
  );
  if (
    /trade\s*rating|registered\s*:|country\s*:|gamedesc|showuserinfo/i.test(
      context,
    )
  )
    return "User information";
  if (/price drop/i.test(context)) return "Price drop list";
  if (/price|history|\$|coin/i.test(context)) return "Price history";
  if (/oracle|boardgameoracle/i.test(context)) return "Board Game Oracle";
  if (/mark/i.test(context)) return "Mark item";
  if (/collection/i.test(context)) return "Collection";
  if (/market|shop|buy/i.test(context)) return "Marketplace";
  return normalizedText(guideLabel || image?.alt || image?.title || element.title) ||
    undefined;
}

function catalogTools(cell: HTMLTableCellElement) {
  const titleLink = catalogTitleLink(cell);
  const metadata = cell.querySelector(".olwlg-catalog-metadata");
  return [
    ...cell.querySelectorAll<HTMLElement>(
      "a, button, input[type='image'], img, [onclick]",
    ),
  ].filter(
    (element) => {
      if (
        element instanceof HTMLImageElement &&
        element.closest("a, button")
      )
        return false;
      if (element === titleLink || element.contains(titleLink ?? null))
        return false;
      const toolName = toolLabel(element);
      if (
        toolName &&
        /^(?:view|show)(?:\s+item)?\s+photo$/i.test(toolName)
      )
        return false;
      if (
        metadata &&
        metadata.contains(element) &&
        toolName !== "User information" &&
        toolName !== "Price history"
      )
        return false;
      if (element.closest(".olwlg-catalog-version")) return false;
      if (
        toolName !== "User information" &&
        /\/user\/|geekname=|username=/i.test(
          element instanceof HTMLAnchorElement ? element.href : "",
        )
      )
        return false;
      const image = element instanceof HTMLImageElement
        ? element
        : element.querySelector("img");
      const filename =
        image instanceof HTMLImageElement ? imageFilename(image) ?? "" : "";
      const label = normalizedText(
        `${element.textContent} ${element.title} ${image?.getAttribute("alt")} ${image?.getAttribute("title")} ${element.getAttribute("onclick")}`,
      );
      const hasLegacyAction =
        element.hasAttribute("onclick") ||
        Boolean(element.querySelector("[onclick]")) ||
        Boolean(catalogToolTarget(element)) ||
        Boolean(catalogToolUrl(element));
      return Boolean(toolName) &&
        (Boolean(image) || hasLegacyAction) &&
        !/show line breaks|bgg no longer supports|unsupported icons/i.test(
          label,
        ) &&
        (toolName === "User information" || !/flag|avatar/i.test(label)) &&
        filename !== "arrow.gif" &&
        !/bgg.*icon|icon.*bgg|nobgg/i.test(filename);
    },
  );
}

function catalogToolIdentity(tool: HTMLElement) {
  const image =
    tool instanceof HTMLImageElement
      ? tool
      : tool.querySelector<HTMLImageElement>("img");
  return [
    toolLabel(tool)?.toLocaleLowerCase() ?? "",
    image ? imageFilename(image) ?? "" : "",
  ].join("|");
}

const catalogToolFrames = new WeakMap<HTMLElement, HTMLIFrameElement>();

function catalogUserInformation(
  tool: HTMLElement,
  userInformation: string,
  participant?: string,
  participantUrl?: string,
) {
  const content = document.createElement("section");
  const fields = ["Trade Rating", "Registered", "Name", "Country"];
  const renderedFields = new Set<string>();
  const fieldPatterns: Record<string, RegExp> = {
    "Trade Rating": /trade\s*rating\s*:\s*([+-]?\d+(?:\.\d+)?)/i,
    Registered: /registered\s*:\s*((?:19|20)\d{2})/i,
    Name:
      /name\s*:\s*([^,|;]{1,80}?)(?=\s*(?:[,|;]|country\s*:|trade\s*rating\s*:|registered\s*:|showuserinfo|showln|show\s+line\s+breaks|$))/i,
    Country:
      /country\s*:\s*([^,|;]{1,80}?)(?=\s*(?:[,|;]|name\s*:|trade\s*rating\s*:|registered\s*:|showuserinfo|showln|show\s+line\s+breaks|$))/i,
  };
  content.className = "olwlg-user-information olwlg-user-information--details";
  const addField = (
    field: string,
    value: string,
    href?: string,
  ) => {
    const row = document.createElement("div");
    const fieldLabel = document.createElement("span");
    const fieldValue = document.createElement("strong");
    fieldLabel.textContent = field;
    if (href) {
      const link = document.createElement("a");
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = value;
      fieldValue.append(link);
    } else fieldValue.textContent = value;
    row.append(fieldLabel, fieldValue);
    content.append(row);
    renderedFields.add(field.toLocaleLowerCase());
  };
  fields.forEach((field) => {
    const value = userInformation.match(fieldPatterns[field])?.[1]?.trim();
    if (!value) return;
    addField(field, value);
  });
  if (
    participant &&
    participant !== "Unknown participant" &&
    !renderedFields.has("name")
  )
    addField("Name", participant);
  if (participantUrl)
    addField("BGG profile", "Open profile on BoardGameGeek", participantUrl);
  if (!content.childElementCount)
    content.textContent =
      normalizedText(tool.textContent) || "User information is unavailable.";
  return content;
}

function catalogUserInformationContext(cell: HTMLTableCellElement) {
  return normalizedText(
    [
      cell,
      ...cell.querySelectorAll<HTMLElement>(
        "a, button, input, img, [title], [onclick]",
      ),
    ]
      .map((element) =>
        [
          element.textContent,
          element.title,
          element.getAttribute("alt"),
          element.getAttribute("aria-label"),
          element.getAttribute("onclick"),
        ].filter(Boolean).join(" ")
      )
      .join(" "),
  );
}

function catalogUserInformationSummary(
  userInformation: string,
  participant: string,
) {
  const fields = [
    userInformation.match(/trade\s*rating\s*:\s*[+-]?\d+(?:\.\d+)?/i)?.[0],
    userInformation.match(/registered\s*:\s*(?:19|20)\d{2}/i)?.[0],
    userInformation.match(
      /name\s*:\s*[^,|;]{1,80}?(?=\s*(?:[,|;]|country\s*:|trade\s*rating\s*:|registered\s*:|$))/i,
    )?.[0],
    userInformation.match(
      /country\s*:\s*[^,|;]{1,80}?(?=\s*(?:[,|;]|name\s*:|trade\s*rating\s*:|registered\s*:|$))/i,
    )?.[0],
  ].filter((field): field is string => Boolean(field));
  return fields.length
    ? fields.map((field) => normalizedText(field)).join(", ")
    : `User information for ${participant}`;
}

function createCatalogUserInformationControl(
  row: CatalogRow,
  cell: HTMLTableCellElement,
) {
  const control = document.createElement("button");
  const icon = document.createElement("img");
  const label = document.createElement("span");
  const userInformation = catalogUserInformationContext(cell);
  const tooltip = catalogUserInformationSummary(
    userInformation,
    row.participant,
  );

  control.type = "button";
  control.className = "olwlg-item-card__tool";
  control.dataset.olwlgModalTool = "true";
  icon.src = "uinfo.png";
  icon.className =
    "avatar olwlg-catalog-guide-icon olwlg-tooltip-target";
  icon.height = 24;
  icon.dataset.olwlgEnhanced = "guide";
  icon.dataset.olwlgTooltip = tooltip;
  icon.setAttribute("aria-label", tooltip);
  icon.tabIndex = 0;
  icon.loading = "lazy";
  icon.decoding = "async";
  label.className = "olwlg-item-card__tool-label";
  label.textContent = "User information";
  control.append(icon, label);
  control.addEventListener("click", () => {
    const nativeProxy = document.createElement("button");
    nativeProxy.type = "button";
    nativeProxy.hidden = true;
    nativeProxy.setAttribute(
      "onclick",
      `showuserinfo(${JSON.stringify(row.participant)})`,
    );
    document.body.append(nativeProxy);
    openCatalogToolModal(
      nativeProxy,
      "User information",
      catalogUserInformation(
        cell,
        userInformation,
        row.participant,
        row.participantUrl,
      ),
    );
    window.setTimeout(() => nativeProxy.remove(), 1_000);
  });
  return control;
}

function catalogToolTarget(tool: HTMLElement) {
  const anchor =
    tool instanceof HTMLAnchorElement ? tool : tool.closest("a");
  const targetName =
    anchor?.getAttribute("target") ??
    tool.getAttribute("target") ??
    tool.getAttribute("formtarget");
  if (!targetName || /^_(?:blank|self|parent|top)$/i.test(targetName))
    return undefined;

  return (
    document.getElementById(targetName) ??
    [...document.querySelectorAll<HTMLElement>("[name]")].find(
      (element) => element.getAttribute("name") === targetName,
    )
  );
}

function legacyCatalogToolSource(tool: HTMLElement) {
  const target = catalogToolTarget(tool);
  const description = document.getElementById("gamedesc");
  const frame = document.getElementById("gamedescframe");

  for (const candidate of [target, frame, description]) {
    if (!(candidate instanceof HTMLElement)) continue;
    if (
      description instanceof HTMLElement &&
      (candidate === description || description.contains(candidate))
    )
      return description;
    return candidate;
  }
  return undefined;
}

function catalogToolUrl(tool: HTMLElement) {
  const anchor =
    tool instanceof HTMLAnchorElement ? tool : tool.closest("a");
  const href = anchor?.getAttribute("href") ?? "";
  if (!href || href === "#" || /^javascript:/i.test(href)) return undefined;
  try {
    return new URL(href, location.href).href;
  } catch {
    return undefined;
  }
}

function bggPriceHistoryUrl(tool: HTMLElement) {
  const directUrl = catalogToolUrl(tool);
  if (directUrl) {
    const parsed = new URL(directUrl);
    if (
      /(?:^|\.)boardgamegeek\.com$/i.test(parsed.hostname) &&
      /\/market\/pricehistory\/thing\//i.test(parsed.pathname)
    )
      return parsed.href;
  }

  const image =
    tool instanceof HTMLImageElement
      ? tool
      : tool.querySelector<HTMLImageElement>("img");
  const filename = image ? imageFilename(image) ?? "" : "";
  const guideLabel = filename ? iconGuideLabels.get(filename) ?? "" : "";
  const context = normalizedText(
    `${filename} ${guideLabel} ${image?.alt} ${image?.title} ${tool.title}`,
  );
  const isBggHistoryIcon =
    /(?:^|[^a-z])(?:bgg|geekmarket)[^|]*(?:price|history)/i.test(context) ||
    /(?:^|[^a-z])(?:price|history)[^|]*(?:bgg|geekmarket)/i.test(context) ||
    /^(?:h|history|pricehistory)\.(?:gif|png|jpe?g|webp)$/i.test(filename);
  if (!isBggHistoryIcon) return undefined;

  const gameCell = tool.closest<HTMLTableCellElement>("td");
  const gameUrl =
    catalogTitleLink(gameCell ?? undefined)?.href ??
    catalogBggLink(gameCell ?? undefined);
  const thingId = gameUrl?.match(
    /boardgamegeek\.com\/(?:boardgame|boardgameexpansion|thing)\/(\d+)/i,
  )?.[1];
  return thingId
    ? `https://boardgamegeek.com/market/pricehistory/thing/${thingId}`
    : directUrl;
}

function catalogToolFrame(tool: HTMLElement, sourceUrl: string) {
  const cached = catalogToolFrames.get(tool);
  if (cached) return cached;

  const frame = document.createElement("iframe");
  frame.className =
    "olwlg-catalog-legacy-source olwlg-catalog-tool-frame";
  frame.src = sourceUrl;
  frame.title = `${toolLabel(tool) ?? "Item"} details`;
  frame.loading = "eager";
  frame.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
  catalogToolFrames.set(tool, frame);
  return frame;
}

const CATALOG_IFRAME_STYLE_ID = "olwlg-beautifier-iframe-theme";

function styleCatalogIframe(frame: HTMLIFrameElement) {
  try {
    const document = frame.contentDocument;
    if (!document?.head || !document.body) return false;

    let style = document.getElementById(CATALOG_IFRAME_STYLE_ID);
    if (!(style instanceof HTMLStyleElement)) {
      style = document.createElement("style");
      style.id = CATALOG_IFRAME_STYLE_ID;
      style.textContent = `
        :root {
          color-scheme: light;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: #fff;
          color: #292750;
        }
        *, *::before, *::after { box-sizing: border-box; }
        html, body {
          min-height: 100%;
          margin: 0 !important;
          background: #fff !important;
          color: #343248 !important;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
          font-size: 15px !important;
          line-height: 1.55 !important;
        }
        body, body * {
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        }
        body { padding: 22px 24px 32px !important; }
        a {
          color: #4338ca !important;
          font-weight: 700;
          text-decoration-thickness: 1px;
          text-underline-offset: 3px;
        }
        a:hover { color: #292750 !important; }
        table {
          width: 100% !important;
          margin: 14px 0 !important;
          overflow: hidden;
          border: 1px solid #d9d8e7 !important;
          border-collapse: separate !important;
          border-spacing: 0 !important;
          border-radius: 12px;
          background: #fff;
        }
        th {
          position: sticky;
          z-index: 1;
          top: 0;
          padding: 10px 12px !important;
          border: 0 !important;
          border-bottom: 1px solid #cfcede !important;
          background: #efeff8 !important;
          color: #292750 !important;
          font-size: 12px !important;
          font-weight: 850 !important;
          letter-spacing: .035em;
          text-align: left;
        }
        td {
          padding: 10px 12px !important;
          border: 0 !important;
          border-bottom: 1px solid #e7e6ef !important;
          color: #46445c !important;
          vertical-align: top;
        }
        tr:nth-child(even) td { background: #fafaff !important; }
        tr:last-child td { border-bottom: 0 !important; }
        img {
          max-width: 100%;
          height: auto;
          border-radius: 10px;
        }
        body > img:not([src*="close" i]):not([src*="redx" i]) {
          width: 76px;
          height: 76px;
          margin: 0 16px 12px 0;
          float: left;
          object-fit: cover;
          box-shadow: 0 4px 14px rgba(41, 39, 80, .14);
        }
        img[src*="close" i],
        img[src*="redx" i],
        img[alt*="close" i],
        img[title*="close" i] { display: none !important; }
        input, button, select, textarea {
          min-height: 38px;
          padding: 7px 11px;
          border: 1px solid #cfcede;
          border-radius: 9px;
          background: #fff;
          color: #292750;
          font: inherit;
        }
        button, input[type="button"], input[type="submit"] {
          cursor: pointer;
          background: #292750;
          color: #fff;
          font-weight: 750;
        }
        b, strong { color: #292750; }
        hr { border: 0; border-top: 1px solid #e3e2ec; }
        .olwlg-user-profile {
          width: min(100%, 780px);
          margin: 0 auto;
          color: #343248;
        }
        .olwlg-user-profile__hero {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 20px;
          border: 1px solid #deddea;
          border-radius: 16px;
          background: linear-gradient(135deg, #f7f6ff, #fff);
          box-shadow: 0 8px 24px rgba(41, 39, 80, .08);
        }
        .olwlg-user-profile__avatar {
          width: 88px !important;
          height: 88px !important;
          flex: 0 0 88px;
          margin: 0 !important;
          float: none !important;
          border: 3px solid #fff;
          border-radius: 18px !important;
          object-fit: cover;
          box-shadow: 0 6px 18px rgba(41, 39, 80, .18);
        }
        .olwlg-user-profile__eyebrow {
          margin: 0 0 4px;
          color: #77748d;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: .09em;
          text-transform: uppercase;
        }
        .olwlg-user-profile h1 {
          margin: 0;
          color: #292750;
          font-size: 28px;
          line-height: 1.15;
          letter-spacing: -.025em;
        }
        .olwlg-user-profile__handle {
          display: inline-flex;
          margin-top: 7px;
          align-items: center;
          gap: 5px;
          font-size: 14px;
          text-decoration: none;
        }
        .olwlg-user-profile__stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin: 16px 0;
        }
        .olwlg-user-profile__stat {
          display: grid;
          gap: 4px;
          padding: 15px 16px;
          border: 1px solid #deddea;
          border-radius: 13px;
          background: #fafaff;
        }
        .olwlg-user-profile__stat-label,
        .olwlg-user-profile__activity-label {
          color: #77748d;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .075em;
          text-transform: uppercase;
        }
        .olwlg-user-profile__stat-value {
          color: #292750 !important;
          font-size: 20px;
          font-weight: 850;
          text-decoration: none;
        }
        .olwlg-user-profile__activity {
          overflow: hidden;
          border: 1px solid #deddea;
          border-radius: 14px;
          background: #fff;
        }
        .olwlg-user-profile__activity h2 {
          margin: 0;
          padding: 14px 16px;
          border-bottom: 1px solid #e6e5ed;
          background: #f4f3fa;
          color: #292750;
          font-size: 14px;
        }
        .olwlg-user-profile__activity-row {
          display: grid;
          grid-template-columns: minmax(150px, .7fr) minmax(0, 1.3fr);
          gap: 18px;
          align-items: center;
          padding: 13px 16px;
          border-bottom: 1px solid #ecebf2;
        }
        .olwlg-user-profile__activity-row:last-child { border-bottom: 0; }
        .olwlg-user-profile__activity-value {
          color: #343248;
          font-size: 15px;
          font-weight: 750;
          overflow-wrap: anywhere;
        }
        .olwlg-user-profile__activity-value a { font-weight: 800; }
        .olwlg-price-history {
          width: 100%;
          margin: 0 auto;
        }
        .olwlg-price-history__sections {
          display: grid;
          gap: 14px;
          margin: 18px 0;
        }
        .olwlg-price-history__section {
          overflow: hidden;
          border: 1px solid #d9d8e7;
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 5px 18px rgba(41, 39, 80, .07);
        }
        .olwlg-price-history__section-summary {
          position: relative;
          display: flex;
          min-height: 58px;
          align-items: center;
          padding: 14px 52px 14px 18px;
          border-radius: 14px;
          cursor: pointer;
          list-style: none;
          background: #f4f3fa;
          color: #292750;
          font-size: 16px;
          font-weight: 850;
          user-select: none;
        }
        .olwlg-price-history__section-summary::-webkit-details-marker {
          display: none;
        }
        .olwlg-price-history__section-summary::after {
          position: absolute;
          top: 50%;
          right: 18px;
          width: 10px;
          height: 10px;
          border-right: 2px solid #5c5877;
          border-bottom: 2px solid #5c5877;
          content: "";
          rotate: 45deg;
          translate: 0 -70%;
          transition: rotate 140ms ease;
        }
        .olwlg-price-history__section[open]
          > .olwlg-price-history__section-summary {
          border-bottom: 1px solid #deddea;
          border-radius: 14px 14px 0 0;
          background: #eeedf7;
        }
        .olwlg-price-history__section[open] { overflow: visible; }
        .olwlg-price-history__section[open]
          > .olwlg-price-history__section-summary::after {
          rotate: 225deg;
          translate: 0 0;
        }
        .olwlg-price-history__section-panel {
          padding: 16px;
          border-radius: 0 0 14px 14px;
          background: #fff;
        }
        .olwlg-price-history__marketplace-heading {
          margin: 0 0 14px;
          color: #292750;
          font-size: 15px;
          font-weight: 800;
        }
        .olwlg-price-history__section-loading {
          margin: 0;
          padding: 22px 18px;
          color: #6f6c84;
          font-weight: 700;
        }
        .olwlg-price-history__filters {
          display: grid;
          grid-template-columns: repeat(4, minmax(135px, 1fr)) auto;
          gap: 10px;
          align-items: end;
          margin: 0 0 16px;
          padding: 14px;
          border: 1px solid #deddea;
          border-radius: 14px;
          background: #f8f8fc;
        }
        .olwlg-price-history__filter {
          display: grid;
          gap: 5px;
          min-width: 0;
        }
        .olwlg-price-history__filter > span {
          color: #6f6c84;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .07em;
          text-transform: uppercase;
        }
        .olwlg-price-history__filter select,
        .olwlg-price-history__filter input {
          width: 100%;
          min-width: 0;
          background: #fff;
        }
        .olwlg-price-history__clear {
          min-width: 108px;
          white-space: nowrap;
        }
        .olwlg-price-history__summary {
          grid-column: 1 / -1;
          margin: 0;
          color: #6f6c84;
          font-size: 12px;
          font-weight: 700;
        }
        table.olwlg-price-history__table {
          table-layout: fixed !important;
        }
        .olwlg-price-history__table th.olwlg-price-history__sortable {
          cursor: pointer;
          user-select: none;
        }
        .olwlg-price-history__table
          th.olwlg-price-history__sortable::after {
          display: inline-grid;
          width: 22px;
          height: 22px;
          margin-left: 7px;
          place-items: center;
          border-radius: 6px;
          background: #deddf0;
          color: #555179;
          content: "↕";
          font-family: ui-sans-serif, system-ui, sans-serif;
          font-size: 13px;
          font-weight: 900;
          line-height: 1;
          vertical-align: middle;
        }
        .olwlg-price-history__table
          th.olwlg-price-history__sortable[data-olwlg-sort="asc"]::after {
          background: #292750;
          color: #fff;
          content: "↑";
        }
        .olwlg-price-history__table
          th.olwlg-price-history__sortable[data-olwlg-sort="desc"]::after {
          background: #292750;
          color: #fff;
          content: "↓";
        }
        .olwlg-price-history__price {
          color: #292750 !important;
          font-size: 16px;
          font-weight: 900 !important;
          white-space: normal;
        }
        .olwlg-price-history__condition {
          color: #44415a !important;
          font-weight: 750;
        }
        .olwlg-price-history__date {
          white-space: normal;
        }
        .olwlg-price-history__notes {
          color: #555268 !important;
          font-size: 14px;
          line-height: 1.55;
        }
        .olwlg-price-history__listing-heading,
        .olwlg-price-history__listing {
          text-align: center;
        }
        .olwlg-price-history__listing-link {
          position: relative;
          display: inline-grid;
          width: 38px;
          height: 38px;
          place-items: center;
          border: 1px solid #cfcede;
          border-radius: 10px;
          background: #fff;
          box-shadow: 0 3px 9px rgba(41, 39, 80, .08);
          color: #292750 !important;
          text-decoration: none !important;
        }
        .olwlg-price-history__listing-link:hover,
        .olwlg-price-history__listing-link:focus-visible {
          border-color: #918db2;
          background: #f3f2fa;
          color: #292750 !important;
        }
        .olwlg-price-history__listing-link svg {
          width: 18px;
          height: 18px;
          pointer-events: none;
        }
        .olwlg-price-history__listing-link::after {
          position: absolute;
          z-index: 6;
          top: 50%;
          right: calc(100% + 8px);
          width: max-content;
          max-width: 220px;
          padding: 7px 9px;
          border-radius: 7px;
          background: #292750;
          box-shadow: 0 6px 16px rgba(41, 39, 80, .18);
          color: #fff;
          content: attr(data-tooltip);
          font-size: 11px;
          font-weight: 750;
          line-height: 1.25;
          opacity: 0;
          pointer-events: none;
          translate: 3px -50%;
          transition: opacity 120ms ease, translate 120ms ease;
          white-space: nowrap;
        }
        .olwlg-price-history__listing-link:hover::after,
        .olwlg-price-history__listing-link:focus-visible::after {
          opacity: 1;
          translate: 0 -50%;
        }
        .olwlg-price-history__listing-empty {
          color: #9693a7;
          font-weight: 750;
        }
        .olwlg-price-history__empty {
          padding: 30px !important;
          color: #77748d !important;
          font-weight: 750;
          text-align: center;
        }
        select.olwlg-custom-select__native {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          min-height: 0 !important;
          padding: 0 !important;
          pointer-events: none;
          opacity: 0;
          clip-path: inset(50%);
        }
        .olwlg-custom-select {
          position: relative;
          min-width: 0;
        }
        button.olwlg-custom-select__trigger {
          position: relative;
          display: flex;
          width: 100%;
          min-height: 38px;
          align-items: center;
          padding: 7px 32px 7px 10px;
          border: 1px solid #cfcede;
          border-radius: 9px;
          background: #fff;
          box-shadow: none;
          color: #292750;
          font-weight: 750;
          text-align: left;
        }
        button.olwlg-custom-select__trigger::after {
          position: absolute;
          top: 50%;
          right: 12px;
          width: 8px;
          height: 8px;
          border-right: 1.5px solid currentColor;
          border-bottom: 1.5px solid currentColor;
          content: "";
          rotate: 45deg;
          translate: 0 -70%;
        }
        .olwlg-custom-select.is-open
          button.olwlg-custom-select__trigger {
          border-color: #7773bd;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, .12);
        }
        .olwlg-custom-select.is-open
          button.olwlg-custom-select__trigger::after {
          rotate: 225deg;
          translate: 0 0;
        }
        .olwlg-custom-select__panel {
          position: absolute;
          z-index: 20;
          top: calc(100% + 6px);
          left: 0;
          width: max(100%, 230px);
          padding: 8px;
          border: 1px solid #d7d6e4;
          border-radius: 11px;
          background: #fff;
          box-shadow: 0 14px 34px rgba(26, 24, 57, .18);
        }
        .olwlg-custom-select__panel[hidden] { display: none !important; }
        input.olwlg-custom-select__search {
          width: 100%;
          min-height: 36px;
          margin: 0 0 6px;
          background: #f8f8fc;
        }
        .olwlg-custom-select__options {
          display: grid;
          max-height: 230px;
          gap: 2px;
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        button.olwlg-custom-select__option {
          position: relative;
          width: 100%;
          min-height: 34px;
          padding: 7px 9px 7px 29px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          box-shadow: none;
          color: #45425c;
          font-weight: 700;
          text-align: left;
        }
        button.olwlg-custom-select__option:hover,
        button.olwlg-custom-select__option:focus-visible {
          background: #f0eff8;
          color: #292750;
        }
        button.olwlg-custom-select__option[aria-selected="true"] {
          background: #e9e8f5;
          color: #292750;
          font-weight: 850;
        }
        button.olwlg-custom-select__option[aria-selected="true"]::before {
          position: absolute;
          left: 9px;
          content: "✓";
        }
        .olwlg-custom-select__empty {
          margin: 0;
          padding: 14px 8px;
          color: #77748d;
          font-size: 12px;
          font-weight: 700;
          text-align: center;
        }
        img[src$="/x.gif" i],
        img[src*="delete" i] { display: none !important; }
        @media (max-width: 600px) {
          body { padding: 16px !important; }
          .olwlg-user-profile__hero { align-items: flex-start; padding: 16px; }
          .olwlg-user-profile__avatar {
            width: 64px !important;
            height: 64px !important;
            flex-basis: 64px;
          }
          .olwlg-user-profile h1 { font-size: 22px; }
          .olwlg-user-profile__stats { grid-template-columns: 1fr; }
          .olwlg-user-profile__activity-row {
            grid-template-columns: 1fr;
            gap: 4px;
          }
          .olwlg-price-history__filters {
            grid-template-columns: 1fr 1fr;
          }
          .olwlg-price-history__clear { width: 100%; }
        }
      `;
      document.head.append(style);
    }
    document.body.classList.add("olwlg-embedded-content");
    return true;
  } catch {
    return false;
  }
}

function enhanceCatalogUserInformation(frame: HTMLIFrameElement) {
  try {
    const document = frame.contentDocument;
    const body = document?.body;
    if (!document || !body) return false;
    if (body.querySelector(".olwlg-user-profile")) return true;

    const lines = (body.innerText || body.textContent || "")
      .split(/\n+/)
      .map((line) => normalizedText(line))
      .filter(Boolean);
    const combined = normalizedText(lines.join(" "));
    if (!/\bbgg registered\s*:|\btrade rating\s*:/i.test(combined))
      return false;

    const labels = [
      "BGG Registered",
      "Name",
      "BGG",
      "Trade rating",
      "Country",
      "Number of items in this math trade",
      "Number of math trades",
      "First math trade",
    ];
    const valueFor = (label: string) => {
      const lineValue = lines
        .find((line) =>
          line.toLocaleLowerCase().startsWith(`${label.toLocaleLowerCase()}:`),
        )
        ?.slice(label.length + 1)
        .trim();
      if (lineValue) return lineValue;
      const followingLabels = labels
        .filter((candidate) => candidate !== label)
        .map((candidate) =>
          candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        )
        .join("|");
      return combined.match(
        new RegExp(
          `${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*(.*?)(?=\\s+(?:${followingLabels})\\s*:|$)`,
          "i",
        ),
      )?.[1]?.trim();
    };
    const linkFor = (value: string | undefined) => {
      if (!value) return undefined;
      const normalizedValue = normalizedText(value).toLocaleLowerCase();
      return [...body.querySelectorAll<HTMLAnchorElement>("a")].find((link) => {
        const linkText = normalizedText(link.textContent).toLocaleLowerCase();
        return linkText === normalizedValue ||
          normalizedValue.startsWith(linkText) ||
          linkText.startsWith(normalizedValue);
      });
    };
    const linkedValue = (value: string | undefined) => {
      const sourceLink = linkFor(value);
      if (!sourceLink) {
        const text = document.createElement("span");
        text.textContent = value || "—";
        return text;
      }
      const link = document.createElement("a");
      link.href = sourceLink.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = value || normalizedText(sourceLink.textContent);
      return link;
    };

    const images = [...body.querySelectorAll<HTMLImageElement>("img")];
    const avatarSource = images
      .filter(
        (image) =>
          !/close|redx|cancel|(?:^|\/)x\.(?:gif|png)/i.test(image.src) &&
          !/close|cancel/i.test(`${image.alt} ${image.title}`),
      )
      .sort((left, right) => {
        const leftArea =
          (left.naturalWidth || left.width) * (left.naturalHeight || left.height);
        const rightArea =
          (right.naturalWidth || right.width) *
          (right.naturalHeight || right.height);
        return rightArea - leftArea;
      })[0];

    const profile = document.createElement("main");
    const hero = document.createElement("header");
    const identity = document.createElement("div");
    const eyebrow = document.createElement("p");
    const name = document.createElement("h1");
    const stats = document.createElement("section");
    const activity = document.createElement("section");
    profile.className = "olwlg-user-profile";
    hero.className = "olwlg-user-profile__hero";
    identity.className = "olwlg-user-profile__identity";
    eyebrow.className = "olwlg-user-profile__eyebrow";
    stats.className = "olwlg-user-profile__stats";
    activity.className = "olwlg-user-profile__activity";
    eyebrow.textContent = "BoardGameGeek trader";
    name.textContent = valueFor("Name") || valueFor("BGG") || "Trader";

    if (avatarSource) {
      const avatar = document.createElement("img");
      avatar.className = "olwlg-user-profile__avatar";
      avatar.src = avatarSource.src;
      avatar.alt = `${name.textContent} avatar`;
      hero.append(avatar);
    }
    identity.append(eyebrow, name);
    const bggName = valueFor("BGG");
    if (bggName) {
      const handle = linkedValue(bggName);
      handle.classList.add("olwlg-user-profile__handle");
      handle.textContent = `@${bggName}`;
      identity.append(handle);
    }
    hero.append(identity);

    const addStat = (label: string, value: string | undefined) => {
      const item = document.createElement("div");
      const itemLabel = document.createElement("span");
      const itemValue = linkedValue(value);
      item.className = "olwlg-user-profile__stat";
      itemLabel.className = "olwlg-user-profile__stat-label";
      itemValue.classList.add("olwlg-user-profile__stat-value");
      itemLabel.textContent = label;
      item.append(itemLabel, itemValue);
      stats.append(item);
    };
    addStat("Trade rating", valueFor("Trade rating"));
    addStat("BGG member since", valueFor("BGG Registered"));
    addStat("Country", valueFor("Country"));

    const activityTitle = document.createElement("h2");
    activityTitle.textContent = "Trade activity";
    activity.append(activityTitle);
    const addActivity = (label: string, value: string | undefined) => {
      const row = document.createElement("div");
      const rowLabel = document.createElement("span");
      const rowValue = document.createElement("div");
      row.className = "olwlg-user-profile__activity-row";
      rowLabel.className = "olwlg-user-profile__activity-label";
      rowValue.className = "olwlg-user-profile__activity-value";
      rowLabel.textContent = label;
      rowValue.append(linkedValue(value));
      row.append(rowLabel, rowValue);
      activity.append(row);
    };
    addActivity(
      "Items in this math trade",
      valueFor("Number of items in this math trade"),
    );
    addActivity("Math trades", valueFor("Number of math trades"));
    addActivity("First math trade", valueFor("First math trade"));

    profile.append(hero, stats, activity);
    body.replaceChildren(profile);
    return true;
  } catch {
    return false;
  }
}

function enhanceCatalogPriceHistory(frame: HTMLIFrameElement) {
  try {
    const document = frame.contentDocument;
    const body = document?.body;
    if (!document || !body) return false;
    if (body.querySelector(".olwlg-price-history__filters")) return true;

    const table = [...body.querySelectorAll<HTMLTableElement>("table")].find(
      (candidate) => {
        const headings = [...candidate.rows[0]?.cells ?? []].map((cell) =>
          normalizedText(cell.textContent).toLocaleLowerCase(),
        );
        return (
          headings.includes("price") &&
          headings.some((heading) => /^cond(?:ition)?$/.test(heading)) &&
          headings.includes("listed") &&
          headings.includes("sold")
        );
      },
    );
    if (!table || table.rows.length < 2) return false;

    const headerCells = [...table.rows[0].cells];
    const headingIndex = (pattern: RegExp) =>
      headerCells.findIndex((cell) =>
        pattern.test(normalizedText(cell.textContent).toLocaleLowerCase()),
      );
    const priceIndex = headingIndex(/^price$/);
    const conditionIndex = headingIndex(/^cond(?:ition)?$/);
    const listedIndex = headingIndex(/^listed$/);
    const soldIndex = headingIndex(/^sold$/);
    const notesIndex = headingIndex(/^notes?$/);
    if (
      priceIndex < 0 ||
      conditionIndex < 0 ||
      listedIndex < 0 ||
      soldIndex < 0
    )
      return false;

    body.classList.add("olwlg-price-history");
    table.classList.add("olwlg-price-history__table");
    table.querySelector("colgroup")?.remove();
    const columnGroup = document.createElement("colgroup");
    const widths = headerCells.map((_, index) =>
      index === priceIndex
        ? "13%"
        : index === conditionIndex
          ? "17%"
          : index === listedIndex || index === soldIndex
            ? "15%"
            : index === notesIndex
              ? "40%"
              : `${100 / headerCells.length}%`,
    );
    widths.forEach((width) => {
      const column = document.createElement("col");
      column.style.width = width;
      columnGroup.append(column);
    });
    table.prepend(columnGroup);

    let activeSort: HTMLTableCellElement | undefined;
    let sortDirection: "asc" | "desc" = "asc";
    headerCells.forEach((cell) => {
      cell.classList.add("olwlg-price-history__sortable");
      cell.tabIndex = 0;
      cell.setAttribute("role", "button");
      cell.setAttribute(
        "aria-label",
        `Sort by ${normalizedText(cell.textContent)}`,
      );
      cell.addEventListener("click", () => {
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
      });
      cell.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        cell.click();
      });
    });

    const formatCondition = (value: string) => {
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
    };
    const currencyFor = (value: string) => {
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
    };
    const dateFor = (value: string) => {
      const parsed = Date.parse(normalizedText(value));
      if (!Number.isFinite(parsed)) return "";
      const date = new Date(parsed);
      return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");
    };

    const rows = [...table.rows].slice(1).filter((row) => row.cells.length > 1);
    const currencies = new Set<string>();
    const conditions = new Set<string>();
    rows.forEach((row) => {
      const priceCell = row.cells[priceIndex];
      const conditionCell = row.cells[conditionIndex];
      const listedCell = row.cells[listedIndex];
      const soldCell = row.cells[soldIndex];
      const notesCell = notesIndex >= 0 ? row.cells[notesIndex] : undefined;
      const currency = currencyFor(priceCell?.textContent ?? "");
      const condition = formatCondition(conditionCell?.textContent ?? "");
      row.dataset.olwlgCurrency = currency;
      row.dataset.olwlgCondition = condition;
      row.dataset.olwlgDate =
        dateFor(soldCell?.textContent ?? "") ||
        dateFor(listedCell?.textContent ?? "");
      currencies.add(currency);
      if (condition) conditions.add(condition);
      priceCell?.classList.add("olwlg-price-history__price");
      conditionCell?.classList.add("olwlg-price-history__condition");
      if (conditionCell) conditionCell.textContent = condition;
      listedCell?.classList.add("olwlg-price-history__date");
      soldCell?.classList.add("olwlg-price-history__date");
      notesCell?.classList.add("olwlg-price-history__notes");
    });

    const filters = document.createElement("section");
    const currency = document.createElement("select");
    const condition = document.createElement("select");
    const startDate = document.createElement("input");
    const endDate = document.createElement("input");
    const clear = document.createElement("button");
    const summary = document.createElement("p");
    filters.className = "olwlg-price-history__filters";
    filters.setAttribute("aria-label", "Price history filters");
    currency.innerHTML = '<option value="">All currencies</option>';
    condition.innerHTML = '<option value="">All conditions</option>';
    [...currencies].sort().forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      currency.append(option);
    });
    [...conditions].sort().forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      condition.append(option);
    });
    startDate.type = "date";
    endDate.type = "date";
    clear.type = "button";
    clear.className = "olwlg-price-history__clear";
    clear.textContent = "Clear filters";
    summary.className = "olwlg-price-history__summary";
    summary.setAttribute("aria-live", "polite");
    const filterControl = (
      labelText: string,
      control: HTMLElement,
    ) => {
      const label = document.createElement("label");
      const text = document.createElement("span");
      label.className = "olwlg-price-history__filter";
      text.textContent = labelText;
      label.append(text, control);
      return label;
    };
    filters.append(
      filterControl("Currency", currency),
      filterControl("Condition", condition),
      filterControl("Start sold date", startDate),
      filterControl("End sold date", endDate),
      clear,
      summary,
    );
    table.insertAdjacentElement("beforebegin", filters);

    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyRow.hidden = true;
    emptyRow.className = "olwlg-price-history__empty-row";
    emptyCell.className = "olwlg-price-history__empty";
    emptyCell.colSpan = headerCells.length;
    emptyCell.textContent = "No price records match these filters.";
    emptyRow.append(emptyCell);
    table.tBodies[0]?.append(emptyRow);

    const render = () => {
      let visible = 0;
      rows.forEach((row) => {
        const rowDate = row.dataset.olwlgDate ?? "";
        const matches =
          (!currency.value ||
            row.dataset.olwlgCurrency === currency.value) &&
          (!condition.value ||
            row.dataset.olwlgCondition === condition.value) &&
          (!startDate.value || (rowDate && rowDate >= startDate.value)) &&
          (!endDate.value || (rowDate && rowDate <= endDate.value));
        row.hidden = !matches;
        if (matches) visible += 1;
      });
      emptyRow.hidden = visible > 0;
      summary.textContent =
        `${visible} of ${rows.length} price records displayed`;
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
      render();
    });
    render();

    const firstTable = table;
    body.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
      const context = normalizedText(
        `${image.src} ${image.alt} ${image.title} ${image.getAttribute("onclick")}`,
      );
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      const appearsBeforeTable = Boolean(
        image.compareDocumentPosition(firstTable) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      );
      if (
        /close|cancel|redx|hide(?:game)?desc|\/x\.(?:gif|png)/i.test(
          context,
        ) ||
        (appearsBeforeTable && width > 0 && height > 0 && width <= 56 && height <= 56)
      )
        image.closest("a, button")?.remove() ?? image.remove();
    });
    return true;
  } catch {
    return false;
  }
}

type MarketplaceSectionKind = "sold" | "active";

function marketplaceCondition(value: string) {
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

function marketplaceCurrency(value: string) {
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

function marketplaceDate(value: string) {
  const parsed = Date.parse(normalizedText(value));
  if (!Number.isFinite(parsed)) return "";
  const date = new Date(parsed);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function marketplaceTables(root: ParentNode) {
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

function marketplaceTableKind(
  table: HTMLTableElement,
): MarketplaceSectionKind {
  const headings = [...table.rows[0]?.cells ?? []].map((cell) =>
    normalizedText(cell.textContent).toLocaleLowerCase(),
  );
  return headings.some((heading) => /^sold$/.test(heading))
    ? "sold"
    : "active";
}

function removeLegacyMarketplaceHeadings(root: ParentNode) {
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

function createMarketplaceSection(
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
      const action = document.createElement("a");
      action.className = "olwlg-price-history__listing-link";
      action.href = listingLink.href;
      action.target = "_blank";
      action.rel = "noopener noreferrer";
      action.setAttribute("aria-label", "View BGG marketplace listing");
      action.dataset.tooltip = "View BGG marketplace listing";
      action.title = "View BGG marketplace listing";
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
  const currency = document.createElement("select");
  const condition = document.createElement("select");
  const startDate = document.createElement("input");
  const endDate = document.createElement("input");
  const clear = document.createElement("button");
  const resultSummary = document.createElement("p");
  filters.className = "olwlg-price-history__filters";
  filters.setAttribute(
    "aria-label",
    `${kind === "sold" ? "Sold" : "Active"} listing filters`,
  );
  currency.innerHTML = '<option value="">All currencies</option>';
  condition.innerHTML = '<option value="">All conditions</option>';
  [...currencies].sort().forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    currency.append(option);
  });
  [...conditions].sort().forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    condition.append(option);
  });
  startDate.type = "date";
  endDate.type = "date";
  clear.type = "button";
  clear.className = "olwlg-price-history__clear";
  clear.textContent = "Clear filters";
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

function enhanceCatalogMarketplaceSections(frame: HTMLIFrameElement) {
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

function catalogSourceIframe(source: HTMLElement) {
  return source instanceof HTMLIFrameElement
    ? source
    : source.querySelector<HTMLIFrameElement>("iframe");
}

function removeLegacyCatalogCloseControls(source: HTMLElement) {
  source
    .querySelectorAll<HTMLElement>("img, input, button, a")
    .forEach((control) => {
      const image =
        control instanceof HTMLImageElement
          ? control
          : control.querySelector<HTMLImageElement>("img");
      const filename = image ? imageFilename(image) ?? "" : "";
      const context = normalizedText(
        `${filename} ${control.textContent} ${control.title} ${control.getAttribute("alt")} ${control.getAttribute("value")} ${control.getAttribute("onclick")} ${image?.alt} ${image?.title}`,
      );
      if (
        /(?:^|[^a-z])(?:close|cancel|redx)(?:[^a-z]|$)|^x\.(?:gif|png|jpe?g|webp)$|hide(?:game)?desc/i.test(
          context,
        )
      )
        control.remove();
    });
}

function watchCatalogIframe(source: HTMLElement, title: string) {
  const modal = document.querySelector<HTMLElement>(".olwlg-catalog-modal");
  const body = modal?.querySelector<HTMLElement>(".olwlg-catalog-modal__body");
  const frame = catalogSourceIframe(source);
  if (!body || !frame) return;

  body
    .querySelector(".olwlg-catalog-modal__frame-loader")
    ?.remove();
  const loader = document.createElement("div");
  const spinner = document.createElement("span");
  const label = document.createElement("span");
  loader.className = "olwlg-catalog-modal__frame-loader";
  loader.setAttribute("role", "status");
  spinner.className = "olwlg-catalog-spinner";
  spinner.setAttribute("aria-hidden", "true");
  label.textContent = `Loading ${title.toLocaleLowerCase()}…`;
  loader.append(spinner, label);
  body.classList.add("olwlg-catalog-modal__body--frame-loading");
  body.append(loader);

  let finished = false;
  let timeout: number | undefined;
  const finish = (force = false) => {
    if (finished) return;
    const styled = styleCatalogIframe(frame);
    const contentReady =
      title === "User information"
        ? enhanceCatalogUserInformation(frame)
        : title === "Price history"
          ? enhanceCatalogMarketplaceSections(frame)
          : true;
    if (!force && (!styled || !contentReady)) return;
    finished = true;
    if (timeout !== undefined) window.clearTimeout(timeout);
    if (!body.contains(source)) {
      loader.remove();
      return;
    }
    body.classList.remove("olwlg-catalog-modal__body--frame-loading");
    loader.remove();
  };
  frame.addEventListener("load", () => {
    if (!finished) {
      finish();
      return;
    }
    styleCatalogIframe(frame);
    if (title === "User information")
      enhanceCatalogUserInformation(frame);
    else if (title === "Price history")
      enhanceCatalogMarketplaceSections(frame);
  });

  window.setTimeout(() => {
    try {
      if (
        frame.contentDocument?.readyState === "complete" &&
        normalizedText(frame.contentDocument.body?.textContent).length > 0
      )
        finish();
    } catch {
      // Cross-origin frames can only be styled by their source page.
    }
  }, 80);
  timeout = window.setTimeout(() => finish(true), 12_000);
}

function openCatalogToolModal(
  tool: HTMLElement,
  title: string,
  fallback?: HTMLElement,
) {
  const sourceBeforeClick = legacyCatalogToolSource(tool);
  const sourceUrl = catalogToolUrl(tool);
  const loading = document.createElement("div");
  const loadingSpinner = document.createElement("span");
  const loadingLabel = document.createElement("span");
  loading.className = "olwlg-catalog-modal__loading";
  loadingSpinner.className = "olwlg-catalog-spinner";
  loadingSpinner.setAttribute("aria-hidden", "true");
  loadingLabel.textContent = `Loading ${title.toLocaleLowerCase()}…`;
  loading.setAttribute("role", "status");
  loading.append(loadingSpinner, loadingLabel);
  openCatalogModal(title, loading);

  const inlineAction =
    (tool.matches("[onclick]") ? tool : undefined) ??
    tool.querySelector<HTMLElement>("[onclick]") ??
    tool.closest<HTMLElement>("[onclick]");
  const anchor =
    tool instanceof HTMLAnchorElement ? tool : tool.closest("a");
  const hasJavascriptLink = /^javascript:/i.test(
    anchor?.getAttribute("href")?.trim() ?? "",
  );
  const hasNativeHandler =
    Boolean(inlineAction) ||
    hasJavascriptLink ||
    Boolean(catalogToolTarget(tool));

  if (hasNativeHandler) {
    try {
      (inlineAction ?? tool).click();
    } catch {
      // The fallback below still gives the user useful information.
    }
  }

  window.setTimeout(() => {
    const source = hasNativeHandler
      ? legacyCatalogToolSource(tool) ?? sourceBeforeClick
      : undefined;
    if (source) {
      source.classList.add("olwlg-catalog-legacy-source");
      removeLegacyCatalogCloseControls(source);
      openCatalogModal(title, source, true);
      watchCatalogIframe(source, title);
      return;
    }
    if (sourceUrl) {
      const frame = catalogToolFrame(tool, sourceUrl);
      openCatalogModal(title, frame);
      watchCatalogIframe(frame, title);
      return;
    }
    if (!hasNativeHandler) {
      try {
        tool.click();
      } catch {
        // The fallback modal is already open.
      }
    }
    openCatalogModal(
      title,
      fallback ??
        Object.assign(document.createElement("p"), {
          textContent: "This information could not be loaded.",
        }),
    );
  }, 0);
}

function cloneCatalogTool(tool: HTMLElement) {
  const labelText = toolLabel(tool);
  if (!labelText) return undefined;

  const image =
    tool instanceof HTMLImageElement
      ? tool
      : tool.querySelector<HTMLImageElement>("img");
  const userInformation = normalizedText(
    `${labelText} ${tool.textContent} ${tool.title} ${image?.alt} ${image?.title} ${tool.getAttribute("onclick")} ${tool.querySelector<HTMLElement>("[onclick]")?.getAttribute("onclick")} ${tool.parentElement?.textContent} ${tool.parentElement?.getAttribute("title")}`,
  );
  const isUserInformation =
    /trade\s*rating\s*:|registered\s*:|country\s*:|gamedesc|showuserinfo/i.test(
      userInformation,
    );
  const bggHistoryUrl =
    labelText === "Price history" ? bggPriceHistoryUrl(tool) : undefined;
  const usesModal =
    isUserInformation || (labelText === "Price history" && !bggHistoryUrl);
  const control =
    tool instanceof HTMLAnchorElement && !usesModal
      ? cloneElement(tool)
      : document.createElement("button");
  if (control instanceof HTMLButtonElement) {
    control.type = "button";
    if (image) control.append(image.cloneNode(true));
  }
  const label = document.createElement("span");
  removeCloneIds(control);
  control.className = "olwlg-item-card__tool";
  control.removeAttribute("onclick");
  control.removeAttribute("style");
  control.querySelectorAll<HTMLElement>("*").forEach((element) => {
    element.removeAttribute("style");
    [...element.attributes].forEach((attribute) => {
      if (/^on/i.test(attribute.name)) element.removeAttribute(attribute.name);
    });
  });
  if (usesModal) control.dataset.olwlgModalTool = "true";
  if (bggHistoryUrl && control instanceof HTMLAnchorElement) {
    control.href = bggHistoryUrl;
    control.target = "_blank";
    control.rel = "noopener noreferrer";
    control.setAttribute("aria-label", "Open BGG price history");
    control.title = "Open the dedicated price-history page on BoardGameGeek";
  }
  label.className = "olwlg-item-card__tool-label";
  label.textContent = bggHistoryUrl ? "BGG price history" : labelText;
  control.append(label);
  control.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (isUserInformation) {
      const nativeRow = tool.closest<HTMLTableRowElement>("tr");
      openCatalogToolModal(
        tool,
        "User information",
        catalogUserInformation(
          tool,
          userInformation,
          nativeRow ? participantFromRow(nativeRow) : undefined,
          nativeRow ? participantUrlFromRow(nativeRow) : undefined,
        ),
      );
      return;
    }
    if (bggHistoryUrl) {
      window.open(bggHistoryUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (labelText === "Price history") {
      openCatalogToolModal(tool, "Price history");
      return;
    }
    if (tool instanceof HTMLAnchorElement) {
      const href = tool.getAttribute("href") ?? "";
      if (href && !/^javascript:/i.test(href) && href !== "#") {
        window.open(tool.href, tool.target || "_blank", "noopener");
        return;
      }
    }
    tool.click();
  }, { capture: true });
  return control;
}

function syncCatalogCardActions(
  row: CatalogRow,
  primaryStack: HTMLElement,
) {
  if (row.element.dataset.olwlgOwnOffer === "true") {
    primaryStack
      .querySelectorAll<HTMLElement>(
        ".olwlg-catalog-primary-action, .olwlg-catalog-add-action",
      )
      .forEach((control) => control.remove());
    ensureCatalogOwnItemIndicator(primaryStack);
    return;
  }
  if (catalogIsReadOnly()) {
    primaryStack
      .querySelectorAll<HTMLElement>(
        ".olwlg-catalog-primary-action, .olwlg-catalog-add-action",
      )
      .forEach((control) => control.remove());
    return;
  }
  if (row.element.dataset.olwlgAdded === "true") {
    primaryStack
      .querySelectorAll<HTMLElement>(
        ".olwlg-catalog-primary-action, .olwlg-catalog-add-action",
      )
      .forEach((control) => control.remove());
    return;
  }

  const indexCell = row.element.cells[0];
  if (!indexCell) return;
  const attribution = primaryStack.querySelector(
    ".olwlg-item-card__attribution",
  );
  const mountAction = (control: HTMLElement) => {
    if (attribution) attribution.before(control);
    else primaryStack.append(control);
  };

  if (!primaryStack.querySelector(".olwlg-catalog-primary-action")) {
    let primary = indexCell.querySelector<HTMLElement>(
      "button.olwlg-catalog-primary-action",
    );
    const nativeWantControl = catalogWantControl(row.element);
    if (!primary) {
      if (nativeWantControl)
        createCatalogAction(nativeWantControl, "add", indexCell);
      else {
        const panel = catalogWantPanelForRow(row.element);
        if (panel) createCatalogPanelAction(panel, indexCell);
      }
      primary = indexCell.querySelector<HTMLElement>(
        "button.olwlg-catalog-primary-action",
      );
    }
    if (primary) {
      const source = primary;
      const clone = cloneElement(source);
      clone.addEventListener("click", (event) => {
        event.preventDefault();
        source.click();
      });
      mountAction(clone);
    }
  }

  if (!primaryStack.querySelector(".olwlg-catalog-add-action")) {
    let offerAction = indexCell.querySelector<HTMLElement>(
      ".olwlg-catalog-add-action",
    );
    const nativeDirectWantControl = catalogDirectWantControl(row.element);
    if (!offerAction && nativeDirectWantControl) {
      createCatalogOfferAction(nativeDirectWantControl, indexCell);
      offerAction = indexCell.querySelector<HTMLElement>(
        ".olwlg-catalog-add-action",
      );
    }
    if (offerAction) {
      const source = offerAction;
      const clone = cloneElement(source);
      clone.classList.add("olwlg-item-card__offer-action");
      clone.addEventListener("click", (event) => {
        event.preventDefault();
        showAddedFeedback(clone, "Add to list");
        source.click();
      });
      mountAction(clone);
    }
  }
}

function createCatalogCards(rows: CatalogRow[]) {
  const grid = document.createElement("section");
  grid.className = "olwlg-item-grid";
  grid.setAttribute("aria-label", "Math trade item cards");

  const hydrationQueue: Array<() => void> = [];
  let hydrationIdleCallback = 0;
  const flushHydrationQueue = (deadline: IdleDeadline) => {
    hydrationIdleCallback = 0;
    while (
      hydrationQueue.length &&
      (deadline.timeRemaining() > 4 || deadline.didTimeout)
    )
      hydrationQueue.shift()?.();
    if (hydrationQueue.length)
      hydrationIdleCallback = requestIdleCallback(flushHydrationQueue, {
        timeout: 250,
      });
  };
  const scheduleHydration = (hydrate: () => void) => {
    hydrationQueue.push(hydrate);
    if (!hydrationIdleCallback)
      hydrationIdleCallback = requestIdleCallback(flushHydrationQueue, {
        timeout: 250,
      });
  };
  const hydrationObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        hydrationObserver.unobserve(entry.target);
        const card = entry.target as HTMLElement;
        const hydrate = cardHydrators.get(card);
        if (hydrate) scheduleHydration(hydrate);
      });
    },
    { rootMargin: "900px 0px" },
  );
  const cardHydrators = new WeakMap<HTMLElement, () => void>();

  rows.forEach((row, rowIndex) => {
    const gameCell = row.element.cells[1];
    const indexCell = row.element.cells[0];
    const card = document.createElement("article");
    const content = document.createElement("div");
    const header = document.createElement("header");
    const body = document.createElement("div");
    const footer = document.createElement("footer");

    card.className = `olwlg-item-card olwlg-item-card--${row.itemType}`;
    if (row.element.dataset.olwlgAdded === "true")
      card.classList.add("olwlg-item-card--added");
    card.dataset.olwlgRowNumber = row.element.dataset.olwlgRowNumber ?? "";
    content.className = "olwlg-item-card__content";
    header.className = "olwlg-item-card__header";
    body.className = "olwlg-item-card__body";
    footer.className = "olwlg-item-card__footer";

    const bggLink = catalogBggLink(gameCell);

    const identity = document.createElement("div");
    identity.className = "olwlg-item-card__identity";
    const number = document.createElement("span");
    const titleLine = document.createElement("div");
    const title = document.createElement("a");
    const participant = row.participantUrl
      ? document.createElement("a")
      : document.createElement("span");
    number.className = "olwlg-item-card__number";
    number.textContent = `GL #${row.glNumber}`;
    titleLine.className = "olwlg-item-card__title-line";
    title.className = "olwlg-item-card__title";
    title.href = bggLink ?? "#";
    title.target = bggLink ? "_blank" : "";
    title.rel = bggLink ? "noreferrer" : "";
    title.textContent = row.gameTitle;
    titleLine.append(title);
    const statusBadges = document.createElement("div");
    statusBadges.className = "olwlg-item-card__status-badges";
    row.collectionStatuses.forEach((status) => {
      const badge = document.createElement("span");
      badge.className = "olwlg-item-card__status-badge";
      badge.textContent = status.label;
      badge.title = `Collection status: ${status.label}`;
      badge.setAttribute("aria-label", `Collection status: ${status.label}`);
      badge.style.setProperty("--olwlg-status-color", status.color);
      statusBadges.append(badge);
    });
    participant.className = "olwlg-item-card__participant";
    participant.textContent = `Offered by ${row.participant}`;
    if (participant instanceof HTMLAnchorElement) {
      participant.href = row.participantUrl ?? "#";
      participant.target = "_blank";
      participant.rel = "noreferrer";
    }
    identity.append(number, titleLine, participant);
    if (statusBadges.childElementCount) identity.append(statusBadges);
    const stats = document.createElement("div");
    stats.className = "olwlg-item-card__stats";
    stats.append(
      catalogStat("Rank", row.rank),
      catalogStat("Rating", row.rating),
      catalogStat("Bay", row.bayRating),
    );
    header.append(identity, stats);
    const hasAnyStat =
      row.rank !== undefined ||
      row.rating !== undefined ||
      row.bayRating !== undefined;

    const hydrateBody = () => {
      if (body.dataset.olwlgHydrated === "true") return;
      body.dataset.olwlgHydrated = "true";
      body.classList.remove("olwlg-item-card__body--deferred");
      body.removeAttribute("aria-busy");
      if (!gameCell) return;
      const tools = catalogTools(gameCell);
      const toolSection = document.createElement("section");
      const toolHeading = document.createElement("strong");
      const toolRow = document.createElement("div");
      toolSection.className = "olwlg-item-card__tool-section";
      toolHeading.className = "olwlg-item-card__tool-heading";
      toolHeading.textContent = "Game tools";
      toolRow.className = "olwlg-item-card__tools";
      const renderedTools = new Set<string>();
      let hasUserInformation = false;
      tools.forEach((tool) => {
        const identity = catalogToolIdentity(tool);
        if (renderedTools.has(identity)) return;
        const control = cloneCatalogTool(tool);
        if (control) {
          renderedTools.add(identity);
          hasUserInformation ||= toolLabel(tool) === "User information";
          toolRow.append(control);
        }
      });
      if (!hasUserInformation)
        toolRow.append(createCatalogUserInformationControl(row, gameCell));
      if (toolRow.childElementCount) {
        toolSection.append(toolHeading, toolRow);
        body.append(toolSection);
      }

      const info = catalogSection(
        gameCell,
        ".olwlg-catalog-metadata",
        "olwlg-item-card__info",
      );
      const version = catalogSection(
        gameCell,
        ".olwlg-catalog-version",
        "olwlg-item-card__version",
      );
      const description = catalogDescription(gameCell);
      if (info) body.append(info);
      if (version) body.append(version);
      if (description) {
        const descriptionTitle = document.createElement("strong");
        descriptionTitle.className = "olwlg-item-card__description-heading";
        descriptionTitle.textContent = "Item description";
        description.prepend(descriptionTitle);
        body.append(description);
        window.requestAnimationFrame(() => {
          if (description.scrollHeight <= description.clientHeight + 4)
            return;
          description.classList.add(
            "olwlg-item-card__description--collapsed",
          );
          const toggle = document.createElement("button");
          toggle.type = "button";
          toggle.className = "olwlg-item-card__description-toggle";
          toggle.textContent = "Show more";
          toggle.addEventListener("click", () => {
            const collapsed = description.classList.toggle(
              "olwlg-item-card__description--collapsed",
            );
            toggle.textContent = collapsed ? "Show more" : "Show less";
          });
          description.after(toggle);
        });
      }
      card.classList.toggle(
        "olwlg-item-card--incomplete",
        !hasAnyStat || !description,
      );
      body.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
        image.loading = "lazy";
        image.decoding = "async";
      });
    };
    if (gameCell) {
      if (rowIndex < 3) hydrateBody();
      else {
        body.classList.add("olwlg-item-card__body--deferred");
        body.setAttribute("aria-busy", "true");
        cardHydrators.set(card, hydrateBody);
        hydrationObserver.observe(card);
      }
    } else {
      body.dataset.olwlgHydrated = "true";
    }

    const primaryStack = document.createElement("div");
    primaryStack.className = "olwlg-item-card__primary-stack";
    const listingStack = document.createElement("div");
    listingStack.className = "olwlg-item-card__listing-stack";
    const details = document.createElement("button");
    details.type = "button";
    details.className = "olwlg-item-card__details";
    details.textContent = "View details";
    details.setAttribute("aria-label", `View details for ${row.gameTitle}`);
    details.addEventListener("click", () => {
      hydrateBody();
      const detailContent = cloneElement(body);
      detailContent.className = "olwlg-catalog-item-details";
      detailContent
        .querySelectorAll<HTMLElement>(
          ".olwlg-item-card__description--collapsed",
        )
        .forEach((description) =>
          description.classList.remove(
            "olwlg-item-card__description--collapsed",
          )
        );
      detailContent
        .querySelectorAll<HTMLElement>(
          ".olwlg-item-card__description-toggle",
        )
        .forEach((toggle) => toggle.remove());
      const sourceButtons = [
        ...body.querySelectorAll<HTMLButtonElement>(
          "button:not(.olwlg-item-card__description-toggle)",
        ),
      ];
      detailContent
        .querySelectorAll<HTMLButtonElement>("button")
        .forEach((button, index) => {
          const source = sourceButtons[index];
          if (!source) return;
          button.addEventListener("click", (event) => {
            event.preventDefault();
            source.click();
          });
        });
      openCatalogModal(row.gameTitle, detailContent);
    });
    const attribution = document.createElement("a");
    attribution.className = "olwlg-item-card__attribution";
    attribution.href = "https://boardgamegeek.com/";
    attribution.target = "_blank";
    attribution.rel = "noreferrer";
    attribution.textContent = "Powered by BoardGameGeek";
    syncCatalogCardActions(row, primaryStack);

    const listingLink = indexCell
      ? [...indexCell.querySelectorAll<HTMLAnchorElement>("a")].find((link) =>
          /boardgamegeek\.com/i.test(link.href),
        )
      : undefined;
    if (listingLink) {
      const clone = cloneElement(listingLink) as HTMLAnchorElement;
      const label = document.createElement("span");
      clone.classList.add("olwlg-item-card__listing");
      clone.setAttribute("aria-label", "Open original BGG listing");
      label.textContent = "BGG listing";
      clone.append(label);
      listingStack.append(clone);
    }
    listingStack.prepend(details);
    listingStack.append(attribution);
    footer.append(primaryStack, listingStack);

    content.append(header, body, footer);
    card.append(content);
    grid.append(card);
    row.card = card;
  });

  return grid;
}

function sortCatalogCards(
  rows: CatalogRow[],
  grid: HTMLElement,
  sortBy: string,
) {
  const sorted = [...rows].sort((left, right) => {
    if (sortBy === "title")
      return left.gameTitle.localeCompare(right.gameTitle, undefined, {
        sensitivity: "base",
      });
    if (sortBy === "rank")
      return (left.rank ?? Number.MAX_SAFE_INTEGER) -
        (right.rank ?? Number.MAX_SAFE_INTEGER);
    if (sortBy === "rating")
      return (right.rating ?? -1) - (left.rating ?? -1);
    if (sortBy === "bay")
      return (right.bayRating ?? -1) - (left.bayRating ?? -1);

    const leftNumber = Number.parseInt(left.glNumber, 10);
    const rightNumber = Number.parseInt(right.glNumber, 10);
    return (Number.isFinite(leftNumber) ? leftNumber : 0) -
      (Number.isFinite(rightNumber) ? rightNumber : 0);
  });
  sorted.forEach((row) => {
    if (row.card) grid.append(row.card);
  });
}

let customSelectId = 0;
const customSelectSync = new WeakMap<HTMLSelectElement, () => void>();
const customSelectDocuments = new WeakSet<Document>();

function closeCustomSelects(
  document: Document,
  except?: HTMLElement,
) {
  document
    .querySelectorAll<HTMLElement>(".olwlg-custom-select.is-open")
    .forEach((customSelect) => {
      if (customSelect === except) return;
      customSelect.classList.remove("is-open");
      customSelect
        .querySelector<HTMLElement>(".olwlg-custom-select__panel")
        ?.setAttribute("hidden", "");
      customSelect
        .querySelector<HTMLElement>(".olwlg-custom-select__trigger")
        ?.setAttribute("aria-expanded", "false");
    });
}

function enhanceSearchableSelect(select: HTMLSelectElement) {
  if (customSelectSync.has(select)) {
    customSelectSync.get(select)?.();
    return;
  }

  const document = select.ownerDocument;
  const view = document.defaultView;
  const wrapper = document.createElement("div");
  const trigger = document.createElement("button");
  const triggerLabel = document.createElement("span");
  const panel = document.createElement("div");
  const search = document.createElement("input");
  const options = document.createElement("div");
  const selectId = `olwlg-custom-select-${++customSelectId}`;
  const fieldLabel = normalizedText(
    select
      .closest("label")
      ?.querySelector<HTMLElement>(":scope > span")
      ?.textContent,
  ) || "options";

  wrapper.className = "olwlg-custom-select";
  trigger.className = "olwlg-custom-select__trigger";
  trigger.type = "button";
  trigger.setAttribute("role", "combobox");
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-controls", `${selectId}-options`);
  trigger.setAttribute("aria-expanded", "false");
  triggerLabel.className = "olwlg-custom-select__value";
  panel.className = "olwlg-custom-select__panel";
  panel.id = `${selectId}-panel`;
  panel.hidden = true;
  search.className = "olwlg-custom-select__search";
  search.type = "search";
  search.autocomplete = "off";
  search.placeholder = `Search ${fieldLabel.toLocaleLowerCase()}…`;
  search.setAttribute("aria-label", `Search ${fieldLabel}`);
  options.className = "olwlg-custom-select__options";
  options.id = `${selectId}-options`;
  options.setAttribute("role", "listbox");
  trigger.append(triggerLabel);
  panel.append(search, options);
  wrapper.append(trigger, panel);
  select.classList.add("olwlg-custom-select__native");
  select.insertAdjacentElement("afterend", wrapper);

  const renderOptions = () => {
    const query = normalizedText(search.value).toLocaleLowerCase();
    options.replaceChildren();
    const matchingOptions = [...select.options].filter((option) =>
      normalizedText(option.textContent).toLocaleLowerCase().includes(query)
    );
    matchingOptions.forEach((option) => {
      const control = document.createElement("button");
      control.className = "olwlg-custom-select__option";
      control.type = "button";
      control.setAttribute("role", "option");
      control.setAttribute(
        "aria-selected",
        option.value === select.value ? "true" : "false",
      );
      control.disabled = option.disabled;
      control.textContent = option.textContent;
      control.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        select.value = option.value;
        select.dispatchEvent(
          new (view?.Event ?? Event)("change", { bubbles: true }),
        );
        closeCustomSelects(document);
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
    triggerLabel.textContent =
      selected?.textContent || "Select an option";
    trigger.disabled =
      select.disabled || select.options.length <= 1;
    renderOptions();
  };
  const open = () => {
    if (trigger.disabled) return;
    closeCustomSelects(document, wrapper);
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
      closeCustomSelects(document);
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
      closeCustomSelects(document);
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
    closeCustomSelects(document);
    trigger.focus();
  });
  select.addEventListener("change", sync);
  customSelectSync.set(select, sync);
  sync();

  if (!customSelectDocuments.has(document)) {
    customSelectDocuments.add(document);
    document.addEventListener("pointerdown", (event) => {
      const target = event.target;
      if (!view || !(target instanceof view.Node)) return;
      const openSelect = document.querySelector<HTMLElement>(
        ".olwlg-custom-select.is-open",
      );
      if (openSelect && !openSelect.contains(target))
        closeCustomSelects(document);
    });
  }
}

function syncSearchableSelects(root: ParentNode) {
  root.querySelectorAll<HTMLSelectElement>("select").forEach((select) => {
    customSelectSync.get(select)?.();
  });
}

type CatalogListMode = "full" | "new" | "wants";

const CATALOG_LIST_MODE_LABELS: Record<CatalogListMode, string> = {
  full: "Full list",
  new: "New items",
  wants: "My wants",
};

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

function configureCatalogCardView(toolbar: HTMLElement, grid: HTMLElement) {
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

function catalogListId() {
  return new URL(location.href).searchParams.get("listid");
}

function catalogTradeStateStorageKey(listId: string) {
  return `olwlg-trade-state-${listId}`;
}

function rememberCatalogTradeState(listId: string, state: TradeState) {
  try {
    localStorage.setItem(
      catalogTradeStateStorageKey(listId),
      state === "ended" ? "ended" : "active",
    );
  } catch {
    // State inference still works when storage is unavailable.
  }
}

function rememberedCatalogTradeState() {
  const listId = catalogListId();
  if (!listId) return undefined;
  try {
    return localStorage.getItem(catalogTradeStateStorageKey(listId)) ??
      undefined;
  } catch {
    return undefined;
  }
}

function fullCatalogUrl() {
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
        normalizedText(link.parentElement?.textContent),
      ),
    );
  }
  if (mode === "wants") {
    return links.find((link) =>
      /one more pass viewing only items that are on your wish\/want\/etc lists/i.test(
        normalizedText(link.parentElement?.textContent),
      ),
    );
  }
  return undefined;
}

function activeCatalogMode(): CatalogListMode {
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
          normalizedText(message.textContent),
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

function rememberCatalogModeUrls() {
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

function addCatalogModeSwitch(toolbar: HTMLElement) {
  const heading = toolbar.querySelector<HTMLElement>(
    ".olwlg-catalog-toolbar__heading",
  );
  if (!heading) return;

  const switcher = document.createElement("nav");
  switcher.className = "olwlg-catalog-mode-switch";
  switcher.setAttribute("aria-label", "Catalog list mode");
  const currentMode = activeCatalogMode();

  (["full", "new", "wants"] as const).forEach(
    (mode) => {
      const href = catalogModeUrl(mode);
      const control = document.createElement(href ? "a" : "span");
      control.className = "olwlg-catalog-mode-switch__option olwlg-tooltip-target";
      control.dataset.olwlgCatalogMode = mode;
      control.textContent = CATALOG_LIST_MODE_LABELS[mode];
      control.dataset.olwlgTooltip =
        mode === "full"
          ? "View every item in this math trade."
          : mode === "new"
            ? "View items added since your previous visit."
            : "View only items on your wish and want lists.";
      control.setAttribute("aria-current", mode === currentMode ? "page" : "false");
      if (href && control instanceof HTMLAnchorElement) {
        control.href = href;
        control.target = "_self";
      } else {
        control.classList.add("is-unavailable");
        control.setAttribute("aria-disabled", "true");
      }
      switcher.append(control);
    },
  );
  if (
    !switcher.querySelector('[data-olwlg-catalog-mode="wants"]')
  ) {
    const wants = document.createElement("a");
    wants.className =
      "olwlg-catalog-mode-switch__option olwlg-tooltip-target";
    wants.dataset.olwlgCatalogMode = "wants";
    wants.textContent = CATALOG_LIST_MODE_LABELS.wants;
    wants.href = wantsCatalogUrl() ?? location.href;
    wants.target = "_self";
    wants.dataset.olwlgTooltip =
      "View only items on your wish and want lists.";
    wants.setAttribute(
      "aria-current",
      currentMode === "wants" ? "page" : "false",
    );
    switcher.append(wants);
  }
  heading.append(switcher);
}

function restoreNewItemsNotice(toolbar: HTMLElement) {
  const notice = [...document.querySelectorAll<HTMLElement>(".olwlg-message--info")]
    .find((message) =>
      /you are only viewing new items added since you last viewed/i.test(
        normalizedText(message.textContent),
      ),
    );
  if (!notice) return;
  notice.classList.add("olwlg-catalog-new-items-note");
  toolbar.prepend(notice);
}

function createCatalogToolbar(
  rows: CatalogRow[],
  wrapper: HTMLDivElement,
  grid: HTMLElement,
) {
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
          <button class="olwlg-catalog-view-switch__option" type="button"
            data-olwlg-catalog-view="list" aria-pressed="true">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M8 6h13M8 12h13M8 18h13"></path>
              <path d="M3 6h.01M3 12h.01M3 18h.01"></path>
            </svg>
            <span>Detailed List</span>
          </button>
          <button class="olwlg-catalog-view-switch__option" type="button"
            data-olwlg-catalog-view="grid" aria-pressed="false">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none"
              stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1"></rect>
              <rect x="14" y="3" width="7" height="7" rx="1"></rect>
              <rect x="3" y="14" width="7" height="7" rx="1"></rect>
              <rect x="14" y="14" width="7" height="7" rx="1"></rect>
            </svg>
            <span>Compact Grid</span>
          </button>
        </div>
      </div>
      <button class="olwlg-catalog-filter-collapse olwlg-tooltip-target" type="button"
        aria-label="Minimize item filters" aria-expanded="true"
        data-olwlg-tooltip="Minimize item filters">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round">
          <path d="M4 6h16"></path>
          <path d="M7 12h10"></path>
          <path d="M10 18h4"></path>
        </svg>
        <span>Minimize filters</span>
      </button>
    </div>
    <details class="olwlg-catalog-filters" open>
      <summary class="olwlg-catalog-filters__summary">
        <span>Filters</span>
      </summary>
      <div class="olwlg-catalog-controls">
      <label class="olwlg-catalog-search">
        <span>Search items</span>
        <input type="search" placeholder="Game, description, or participant…" autocomplete="off">
      </label>
      <label class="olwlg-catalog-participant">
        <span>Participant</span>
        <select>
          <option value="">All participants</option>
        </select>
      </label>
      <label>
        <span>Item type</span>
        <select class="olwlg-catalog-type">
          <option value="">All item types</option>
          <option value="game">Board games</option>
          <option value="money">Money</option>
          <option value="other">Other alternative items</option>
        </select>
      </label>
      <fieldset class="olwlg-catalog-money olwlg-control-unavailable">
        <legend>Money range</legend>
        <input class="olwlg-money-min" type="number" min="0" step="any" inputmode="decimal" placeholder="Min">
        <span>to</span>
        <input class="olwlg-money-max" type="number" min="0" step="any" inputmode="decimal" placeholder="Max">
      </fieldset>
      <label>
        <span>BGG rank</span>
        <select class="olwlg-catalog-rank">
          <option value="">Any rank</option>
          <option value="100">Top 100</option>
          <option value="500">Top 500</option>
          <option value="1000">Top 1,000</option>
          <option value="ranked">All ranked games</option>
          <option value="unranked">Unranked</option>
        </select>
      </label>
      <label class="olwlg-catalog-collection-label">
        <span>Collection status</span>
        <select class="olwlg-catalog-collection">
          <option value="">Any collection status</option>
        </select>
      </label>
      <label>
        <span>Sort cards</span>
        <select class="olwlg-catalog-sort">
          <option value="gl">GL number</option>
          <option value="title">Game title</option>
          <option value="rank">BGG rank</option>
          <option value="rating">Rating (high first)</option>
          <option value="bay">Bay rating (high first)</option>
        </select>
      </label>
      <button class="olwlg-catalog-clear" type="button" disabled>
        Clear filters
      </button>
      </div>
    </details>
    <div class="olwlg-catalog-loader" role="status">
      <span class="olwlg-catalog-spinner" aria-hidden="true"></span>
      <span>Updating items…</span>
    </div>
  `;

  restoreNewItemsNotice(toolbar);
  addCatalogModeSwitch(toolbar);
  configureCatalogCardView(toolbar, grid);

  const collapseFilters = toolbar.querySelector<HTMLButtonElement>(
    ".olwlg-catalog-filter-collapse",
  );
  const filterDock = document.createElement("button");
  filterDock.className =
    "olwlg-catalog-filter-dock olwlg-tooltip-target";
  filterDock.type = "button";
  filterDock.hidden = true;
  filterDock.setAttribute("aria-label", "Show item filters");
  filterDock.dataset.olwlgTooltip = "Show item filters";
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

  const emptyState = document.createElement("div");
  emptyState.className = "olwlg-catalog-empty";
  emptyState.hidden = true;
  emptyState.innerHTML =
    "<strong>No matching items</strong><span>Try a broader search or clear the participant filter.</span>";
  wrapper.insertAdjacentElement("afterend", emptyState);

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
    let visible = 0;

    for (const row of rows) {
      const matchesSearch =
        !query ||
        row.searchText.includes(query) ||
        row.compactSearchText.includes(compactQuery);
      const matchesParticipant =
        !selectedParticipant ||
        row.participant.toLocaleLowerCase() === selectedParticipant;
      const matchesType = !selectedType || row.itemType === selectedType;
      const matchesMoney =
        selectedType !== "money" ||
        (row.moneyAmount !== undefined &&
          (minimumMoney === undefined || row.moneyAmount >= minimumMoney) &&
          (maximumMoney === undefined || row.moneyAmount <= maximumMoney));
      const matchesCollection =
        !selectedCollection ||
        row.collectionTags.some(
          (tag) => tag.toLocaleLowerCase() === selectedCollection,
        );
      const matchesRank =
        !selectedRank ||
        (selectedRank === "ranked" && row.rank !== undefined) ||
        (selectedRank === "unranked" && row.rank === undefined) ||
        (/^\d+$/.test(selectedRank) &&
          row.rank !== undefined &&
          row.rank <= Number(selectedRank));
      const hidden = !(
        matchesSearch &&
        matchesParticipant &&
        matchesType &&
        matchesMoney &&
        matchesCollection &&
        matchesRank
      );
      row.element.hidden = hidden;
      if (row.card) row.card.hidden = hidden;
      if (!hidden) visible += 1;
    }

    const participantLabel =
      participants.length === 1 ? "participant" : "participants";
    count.textContent = `${visible} of ${rows.length} items · ${participants.length} ${participantLabel}`;
    emptyState.hidden = visible !== 0;
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
    sortCatalogCards(rows, grid, sort.value);
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
    sortCatalogCards(rows, grid, sort.value);
    syncSearchableSelects(toolbar);
    render();
    search.focus();
  });

  toolbar.querySelectorAll<HTMLSelectElement>("select").forEach(
    enhanceSearchableSelect,
  );
  wrapper.insertAdjacentElement("beforebegin", toolbar);
  render();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      loader.hidden = true;
    });
  });
  return toolbar;
}

const CATALOG_DAY_MS = 86_400_000;

type CatalogDeadlineKind = "submission" | "offer";
type CatalogCountdownKind = CatalogDeadlineKind | "ended";

function buildCatalogCountdown(
  captionText: string,
  deadline: number,
  kind: CatalogCountdownKind = "submission",
) {
  const countdown = document.createElement("aside");
  const units = document.createElement("div");
  const caption = document.createElement("span");
  countdown.className = "olwlg-catalog-countdown";
  if (kind !== "submission")
    countdown.classList.add(`olwlg-catalog-countdown--${kind}`);
  units.className = "olwlg-catalog-countdown__units";
  caption.className = "olwlg-catalog-countdown__caption";
  countdown.setAttribute("role", "timer");
  countdown.setAttribute("aria-live", "polite");
  const deadlineLabel = kind === "offer"
    ? "Offer deadline"
    : kind === "ended"
      ? "Trade ended"
      : "Submission deadline";
  countdown.title = `${deadlineLabel}: ${new Date(deadline).toLocaleString()}`;
  caption.textContent = captionText;

  const unitEntries = (["days", "hrs", "min", "sec"] as const).map((name) => {
    const unit = document.createElement("div");
    const value = document.createElement("strong");
    const label = document.createElement("span");
    unit.className = "olwlg-catalog-countdown__unit";
    label.textContent = name;
    unit.append(value, label);
    return { unit, value };
  });
  units.append(...unitEntries.map((entry) => entry.unit));
  countdown.append(units, caption);

  const update = () => {
    const remaining = Math.max(0, deadline - Date.now());
    const days = Math.floor(remaining / CATALOG_DAY_MS);
    const hours = Math.floor((remaining % CATALOG_DAY_MS) / 3_600_000);
    const minutes = Math.floor((remaining % 3_600_000) / 60_000);
    const seconds = Math.floor((remaining % 60_000) / 1000);
    unitEntries[0].value.textContent = String(days);
    unitEntries[1].value.textContent = String(hours).padStart(2, "0");
    unitEntries[2].value.textContent = String(minutes).padStart(2, "0");
    unitEntries[3].value.textContent = String(seconds).padStart(2, "0");
    countdown.classList.toggle(
      "olwlg-catalog-countdown--urgent",
      remaining > 0 && remaining <= CATALOG_DAY_MS,
    );
    countdown.classList.toggle(
      "olwlg-catalog-countdown--critical",
      remaining > 0 && remaining <= 3_600_000,
    );
  };

  return { countdown, update };
}

function parseCatalogDeadlineValue(value: string | null | undefined) {
  const raw = normalizedText(value);
  if (!raw) return undefined;

  if (/^\d{10,13}$/.test(raw)) {
    const numeric = Number(raw);
    const timestamp = raw.length <= 10 ? numeric * 1000 : numeric;
    return Number.isFinite(timestamp) ? timestamp : undefined;
  }
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function exactCatalogDeadline(
  kind: CatalogDeadlineKind,
  roots: ParentNode[] = [document],
) {
  const now = Date.now();
  const latestPlausibleDeadline = now + 366 * CATALOG_DAY_MS;
  const selector = [
    "[data-deadline]",
    "[data-submission-deadline]",
    "[data-wants-deadline]",
    "[data-offer-deadline]",
    "[data-items-deadline]",
    "time[datetime]",
    "[id*='deadline' i]",
    "[class*='deadline' i]",
  ].join(",");
  const candidates = roots.flatMap((root) => [
    ...root.querySelectorAll<HTMLElement>(selector),
  ]);

  for (const candidate of candidates) {
    const context = normalizedText(
      candidate.closest<HTMLElement>("p, aside, div, section, td")
        ?.textContent ?? candidate.textContent,
    );
    const isMatchingDeadline = kind === "submission"
      ? /(?:submit|submission|re-?submit).{0,80}wants?|wants?.{0,80}deadline/i
          .test(context) ||
        candidate.hasAttribute("data-wants-deadline") ||
        candidate.hasAttribute("data-submission-deadline")
      : /(?:offer|add).{0,80}(?:games?|items?)|(?:games?|items?).{0,80}(?:offer|add).{0,40}deadline/i
          .test(context) ||
        candidate.hasAttribute("data-offer-deadline") ||
        candidate.hasAttribute("data-items-deadline");
    if (!isMatchingDeadline) continue;

    const values = [
      kind === "offer"
        ? candidate.getAttribute("data-offer-deadline")
        : candidate.getAttribute("data-wants-deadline"),
      kind === "offer"
        ? candidate.getAttribute("data-items-deadline")
        : candidate.getAttribute("data-submission-deadline"),
      candidate.getAttribute("data-wants-deadline"),
      candidate.getAttribute("data-submission-deadline"),
      candidate.getAttribute("data-offer-deadline"),
      candidate.getAttribute("data-items-deadline"),
      candidate.getAttribute("data-deadline"),
      candidate.getAttribute("datetime"),
      candidate.getAttribute("data-timestamp"),
      candidate.getAttribute("title"),
      candidate.getAttribute("value"),
    ];
    for (const value of values) {
      const timestamp = parseCatalogDeadlineValue(value);
      if (
        timestamp !== undefined &&
        timestamp >= now - 5 * 60_000 &&
        timestamp <= latestPlausibleDeadline
      )
        return timestamp;
    }
  }
  return undefined;
}

function exactCatalogSubmissionDeadline(
  roots: ParentNode[] = [document],
) {
  return exactCatalogDeadline("submission", roots);
}

function exactCatalogOfferDeadline(roots: ParentNode[] = [document]) {
  return exactCatalogDeadline("offer", roots);
}

function stableCatalogDeadline(
  kind: CatalogDeadlineKind,
  remainingText: string,
  remainingUnit: string,
  exactDeadline: number | undefined,
) {
  const listId = catalogListId() ?? "unknown";
  const storageKey = `olwlg-${kind}-deadline-${listId}`;
  const now = Date.now();
  const remaining = Number.parseFloat(remainingText);
  const unitMilliseconds = /^hours?/i.test(remainingUnit)
    ? 3_600_000
    : /^minutes?/i.test(remainingUnit)
      ? 60_000
      : CATALOG_DAY_MS;
  const estimatedDeadline = now + remaining * unitMilliseconds;
  const decimalPlaces = remainingText.split(".")[1]?.length ?? 0;
  const displayedStep = 10 ** -decimalPlaces * unitMilliseconds;
  const reconciliationWindow = Math.max(
    displayedStep * 1.5,
    5 * 60_000,
  );

  let storedDeadline: number | undefined;
  try {
    const stored = JSON.parse(
      localStorage.getItem(storageKey) ?? "null",
    ) as { deadline?: unknown } | null;
    if (
      stored &&
      typeof stored.deadline === "number" &&
      Number.isFinite(stored.deadline)
    )
      storedDeadline = stored.deadline;
  } catch {
    // Storage can be unavailable in restricted browsing contexts.
  }

  const deadline =
    exactDeadline ??
    (storedDeadline !== undefined &&
        Math.abs(storedDeadline - estimatedDeadline) <= reconciliationWindow
      ? storedDeadline
      : estimatedDeadline);
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        deadline,
        source: exactDeadline ? "page" : "remaining-days",
        updatedAt: now,
      }),
    );
  } catch {
    // The live countdown still works without persistence.
  }
  return deadline;
}

function stableCatalogSubmissionDeadline(
  remainingText: string,
  remainingUnit: string,
  exactDeadline = exactCatalogSubmissionDeadline(),
) {
  return stableCatalogDeadline(
    "submission",
    remainingText,
    remainingUnit,
    exactDeadline,
  );
}

function stableCatalogOfferDeadline(
  remainingText: string,
  remainingUnit: string,
  exactDeadline = exactCatalogOfferDeadline(),
) {
  return stableCatalogDeadline(
    "offer",
    remainingText,
    remainingUnit,
    exactDeadline,
  );
}

function removeCatalogDeadlineMessage(
  roots: ParentNode[],
  pattern: RegExp,
) {
  roots.forEach((root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const matches: Text[] = [];
    while (walker.nextNode()) {
      const textNode = walker.currentNode as Text;
      if (pattern.test(textNode.data)) matches.push(textNode);
    }
    matches.forEach((textNode) => {
      const parent = textNode.parentElement;
      textNode.data = textNode.data.replace(pattern, "");
      if (parent && !normalizedText(parent.textContent)) {
        removeEmptyCatalogFooterAncestors(parent);
      }
    });
  });
}

function catalogFooterTextRow(
  pattern: RegExp,
  className: string,
) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let matchNode: Text | undefined;
  let matchText = "";

  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text;
    if (textNode.parentElement?.closest(".olwlg-catalog-page-footer")) continue;
    const match = textNode.data.match(pattern);
    if (!match) continue;
    matchNode = textNode;
    matchText = normalizedText(match[0]);
    break;
  }
  if (!matchNode || !matchText) return undefined;

  const oldParent = matchNode.parentElement;
  matchNode.data = matchNode.data.replace(pattern, "");
  const row = document.createElement("p");
  row.className = `olwlg-catalog-diagnostics__row ${className}`;
  row.append(document.createTextNode(matchText));

  let emptyAncestor = oldParent;
  while (
    emptyAncestor &&
    emptyAncestor !== document.body &&
    !normalizedText(emptyAncestor.textContent) &&
    !emptyAncestor.querySelector("img, input, button, details")
  ) {
    const parent = emptyAncestor.parentElement;
    emptyAncestor.remove();
    emptyAncestor = parent;
  }
  return row;
}

function removeEmptyCatalogFooterAncestors(
  element: HTMLElement | null,
) {
  let current = element;
  while (
    current &&
    current !== document.body &&
    !normalizedText(current.textContent) &&
    !current.querySelector("img, input, button, details")
  ) {
    const parent = current.parentElement;
    current.remove();
    current = parent;
  }
}

function removeCatalogEditWantsPrompt() {
  document
    .querySelectorAll<HTMLElement>(
      ".olwlg-wants-cta, a[href*='mywants'], a[href*='step4']",
    )
    .forEach((control) => {
      if (
        control.closest(
          "#navbar, .olwlg-item-card, .olwlg-catalog-info-card",
        )
      )
        return;
      const container = control.closest<HTMLElement>("p, center, div");
      const emptyAncestor = container?.parentElement ?? control.parentElement;
      control.remove();
      if (
        container &&
        /^to edit your wants(?:\s*\.{3})?$/i.test(
          normalizedText(container.textContent),
        )
      )
        container.remove();
      removeEmptyCatalogFooterAncestors(emptyAncestor);
    });

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const prompts: Text[] = [];
  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text;
    if (
      textNode.parentElement?.closest(
        "#navbar, .olwlg-item-card, .olwlg-catalog-info-card",
      )
    )
      continue;
    if (/^to edit your wants(?:\s*\.{3})?$/i.test(normalizedText(textNode.data)))
      prompts.push(textNode);
  }
  prompts.forEach((textNode) => {
    const parent = textNode.parentElement;
    const emptyAncestor = parent?.parentElement ?? null;
    if (
      parent &&
      /^to edit your wants(?:\s*\.{3})?$/i.test(
        normalizedText(parent.textContent),
      )
    )
      parent.remove();
    else textNode.remove();
    removeEmptyCatalogFooterAncestors(emptyAncestor);
  });
}

function removeCatalogDisplayedCount() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const counters: Text[] = [];
  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text;
    if (/^\d+\s+items?\s+displayed$/i.test(normalizedText(textNode.data)))
      counters.push(textNode);
  }
  counters.forEach((textNode) => {
    const parent = textNode.parentElement;
    const previous = textNode.previousSibling;
    const next = textNode.nextSibling;
    if (previous instanceof HTMLBRElement) previous.remove();
    if (next instanceof HTMLBRElement) next.remove();
    if (
      parent &&
      /^\d+\s+items?\s+displayed$/i.test(normalizedText(parent.textContent)) &&
      !parent.querySelector(
        ".olwlg-item-grid, .olwlg-catalog-toolbar, .olwlg-catalog-info-card",
      )
    ) {
      const emptyAncestor = parent.parentElement;
      parent.remove();
      removeEmptyCatalogFooterAncestors(emptyAncestor);
    } else {
      textNode.remove();
    }
  });
}

function organizeCatalogPageFooter() {
  if (document.querySelector(".olwlg-catalog-page-footer")) return;

  removeCatalogDisplayedCount();
  removeCatalogEditWantsPrompt();
  const summaries = [
    ...document.querySelectorAll<HTMLElement>("details > summary"),
  ];
  const completionSummary = summaries.find((summary) =>
    /after you (?:are )?done with this step/i.test(
      normalizedText(summary.textContent),
    ),
  );
  const activeThreadsSummary = summaries.find((summary) =>
    /active (?:olwlg|bgg) threads/i.test(normalizedText(summary.textContent)),
  );
  const completion = completionSummary?.closest<HTMLDetailsElement>("details");
  const activeThreads =
    activeThreadsSummary?.closest<HTMLDetailsElement>("details");

  if (completion) completion.classList.add("olwlg-catalog-completion");
  if (activeThreads && activeThreadsSummary) {
    activeThreads.classList.add("olwlg-active-threads");
    activeThreadsSummary.textContent = "Active BGG Threads";
  }

  const diagnostics = document.createElement("aside");
  diagnostics.className = "olwlg-catalog-diagnostics";
  diagnostics.setAttribute("aria-label", "Page information");
  const lastView = catalogFooterTextRow(
    /Lastview:\s*\d+/i,
    "olwlg-catalog-diagnostics__last-view",
  );
  const timestamps = catalogFooterTextRow(
    /All timestamps displayed as\s+GMT[+-]\d{4}\s*\([^)]+\)/i,
    "olwlg-catalog-diagnostics__timestamps",
  );
  const execution = catalogFooterTextRow(
    /Execution time:\s*[^.\r\n]+\.?/i,
    "olwlg-catalog-diagnostics__execution",
  );
  const timezoneLink = [...document.querySelectorAll<HTMLAnchorElement>("a")]
    .find((link) =>
      /change timezone/i.test(normalizedText(link.textContent)),
    );
  if (timestamps && timezoneLink) {
    timestamps.append(document.createTextNode(" "), timezoneLink);
  }
  [lastView, timestamps, execution].forEach((row) => {
    if (row) diagnostics.append(row);
  });

  const poweredLogo = [...document.querySelectorAll<HTMLImageElement>("img")]
    .find((image) =>
      /powered.{0,12}(?:by)?.{0,12}bgg|bgg.{0,12}powered/i.test(
        `${image.src} ${image.alt} ${image.title}`,
      ),
    );
  const powered = document.createElement("div");
  powered.className = "olwlg-catalog-powered";
  powered.setAttribute("aria-label", "Powered by BoardGameGeek");
  if (poweredLogo) {
    const linkedLogo = poweredLogo.closest<HTMLAnchorElement>("a");
    const emptyAncestor = (linkedLogo ?? poweredLogo).parentElement;
    powered.append(linkedLogo ?? poweredLogo);
    removeEmptyCatalogFooterAncestors(emptyAncestor);
  }

  const footer = document.createElement("footer");
  footer.className = "olwlg-catalog-page-footer";
  if (completion) footer.append(completion);
  if (activeThreads) footer.append(activeThreads);
  if (diagnostics.childNodes.length) footer.append(diagnostics);
  if (powered.childNodes.length) footer.append(powered);
  if (footer.childNodes.length) {
    const catalogGrid = document.querySelector(".olwlg-item-grid");
    if (catalogGrid) catalogGrid.insertAdjacentElement("afterend", footer);
    else document.body.append(footer);
    if (catalogGrid) {
      document.querySelectorAll("hr").forEach((separator) => {
        if (
          catalogGrid.compareDocumentPosition(separator) &
          Node.DOCUMENT_POSITION_FOLLOWING
        )
          separator.remove();
      });
    }
  }
}

function organizeAppPageFooter() {
  if (
    !location.pathname.startsWith("/olwlg/") ||
    document.querySelector(".olwlg-app-page-footer")
  )
    return;

  const poweredLogo = [...document.querySelectorAll<HTMLImageElement>("img")]
    .reverse()
    .find((image) => {
      const link = image.closest<HTMLAnchorElement>("a");
      return (
        /powered.{0,12}(?:by)?.{0,12}bgg|bgg.{0,12}powered/i.test(
          `${image.src} ${image.alt} ${image.title}`,
        ) ||
        Boolean(
          link &&
            /^https?:\/\/(?:www\.)?boardgamegeek\.com\/?(?:[?#].*)?$/i.test(
              link.href,
            ) &&
            /geekdo-images|pic7779581/i.test(image.src),
        )
      );
    });
  if (!poweredLogo) return;

  const poweredUnit =
    poweredLogo.closest<HTMLAnchorElement>("a") ?? poweredLogo;
  const oldParent = poweredUnit.parentElement;
  const legacyFooterDivider = [...document.querySelectorAll<HTMLHRElement>("hr")]
    .filter((divider) =>
      Boolean(
        divider.compareDocumentPosition(poweredUnit) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      )
    )
    .at(-1);
  legacyFooterDivider?.remove();
  const previousSibling = poweredUnit.previousSibling;
  const nextSibling = poweredUnit.nextSibling;
  if (
    previousSibling instanceof Text &&
    /^\s*[.·]\s*$/.test(previousSibling.data)
  )
    previousSibling.remove();
  if (nextSibling instanceof Text && /^\s*[.·]\s*$/.test(nextSibling.data))
    nextSibling.remove();
  const footer = document.createElement("footer");
  const attribution = document.createElement("div");
  footer.className = "olwlg-app-page-footer";
  footer.setAttribute("aria-label", "Application attribution");
  attribution.className = "olwlg-app-page-footer__attribution";
  attribution.append(poweredUnit);
  footer.append(attribution);
  document.body.append(footer);

  if (
    oldParent &&
    oldParent !== document.body &&
    !normalizedText(oldParent.textContent) &&
    !oldParent.querySelector("img, input, button, details")
  )
    removeEmptyCatalogFooterAncestors(oldParent);
}

function createCatalogInfoCard(toolbar: HTMLElement) {
  const container = toolbar.parentElement;
  if (!container) return;
  const readOnly = catalogIsReadOnly();

  const card = document.createElement("section");
  const header = document.createElement("header");
  const title = document.createElement("h1");
  const overview = document.createElement("div");
  const notes = document.createElement("div");
  const actions = document.createElement("div");
  card.className = "olwlg-catalog-info-card";
  header.className = "olwlg-catalog-info-card__header";
  overview.className = "olwlg-catalog-info-card__overview";
  notes.className = "olwlg-catalog-info-card__notes";
  actions.className = "olwlg-catalog-info-card__actions";

  const candidates: ChildNode[] = [];
  let node: ChildNode | null = container.firstChild;
  while (node && node !== toolbar) {
    const next: ChildNode | null = node.nextSibling;
    if (
      !(node instanceof HTMLElement) ||
      (!node.matches(
        "#navbar, #spacer, #gamedesc, #gamedescframe, script, style, link, .olwlg-catalog-modal",
      ) &&
        !node.closest("#navbar"))
    )
      candidates.push(node);
    node = next;
  }

  const mainHeading = candidates
    .flatMap((candidate) => {
      if (!(candidate instanceof HTMLElement)) return [];
      if (candidate.matches("h3")) return [candidate];
      return [...candidate.querySelectorAll<HTMLHeadingElement>("h3")];
    })
    .find(
      (candidate) =>
        !/warning|note|important/i.test(normalizedText(candidate.textContent)),
    ) as HTMLHeadingElement | undefined;
  if (mainHeading) {
    [...mainHeading.childNodes].forEach((child) => {
      title.append(child.cloneNode(true));
    });
  } else {
    title.textContent = "Math trade catalog";
  }
  mainHeading?.remove();
  header.innerHTML =
    '<div><p class="olwlg-catalog-eyebrow">Current math trade</p></div>';
  header.firstElementChild?.append(title);
  if (readOnly) {
    const eyebrow = header.querySelector<HTMLElement>(".olwlg-catalog-eyebrow");
    if (eyebrow) eyebrow.textContent = "Read-only math trade";
  }

  candidates.forEach((candidate) => {
    if (!candidate.isConnected || candidate === mainHeading) return;
    if (candidate instanceof Text) {
      const text = normalizedText(candidate.data);
      if (!text) {
        candidate.remove();
        return;
      }
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      overview.append(paragraph);
      candidate.remove();
      return;
    }

    if (!(candidate instanceof HTMLElement)) return;
    const text = normalizedText(candidate.textContent);
    const isNote =
      candidate.matches(".olwlg-message, [role='alert']") ||
      /warning|important|only viewing new items|note:/i.test(text);
    const isAction =
      candidate.matches("form, a, button") ||
      Boolean(
        candidate.querySelector(
          ".olwlg-wants-cta, input[type='button'], input[type='submit'], button",
        ),
      ) ||
      (text.length < 300 &&
        candidate.querySelectorAll("a, input[type='image']").length > 1);

    if (isNote) notes.append(candidate);
    else if (isAction) actions.append(candidate);
    else overview.append(candidate);
  });

  const editWants = [
    ...actions.querySelectorAll<HTMLElement>(
      ".olwlg-wants-cta, a[href*='mywants'], a[href*='step4']",
    ),
    ...overview.querySelectorAll<HTMLElement>(
      ".olwlg-wants-cta, a[href*='mywants'], a[href*='step4']",
    ),
    ...notes.querySelectorAll<HTMLElement>(
      ".olwlg-wants-cta, a[href*='mywants'], a[href*='step4']",
    ),
  ][0];
  if (editWants && readOnly) {
    editWants.remove();
  } else if (editWants) {
    editWants.classList.add("olwlg-catalog-action--edit-wants");
    if (!actions.contains(editWants)) actions.append(editWants);
  }
  removeCatalogEditWantsPrompt();
  const hideComments = [
    ...actions.querySelectorAll<HTMLElement>("a, button, input"),
  ].find((control) =>
    /hide comments/i.test(
      normalizedText(
        control instanceof HTMLInputElement
          ? control.value
          : control.textContent,
      ),
    ),
  );
  if (hideComments) {
    hideComments.classList.add("olwlg-catalog-action--hide-comments");
    actions.append(hideComments);
  }

  [overview, notes, actions].forEach((section) => {
    section.querySelectorAll<HTMLElement>("*").forEach((element) => {
      if (/color coding and icon guide/i.test(normalizedText(element.textContent)))
        element.closest("details")?.remove() ?? element.remove();
    });
    const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
    textNodes.forEach((textNode) => {
      if (/^[\[\]()]+$/.test(normalizedText(textNode.data)))
        textNode.remove();
    });
  });
  notes.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6").forEach(
    (heading) => {
      if (/^warning!?$/i.test(normalizedText(heading.textContent)))
        heading.remove();
    },
  );
  const submissionAlert = [
    ...notes.querySelectorAll<HTMLElement>(".olwlg-message, [role='alert']"),
  ].find((message) =>
    /submission window is open for submitting your wants but you have not yet submitted/i.test(
      normalizedText(message.textContent),
    ),
  );
  if (submissionAlert && readOnly) {
    submissionAlert.remove();
    if (!normalizedText(notes.textContent)) notes.replaceChildren();
  } else if (submissionAlert) {
    submissionAlert.classList.add("olwlg-message--submission-alert");
    submissionAlert.setAttribute("role", "alert");
    submissionAlert.setAttribute("aria-live", "assertive");
    notes.prepend(submissionAlert);
  }

  const informationRoots: ParentNode[] = [overview, notes, actions, document];
  const timingMetadata = informationRoots.flatMap((root) =>
    [...root.querySelectorAll<HTMLElement>(
      "[title], [aria-label], img[alt], input[value], [data-deadline], " +
        "[data-submission-deadline], [data-wants-deadline], " +
        "[data-offer-deadline], [data-items-deadline]",
    )].flatMap((element) => [
      element.title,
      element.getAttribute("aria-label"),
      element instanceof HTMLImageElement ? element.alt : undefined,
      element instanceof HTMLInputElement ? element.value : undefined,
      element.getAttribute("data-deadline"),
      element.getAttribute("data-submission-deadline"),
      element.getAttribute("data-wants-deadline"),
      element.getAttribute("data-offer-deadline"),
      element.getAttribute("data-items-deadline"),
    ])
  ).filter(
    (value): value is string =>
      Boolean(value) &&
      /(?:days?|hours?|minutes?)\s+(?:left|until)|deadline|trade\s+is\s+over/i
        .test(value ?? ""),
  );
  const combinedInformation = normalizedText(
    `${overview.textContent} ${notes.textContent} ${actions.textContent} ${
      timingMetadata.join(" ")
    }`,
  );
  const activeThreadsSummary = [overview, notes, actions]
    .flatMap((section) => [
      ...section.querySelectorAll<HTMLElement>("summary, h2, h3, h4"),
    ])
    .find((element) =>
      /active olwlg threads/i.test(normalizedText(element.textContent)),
    );
  const activeThreads =
    activeThreadsSummary?.closest<HTMLElement>("details") ??
    activeThreadsSummary?.parentElement;
  if (activeThreads) {
    activeThreads.classList.add("olwlg-active-threads");
    document.body.append(activeThreads);
  }
  const deadlinePattern =
    /(\d+(?:\.\d+)?)\s+(days?|hours?|minutes?)\s+left\s+to\s+((?:re-?submit|submit(?:\/re-?submit)?)\s+your\s+wants)/i;
  const deadlineMatch = combinedInformation.match(deadlinePattern);
  const offerDeadlinePattern =
    /(\d+(?:\.\d+)?)\s+(days?|hours?|minutes?)\s+left\s+to\s+((?:offer(?:\s*(?:\/|\()\s*add\s*\)?)?|add)\s+(?:games?|items?))/i;
  const offerDeadlineMatch = combinedInformation.match(offerDeadlinePattern);
  const tradeEndTimingPattern =
    /(-?\d+(?:\.\d+)?)\s+(days?|hours?|minutes?)\s+(?:left\s+)?until\s+(?:the\s+)?(?:math\s+)?trade\s+is\s+over/i;
  const tradeEndTimingMatch = combinedInformation.match(tradeEndTimingPattern);
  const exactDeadline = exactCatalogSubmissionDeadline([
    overview,
    notes,
    actions,
    document,
  ]);
  const submissionDeadline = deadlineMatch
    ? stableCatalogSubmissionDeadline(
        deadlineMatch[1],
        deadlineMatch[2],
        exactDeadline,
      )
    : undefined;
  const exactOfferDeadline = exactCatalogOfferDeadline([
    overview,
    notes,
    actions,
    document,
  ]);
  const offerDeadline = offerDeadlineMatch
    ? stableCatalogOfferDeadline(
        offerDeadlineMatch[1],
        offerDeadlineMatch[2],
        exactOfferDeadline,
      )
    : exactOfferDeadline;
  const phaseContext = normalizedText(
    `${document.title} ${title.textContent}`,
  );
  const isStep3Page =
    /want list generator\s*:\s*step\s*3|\bstep\s*3\b/i.test(phaseContext);
  const endedStateText = normalizedText(
    `${document.title} ${combinedInformation}`,
  );
  const endedStateWithoutTiming = endedStateText.replace(
    new RegExp(tradeEndTimingPattern.source, "gi"),
    "",
  );
  const hasFutureTiming =
    Number.parseFloat(deadlineMatch?.[1] ?? "0") > 0 ||
    Number.parseFloat(offerDeadlineMatch?.[1] ?? "0") > 0 ||
    Number.parseFloat(tradeEndTimingMatch?.[1] ?? "0") > 0 ||
    (exactDeadline !== undefined && exactDeadline > Date.now()) ||
    (exactOfferDeadline !== undefined && exactOfferDeadline > Date.now());
  const hasExpiredTradeTiming =
    tradeEndTimingMatch !== null &&
    Number.parseFloat(tradeEndTimingMatch[1]) <= 0;
  const hasExplicitEndedState =
    /(?:math\s+)?trade\s+(?:has\s+ended|is\s+(?:over|closed|completed|finished))|ended\s+(?:math\s+)?trade|(?:offers?|submissions?|want\s*lists?).{0,60}(?:closed|ended|no\s+longer\s+accepted)/i
      .test(endedStateWithoutTiming);
  const isEndedTrade =
    !hasFutureTiming &&
    (hasExpiredTradeTiming ||
      hasExplicitEndedState ||
      rememberedCatalogTradeState() === "ended");
  if (hasFutureTiming) {
    const listId = catalogListId();
    if (listId) rememberCatalogTradeState(listId, "active");
  }
  const isOfferPhase =
    !isEndedTrade &&
    !deadlineMatch &&
    (Boolean(offerDeadlineMatch) || isStep3Page);
  if (isEndedTrade) {
    document.body.classList.add("olwlg-catalog-read-only");
    installReadOnlyWantGuard();
    const listId = catalogListId();
    if (listId) rememberCatalogTradeState(listId, "ended");
    card.classList.add("olwlg-catalog-info-card--ended");
    const eyebrow = header.querySelector<HTMLElement>(".olwlg-catalog-eyebrow");
    if (eyebrow) eyebrow.textContent = "Ended math trade";
    actions.replaceChildren();
    actions.hidden = true;
    notes.replaceChildren();
    notes.hidden = true;
  } else if (isOfferPhase) {
    const eyebrow = header.querySelector<HTMLElement>(".olwlg-catalog-eyebrow");
    if (eyebrow) eyebrow.textContent = "Offer phase";
  }
  overview.replaceChildren();
  if (isEndedTrade) {
    const { countdown, update: updateCountdown } = buildCatalogCountdown(
      "This math trade has ended.",
      Date.now(),
      "ended",
    );
    overview.append(countdown);
    updateCountdown();
  } else if (isOfferPhase && offerDeadline !== undefined) {
    removeCatalogDeadlineMessage(
      [notes, actions],
      new RegExp(offerDeadlinePattern.source, "i"),
    );
    const { countdown, update: updateCountdown } = buildCatalogCountdown(
      offerDeadlineMatch?.[3] ?? "Offer/add games",
      offerDeadline,
      "offer",
    );
    overview.append(countdown);
    updateCountdown();
    window.setInterval(updateCountdown, 1000);
  } else if (deadlineMatch && submissionDeadline !== undefined) {
    removeCatalogDeadlineMessage(
      [notes, actions],
      new RegExp(deadlinePattern.source, "i"),
    );
    const { countdown, update: updateCountdown } = buildCatalogCountdown(
      readOnly ? "Submission window closes" : deadlineMatch[3],
      submissionDeadline,
    );
    overview.append(countdown);
    updateCountdown();
    window.setInterval(updateCountdown, 1000);
  }
  if (isOfferPhase) {
    const offerNotice = document.createElement("p");
    offerNotice.className = "olwlg-catalog-offer-notice";
    offerNotice.textContent =
      "This math trade is open for item offers. Want-list submission has not started yet.";
    notes.append(offerNotice);
  }
  if (readOnly && !isEndedTrade) {
    const readOnlyNotice = document.createElement("p");
    readOnlyNotice.className =
      "olwlg-catalog-ended-notice olwlg-catalog-read-only-notice";
    readOnlyNotice.textContent =
      "You are not participating in this math trade. Want-list changes are unavailable.";
    notes.append(readOnlyNotice);
  }
  if (actions.childNodes.length) {
    const actionsTitle = document.createElement("h2");
    actionsTitle.textContent = "Actions";
    actions.prepend(actionsTitle);
    overview.append(actions);
  } else actions.hidden = true;

  if (overview.childNodes.length) {
    const overviewTitle = document.createElement("h2");
    overviewTitle.textContent = "Trade information";
    overview.prepend(overviewTitle);
  } else {
    overview.hidden = true;
    card.classList.add("olwlg-catalog-info-card--without-overview");
  }

  if (notes.childNodes.length) {
    const notesTitle = document.createElement("h2");
    notesTitle.textContent = "Important notes";
    notes.prepend(notesTitle);
  } else {
    notes.hidden = true;
    card.classList.add("olwlg-catalog-info-card--without-notes");
  }

  card.append(header, overview, notes);
  if (card.contains(toolbar) || toolbar.contains(card)) return;
  container.insertBefore(card, toolbar);
}

function createMyWantsInfoCard(toolbar: HTMLElement) {
  if (!location.pathname.endsWith("/mywants.cgi")) return;
  if (document.querySelector(".olwlg-mywants-info-card")) return;
  const readOnly = catalogIsReadOnly();

  enhanceCatalogMessages();
  const controls = [
    ...document.querySelectorAll<HTMLElement>(
      "a, button, input[type='button'], input[type='submit'], input[type='reset'], input[type='image']",
    ),
  ].filter(
    (control) =>
      !control.closest("#navbar, .olwlg-want-matrix-toolbar") &&
      !toolbar.contains(control),
  );
  const actionDefinitions = [
    {
      className: "olwlg-mywants-action--confirm",
      label: "Confirm Changes",
      pattern: /\bconfirm\s+changes\b/i,
    },
    {
      className: "olwlg-mywants-action--reset",
      label: "Reset Changes",
      pattern: /\breset\s+changes\b/i,
    },
    {
      className: "olwlg-mywants-action--submit",
      label: "Submit My Wants",
      pattern: /\bsubmit(?:\s+my)?\s+wants\b/i,
    },
  ];
  const actionSources = actionDefinitions.map((definition) => ({
    ...definition,
    source: controls.find((control) =>
      definition.pattern.test(
        normalizedText(
          `${wantListControlLabel(control)} ${
            control.querySelector<HTMLImageElement>("img")?.alt ?? ""
          }`,
        ),
      )
    ),
  }));
  document.body.classList.add("olwlg-mywants-page");

  const headings = [
    ...document.querySelectorAll<HTMLHeadingElement>("h1, h2, h3, h4"),
  ];
  const mainHeading = headings.find((heading) =>
    /math trade gateway[\s\S]*steps?\s*4\s*(?:&|and)\s*5/i.test(
      normalizedText(heading.textContent),
    )
  );
  const instructionDetails = [
    ...document.querySelectorAll<HTMLDetailsElement>("details"),
  ].filter((details) =>
    /active olwlg threads|how to assign values and auto-check boxes/i.test(
      normalizedText(details.querySelector("summary")?.textContent),
    )
  );
  const messages = [
    ...document.querySelectorAll<HTMLElement>(".olwlg-message, [role='alert']"),
  ];
  const submissionAlert = messages.find((message) =>
    /submission window is open for submitting your wants but you have not yet submitted/i.test(
      normalizedText(message.textContent),
    )
  );
  const resubmissionWarning = messages.find((message) =>
    message.classList.contains("olwlg-message--resubmission-warning") ||
    /made changes(?:\/edits| or edits)? to your want lists? after your last submission/i.test(
      normalizedText(message.textContent),
    )
  );
  const commentsWarning = messages.find((message) =>
    /offerings?.{0,40}geeklist comments.{0,80}not replied/i.test(
      normalizedText(message.textContent),
    )
  );
  if (commentsWarning) removeCatalogItemCountFromMessage(commentsWarning);
  const deadlinePattern =
    /(\d+(?:\.\d+)?)\s+(days?|hours?|minutes?)\s+left\s+to\s+((?:re-?submit|submit(?:\/re-?submit)?)\s+your\s+wants)/i;
  const deadlineSource = [
    ...document.querySelectorAll<HTMLElement>("a, p, div, span, center"),
  ]
    .filter((element) => deadlinePattern.test(normalizedText(element.textContent)))
    .sort(
      (left, right) =>
        normalizedText(left.textContent).length -
        normalizedText(right.textContent).length,
    )[0];
  const deadlineMatch = normalizedText(deadlineSource?.textContent).match(
    deadlinePattern,
  );
  const exactDeadline = exactCatalogSubmissionDeadline([document]);
  const submissionDeadline = deadlineMatch
    ? stableCatalogSubmissionDeadline(
        deadlineMatch[1],
        deadlineMatch[2],
        exactDeadline,
      )
    : exactDeadline;

  const card = document.createElement("section");
  const header = document.createElement("header");
  const headerCopy = document.createElement("div");
  const eyebrow = document.createElement("p");
  const title = document.createElement("h1");
  const overview = document.createElement("div");
  const notes = document.createElement("div");
  const actions = document.createElement("div");
  card.className = "olwlg-catalog-info-card olwlg-mywants-info-card";
  header.className = "olwlg-catalog-info-card__header";
  overview.className = "olwlg-catalog-info-card__overview";
  notes.className = "olwlg-catalog-info-card__notes";
  actions.className = "olwlg-catalog-info-card__actions";
  eyebrow.className = "olwlg-catalog-eyebrow";
  eyebrow.textContent = readOnly ? "Read-only math trade" : "Current math trade";
  if (mainHeading) {
    [...mainHeading.childNodes].forEach((child) =>
      title.append(child.cloneNode(true))
    );
  } else {
    title.textContent = "Math Trade Gateway: Steps 4 & 5";
  }
  headerCopy.append(eyebrow, title);
  header.append(headerCopy);

  const overviewTitle = document.createElement("h2");
  overviewTitle.textContent = "Trade information";
  overview.append(overviewTitle);
  let readOnlyNotice: HTMLElement | undefined;
  if (readOnly) {
    readOnlyNotice = document.createElement("p");
    readOnlyNotice.className =
      "olwlg-catalog-ended-notice olwlg-catalog-read-only-notice";
    readOnlyNotice.textContent =
      "You are not participating in this math trade. Want-list changes are unavailable.";
  } else if (submissionDeadline !== undefined) {
    const { countdown, update: updateCountdown } = buildCatalogCountdown(
      deadlineMatch?.[3] ?? "Submit/re-submit your wants",
      submissionDeadline,
    );
    overview.append(countdown);
    updateCountdown();
    window.setInterval(updateCountdown, 1000);
  } else {
    const status = document.createElement("p");
    status.className = "olwlg-catalog-ended-notice";
    status.textContent = submissionAlert
      ? "The submission window is currently open."
      : "Want-list editing is available for this math trade.";
    overview.append(status);
  }

  const actionsTitle = document.createElement("h2");
  actionsTitle.textContent = "Actions";
  actions.append(actionsTitle);
  actionSources.forEach(({ className, label, source }) => {
    if (!source) return;
    source.classList.add("olwlg-mywants-original-action");
    if (readOnly) return;
    const isChangeAction =
      className === "olwlg-mywants-action--confirm" ||
      className === "olwlg-mywants-action--reset";
    const proxy = isChangeAction
      ? document.createElement("button")
      : source instanceof HTMLAnchorElement
      ? document.createElement("a")
      : document.createElement("button");
    proxy.className = `olwlg-mywants-action ${className}`;
    proxy.textContent = label;
    if (
      proxy instanceof HTMLAnchorElement &&
      source instanceof HTMLAnchorElement
    ) {
      proxy.href = source.href;
      proxy.target = source.target;
      proxy.rel = source.rel;
    } else {
      proxy.type = "button";
      proxy.addEventListener("click", () => source.click());
    }
    if (isChangeAction && proxy instanceof HTMLButtonElement) {
      proxy.disabled = true;
      proxy.setAttribute("aria-disabled", "true");
    }
    actions.append(proxy);
  });
  if (actions.childElementCount > 1) overview.append(actions);
  else actions.remove();

  if (overview.childElementCount === 1) {
    overview.hidden = true;
    card.classList.add("olwlg-catalog-info-card--without-overview");
  }

  const noteElements = [
    readOnlyNotice,
    submissionAlert,
    resubmissionWarning,
    commentsWarning,
  ].filter(
    (message): message is HTMLElement => Boolean(message),
  );
  if (noteElements.length) {
    const notesTitle = document.createElement("h2");
    notesTitle.textContent = "Important notes";
    notes.append(notesTitle);
    noteElements.forEach((message) => notes.append(message));
    submissionAlert?.classList.add("olwlg-message--submission-alert");
  } else {
    notes.hidden = true;
    card.classList.add("olwlg-catalog-info-card--without-notes");
  }

  card.append(header, overview, notes);

  const sourceElements = [
    mainHeading,
    ...instructionDetails,
    deadlineSource,
    submissionAlert,
    resubmissionWarning,
    commentsWarning,
  ].filter((element): element is HTMLElement => Boolean(element));
  const firstSource = sourceElements
    .filter((element) => element.isConnected)
    .sort((left, right) =>
      left === right
        ? 0
        : left.compareDocumentPosition(right) &
            Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1
    )[0];
  const insertionTarget = firstSource ?? toolbar;
  insertionTarget.parentElement?.insertBefore(card, insertionTarget);

  mainHeading?.classList.add("olwlg-mywants-source-hidden");
  deadlineSource?.classList.add("olwlg-mywants-source-hidden");
  headings
    .filter((heading) =>
      /^warning!?$/i.test(normalizedText(heading.textContent))
    )
    .forEach((heading) =>
      heading.classList.add("olwlg-mywants-source-hidden")
    );
  instructionDetails.forEach((details) => {
    if (/active olwlg threads/i.test(normalizedText(details.textContent))) {
      details.classList.add("olwlg-active-threads");
      document.body.append(details);
    } else details.classList.add("olwlg-mywants-source-hidden");
  });
}

function addCatalogBackToTop() {
  if (document.querySelector(".olwlg-back-to-top")) return;

  const button = document.createElement("button");
  button.className = "olwlg-back-to-top";
  button.type = "button";
  button.hidden = true;
  button.setAttribute("aria-label", "Back to top");
  button.innerHTML =
    '<span aria-hidden="true">↑</span><span>Back to top</span>';

  let frame = 0;
  const updateVisibility = () => {
    frame = 0;
    button.hidden = window.scrollY < 600;
  };
  window.addEventListener(
    "scroll",
    () => {
      if (frame) return;
      frame = requestAnimationFrame(updateVisibility);
    },
    { passive: true },
  );
  button.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  });

  document.body.append(button);
  updateVisibility();
}

function catalogLoggedInUsername() {
  const profileName = normalizedText(
    document.querySelector<HTMLElement>(".olwlg-profile-menu__heading strong")
      ?.textContent ??
      document.querySelector<HTMLElement>(".olwlg-profile-menu__trigger")
        ?.textContent,
  );
  if (profileName) return profileName;

  const profileLink = [
    ...document.querySelectorAll<HTMLAnchorElement>(
      "a[href*='/user/'], a[href*='geekname='], a[href*='username=']",
    ),
  ][0];
  if (!profileLink) return undefined;
  const url = new URL(profileLink.href);
  const encodedName =
    url.pathname.match(/\/user\/([^/?#]+)/i)?.[1] ??
    url.searchParams.get("geekname") ??
    url.searchParams.get("username");
  if (!encodedName) return undefined;
  try {
    return decodeURIComponent(encodedName);
  } catch {
    return encodedName;
  }
}

async function configureCatalogParticipation(rows: HTMLTableRowElement[]) {
  const username = catalogLoggedInUsername();
  const listId = catalogListId();
  if (!username || !listId) {
    document.body.classList.add("olwlg-catalog-read-only");
    document.body.dataset.olwlgCatalogParticipation = "read-only";
    installReadOnlyWantGuard();
    return;
  }

  const storageKey = `olwlg-catalog-participation-${listId}-${username.toLocaleLowerCase()}`;
  let participates = rows.some(
    (row) =>
      participantFromRow(row).localeCompare(username, undefined, {
        sensitivity: "base",
      }) === 0,
  );
  const isVerifiedFullList =
    location.pathname.endsWith("/viewlist.cgi") &&
    activeCatalogMode() === "full";
  if (!participates && !isVerifiedFullList) {
    const verificationUrl = fullCatalogUrl();
    if (verificationUrl) {
      try {
        const response = await fetch(verificationUrl, {
          credentials: "same-origin",
          headers: { Accept: "text/html" },
        });
        if (response.ok) {
          const verificationDocument = new DOMParser().parseFromString(
            await response.text(),
            "text/html",
          );
          const verificationTable = findCatalogTable(verificationDocument);
          const verificationRows = verificationTable
            ? [...verificationTable.rows]
              .slice(1)
              .filter((row) => row.cells.length >= 2)
            : [];
          participates = verificationRows.some(
            (row) =>
              participantFromRow(row).localeCompare(username, undefined, {
                sensitivity: "base",
              }) === 0,
          );
        }
      } catch {
        participates = false;
      }
    }
  }
  const readOnly = !participates;
  sessionStorage.setItem(
    storageKey,
    participates ? "participant" : "read-only",
  );
  document.body.classList.toggle("olwlg-catalog-read-only", readOnly);
  document.body.dataset.olwlgCatalogParticipation = readOnly
    ? "read-only"
    : "participant";
  if (readOnly) installReadOnlyWantGuard();
}

function catalogIsReadOnly() {
  return document.body.classList.contains("olwlg-catalog-read-only");
}

let readOnlyWantGuardInstalled = false;

function installReadOnlyWantGuard() {
  if (readOnlyWantGuardInstalled) return;
  readOnlyWantGuardInstalled = true;

  document.addEventListener(
    "click",
    (event) => {
      if (!catalogIsReadOnly() || !(event.target instanceof Element)) return;
      const target = event.target;
      let control = target.closest<HTMLElement>(
        ".olwlg-catalog-primary-action, .olwlg-catalog-add-action, " +
          ".olwlg-catalog-action--edit-wants, .olwlg-navbar__edit-wants, " +
          ".olwlg-mywants-action, .olwlg-want-matrix__bulk, " +
          "form[action*='mywants.cgi'] button, " +
          "form[action*='mywants.cgi'] input[type='submit'], " +
          "form[action*='mywants.cgi'] input[type='image'], " +
          "a[href*='mywants.cgi'], a[href*='step4']",
      );
      if (!control) {
        const row = target.closest<HTMLTableRowElement>("tr");
        const nativeControls = row
          ? [catalogWantControl(row), catalogDirectWantControl(row)].filter(
              (candidate): candidate is HTMLElement => Boolean(candidate),
            )
          : [];
        control = nativeControls.find(
          (candidate) =>
            candidate === target ||
            candidate.contains(target) ||
            target.contains(candidate),
        ) ?? null;
      }
      if (!control) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true,
  );
  document.addEventListener(
    "submit",
    (event) => {
      if (
        !catalogIsReadOnly() ||
        !(event.target instanceof HTMLFormElement) ||
        !/mywants\.cgi/i.test(event.target.action)
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true,
  );
}

async function enhanceCatalogPage() {
  if (!location.pathname.endsWith("/viewlist.cgi")) return;

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
  wrapper.insertAdjacentElement("beforebegin", grid);
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

type WantListMode = "edit" | "review";
type WantListWorkspaceView = "focus" | "matrix" | "review";

interface WantListMatrix {
  columns: number[];
  header: HTMLTableRowElement;
  repeatedHeaders: HTMLTableRowElement[];
  rows: HTMLTableRowElement[];
  table: HTMLTableElement;
}

interface WantListRowIdentity {
  detailCell?: HTMLTableCellElement;
  item: string;
  label: string;
  owner: string;
  ownerUrl?: string;
  searchText: string;
}

function wantListPageMode(): WantListMode | undefined {
  if (location.pathname.endsWith("/viewlist.cgi")) return undefined;

  const pageContext = normalizedText(
    [
      document.title,
      ...document.querySelectorAll<HTMLElement>("h1, h2, h3, legend"),
    ]
      .map((element) =>
        typeof element === "string" ? element : element.textContent
      )
      .join(" "),
  );
  const routeContext = `${location.pathname} ${location.search}`;
  if (
    !/step\s*[45]|edit (?:your )?wants|want\s*list|mywants/i.test(
      `${routeContext} ${pageContext}`,
    )
  )
    return undefined;

  return /step\s*5|review|confirm|submit.*want/i.test(
      `${routeContext} ${pageContext}`,
    )
    ? "review"
    : "edit";
}

function findWantListMatrix(): WantListMatrix | undefined {
  const candidates = [...document.querySelectorAll<HTMLTableElement>("table")]
    .filter((table) => !table.parentElement?.closest("table"))
    .map((table) => {
      const header = table.rows[0];
      const candidateRows = [...table.rows]
        .slice(1)
        .filter((row) => row.cells.length > 2);
      if (!header || candidateRows.length < 2) return undefined;

      const columns = [...header.cells]
        .map((_, column) => column)
        .filter((column) => {
          const checkboxCount = candidateRows.filter((row) =>
            Boolean(
              row.cells[column]?.querySelector<HTMLInputElement>(
                'input[type="checkbox"]',
              ),
            )
          ).length;
          return checkboxCount >=
            Math.max(2, Math.floor(candidateRows.length * 0.15));
        });
      const rows = candidateRows.filter((row) =>
        columns.some((column) =>
          Boolean(
            row.cells[column]?.querySelector<HTMLInputElement>(
              'input[type="checkbox"]',
            ),
          )
        )
      );
      const lastDataRowIndex = Math.max(
        ...rows.map((row) => candidateRows.indexOf(row)),
      );
      const headerLabels = new Set(
        [...header.cells]
          .map((cell) => readableWantListHeading(cell.textContent))
          .filter(Boolean),
      );
      const repeatedHeaders = candidateRows.filter((row, rowIndex) => {
        if (rows.includes(row)) return false;
        const rowLabels = [...row.cells]
          .map((cell) => readableWantListHeading(cell.textContent))
          .filter(Boolean);
        const matchingLabels = rowLabels.filter((label) =>
          headerLabels.has(label)
        );
        const isTrailingHeaderShape =
          rowIndex > lastDataRowIndex &&
          row.cells.length >= Math.max(3, Math.floor(columns.length * 0.6));
        return matchingLabels.length >= 2 || isTrailingHeaderShape;
      });
      const checkboxCount = rows.reduce(
        (total, row) =>
          total +
          columns.filter((column) =>
            Boolean(
              row.cells[column]?.querySelector('input[type="checkbox"]'),
            )
          ).length,
        0,
      );
      if (!columns.length || checkboxCount < 4) return undefined;
      return {
        columns,
        header,
        repeatedHeaders,
        rows,
        table,
        score: checkboxCount,
      };
    })
    .filter(
      (
        candidate,
      ): candidate is WantListMatrix & { score: number } =>
        Boolean(candidate),
    )
    .sort((left, right) => right.score - left.score);

  return candidates[0];
}

function readableWantListHeading(value: string | null | undefined) {
  return normalizedText(value)
    .replace(
      /\b(?:[A-Za-z]\s+){2,}[A-Za-z]\b/g,
      (word) => word.replace(/\s+/g, ""),
    );
}

function normalizedWantListSearchText(value: string | null | undefined) {
  return normalizedText(value)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase();
}

function wantListControlLabel(control: HTMLElement) {
  const image = control.querySelector<HTMLImageElement>("img");
  return normalizedText(
    [
      control instanceof HTMLInputElement
        ? control.value
        : control.textContent,
      control.getAttribute("aria-label"),
      control.title,
      control instanceof HTMLInputElement ? control.alt : "",
      control instanceof HTMLInputElement ? control.src : "",
      image?.alt,
      image?.title,
    ].filter(Boolean).join(" "),
  );
}

function wantListVisibleControlLabel(control: HTMLElement) {
  return normalizedText(
    [
      control instanceof HTMLInputElement
        ? control.value
        : control.textContent,
      control.getAttribute("aria-label"),
      control.title,
    ].find((value) => normalizedText(value)),
  );
}

function wantListNavigationLabel(control: HTMLElement) {
  const image = control.querySelector<HTMLImageElement>("img");
  const input = control instanceof HTMLInputElement ? control : undefined;
  const directLabel = [
    input?.value,
    control.textContent,
    control.getAttribute("aria-label"),
    control.title,
    input?.alt,
    image?.alt,
    image?.title,
  ].find((value) => normalizedText(value));
  if (directLabel) return readableWantListHeading(directLabel);

  const href =
    control instanceof HTMLAnchorElement ? control.href : "";
  const step = href.match(/step(?:=|\/|_|\s*)?([1-6])/i)?.[1];
  return step ? `Step ${step}` : "";
}

function createWantListTabs(toolbar: HTMLElement) {
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
    const tab = document.createElement("button");
    const tabLabel = document.createElement("span");
    tab.className = "olwlg-want-tabs__item";
    tab.setAttribute("role", "tab");
    tab.id = `olwlg-want-tab-${panelIds[index]}`;
    tab.setAttribute("aria-controls", panelIds[index]);
    tab.type = "button";
    tab.addEventListener("click", () => source.click());
    tab.addEventListener("click", () => activateTab(tab));
    tabLabel.textContent = label;
    tab.append(tabLabel);
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

function cleanWantListPageFooter() {
  const duplicatePatterns = [
    /Note:\s*Confirm Changes does not submit your WANTS/i,
    /Note:\s*Submission window is open for submitting your wants/i,
    /\d+(?:\.\d+)?\s+days?\s+left to submit\/re-submit your wants/i,
    /^\d+\s+check\s*boxes$/i,
  ];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const duplicateNodes: Text[] = [];
  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text;
    if (
      textNode.parentElement?.closest(
        ".olwlg-mywants-info-card, .olwlg-want-matrix-toolbar",
      )
    )
      continue;
    if (
      duplicatePatterns.some((pattern) =>
        pattern.test(normalizedText(textNode.data))
      )
    )
      duplicateNodes.push(textNode);
  }
  duplicateNodes.forEach((textNode) => {
    const parent = textNode.parentElement;
    const compactContainer = parent?.closest<HTMLElement>(
      "p, li, mark, font, a, span",
    );
    const compactText = normalizedText(compactContainer?.textContent);
    if (
      compactContainer &&
      compactText.length < 320 &&
      duplicatePatterns.some((pattern) => pattern.test(compactText))
    ) {
      const previous = compactContainer.previousSibling;
      const next = compactContainer.nextSibling;
      compactContainer.remove();
      if (previous instanceof HTMLBRElement) previous.remove();
      if (next instanceof HTMLBRElement) next.remove();
      return;
    }
    const previous = textNode.previousSibling;
    const next = textNode.nextSibling;
    textNode.remove();
    if (previous instanceof HTMLBRElement) previous.remove();
    if (next instanceof HTMLBRElement) next.remove();
  });

}

function enhanceWantListSubmissionError() {
  const errorPattern = /^error:\s*(sendgeekmail\b.*)$/i;
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
  );
  let errorNode: Text | undefined;
  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text;
    if (
      textNode.parentElement?.closest(
        ".olwlg-want-submission-error, script, style",
      )
    )
      continue;
    if (errorPattern.test(normalizedText(textNode.data))) {
      errorNode = textNode;
      break;
    }
  }
  if (!errorNode) return false;

  const sourceParent = errorNode.parentElement;
  const semanticSource = sourceParent?.closest<HTMLElement>(
    "p, li, pre, blockquote",
  );
  const source = semanticSource &&
      normalizedText(semanticSource.textContent).length < 300
    ? semanticSource
    : sourceParent &&
        sourceParent !== document.body &&
        normalizedText(sourceParent.textContent).length < 160
    ? sourceParent
    : errorNode;
  const detail = normalizedText(errorNode.data).replace(/^error:\s*/i, "");
  const alert = document.createElement("aside");
  const icon = document.createElement("span");
  const copy = document.createElement("div");
  const eyebrow = document.createElement("span");
  const heading = document.createElement("h2");
  const message = document.createElement("p");
  const technicalDetail = document.createElement("p");
  const code = document.createElement("code");

  alert.className = "olwlg-want-submission-error";
  alert.setAttribute("role", "alert");
  alert.setAttribute("aria-live", "assertive");
  alert.setAttribute("aria-label", "BGG GeekMail confirmation error");
  icon.className = "olwlg-want-submission-error__icon";
  icon.textContent = "!";
  icon.setAttribute("aria-hidden", "true");
  copy.className = "olwlg-want-submission-error__copy";
  eyebrow.className = "olwlg-want-submission-error__eyebrow";
  eyebrow.textContent = "Confirmation delivery error";
  heading.textContent = "The BGG GeekMail confirmation was not sent";
  message.textContent =
    "Your want-list submission is shown as confirmed, but OLWLG could not send its confirmation message through BGG GeekMail.";
  technicalDetail.className = "olwlg-want-submission-error__detail";
  technicalDetail.append("Technical detail: ");
  code.textContent = detail;
  technicalDetail.append(code);
  copy.append(eyebrow, heading, message, technicalDetail);
  alert.append(icon, copy);

  if (source instanceof HTMLElement && source.parentNode) {
    source.parentNode.insertBefore(alert, source);
    source.classList.add("olwlg-want-submission-error__source");
    source.setAttribute("aria-hidden", "true");
  } else if (source.parentNode) {
    source.parentNode.insertBefore(alert, source);
    source.parentNode.removeChild(source);
  }
  [alert.previousSibling, alert.nextSibling].forEach((sibling) => {
    if (sibling instanceof HTMLBRElement) sibling.remove();
    else if (
      sibling instanceof Text &&
      /^[.\u00b7]+$/.test(normalizedText(sibling.data))
    )
      sibling.remove();
  });
  return true;
}

function enhanceWantListSubmissionConfirmation(
  toolbar: HTMLElement,
  geekMailDeliveryFailed = false,
) {
  const headingPattern =
    /thank you for confirming your wants for (?:the|this) math trade/i;
  const messagePattern =
    /confirmation and summary (?:has|have) been geekmailed to you on BGG/i;
  const matchingElement = (pattern: RegExp) =>
    [
      ...document.querySelectorAll<HTMLElement>(
        "h1, h2, h3, h4, p, li, div, section, article, td, center, font, strong, b, span",
      ),
    ]
      .filter(
        (element) =>
          !element.closest(".olwlg-want-submission-success") &&
          pattern.test(normalizedText(element.textContent)),
      )
      .sort(
        (left, right) =>
          normalizedText(left.textContent).length -
          normalizedText(right.textContent).length,
      )[0];
  const textWalker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
  );
  let headingNode: Text | undefined;
  let messageNode: Text | undefined;
  while (textWalker.nextNode() && (!headingNode || !messageNode)) {
    const textNode = textWalker.currentNode as Text;
    if (textNode.parentElement?.closest(".olwlg-want-submission-success"))
      continue;
    const text = normalizedText(textNode.data);
    if (!headingNode && headingPattern.test(text)) headingNode = textNode;
    if (!messageNode && messagePattern.test(text)) messageNode = textNode;
  }
  const headingElement = matchingElement(headingPattern);
  const messageElement = matchingElement(messagePattern);
  if (!headingNode && !headingElement) return false;

  const sourceBlock = (textNode: Text) => {
    const parent = textNode.parentElement;
    const semanticBlock = parent?.closest<HTMLElement>(
      "h1, h2, h3, h4, p, li",
    );
    if (semanticBlock) return semanticBlock;
    if (
      parent &&
      parent !== document.body &&
      normalizedText(parent.textContent).length < 420
    )
      return parent;
    return textNode;
  };
  const headingSource = headingNode
    ? sourceBlock(headingNode)
    : headingElement;
  const messageSource = messageNode
    ? sourceBlock(messageNode)
    : messageElement;
  const card = document.createElement("section");
  const icon = document.createElement("span");
  const copy = document.createElement("div");
  const eyebrow = document.createElement("span");
  const heading = document.createElement("h2");
  const message = document.createElement("p");
  card.className = "olwlg-want-submission-success";
  card.setAttribute("role", "status");
  card.setAttribute("aria-live", "polite");
  card.setAttribute("aria-label", "Want-list submission confirmed");
  icon.className = "olwlg-want-submission-success__icon";
  icon.textContent = "✓";
  icon.setAttribute("aria-hidden", "true");
  copy.className = "olwlg-want-submission-success__copy";
  eyebrow.className = "olwlg-want-submission-success__eyebrow";
  eyebrow.textContent = "Submission confirmed";
  heading.textContent =
    "Thank you for confirming your wants for the math trade.";
  message.textContent = geekMailDeliveryFailed
    ? "Your wants are confirmed for this math trade. OLWLG could not send the usual summary through BGG GeekMail; see the delivery error above. You can still make changes and re-submit your lists until the deadline."
    : "A confirmation and summary has been sent to you through BGG GeekMail. You can still make changes and re-submit your lists until the deadline.";
  copy.append(eyebrow, heading, message);
  card.append(icon, copy);

  const insertionAnchor = headingSource instanceof HTMLElement
    ? headingSource
    : headingNode?.parentElement;
  if (insertionAnchor?.parentNode)
    insertionAnchor.parentNode.insertBefore(card, insertionAnchor);
  else toolbar.insertAdjacentElement("beforebegin", card);

  const sources = new Set<HTMLElement | Text>(
    [headingSource, messageSource].filter(
      (source): source is HTMLElement | Text => source !== undefined,
    ),
  );
  sources.forEach((source) => {
    [source.previousSibling, source.nextSibling].forEach((sibling) => {
      if (sibling instanceof HTMLBRElement) {
        sibling.classList.add("olwlg-want-submission-success__source");
      } else if (
        sibling instanceof Text &&
        /^[.·]+$/.test(normalizedText(sibling.data))
      ) {
        sibling.parentNode?.removeChild(sibling);
      }
    });
    if (source instanceof HTMLElement) {
      source.classList.add("olwlg-want-submission-success__source");
      source.setAttribute("aria-hidden", "true");
    } else source.parentNode?.removeChild(source);
  });
  return true;
}

function enhanceWantListPages() {
  const mode = wantListPageMode();
  if (!mode) return;
  const readOnly = catalogIsReadOnly();

  const matrix = findWantListMatrix();
  if (!matrix || matrix.table.dataset.olwlgWantMatrix) return;

  const { columns, header, repeatedHeaders, rows, table } = matrix;
  const sourceCellPresentation = new WeakMap<
    HTMLTableCellElement,
    { colorKeys: string[]; statusHint: string }
  >();
  [header, ...rows, ...repeatedHeaders].forEach((row) => {
    [...row.cells].forEach((cell) => {
      sourceCellPresentation.set(cell, {
        colorKeys: backgroundColorKeys(cell),
        statusHint: normalizedText(
          [
            cell.className,
            cell.id,
            cell.title,
            cell.getAttribute("aria-label"),
            cell.getAttribute("data-status"),
            cell.getAttribute("data-warning"),
          ].filter(Boolean).join(" "),
        ).toLocaleLowerCase(),
      });
    });
  });
  const form = table.closest("form");
  const matrixInputs = [
    ...table.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"], input[type="number"], input[type="text"]',
    ),
  ];
  if (readOnly) {
    matrixInputs.forEach((input) => {
      input.disabled = true;
      input.setAttribute("aria-disabled", "true");
    });
  }
  const initialValues = new Map<HTMLInputElement, string | boolean>(
    matrixInputs.map((input) => [
      input,
      input.type === "checkbox" ? input.checked : input.value,
    ]),
  );
  const columnLabels = new Map<number, string>();
  let activeColumn = -1;
  let activeFocusColumn = columns[0];
  let workspaceView: WantListWorkspaceView = mode === "review"
    ? "review"
    : "matrix";
  let setWorkspaceView = (_view: WantListWorkspaceView) => {};
  const detailColumnWidth = 400;
  const offerColumnWidth = 118;
  const matrixWidth =
    detailColumnWidth + columns.length * offerColumnWidth;

  table.dataset.olwlgWantMatrix = mode;
  table.classList.add("olwlg-want-matrix");
  table.style.setProperty(
    "width",
    `${matrixWidth}px`,
    "important",
  );
  table.style.setProperty(
    "min-width",
    `${matrixWidth}px`,
    "important",
  );
  table.style.setProperty("table-layout", "fixed", "important");
  document.body.classList.add(
    "olwlg-want-list-page",
    `olwlg-want-list-page--${mode}`,
  );
  let tableHead = table.tHead;
  if (!tableHead) {
    tableHead = document.createElement("thead");
    table.insertBefore(tableHead, table.firstChild);
  }
  if (header.parentElement !== tableHead) tableHead.append(header);
  const matrixBodies = new Set<HTMLTableSectionElement>();
  rows.forEach((row) => {
    if (row.parentElement instanceof HTMLTableSectionElement)
      matrixBodies.add(row.parentElement);
  });
  matrixBodies.forEach((body) =>
    body.classList.add("olwlg-want-matrix__body")
  );
  header.classList.add("olwlg-want-matrix__header");
  rows.forEach((row) => row.classList.add("olwlg-want-matrix__row"));
  const itemCells = [
    header.cells[0],
    ...rows.map((row) => row.cells[0]),
  ].filter(
    (cell): cell is HTMLTableCellElement =>
      cell instanceof HTMLTableCellElement,
  );
  itemCells.forEach((cell) => {
    cell.hidden = true;
    cell.setAttribute("aria-hidden", "true");
    cell.classList.add("olwlg-want-matrix__item-column");
    cell
      .querySelectorAll<HTMLElement>("a, button, input, [tabindex]")
      .forEach((control) => control.tabIndex = -1);
  });
  repeatedHeaders.forEach((row) => {
    row.hidden = true;
    row.setAttribute("aria-hidden", "true");
    row.classList.add("olwlg-want-matrix__repeated-header");
  });

  const wrapper = document.createElement("div");
  const headerViewport = document.createElement("div");
  const headerTable = table.cloneNode(false) as HTMLTableElement;
  const bodyViewport = document.createElement("div");
  wrapper.className = "olwlg-want-matrix__scroll";
  headerViewport.className = "olwlg-want-matrix__header-viewport";
  headerTable.classList.add("olwlg-want-matrix__header-table");
  headerTable.removeAttribute("data-olwlg-want-matrix");
  bodyViewport.className = "olwlg-want-matrix__body-viewport";
  wrapper.tabIndex = 0;
  wrapper.setAttribute(
    "aria-label",
    "Want-list relationship matrix. Drag to pan horizontally or vertically.",
  );
  table.insertAdjacentElement("beforebegin", wrapper);
  headerTable.append(tableHead);
  headerViewport.append(headerTable);
  bodyViewport.append(table);
  wrapper.append(headerViewport, bodyViewport);
  wrapper.style.setProperty(
    "--olwlg-want-matrix-width",
    `${matrixWidth}px`,
  );
  wrapper.style.maxWidth = "1380px";
  bodyViewport.tabIndex = 0;
  bodyViewport.setAttribute(
    "aria-label",
    "Want-list rows and columns. Drag to pan; use the checkboxes to select trades.",
  );
  const syncMatrixViewport = () => {
    const headerHeight = Math.max(
      Math.ceil(tableHead.getBoundingClientRect().height),
      1,
    );
    wrapper.style.setProperty(
      "--olwlg-want-matrix-header-height",
      `${headerHeight}px`,
    );
  };
  syncMatrixViewport();
  requestAnimationFrame(syncMatrixViewport);
  window.addEventListener("resize", syncMatrixViewport);
  if (typeof ResizeObserver !== "undefined")
    new ResizeObserver(syncMatrixViewport).observe(tableHead);

  const toolbar = document.createElement("section");
  const toolbarHeading = document.createElement("div");
  const toolbarTitle = document.createElement("div");
  const step = document.createElement("span");
  const title = document.createElement("strong");
  const summary = document.createElement("span");
  const controls = document.createElement("div");
  const search = document.createElement("input");
  const filter = document.createElement("select");
  const viewSwitch = document.createElement("div");
  const focusView = document.createElement("button");
  const matrixView = document.createElement("button");
  const revert = document.createElement("button");
  const actions = document.createElement("div");
  const backToStep3 = document.createElement("a");
  const save = document.createElement("button");
  const cancel = document.createElement("button");
  const actionHelp = document.createElement("span");
  const announcement = document.createElement("div");

  toolbar.className = "olwlg-want-matrix-toolbar";
  toolbarHeading.className = "olwlg-want-matrix-toolbar__heading";
  toolbarTitle.className = "olwlg-want-matrix-toolbar__title";
  step.className = "olwlg-want-matrix-toolbar__step";
  step.textContent = mode === "review" ? "Step 5 of 5" : "Step 4 of 5";
  title.textContent = mode === "review" ? "Review & submit" : "Build wants";
  summary.className = "olwlg-want-matrix-toolbar__summary";
  controls.className = "olwlg-want-matrix-toolbar__controls";
  search.type = "search";
  search.className = "olwlg-want-matrix-toolbar__search";
  search.placeholder = "Search games or participants…";
  search.setAttribute("aria-label", "Search games or participants");
  filter.className = "olwlg-want-matrix-toolbar__filter";
  filter.setAttribute("aria-label", "Filter want-list rows");
  [
    ["all", "All rows"],
    ["selected", "Selected only"],
    ["unselected", "Unselected only"],
  ].forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    filter.append(option);
  });
  viewSwitch.className = "olwlg-want-view-switch";
  viewSwitch.setAttribute("role", "group");
  viewSwitch.setAttribute("aria-label", "Want-list editor view");
  focusView.type = "button";
  focusView.className = "olwlg-want-view-switch__option";
  focusView.textContent = "Focused";
  focusView.setAttribute("aria-pressed", "true");
  matrixView.type = "button";
  matrixView.className = "olwlg-want-view-switch__option";
  matrixView.textContent = "Matrix";
  matrixView.setAttribute("aria-pressed", "false");
  viewSwitch.append(matrixView, focusView);
  revert.type = "button";
  revert.className = "olwlg-want-matrix-toolbar__secondary";
  revert.textContent = "Revert edits";
  revert.hidden = readOnly;
  actions.className = "olwlg-want-matrix-toolbar__actions";
  backToStep3.className =
    "olwlg-mywants-back-link olwlg-tooltip-target";
  backToStep3.textContent = "Back to Step 3";
  backToStep3.dataset.olwlgTooltip =
    "Return to Want List Generator: Step 3 to add or remove wanted items.";
  save.type = "button";
  save.className = "olwlg-want-matrix-toolbar__save";
  cancel.type = "button";
  cancel.className = "olwlg-want-matrix-toolbar__secondary";
  actionHelp.className = "olwlg-want-matrix-toolbar__action-help";
  actionHelp.textContent = "Saving edits does not submit your want lists.";
  announcement.className = "olwlg-want-announcement";
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", "polite");
  announcement.setAttribute("aria-atomic", "true");

  const pageControls = [
    ...document.querySelectorAll<HTMLElement>(
      "button, input[type='button'], input[type='submit'], input[type='reset'], input[type='image'], a",
    ),
  ].filter(
    (control) =>
      !toolbar.contains(control) &&
      !control.closest("#navbar"),
  );
  const nativeConfirm = pageControls.find((control) =>
    /\bconfirm\s+changes\b|\bsave\s+(?:edits|changes)\b/i.test(
      wantListControlLabel(control),
    )
  );
  const nativeReset = pageControls.find((control) =>
    /\breset\s+changes\b|\brevert\s+(?:edits|changes)\b/i.test(
      wantListControlLabel(control),
    )
  );
  const nativeSubmit = pageControls.find((control) =>
    /\bsubmit(?:\s+my)?\s+wants?\b|\bresubmit(?:\s+updated)?\s+wants?\b/i.test(
      wantListControlLabel(control),
    )
  );
  const nativeSubmissionView = pageControls.find((control) =>
    /\bsubmit\s+your\s+lists?\s+here\b|\bsubmission\s+(?:view|step)\b/i.test(
      wantListControlLabel(control),
    )
  );
  const nativeStep3 = pageControls.find((control) => {
    const href = control instanceof HTMLAnchorElement ? control.href : "";
    const context = normalizedText(
      `${wantListControlLabel(control)} ${href}`,
    );
    return (
      /want\s*list\s*generator\s*:?\s*step\s*3|\b(?:back\s+to\s+)?step\s*3\b/i
        .test(context) ||
      /\/viewlist\.cgi(?:[?#]|$)/i.test(href)
    );
  });
  const step3FallbackUrl = new URL(location.href);
  step3FallbackUrl.pathname = step3FallbackUrl.pathname.replace(
    /\/[^/]*$/,
    "/viewlist.cgi",
  );
  ["step", "format", "mode"].forEach((parameter) =>
    step3FallbackUrl.searchParams.delete(parameter)
  );
  [nativeConfirm, nativeReset, nativeSubmit]
    .filter((control): control is HTMLElement => Boolean(control))
    .forEach((control) => control.classList.add("olwlg-want-native-action"));

  save.addEventListener("click", () => {
    if (workspaceView === "review") {
      (nativeSubmit ?? nativeSubmissionView)?.click();
      return;
    }
    nativeConfirm?.click();
  });
  backToStep3.href = nativeStep3 instanceof HTMLAnchorElement
    ? nativeStep3.href
    : step3FallbackUrl.href;
  if (nativeStep3 instanceof HTMLAnchorElement) {
    backToStep3.target = nativeStep3.target;
    backToStep3.rel = nativeStep3.rel;
  }
  nativeStep3?.classList.add("olwlg-want-matrix-navigation__original");
  cancel.addEventListener("click", () => {
    setWorkspaceView(workspaceView === "review" ? "matrix" : "review");
  });
  focusView.addEventListener("click", () => setWorkspaceView("focus"));
  matrixView.addEventListener("click", () => setWorkspaceView("matrix"));

  toolbarTitle.append(step, title, summary);
  controls.append(search, filter, viewSwitch, revert);
  actions.append(actionHelp, cancel, save);
  toolbarHeading.append(toolbarTitle, actions);
  toolbar.append(toolbarHeading, controls, announcement);

  let bulkAnnouncementTimer = 0;
  const applyBulkSelection = (
    checkboxes: HTMLInputElement[],
    checked: boolean,
  ) => {
    const previous = checkboxes
      .filter((checkbox) => checkbox.checked !== checked)
      .map((checkbox) => [checkbox, checkbox.checked] as const);
    previous.forEach(([checkbox]) => checkbox.click());
    window.clearTimeout(bulkAnnouncementTimer);
    const message = document.createElement("span");
    const undo = document.createElement("button");
    message.textContent =
      `${checked ? "Selected" : "Cleared"} ${previous.length} visible trade${previous.length === 1 ? "" : "s"}.`;
    undo.type = "button";
    undo.className = "olwlg-want-announcement__undo";
    undo.textContent = "Undo";
    undo.hidden = !previous.length;
    undo.addEventListener("click", () => {
      previous.forEach(([checkbox, wasChecked]) => {
        if (checkbox.checked !== wasChecked) checkbox.click();
      });
      announcement.textContent = "Bulk change undone.";
    });
    announcement.replaceChildren(message, undo);
    bulkAnnouncementTimer = window.setTimeout(() => {
      announcement.replaceChildren();
    }, 8000);
  };

  const navigation = document.createElement("nav");
  navigation.className = "olwlg-want-matrix-navigation";
  navigation.setAttribute("aria-label", "Want-list steps and table views");
  const renderedNavigation = new Set<string>();
  pageControls
    .filter(
      (control) =>
        control !== nativeConfirm &&
        control !== nativeReset &&
        control !== nativeSubmit &&
        control !== nativeStep3,
    )
    .forEach((control) => {
      if (table.contains(control)) return;
      const label = wantListNavigationLabel(control);
      const href =
        control instanceof HTMLAnchorElement ? control.href : "";
      const context = normalizedText(
        `${label} ${href} ${
          control instanceof HTMLInputElement ? control.src : ""
        }`,
      );
      if (
        !/\bstep\s*[1-6]\b|\bprevious\b|\bnext\b|\bback\b|\btable\b.*\bformat\b|\b(?:edit|view)\s+format\b/i.test(
          context,
        )
      )
        return;

      const key = `${label.toLocaleLowerCase()}|${href}`;
      if (!label || renderedNavigation.has(key)) return;
      renderedNavigation.add(key);
      const proxy = control instanceof HTMLAnchorElement
        ? document.createElement("a")
        : document.createElement("button");
      proxy.className = "olwlg-want-matrix-navigation__item";
      proxy.textContent = label;
      if (
        proxy instanceof HTMLAnchorElement &&
        control instanceof HTMLAnchorElement
      ) {
        proxy.href = control.href;
        proxy.target = control.target;
        proxy.rel = control.rel;
      } else {
        proxy.type = "button";
        proxy.addEventListener("click", () => control.click());
      }
      control.classList.add("olwlg-want-matrix-navigation__original");
      navigation.append(proxy);
    });
  if (navigation.childElementCount) toolbar.append(navigation);
  wrapper.insertAdjacentElement("beforebegin", toolbar);
  createWantListTabs(toolbar);
  createMyWantsInfoCard(toolbar);
  const infoCard = document.querySelector<HTMLElement>(
    ".olwlg-mywants-info-card",
  );
  (infoCard ?? toolbar).insertAdjacentElement("beforebegin", backToStep3);
  cleanWantListPageFooter();
  const geekMailDeliveryFailed = enhanceWantListSubmissionError();
  const submissionConfirmed = enhanceWantListSubmissionConfirmation(
    toolbar,
    geekMailDeliveryFailed,
  );

  const review = document.createElement("section");
  review.className = "olwlg-want-review";
  review.setAttribute("aria-label", "Want-list review by offered item");
  toolbar.insertAdjacentElement("afterend", review);

  const rowIdentityCache = new WeakMap<
    HTMLTableRowElement,
    WantListRowIdentity
  >();
  const rowIdentity = (row: HTMLTableRowElement): WantListRowIdentity => {
    const cached = rowIdentityCache.get(row);
    if (cached) return cached;
    const detailCells = [...row.cells].filter(
      (_, column) => !columns.includes(column),
    );
    const detailCell = detailCells
      .filter((cell) => normalizedText(cell.textContent))
      .sort(
        (left, right) =>
          normalizedText(right.textContent).length -
          normalizedText(left.textContent).length,
      )[0] ?? row.cells[1];
    const titleLink = [...(detailCell?.querySelectorAll("a") ?? [])].find(
      (link) => normalizedText(link.textContent).length > 1,
    );
    const item = normalizedText(titleLink?.textContent) ||
      readableWantListHeading(detailCell?.textContent) ||
      "Item";
    const participant = participantFromRow(row);
    const ownerCandidates = [
      ...(detailCell?.querySelectorAll<HTMLElement>(
        ".owner, .username, [data-username], [data-geekname], i, em, small, font, span, a",
      ) ?? []),
    ].reverse();
    const ownerFromMarkup = ownerCandidates
      .map((element) => ({
        element,
        text: normalizedText(
          element.dataset.username ??
            element.dataset.geekname ??
            element.textContent,
        ),
      }))
      .find(({ element, text }) =>
        text.length > 1 &&
        text.length <= 80 &&
        text !== item &&
        !element.contains(titleLink ?? null) &&
        !/^(?:value|price|history|show|hide|delete)$/i.test(text)
      )?.text;
    let owner = participant !== "Unknown participant"
      ? participant
      : ownerFromMarkup ?? "";
    if (!owner && detailCell) {
      const clone = detailCell.cloneNode(true) as HTMLTableCellElement;
      [...clone.querySelectorAll("a")]
        .find((link) => normalizedText(link.textContent) === item)
        ?.remove();
      clone
        .querySelectorAll("input, button, img, script, style")
        .forEach((element) => element.remove());
      const remainder = normalizedText(clone.textContent)
        .replace(item, "")
        .replace(/\bvalue\b/gi, "")
        .trim();
      if (remainder.length > 1 && remainder.length <= 80) owner = remainder;
    }
    const identity = {
      detailCell,
      item,
      owner,
      ownerUrl: owner
        ? participantUrlFromRow(row) ??
          `https://boardgamegeek.com/user/${encodeURIComponent(owner)}`
        : undefined,
      label: owner ? `${item} — ${owner}` : item,
      searchText: normalizedWantListSearchText(
        [
          row.textContent,
          ...[
            ...row.querySelectorAll<HTMLElement>(
              "[aria-label], [title], img[alt], input",
            ),
          ].flatMap((element) =>
            element instanceof HTMLInputElement
              ? [
                element.value,
                element.getAttribute("aria-label"),
                element.title,
              ]
              : [
                element.getAttribute("aria-label"),
                element.title,
                element instanceof HTMLImageElement ? element.alt : "",
              ]
          ),
        ]
          .filter(Boolean)
          .join(" "),
      ),
    };
    rowIdentityCache.set(row, identity);
    return identity;
  };

  const decorateGameCell = (cell?: HTMLTableCellElement) => {
    if (!cell || cell.dataset.olwlgGameCell === "true") return;
    cell.dataset.olwlgGameCell = "true";
    cell.classList.add("olwlg-want-matrix__game-cell");

    const source = document.createElement("div");
    while (cell.firstChild) source.append(cell.firstChild);
    const titleLink = [...source.querySelectorAll<HTMLAnchorElement>("a")].find(
      (link) => normalizedText(link.textContent).length > 1,
    );
    const owner = source.querySelector<HTMLElement>("i, em");
    const valueInput = source.querySelector<HTMLInputElement>(
      "input[type='number'], input[type='text']",
    );
    const images = [...source.querySelectorAll<HTMLImageElement>("img")];
    const flag = images.find((image) =>
      /flag|country|\/flags?\//i.test(
        `${image.src} ${image.alt} ${image.title} ${image.className}`,
      )
    );
    const priceImage = images.find((image) =>
      image !== flag &&
      /price|history|dollar|currency|bgg|\$/i.test(
        `${image.src} ${image.alt} ${image.title} ${image.className}`,
      )
    );
    const priceControl = priceImage?.closest<HTMLElement>("a, button") ??
      priceImage;

    const layout = document.createElement("div");
    const identity = document.createElement("div");
    const titleRow = document.createElement("div");
    const metadata = document.createElement("div");
    layout.className = "olwlg-want-game";
    identity.className = "olwlg-want-game__identity";
    titleRow.className = "olwlg-want-game__title-row";
    metadata.className = "olwlg-want-game__meta";

    if (titleLink) {
      titleLink.classList.add("olwlg-want-game__title");
      titleRow.append(titleLink);
    }
    if (
      priceControl &&
      priceControl !== titleLink &&
      (!titleLink || !priceControl.contains(titleLink))
    ) {
      priceControl.classList.add("olwlg-want-game__price");
      titleRow.append(priceControl);
    }
    if (owner) {
      owner.classList.add("olwlg-want-game__owner");
      metadata.append(owner);
    }
    if (flag && !metadata.contains(flag)) {
      flag.classList.add("olwlg-want-game__flag");
      metadata.append(flag);
    }

    [...source.childNodes].forEach((node) => {
      if (
        node === valueInput ||
        node === titleLink ||
        node === owner ||
        node === flag ||
        node === priceControl ||
        (node instanceof HTMLElement &&
          (node.contains(titleLink ?? null) ||
            node.contains(owner ?? null) ||
            node.contains(flag ?? null) ||
            node.contains(priceControl ?? null) ||
            node.contains(valueInput ?? null)))
      )
        return;
      if (node instanceof HTMLBRElement) {
        node.remove();
        return;
      }
      if (node instanceof Text && !normalizedText(node.data)) {
        node.remove();
        return;
      }
      metadata.append(node);
    });

    if (titleRow.childNodes.length) identity.append(titleRow);
    if (metadata.childNodes.length) identity.append(metadata);
    if (!identity.childNodes.length) identity.append(source);
    layout.append(identity);

    if (valueInput) {
      const valueField = document.createElement("label");
      const valueLabel = document.createElement("span");
      valueField.className = "olwlg-want-game__value";
      valueLabel.textContent = "Value";
      valueInput.classList.add("olwlg-want-game__value-input");
      valueField.append(valueLabel, valueInput);
      layout.append(valueField);
    }
    cell.replaceChildren(layout);
  };

  const setActiveColumn = (column: number) => {
    if (column === activeColumn) return;
    if (activeColumn >= 0) {
      header.cells[activeColumn]?.classList.remove(
        "olwlg-want-matrix__cell--active-column",
      );
      rows.forEach((row) =>
        row.cells[activeColumn]?.classList.remove(
          "olwlg-want-matrix__cell--active-column",
        )
      );
    }
    activeColumn = column;
    if (column < 0) return;
    header.cells[column]?.classList.add(
      "olwlg-want-matrix__cell--active-column",
    );
    rows.forEach((row) =>
      row.cells[column]?.classList.add(
        "olwlg-want-matrix__cell--active-column",
      )
    );
  };

  const visibleCheckboxes = (column: number) =>
    rows.flatMap((row) => {
      if (row.hidden) return [];
      const checkbox = row.cells[column]?.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      );
      return checkbox && !checkbox.disabled ? [checkbox] : [];
    });

  const toggleColumn = (column: number, checked: boolean) => {
    applyBulkSelection(visibleCheckboxes(column), checked);
  };

  columns.forEach((column, index) => {
    const cell = header.cells[column];
    if (!cell) return;
    const labelText =
      readableWantListHeading(cell.getAttribute("aria-label")) ||
      readableWantListHeading(cell.title) ||
      readableWantListHeading(cell.textContent) ||
      `Offered item ${index + 1}`;
    columnLabels.set(column, labelText);
    cell.scope = "col";
    cell.classList.add("olwlg-want-matrix__offer-header");
    cell.removeAttribute("title");
    cell.style.setProperty("width", `${offerColumnWidth}px`, "important");
    cell.style.setProperty("min-width", `${offerColumnWidth}px`, "important");
    cell.style.setProperty("max-width", `${offerColumnWidth}px`, "important");

    const legacy = document.createElement("div");
    const headerLabel = document.createElement("span");
    const identifier = document.createElement("span");
    const bulk = document.createElement("button");
    legacy.className = "olwlg-want-matrix__legacy-header";
    legacy.hidden = true;
    while (cell.firstChild) legacy.append(cell.firstChild);
    identifier.className = "olwlg-want-matrix__column-id";
    identifier.textContent = String.fromCharCode(65 + (index % 26));
    headerLabel.className = "olwlg-want-matrix__column-title";
    headerLabel.textContent = labelText;
    headerLabel.classList.add("olwlg-tooltip-target");
    headerLabel.dataset.olwlgTooltip = labelText;
    headerLabel.setAttribute("aria-label", labelText);
    headerLabel.tabIndex = 0;
    bulk.type = "button";
    bulk.className = "olwlg-want-matrix__bulk";
    bulk.textContent = "Select All";
    bulk.setAttribute(
      "aria-label",
      `Select all visible items for ${labelText}`,
    );
    bulk.disabled = readOnly;
    bulk.addEventListener("click", () => {
      if (readOnly) return;
      const checkboxes = visibleCheckboxes(column);
      const shouldCheck = checkboxes.some((checkbox) => !checkbox.checked);
      toggleColumn(column, shouldCheck);
    });
    cell.append(legacy, identifier, headerLabel, bulk);
  });

  let valueOrderLegendLabel: Text | undefined;
  let valueOrderLegendItem: HTMLElement | undefined;
  [...header.cells].forEach((cell, column) => {
    cell.classList.add("olwlg-want-matrix__heading-cell");
    if (column < columns[0]) {
      cell.classList.add("olwlg-want-matrix__frozen");
      if (column === 0) return;
      cell.classList.add("olwlg-want-matrix__game-header");
      const axisLabel = document.createElement("span");
      const legend = document.createElement("span");
      const legendTitle = document.createElement("small");
      axisLabel.className = "olwlg-want-matrix__axis-label";
      axisLabel.innerHTML =
        "<span>Your offers →</span><strong>Wanted items ↓</strong>";
      legend.className = "olwlg-want-matrix__legend";
      legend.setAttribute("role", "list");
      legend.setAttribute("aria-label", "Matrix highlights");
      legendTitle.className = "olwlg-want-matrix__legend-title";
      legendTitle.textContent = "Highlights";
      legend.append(legendTitle);
      [
        ["selected", "Selected"],
        ["warning", "Review value order"],
        ["active", "Current row or column"],
        ["normal", "Not selected"],
      ].forEach(([kind, label]) => {
        const legendItem = document.createElement("span");
        const swatch = document.createElement("i");
        const labelNode = document.createTextNode(label);
        legendItem.className = "olwlg-want-matrix__legend-item";
        legendItem.setAttribute("role", "listitem");
        legendItem.dataset.olwlgLegendKind = kind;
        swatch.className =
          `olwlg-want-matrix__legend-swatch olwlg-want-matrix__legend-swatch--${kind}`;
        swatch.setAttribute("aria-hidden", "true");
        legendItem.append(swatch, labelNode);
        if (kind === "warning") {
          valueOrderLegendItem = legendItem;
          valueOrderLegendLabel = labelNode;
        }
        legend.append(legendItem);
      });
      axisLabel.append(legend);
      cell.prepend(axisLabel);
      cell.querySelectorAll<HTMLElement>(
        "a, button, input[type='button'], input[type='image'], input[type='submit']",
      ).forEach((control) => {
        const description = normalizedText(
          `${wantListControlLabel(control)} ${
            control.querySelector<HTMLImageElement>("img")?.alt ?? ""
          } ${control.querySelector<HTMLImageElement>("img")?.title ?? ""}`,
        );
        if (/\bhide\b/i.test(description)) control.remove();
      });
      cell
        .querySelectorAll<HTMLImageElement>(
          "img.hideimg, img.unhideimg, img[title*='hide' i]",
        )
        .forEach((image) => image.remove());
      cell.querySelectorAll("hr").forEach((separator) => separator.remove());
      const legacyHeader = document.createElement("div");
      legacyHeader.className = "olwlg-want-matrix__legacy-game-header";
      legacyHeader.hidden = true;
      [...cell.childNodes]
        .filter((node) => node !== axisLabel)
        .forEach((node) => legacyHeader.append(node));
      cell.append(legacyHeader);
      const width = detailColumnWidth;
      cell.style.setProperty("width", `${width}px`, "important");
      cell.style.setProperty("min-width", `${width}px`, "important");
      cell.style.setProperty("max-width", `${width}px`, "important");
    }
  });

  const valueOrderWarningDescription =
    "Based on your values and selections, OLWLG thinks you may be offering a higher-valued item without also offering this lower-valued one. This is only a consistency hint; it does not block saving or affect TradeMaximizer.";

  rows.forEach((row) => {
    const identity = rowIdentity(row);
    decorateGameCell(identity.detailCell);
    row.dataset.olwlgWantSearch = identity.searchText;
    [...row.cells].forEach((cell, column) => {
      if (column < columns[0]) {
        cell.classList.add("olwlg-want-matrix__frozen");
        if (column === 0) return;
        const width = detailColumnWidth;
        cell.style.setProperty("width", `${width}px`, "important");
        cell.style.setProperty("min-width", `${width}px`, "important");
        cell.style.setProperty("max-width", `${width}px`, "important");
      }
      if (!columns.includes(column)) return;
      cell.classList.add("olwlg-want-matrix__choice");
      cell.style.setProperty("width", `${offerColumnWidth}px`, "important");
      cell.style.setProperty("min-width", `${offerColumnWidth}px`, "important");
      cell.style.setProperty("max-width", `${offerColumnWidth}px`, "important");
      const sourcePresentation = sourceCellPresentation.get(cell);
      const sourceColorKeys =
        sourcePresentation?.colorKeys ?? backgroundColorKeys(cell);
      const isRedHighlight = sourceColorKeys.some((color) =>
        [
          "red",
          "#f00",
          "#ff0000",
          "rgb(255,0,0)",
          "rgba(255,0,0,1)",
        ].includes(color)
      );
      const isYellowHighlight =
        sourceColorKeys.some(isValueOrderWarningColor) ||
        /(?:^|[\s_-])(?:yellow|value[\s_-]*order|order[\s_-]*warning)(?:$|[\s_-])/i
          .test(sourcePresentation?.statusHint ?? "");
      const originalColor = getComputedStyle(cell).backgroundColor;
      if (isRedHighlight) {
        cell.style.removeProperty("background");
        cell.style.removeProperty("background-color");
        cell.removeAttribute("bgcolor");
        cell.classList.add("olwlg-want-matrix__choice--red-neutralized");
      } else if (
        originalColor &&
        originalColor !== "rgba(0, 0, 0, 0)" &&
        originalColor !== "rgb(255, 255, 255)"
      ) {
        cell.style.setProperty("--olwlg-want-status-color", originalColor);
        cell.classList.add("olwlg-want-matrix__choice--status");
      }

      const checkbox = cell.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      );
      if (!checkbox) return;
      const columnLabel = columnLabels.get(column) ?? `offered item ${column}`;
      const colorLabel = sourceColorKeys
        .map((color) => colorGuideLabels.get(color))
        .find(Boolean);
      const statusLabel = isYellowHighlight
        ? "OLWLG value-order warning"
        : colorLabel ??
          (cell.classList.contains("olwlg-want-matrix__choice--status")
            ? "Highlighted by OLWLG"
            : "");
      const checkboxLabel =
        `Accept ${identity.item} in exchange for ${columnLabel}${
          statusLabel ? `. Status: ${statusLabel}` : ""
        }`;
      checkbox.setAttribute("aria-label", checkboxLabel);
      if (isYellowHighlight) {
        checkbox.setAttribute(
          "aria-description",
          valueOrderWarningDescription,
        );
        cell.classList.add("olwlg-want-matrix__choice--value-warning");
      }
      checkbox.removeAttribute("title");
      cell.classList.add("olwlg-tooltip-target");
      cell.dataset.olwlgTooltipKind = "matrix-cell";
      cell.dataset.olwlgRowNumber = String(rows.indexOf(row) + 1);
      cell.dataset.olwlgRowLabel = identity.item;
      cell.dataset.olwlgRowOwner = identity.owner;
      cell.dataset.olwlgColumnId = String.fromCharCode(
        65 + (columns.indexOf(column) % 26),
      );
      cell.dataset.olwlgColumnLabel = columnLabel;
      cell.dataset.olwlgStatusLabel = statusLabel;
      cell.dataset.olwlgStatusKind = isYellowHighlight
        ? "value-order-warning"
        : statusLabel
          ? "legacy-highlight"
          : "";
      if (isYellowHighlight)
        cell.dataset.olwlgStatusDescription = valueOrderWarningDescription;
      cell.dataset.olwlgTooltip = checkboxLabel;
    });
  });

  const valueOrderWarningCount = rows.reduce(
    (count, row) =>
      count + row.querySelectorAll(
        ".olwlg-want-matrix__choice--value-warning",
      ).length,
    0,
  );
  if (valueOrderLegendLabel && valueOrderLegendItem) {
    valueOrderLegendLabel.data =
      `Review value order (${valueOrderWarningCount})`;
    valueOrderLegendItem.classList.toggle(
      "olwlg-want-matrix__legend-item--inactive",
      valueOrderWarningCount === 0,
    );
    valueOrderLegendItem.title = valueOrderWarningCount
      ? `${valueOrderWarningCount} value-order warning${valueOrderWarningCount === 1 ? "" : "s"} in this matrix.`
      : "OLWLG did not report any value-order warnings in this matrix.";
  }

  const focusEditor = document.createElement("section");
  const offerRail = document.createElement("aside");
  const offerRailHeading = document.createElement("div");
  const offerRailList = document.createElement("div");
  const focusPanel = document.createElement("div");
  const focusPanelHeading = document.createElement("header");
  const focusPanelCopy = document.createElement("div");
  const focusPanelTitle = document.createElement("h2");
  const focusPanelSummary = document.createElement("p");
  const focusBulk = document.createElement("button");
  const focusList = document.createElement("ul");
  const focusEmpty = document.createElement("p");
  const offerButtons = new Map<number, HTMLButtonElement>();
  const offerCounts = new Map<number, HTMLElement>();
  const focusedRows = new Map<
    HTMLTableRowElement,
    {
      element: HTMLLIElement;
      status: HTMLElement;
      toggle: HTMLButtonElement;
      valueProxy?: HTMLInputElement;
      valueSource?: HTMLInputElement;
    }
  >();

  focusEditor.className = "olwlg-want-focus";
  focusEditor.setAttribute("aria-label", "Focused want-list editor");
  offerRail.className = "olwlg-want-focus__offers";
  offerRailHeading.className = "olwlg-want-focus__offers-heading";
  offerRailHeading.innerHTML =
    "<strong>Your offers</strong><span>Choose one item to edit</span>";
  offerRailList.className = "olwlg-want-focus__offer-list";
  offerRailList.setAttribute("aria-label", "Your offered items");
  focusPanel.className = "olwlg-want-focus__panel";
  focusPanelHeading.className = "olwlg-want-focus__panel-heading";
  focusPanelCopy.className = "olwlg-want-focus__panel-copy";
  focusPanelTitle.className = "olwlg-want-focus__panel-title";
  focusPanelSummary.className = "olwlg-want-focus__panel-summary";
  focusBulk.type = "button";
  focusBulk.className = "olwlg-want-focus__bulk";
  focusList.className = "olwlg-want-focus__list";
  focusList.setAttribute("role", "list");
  focusEmpty.className = "olwlg-want-focus__empty";
  focusEmpty.textContent = "No wanted items match the current filters.";
  focusEmpty.hidden = true;

  columns.forEach((column, index) => {
    const button = document.createElement("button");
    const identifier = document.createElement("span");
    const label = document.createElement("span");
    const count = document.createElement("strong");
    button.type = "button";
    button.className =
      "olwlg-want-focus__offer olwlg-tooltip-target";
    button.setAttribute("aria-pressed", String(column === activeFocusColumn));
    identifier.className = "olwlg-want-focus__offer-id";
    identifier.textContent = String.fromCharCode(65 + (index % 26));
    label.className = "olwlg-want-focus__offer-name";
    label.textContent = columnLabels.get(column) ?? `Offered item ${index + 1}`;
    button.dataset.olwlgTooltip =
      `Edit acceptable trades for ${label.textContent}`;
    count.className = "olwlg-want-focus__offer-count";
    button.append(identifier, label, count);
    button.addEventListener("click", () => {
      activeFocusColumn = column;
      render();
    });
    offerButtons.set(column, button);
    offerCounts.set(column, count);
    offerRailList.append(button);
  });

  rows.forEach((row) => {
    const identity = rowIdentity(row);
    const item = document.createElement("li");
    const itemCopy = document.createElement("div");
    const titleRow = document.createElement("div");
    const metadata = document.createElement("div");
    const sourceTitle = identity.detailCell?.querySelector<HTMLAnchorElement>(
      ".olwlg-want-game__title",
    );
    const itemTitle = sourceTitle
      ? cloneElement(sourceTitle)
      : document.createElement("strong");
    const owner = identity.owner
      ? document.createElement("a")
      : document.createElement("span");
    const status = document.createElement("span");
    const controls = document.createElement("div");
    const toggle = document.createElement("button");
    const toggleMark = document.createElement("span");
    const toggleLabel = document.createElement("span");
    const valueSource = identity.detailCell?.querySelector<HTMLInputElement>(
      ".olwlg-want-game__value-input",
    ) ?? undefined;
    let valueProxy: HTMLInputElement | undefined;

    item.className = "olwlg-want-focus__item";
    itemCopy.className = "olwlg-want-focus__item-copy";
    titleRow.className = "olwlg-want-focus__item-title-row";
    metadata.className = "olwlg-want-focus__item-meta";
    itemTitle.classList.add("olwlg-want-focus__item-title");
    if (!(itemTitle instanceof HTMLAnchorElement))
      itemTitle.textContent = identity.item;
    itemTitle.classList.add("olwlg-tooltip-target");
    itemTitle.dataset.olwlgTooltip = identity.owner
      ? `${identity.item} — offered by ${identity.owner}`
      : identity.item;
    owner.className = "olwlg-want-focus__item-owner";
    owner.textContent = identity.owner ? `From ${identity.owner}` : "Participant unknown";
    if (identity.owner) {
      if (owner instanceof HTMLAnchorElement) {
        owner.href = identity.ownerUrl ??
          `https://boardgamegeek.com/user/${encodeURIComponent(identity.owner)}`;
        owner.target = "_blank";
        owner.rel = "noreferrer";
        owner.setAttribute(
          "aria-label",
          `View ${identity.owner} on BoardGameGeek`,
        );
      }
      owner.classList.add("olwlg-tooltip-target");
      owner.dataset.olwlgTooltip =
        `View ${identity.owner} on BoardGameGeek`;
    }
    status.className = "olwlg-want-focus__item-status";
    controls.className = "olwlg-want-focus__item-controls";
    toggle.type = "button";
    toggle.className = "olwlg-want-focus__toggle";
    toggle.setAttribute("role", "checkbox");
    toggle.setAttribute("aria-checked", "false");
    toggleMark.className = "olwlg-want-focus__toggle-mark";
    toggleMark.setAttribute("aria-hidden", "true");
    toggleMark.textContent = "✓";
    toggleLabel.textContent = "Accept this trade";
    toggle.append(toggleMark, toggleLabel);
    toggle.addEventListener("click", () => {
      const checkbox = row.cells[activeFocusColumn]
        ?.querySelector<HTMLInputElement>('input[type="checkbox"]');
      if (checkbox && !checkbox.disabled) checkbox.click();
    });

    titleRow.append(itemTitle);
    metadata.append(owner, status);
    itemCopy.append(titleRow, metadata);

    if (valueSource) {
      const valueField = document.createElement("label");
      const valueLabel = document.createElement("span");
      valueProxy = document.createElement("input");
      valueField.className = "olwlg-want-focus__value";
      valueLabel.textContent = "Value";
      valueProxy.type = "text";
      valueProxy.value = valueSource.value;
      valueProxy.disabled = readOnly || valueSource.disabled;
      valueProxy.setAttribute("aria-label", `Value for ${identity.item}`);
      valueProxy.addEventListener("input", () => {
        if (valueSource.value === valueProxy?.value) return;
        valueSource.value = valueProxy?.value ?? "";
        valueSource.dispatchEvent(new Event("input", { bubbles: true }));
      });
      valueProxy.addEventListener("change", () => {
        valueSource.dispatchEvent(new Event("change", { bubbles: true }));
      });
      valueField.append(valueLabel, valueProxy);
      controls.append(valueField);
    }
    controls.append(toggle);
    item.append(itemCopy, controls);
    focusList.append(item);
    focusedRows.set(row, { element: item, status, toggle, valueProxy, valueSource });
  });

  focusBulk.addEventListener("click", () => {
    const visible = rows.flatMap((row) => {
      const focused = focusedRows.get(row);
      const checkbox = row.cells[activeFocusColumn]
        ?.querySelector<HTMLInputElement>('input[type="checkbox"]');
      return focused && !focused.element.hidden && checkbox && !checkbox.disabled
        ? [checkbox]
        : [];
    });
    const shouldCheck = visible.some((checkbox) => !checkbox.checked);
    applyBulkSelection(visible, shouldCheck);
  });

  offerRail.append(offerRailHeading, offerRailList);
  focusPanelCopy.append(focusPanelTitle, focusPanelSummary);
  focusPanelHeading.append(focusPanelCopy, focusBulk);
  focusPanel.append(focusPanelHeading, focusList, focusEmpty);
  focusEditor.append(offerRail, focusPanel);
  review.insertAdjacentElement("afterend", focusEditor);

  const cellInformation = document.getElementById("cellinfo");
  if (cellInformation instanceof HTMLElement) {
    cellInformation.hidden = true;
    cellInformation.setAttribute("aria-hidden", "true");
    cellInformation.classList.add("olwlg-want-matrix__cell-info-source");
  }

  const updateCellInformationTooltip = (cell: HTMLTableCellElement) => {
    const checkbox = cell.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    if (!checkbox) return;
    cell.dataset.olwlgSelected = String(checkbox.checked);
    showTooltip(cell);
  };

  let openReviewGroup: HTMLDetailsElement | undefined;
  const closeReviewGroup = () => {
    if (openReviewGroup) openReviewGroup.open = false;
    openReviewGroup = undefined;
  };
  document.addEventListener("pointerdown", (event) => {
    if (
      openReviewGroup &&
      event.target instanceof Node &&
      !openReviewGroup.contains(event.target)
    )
      closeReviewGroup();
  });
  window.addEventListener(
    "scroll",
    (event) => {
      if (
        openReviewGroup &&
        event.target instanceof Node &&
        openReviewGroup.contains(event.target)
      ) {
        return;
      }

      closeReviewGroup();
    },
    true,
  );
  window.addEventListener("resize", closeReviewGroup);

  const renderReview = (dirty: boolean) => {
    openReviewGroup = undefined;
    review.replaceChildren();
    const selectedByColumn = new Map(
      columns.map((column) => [
        column,
        rows.filter((row) =>
          row.cells[column]?.querySelector<HTMLInputElement>(
            'input[type="checkbox"]',
          )?.checked
        ),
      ]),
    );
    const selectedCount = [...selectedByColumn.values()].reduce(
      (total, selectedRows) => total + selectedRows.length,
      0,
    );
    const emptyColumns = columns.filter(
      (column) => !selectedByColumn.get(column)?.length,
    );
    const status = document.createElement("header");
    const statusCopy = document.createElement("div");
    const eyebrow = document.createElement("span");
    const heading = document.createElement("h2");
    const metrics = document.createElement("p");
    const validation = document.createElement("div");
    status.className = "olwlg-want-review__status";
    statusCopy.className = "olwlg-want-review__status-copy";
    eyebrow.className = "olwlg-want-review__eyebrow";
    eyebrow.textContent = dirty
      ? "Save required"
      : emptyColumns.length
        ? "Check before submission"
        : submissionConfirmed
          ? "Submission confirmed"
          : "Review complete";
    heading.textContent = dirty
      ? "Save your latest edits before submitting"
      : emptyColumns.length
        ? `Review ${emptyColumns.length} offer${emptyColumns.length === 1 ? "" : "s"} with no acceptable trades`
        : submissionConfirmed
          ? "Want list submitted successfully"
          : "Ready to submit";
    metrics.textContent =
      `${columns.length} offered item${columns.length === 1 ? "" : "s"} · ${selectedCount} acceptable trade${selectedCount === 1 ? "" : "s"} · ${columns.length - emptyColumns.length}/${columns.length} offers covered`;
    statusCopy.append(eyebrow, heading, metrics);
    status.append(statusCopy);
    review.append(status);

    validation.className = "olwlg-want-review__validation";
    if (dirty) {
      status.classList.add("olwlg-want-review__status--blocking");
      validation.classList.add("olwlg-want-review__validation--blocking");
      validation.innerHTML =
        "<strong>Unsaved changes</strong><span>Use Save edits before submitting. Step 5 only submits the last saved version.</span>";
      review.append(validation);
    } else if (emptyColumns.length) {
      status.classList.add("olwlg-want-review__status--warning");
      validation.innerHTML =
        `<strong>${emptyColumns.length} offer${emptyColumns.length === 1 ? " has" : "s have"} no acceptable trades</strong><span>This can be intentional, but those items cannot trade under the current list.</span>`;
      review.append(validation);
    }

    const groupHeading = document.createElement("div");
    const groupTitle = document.createElement("strong");
    const groupHint = document.createElement("span");
    groupHeading.className = "olwlg-want-review__heading";
    groupTitle.textContent = "Selections by your offered item";
    groupHint.textContent = "Expand a group to inspect what you would accept.";
    groupHeading.append(groupTitle, groupHint);
    review.append(groupHeading);

    const groups = document.createElement("div");
    groups.className = "olwlg-want-review__groups";
    columns.forEach((column, index) => {
      const selectedRows = selectedByColumn.get(column) ?? [];
      const group = selectedRows.length
        ? document.createElement("details")
        : document.createElement("article");
      const groupSummary = selectedRows.length
        ? document.createElement("summary")
        : document.createElement("div");
      const groupIdentity = document.createElement("span");
      const groupIdentifier = document.createElement("small");
      const groupName = document.createElement("span");
      const count = document.createElement("strong");
      const list = document.createElement("ul");
      group.className = "olwlg-want-review__group";
      groupSummary.className = "olwlg-want-review__group-summary";
      groupIdentity.className = "olwlg-want-review__group-identity";
      groupIdentifier.textContent = String.fromCharCode(65 + (index % 26));
      groupName.textContent =
        columnLabels.get(column) ?? `Offered item ${index + 1}`;
      groupIdentity.append(groupIdentifier, groupName);
      count.textContent = selectedRows.length
        ? `${selectedRows.length} acceptable trade${selectedRows.length === 1 ? "" : "s"}`
        : "No acceptable trades";
      if (!selectedRows.length) {
        group.classList.add("olwlg-want-review__group--empty");
        groupSummary.setAttribute("aria-disabled", "true");
      }
      groupSummary.append(groupIdentity, count);
      selectedRows.forEach((row) => {
        const item = document.createElement("li");
        item.textContent = rowIdentity(row).label;
        list.append(item);
      });
      if (group instanceof HTMLDetailsElement) {
        list.setAttribute(
          "aria-label",
          `Acceptable trades for ${groupName.textContent}`,
        );
        group.addEventListener("toggle", () => {
          if (!group.open) {
            if (openReviewGroup === group) openReviewGroup = undefined;
            return;
          }
          if (openReviewGroup && openReviewGroup !== group)
            openReviewGroup.open = false;
          openReviewGroup = group;
          requestAnimationFrame(() => {
            if (!group.open) return;
            const summaryRect = groupSummary.getBoundingClientRect();
            const margin = 16;
            const gap = 7;
            const width = Math.min(
              Math.max(summaryRect.width, 320),
              window.innerWidth - margin * 2,
            );
            const height = Math.min(Math.max(list.scrollHeight, 80), 280);
            const left = Math.min(
              window.innerWidth - width - margin,
              Math.max(margin, summaryRect.left),
            );
            const fitsBelow =
              window.innerHeight - summaryRect.bottom >= height + gap + margin;
            const top = fitsBelow
              ? summaryRect.bottom + gap
              : Math.max(margin, summaryRect.top - height - gap);
            list.style.width = `${Math.round(width)}px`;
            list.style.left = `${Math.round(left)}px`;
            list.style.top = `${Math.round(top)}px`;
            list.style.maxHeight = `${Math.round(height)}px`;
          });
        });
        group.append(groupSummary, list);
      } else group.append(groupSummary);
      groups.append(group);
    });
    review.append(groups);

    if (!nativeSubmit && nativeSubmissionView) {
      const continuation = document.createElement("p");
      continuation.className = "olwlg-want-review__continuation";
      continuation.textContent =
        "OLWLG provides the final submission control in its submission view. Continue there after reviewing this summary.";
      review.append(continuation);
    }
  };

  const isDirty = () =>
    matrixInputs.some((input) => {
      const initial = initialValues.get(input);
      return input.type === "checkbox"
        ? input.checked !== initial
        : input.value !== initial;
    });

  const render = () => {
    const queryTokens = normalizedWantListSearchText(search.value)
      .split(" ")
      .filter(Boolean);
    const selectedFilter = filter.value;
    let focusedVisibleCount = 0;
    rows.forEach((row) => {
      const selectedAnywhere = columns.some((column) =>
        row.cells[column]?.querySelector<HTMLInputElement>(
          'input[type="checkbox"]',
        )?.checked
      );
      const activeCell = row.cells[activeFocusColumn];
      const activeCheckbox = activeCell?.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      );
      const selectedForActiveOffer = Boolean(activeCheckbox?.checked);
      const rowSearchText = row.dataset.olwlgWantSearch ??
        rowIdentity(row).searchText;
      const matchesSearch = queryTokens.every((token) =>
        rowSearchText.includes(token)
      );
      const matchesMatrixFilter = selectedFilter === "all" ||
        (selectedFilter === "selected" && selectedAnywhere) ||
        (selectedFilter === "unselected" && !selectedAnywhere);
      const matchesFocusFilter = selectedFilter === "all" ||
        (selectedFilter === "selected" && selectedForActiveOffer) ||
        (selectedFilter === "unselected" && !selectedForActiveOffer);
      row.hidden = !matchesSearch || !matchesMatrixFilter;

      const focused = focusedRows.get(row);
      if (!focused) return;
      focused.element.hidden =
        !activeCheckbox || !matchesSearch || !matchesFocusFilter;
      if (!focused.element.hidden) focusedVisibleCount += 1;
      focused.toggle.disabled = readOnly || !activeCheckbox || activeCheckbox.disabled;
      focused.toggle.setAttribute(
        "aria-checked",
        String(selectedForActiveOffer),
      );
      focused.toggle.classList.add("olwlg-tooltip-target");
      focused.toggle.dataset.olwlgTooltip =
        `${selectedForActiveOffer ? "Remove" : "Add"} ${rowIdentity(row).item} ${
          selectedForActiveOffer ? "from" : "to"
        } the acceptable trades for ${columnLabels.get(activeFocusColumn) ?? "this offer"}.`;
      focused.toggle.classList.toggle(
        "olwlg-want-focus__toggle--selected",
        selectedForActiveOffer,
      );
      const toggleText = focused.toggle.querySelector<HTMLElement>(
        ".olwlg-want-focus__toggle-mark + span",
      );
      if (toggleText)
        toggleText.textContent = selectedForActiveOffer
          ? "Selected"
          : "Select this item";
      const statusLabel = activeCell?.dataset.olwlgStatusLabel;
      const isValueWarning =
        activeCell?.dataset.olwlgStatusKind === "value-order-warning";
      focused.status.textContent = isValueWarning
        ? "⚠ Review value order"
        : statusLabel
          ? `Collection: ${statusLabel}`
          : "";
      focused.status.classList.toggle(
        "olwlg-want-focus__item-status--value-warning",
        isValueWarning,
      );
      focused.status.classList.toggle(
        "olwlg-tooltip-target",
        isValueWarning,
      );
      if (isValueWarning) {
        focused.status.dataset.olwlgTooltip =
          activeCell?.dataset.olwlgStatusDescription ??
            valueOrderWarningDescription;
        focused.status.tabIndex = 0;
        focused.status.setAttribute(
          "aria-label",
          "Review value order warning",
        );
      } else {
        delete focused.status.dataset.olwlgTooltip;
        focused.status.removeAttribute("tabindex");
        focused.status.removeAttribute("aria-label");
        focused.status.removeAttribute("aria-describedby");
      }
      focused.status.hidden = !statusLabel;
      if (
        focused.valueProxy &&
        focused.valueSource &&
        focused.valueProxy.value !== focused.valueSource.value
      )
        focused.valueProxy.value = focused.valueSource.value;
    });

    const allCheckboxes = columns.flatMap((column) =>
      rows.flatMap((row) => {
        const checkbox = row.cells[column]?.querySelector<HTMLInputElement>(
          'input[type="checkbox"]',
        );
        return checkbox ? [checkbox] : [];
      })
    );
    const selectedCount = allCheckboxes.filter(
      (checkbox) => checkbox.checked,
    ).length;
    const populatedColumns = columns.filter((column) =>
      rows.some((row) =>
        row.cells[column]?.querySelector<HTMLInputElement>(
          'input[type="checkbox"]',
        )?.checked
      )
    ).length;
    const visibleRowCount = rows.filter((row) => !row.hidden).length;
    const dirty = isDirty();
    const displayedRowCount = workspaceView === "focus"
      ? focusedVisibleCount
      : visibleRowCount;
    summary.textContent =
      `${displayedRowCount}/${rows.length} wanted items · ${selectedCount} acceptable trade${selectedCount === 1 ? "" : "s"} · ${populatedColumns}/${columns.length} offers covered${
        dirty ? " · Unsaved changes" : ""
      }`;
    summary.classList.toggle(
      "olwlg-want-matrix-toolbar__summary--dirty",
      dirty,
    );
    revert.disabled = !dirty;
    save.disabled = workspaceView === "review" ? dirty : !dirty;
    save.setAttribute("aria-disabled", String(save.disabled));
    document
      .querySelectorAll<HTMLButtonElement>(
        ".olwlg-mywants-action--confirm, .olwlg-mywants-action--reset",
      )
      .forEach((action) => {
        action.disabled = !dirty;
        action.setAttribute("aria-disabled", String(!dirty));
      });

    columns.forEach((column, index) => {
      const checkboxes = visibleCheckboxes(column);
      const selectedForColumn = rows.filter((row) =>
        row.cells[column]?.querySelector<HTMLInputElement>(
          'input[type="checkbox"]',
        )?.checked
      ).length;
      const offerButton = offerButtons.get(column);
      const offerCount = offerCounts.get(column);
      offerButton?.classList.toggle(
        "olwlg-want-focus__offer--active",
        column === activeFocusColumn,
      );
      offerButton?.setAttribute(
        "aria-pressed",
        String(column === activeFocusColumn),
      );
      if (offerCount)
        offerCount.textContent = `${selectedForColumn} accepted`;
      const bulk = header.cells[column]?.querySelector<HTMLButtonElement>(
        ".olwlg-want-matrix__bulk",
      );
      if (!bulk) return;
      const allChecked =
        checkboxes.length > 0 &&
        checkboxes.every((checkbox) => checkbox.checked);
      const columnLabel =
        columnLabels.get(column) ?? `offered item ${column}`;
      bulk.textContent = allChecked
        ? "Clear All"
        : "Select All";
      bulk.setAttribute(
        "aria-label",
        allChecked
          ? `Clear all visible selections for ${columnLabel}`
          : `Select all visible items for ${columnLabel}`,
      );
      bulk.disabled = readOnly || !checkboxes.length;
      bulk.dataset.olwlgColumnIndex = String(index);
    });

    const activeLabel = columnLabels.get(activeFocusColumn) ?? "Offered item";
    const activeVisibleCheckboxes = rows.flatMap((row) => {
      const focused = focusedRows.get(row);
      const checkbox = row.cells[activeFocusColumn]
        ?.querySelector<HTMLInputElement>('input[type="checkbox"]');
      return focused && !focused.element.hidden && checkbox && !checkbox.disabled
        ? [checkbox]
        : [];
    });
    const activeSelected = rows.filter((row) =>
      row.cells[activeFocusColumn]?.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      )?.checked
    ).length;
    const allVisibleChecked = activeVisibleCheckboxes.length > 0 &&
      activeVisibleCheckboxes.every((checkbox) => checkbox.checked);
    focusPanelTitle.textContent = `Acceptable trades for ${activeLabel}`;
    focusPanelTitle.classList.add("olwlg-tooltip-target");
    focusPanelTitle.dataset.olwlgTooltip = activeLabel;
    focusPanelSummary.textContent =
      `${activeSelected} selected · ${focusedVisibleCount} shown.`;
    focusBulk.textContent = allVisibleChecked
      ? "Clear visible"
      : "Select visible";
    focusBulk.disabled = readOnly || !activeVisibleCheckboxes.length;
    focusBulk.setAttribute(
      "aria-label",
      `${allVisibleChecked ? "Clear" : "Select"} all visible trades for ${activeLabel}`,
    );
    focusBulk.classList.add("olwlg-tooltip-target");
    focusBulk.dataset.olwlgTooltip =
      `${allVisibleChecked ? "Clear" : "Select"} the ${activeVisibleCheckboxes.length} currently visible trade${activeVisibleCheckboxes.length === 1 ? "" : "s"} for ${activeLabel}.`;
    focusEmpty.hidden = focusedVisibleCount > 0;

    if (workspaceView === "review") {
      step.textContent = "Step 5 of 5";
      title.textContent = "Review & submit";
      search.hidden = true;
      filter.hidden = true;
      viewSwitch.hidden = true;
      revert.hidden = true;
      cancel.hidden = false;
      cancel.textContent = readOnly ? "Back to offers" : "Back to editing";
      const submitSource = nativeSubmit ?? nativeSubmissionView;
      save.hidden = readOnly || !submitSource;
      save.textContent = nativeSubmit
        ? submissionConfirmed ||
            /\bresubmit/i.test(wantListControlLabel(nativeSubmit))
          ? "Resubmit want lists"
          : "Submit want lists"
        : "Continue to submission";
      actionHelp.textContent = dirty
        ? "Save edits before submitting. Step 5 uses the last saved version."
        : submissionConfirmed
          ? "You can edit and resubmit your want lists until the deadline."
        : nativeSubmit
          ? "Submission sends the reviewed want lists to OLWLG."
          : "Continue to OLWLG’s submission view to finish.";
    } else {
      step.textContent = "Step 4 of 5";
      title.textContent = "Build wants";
      search.hidden = false;
      filter.hidden = false;
      viewSwitch.hidden = false;
      revert.hidden = readOnly;
      cancel.hidden = false;
      cancel.textContent = "Review →";
      save.hidden = readOnly || !nativeConfirm;
      save.textContent = "Save edits";
      actionHelp.textContent = readOnly
        ? "This trade is read-only; selections cannot be changed."
        : "Saving edits does not submit your want lists.";
    }
    renderReview(dirty);
  };

  setWorkspaceView = (view) => {
    hideTooltip(undefined, true);
    workspaceView = view;
    document.body.dataset.olwlgWantView = view;
    focusEditor.hidden = view !== "focus";
    wrapper.hidden = view !== "matrix";
    review.hidden = view !== "review";
    focusView.classList.toggle(
      "olwlg-want-view-switch__option--active",
      view === "focus",
    );
    matrixView.classList.toggle(
      "olwlg-want-view-switch__option--active",
      view === "matrix",
    );
    focusView.setAttribute("aria-pressed", String(view === "focus"));
    matrixView.setAttribute("aria-pressed", String(view === "matrix"));
    render();
    scheduleStickyHeaderUpdate();
  };

  search.addEventListener("input", render);
  filter.addEventListener("change", render);
  revert.addEventListener("click", () => {
    matrixInputs.forEach((input) => {
      const initial = initialValues.get(input);
      if (input.type === "checkbox") {
        const checked = Boolean(initial);
        if (input.checked !== checked) input.click();
      } else {
        input.value = String(initial ?? "");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    render();
  });
  table.addEventListener("change", (event) => {
    render();
    const cell = event.target instanceof Element
      ? event.target.closest<HTMLTableCellElement>(
        "td.olwlg-want-matrix__choice",
      )
      : null;
    if (cell && (cell.matches(":hover") || cell.contains(document.activeElement)))
      updateCellInformationTooltip(cell);
  });
  table.addEventListener("input", render);

  let matrixPan: {
    dragged: boolean;
    pointerId: number;
    scrollLeft: number;
    scrollY: number;
    startX: number;
    startY: number;
  } | undefined;
  let suppressMatrixClick = false;
  const finishMatrixPan = (pointerId: number) => {
    if (!matrixPan || matrixPan.pointerId !== pointerId) return;
    const dragged = matrixPan.dragged;
    matrixPan = undefined;
    wrapper.classList.remove("olwlg-want-matrix__scroll--dragging");
    document.body.classList.remove("olwlg-matrix-pan-active");
    if (wrapper.hasPointerCapture(pointerId))
      wrapper.releasePointerCapture(pointerId);
    if (dragged) {
      hideTooltip(undefined, true);
      suppressMatrixClick = true;
      window.setTimeout(() => {
        suppressMatrixClick = false;
      }, 0);
    }
  };
  wrapper.addEventListener("pointerdown", (event) => {
    if (
      event.pointerType !== "mouse" ||
      event.button !== 0 ||
      !(event.target instanceof Element) ||
      event.target.closest(
        "a, button, input, label, select, textarea, [contenteditable='true']",
      )
    )
      return;

    event.preventDefault();
    matrixPan = {
      dragged: false,
      pointerId: event.pointerId,
      scrollLeft: bodyViewport.scrollLeft,
      scrollY: window.scrollY,
      startX: event.clientX,
      startY: event.clientY,
    };
    wrapper.setPointerCapture(event.pointerId);
  });
  wrapper.addEventListener("pointermove", (event) => {
    if (!matrixPan || matrixPan.pointerId !== event.pointerId) return;
    if (!(event.buttons & 1)) {
      finishMatrixPan(event.pointerId);
      return;
    }

    const deltaX = event.clientX - matrixPan.startX;
    const deltaY = event.clientY - matrixPan.startY;
    if (!matrixPan.dragged && Math.hypot(deltaX, deltaY) < 5) return;
    if (!matrixPan.dragged) {
      matrixPan.dragged = true;
      wrapper.classList.add("olwlg-want-matrix__scroll--dragging");
      document.body.classList.add("olwlg-matrix-pan-active");
      hideTooltip(undefined, true);
    }

    event.preventDefault();
    bodyViewport.scrollLeft = matrixPan.scrollLeft - deltaX;
    window.scrollTo({
      behavior: "auto",
      left: window.scrollX,
      top: matrixPan.scrollY - deltaY,
    });
  });
  wrapper.addEventListener("pointerup", (event) => {
    finishMatrixPan(event.pointerId);
  });
  wrapper.addEventListener("pointercancel", (event) => {
    finishMatrixPan(event.pointerId);
  });
  wrapper.addEventListener("lostpointercapture", (event) => {
    finishMatrixPan(event.pointerId);
  });
  wrapper.addEventListener(
    "click",
    (event) => {
      if (!suppressMatrixClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressMatrixClick = false;
    },
    true,
  );

  table.addEventListener("pointerover", (event) => {
    const cell =
      event.target instanceof Element ? event.target.closest("td, th") : null;
    const row = cell?.closest("tr");
    if (!(cell instanceof HTMLTableCellElement) || !row) return;
    rows.forEach((candidate) =>
      candidate.classList.toggle(
        "olwlg-want-matrix__row--active",
        candidate === row,
      )
    );
    setActiveColumn(columns.includes(cell.cellIndex) ? cell.cellIndex : -1);
    if (cell.classList.contains("olwlg-want-matrix__choice"))
      updateCellInformationTooltip(cell);
  });
  table.addEventListener("pointerout", (event) => {
    const cell =
      event.target instanceof Element
        ? event.target.closest<HTMLTableCellElement>(
          "td.olwlg-want-matrix__choice",
        )
        : null;
    const nextTarget =
      event.relatedTarget instanceof Node ? event.relatedTarget : null;
    if (!cell || cell.contains(nextTarget)) return;
    hideTooltip(cell);
  });
  table.addEventListener("pointerleave", () => {
    rows.forEach((row) =>
      row.classList.remove("olwlg-want-matrix__row--active")
    );
    setActiveColumn(-1);
  });
  table.addEventListener("focusin", (event) => {
    const cell =
      event.target instanceof Element ? event.target.closest("td, th") : null;
    if (!(cell instanceof HTMLTableCellElement)) return;
    rows.forEach((row) =>
      row.classList.toggle(
        "olwlg-want-matrix__row--active",
        row === cell.parentElement,
      )
    );
    setActiveColumn(columns.includes(cell.cellIndex) ? cell.cellIndex : -1);
    if (cell.classList.contains("olwlg-want-matrix__choice"))
      updateCellInformationTooltip(cell);
  });
  table.addEventListener("keydown", (event) => {
    if (
      !(event.target instanceof HTMLInputElement) ||
      event.target.type !== "checkbox" ||
      !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
    )
      return;
    const cell = event.target.closest<HTMLTableCellElement>("td");
    const row = cell?.parentElement;
    if (!cell || !(row instanceof HTMLTableRowElement)) return;
    const visibleRows = rows.filter((candidate) => !candidate.hidden);
    const rowIndex = visibleRows.indexOf(row);
    const columnIndex = columns.indexOf(cell.cellIndex);
    const targetRow = event.key === "ArrowUp"
      ? visibleRows[rowIndex - 1]
      : event.key === "ArrowDown"
        ? visibleRows[rowIndex + 1]
        : row;
    const targetColumn = event.key === "ArrowLeft"
      ? columns[columnIndex - 1]
      : event.key === "ArrowRight"
        ? columns[columnIndex + 1]
        : cell.cellIndex;
    const target = targetRow?.cells[targetColumn]?.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    if (!target) return;
    event.preventDefault();
    target.focus();
  });
  let formIsSubmitting = false;
  form?.addEventListener("reset", () => window.setTimeout(render, 0));
  form?.addEventListener("submit", () => {
    formIsSubmitting = true;
    summary.textContent = "Saving want list…";
    summary.classList.remove(
      "olwlg-want-matrix-toolbar__summary--dirty",
    );
    window.setTimeout(() => {
      formIsSubmitting = false;
    }, 2500);
  });
  window.addEventListener("beforeunload", (event) => {
    if (formIsSubmitting || !isDirty()) return;
    event.preventDefault();
    event.returnValue = "";
  });

  const stickyHeader = document.createElement("div");
  const stickyTable = table.cloneNode(false) as HTMLTableElement;
  const stickyHeaderRow = header.cloneNode(true) as HTMLTableRowElement;
  stickyHeader.className = "olwlg-want-matrix-sticky-header";
  stickyHeader.setAttribute("aria-hidden", "true");
  stickyHeader.inert = true;
  stickyHeader.hidden = true;
  stickyTable.className = table.className;
  stickyTable.removeAttribute("data-olwlg-want-matrix");
  stickyTable.style.cssText = table.style.cssText;
  stickyHeaderRow.classList.add("olwlg-want-matrix__header--clone");
  stickyTable.append(stickyHeaderRow);
  stickyHeader.append(stickyTable);
  document.body.append(stickyHeader);

  const navbar = document.getElementById("navbar");
  const syncToolbarTop = () => {
    const navbarBottom = navbar instanceof HTMLElement
      ? Math.max(0, navbar.getBoundingClientRect().bottom)
      : 0;
    toolbar.style.setProperty(
      "--olwlg-want-toolbar-top",
      `${Math.round(navbarBottom)}px`,
    );
  };
  syncToolbarTop();
  window.addEventListener("resize", syncToolbarTop);
  if (navbar instanceof HTMLElement && typeof ResizeObserver !== "undefined")
    new ResizeObserver(syncToolbarTop).observe(navbar);

  const originalBulkControls = [
    ...header.querySelectorAll<HTMLButtonElement>(
      ".olwlg-want-matrix__bulk",
    ),
  ];
  stickyHeaderRow
    .querySelectorAll<HTMLElement>("a, button, input, [tabindex]")
    .forEach((control) => {
      control.tabIndex = -1;
    });

  let stickyHeaderFrame = 0;
  const updateStickyHeader = () => {
    stickyHeaderFrame = 0;
    const horizontalOffset = Math.round(bodyViewport.scrollLeft);
    const navbarBottom = navbar instanceof HTMLElement
      ? navbar.getBoundingClientRect().bottom
      : 0;
    const toolbarRect = toolbar.getBoundingClientRect();
    const toolbarGap = Number.parseFloat(
      getComputedStyle(toolbar).marginBottom,
    ) || 14;
    const wrapperRect = wrapper.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const stickyTop = Math.max(
      navbarBottom,
      toolbarRect.bottom + toolbarGap,
      0,
    );
    const headerHeight = Math.max(headerRect.height, 1);
    const shouldShow =
      workspaceView === "matrix" &&
      headerRect.top < stickyTop &&
      wrapperRect.bottom > stickyTop + headerHeight &&
      wrapperRect.top < window.innerHeight;

    stickyHeader.hidden = !shouldShow;
    if (!shouldShow) return;

    stickyHeader.style.top = `${Math.round(stickyTop)}px`;
    stickyHeader.style.left = `${Math.round(wrapperRect.left)}px`;
    stickyHeader.style.width = `${Math.round(wrapperRect.width)}px`;
    stickyHeader.style.height = `${Math.round(headerHeight)}px`;
    stickyTable.style.transform =
      `translateX(${-horizontalOffset}px)`;

    [...stickyHeaderRow.cells].forEach((cell, index) => {
      const sourceCell = header.cells[index];
      if (!sourceCell) return;
      const width = sourceCell.getBoundingClientRect().width;
      cell.style.setProperty("width", `${width}px`, "important");
      cell.style.setProperty("min-width", `${width}px`, "important");
      cell.style.setProperty("max-width", `${width}px`, "important");
    });
    stickyHeaderRow
      .querySelectorAll<HTMLButtonElement>(".olwlg-want-matrix__bulk")
      .forEach((control, index) => {
        const source = originalBulkControls[index];
        if (!source) return;
        control.textContent = source.textContent;
        control.disabled = source.disabled;
        control.setAttribute(
          "aria-label",
          source.getAttribute("aria-label") ?? source.textContent ?? "",
        );
      });
    const frozenDetailCell = stickyHeaderRow.cells[1];
    if (frozenDetailCell)
      frozenDetailCell.style.transform =
        `translateX(${horizontalOffset}px)`;
  };
  const scheduleStickyHeaderUpdate = () => {
    if (stickyHeaderFrame) return;
    stickyHeaderFrame = requestAnimationFrame(updateStickyHeader);
  };
  window.addEventListener("scroll", scheduleStickyHeaderUpdate, {
    passive: true,
  });
  window.addEventListener("resize", scheduleStickyHeaderUpdate);
  if (typeof ResizeObserver !== "undefined")
    new ResizeObserver(scheduleStickyHeaderUpdate).observe(toolbar);
  bodyViewport.addEventListener(
    "scroll",
    () => {
      const horizontalOffset = Math.round(bodyViewport.scrollLeft);
      header.style.transform = `translateX(${-horizontalOffset}px)`;
      const frozenDetailCell = header.cells[1];
      if (frozenDetailCell)
        frozenDetailCell.style.transform =
          `translateX(${horizontalOffset}px)`;
      scheduleStickyHeaderUpdate();
    },
    { passive: true },
  );

  setWorkspaceView(workspaceView);
  window.addEventListener("resize", () => {
    if (window.innerWidth <= 720 && workspaceView === "matrix")
      setWorkspaceView("focus");
  });
}

let legacyUserInformationObserver: MutationObserver | undefined;
let openingLegacyUserInformation = false;

function legacyUserInformationContent() {
  const candidates: HTMLElement[] = [];
  const description = document.getElementById("gamedesc");
  const frame = document.getElementById("gamedescframe");
  if (description instanceof HTMLElement) candidates.push(description);
  if (frame instanceof HTMLIFrameElement) {
    try {
      if (frame.contentDocument?.body)
        candidates.push(frame.contentDocument.body);
    } catch {
      // OLWLG normally uses same-origin content, but fall back to the frame.
    }
  }
  if (frame instanceof HTMLElement) candidates.push(frame);

  return candidates.sort(
    (left, right) =>
      normalizedText(right.textContent).length -
      normalizedText(left.textContent).length,
  )[0];
}

function enhanceLegacyGameDescription() {
  const sources = [
    document.getElementById("gamedescframe"),
    document.getElementById("gamedesc"),
  ].filter((element): element is HTMLElement => element instanceof HTMLElement);
  sources.forEach((source) => {
    if (source.dataset.olwlgEnhanced !== "true")
      source.dataset.olwlgEnhanced = "true";
    if (!source.classList.contains("olwlg-game-description-source"))
      source.classList.add("olwlg-game-description-source");
  });

  const openUserInformation = () => {
    if (openingLegacyUserInformation) return;
    const currentSources = [
      document.getElementById("gamedescframe"),
      document.getElementById("gamedesc"),
    ].filter(
      (element): element is HTMLElement => element instanceof HTMLElement,
    );
    const frame = document.getElementById("gamedescframe");
    const description = document.getElementById("gamedesc");
    const explicitlyRequested = (source: HTMLElement) => {
      const visibility = source.style.visibility.toLowerCase();
      const display = source.style.display.toLowerCase();
      return (
        visibility === "visible" ||
        (visibility !== "hidden" && /^(block|grid|flex)$/i.test(display))
      );
    };
    const requested =
      frame instanceof HTMLElement
        ? explicitlyRequested(frame) ||
          (frame.style.visibility.toLowerCase() !== "hidden" &&
            description instanceof HTMLElement &&
            description.style.visibility.toLowerCase() === "visible")
        : description instanceof HTMLElement &&
          explicitlyRequested(description);
    if (!requested) return;

    openingLegacyUserInformation = true;
    let attempts = 0;
    const populateModal = () => {
      const modalSource = legacyUserInformationContent();
      const contentText = normalizedText(modalSource?.textContent);
      if (contentText.length < 12 && attempts < 200) {
        attempts += 1;
        window.setTimeout(populateModal, 50);
        return;
      }

      if (modalSource) {
      const content = cloneElement(modalSource);
      content.className = "olwlg-user-information";
      content.removeAttribute("style");
      content.querySelectorAll<HTMLElement>("[style]").forEach((element) => {
        element.removeAttribute("style");
      });
      content
        .querySelectorAll<HTMLElement>("button, input, img, a")
        .forEach((element) => {
          const image =
            element instanceof HTMLImageElement
              ? element
              : element.querySelector<HTMLImageElement>("img");
          const label = normalizedText(
            `${element.textContent} ${element.title} ${image?.alt} ${image?.title} ${image ? imageFilename(image) : ""}`,
          );
          if (/\bclose(?: window)?\b|\bredx(?:\.[a-z]+)?\b|^x$/i.test(label))
            element.remove();
        });
      openCatalogModal("User information", content);
      }
      currentSources.forEach((source) => {
        source.style.visibility = "hidden";
      });
      openingLegacyUserInformation = false;
    };
    populateModal();
  };

  if (!legacyUserInformationObserver) {
    legacyUserInformationObserver = new MutationObserver(() => {
      enhanceLegacyGameDescription();
      openUserInformation();
    });
    legacyUserInformationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "style"],
      childList: true,
      subtree: true,
    });
  }
  requestAnimationFrame(openUserInformation);
}

let tooltip: HTMLDivElement | undefined;
let tooltipOwner: HTMLElement | undefined;
let tooltipHideTimer = 0;

function getTooltip() {
  if (tooltip) return tooltip;

  tooltip = document.createElement("div");
  tooltip.className = "olwlg-tooltip";
  tooltip.id = "olwlg-icon-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = true;
  document.body.append(tooltip);

  return tooltip;
}

function showTooltip(owner: HTMLElement) {
  if (!document.documentElement.classList.contains(ROOT_CLASS)) return;
  if (owner.closest(".olwlg-want-matrix__scroll--dragging")) return;

  const message = owner.dataset.olwlgTooltip;
  if (!message) return;

  window.clearTimeout(tooltipHideTimer);
  const element = getTooltip();
  tooltipOwner = owner;
  const isMatrixCell = owner.dataset.olwlgTooltipKind === "matrix-cell";
  element.classList.toggle("olwlg-tooltip--matrix-cell", isMatrixCell);
  if (isMatrixCell) {
    const checkbox = owner.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    const selected = checkbox?.checked ??
      owner.dataset.olwlgSelected === "true";
    const heading = document.createElement("div");
    const coordinates = document.createElement("span");
    const state = document.createElement("span");
    const relationship = document.createElement("div");
    const row = document.createElement("div");
    const rowLabel = document.createElement("span");
    const rowValue = document.createElement("strong");
    const column = document.createElement("div");
    const columnLabel = document.createElement("span");
    const columnValue = document.createElement("strong");
    const warning = document.createElement("div");
    const warningTitle = document.createElement("strong");
    const warningText = document.createElement("p");
    const warningNote = document.createElement("small");
    const explanation = document.createElement("p");
    const panNote = document.createElement("p");
    heading.className = "olwlg-matrix-popover__heading";
    coordinates.className = "olwlg-matrix-popover__coordinates";
    state.className =
      `olwlg-matrix-popover__state${
        selected ? " olwlg-matrix-popover__state--selected" : ""
      }`;
    relationship.className = "olwlg-matrix-popover__relationship";
    row.className =
      "olwlg-matrix-popover__entry olwlg-matrix-popover__entry--receive";
    column.className =
      "olwlg-matrix-popover__entry olwlg-matrix-popover__entry--give";
    warning.className = "olwlg-matrix-popover__warning";
    warning.setAttribute("role", "note");
    explanation.className = "olwlg-matrix-popover__explanation";
    panNote.className = "olwlg-matrix-popover__pan-note";
    panNote.textContent =
      "Click and drag outside the checkbox to pan the table.";
    coordinates.textContent =
      `Row ${owner.dataset.olwlgRowNumber ?? "—"} · Column ${
        owner.dataset.olwlgColumnId ?? "—"
      }`;
    state.textContent = selected ? "Selected" : "Not selected";
    rowLabel.textContent = "You receive · Row";
    rowValue.textContent = owner.dataset.olwlgRowLabel ?? "Unknown item";
    const participant = owner.dataset.olwlgRowOwner;
    if (participant) {
      const ownerLabel = document.createElement("small");
      ownerLabel.textContent = `From ${participant}`;
      row.append(rowLabel, rowValue, ownerLabel);
    } else row.append(rowLabel, rowValue);
    columnLabel.textContent = "You give · Column";
    columnValue.textContent =
      owner.dataset.olwlgColumnLabel ?? "Unknown offered item";
    column.append(columnLabel, columnValue);
    relationship.append(row, column);
    const isValueOrderWarning =
      owner.dataset.olwlgStatusKind === "value-order-warning";
    if (isValueOrderWarning) {
      warningTitle.textContent = "Review value order";
      warningText.textContent =
        "OLWLG thinks you may be offering a higher-valued item without also offering this lower-valued one.";
      warningNote.textContent =
        "This is only a consistency hint. It does not block saving or affect TradeMaximizer.";
      warning.append(warningTitle, warningText, warningNote);
    }
    explanation.textContent = selected
      ? "This exchange is currently included in your want list."
      : "Select this cell to include this exchange in your want list.";
    const statusLabel = owner.dataset.olwlgStatusLabel;
    if (statusLabel && !isValueOrderWarning) {
      const status = document.createElement("span");
      status.className = "olwlg-matrix-popover__status";
      status.textContent = statusLabel;
      explanation.append(" ", status);
    }
    heading.append(coordinates, state);
    element.replaceChildren(heading, relationship);
    if (isValueOrderWarning) element.append(warning);
    element.append(explanation, panNote);
  } else {
    element.textContent = message;
  }
  element.hidden = false;

  const ownerRect = owner.getBoundingClientRect();
  const tooltipRect = element.getBoundingClientRect();
  const gap = 9;
  const margin = 8;
  let top: number;
  let left: number;
  if (isMatrixCell) {
    const roomRight = window.innerWidth - ownerRect.right;
    const roomLeft = ownerRect.left;
    if (roomRight >= tooltipRect.width + gap + margin) {
      left = ownerRect.right + gap;
      top = ownerRect.top + ownerRect.height / 2 - tooltipRect.height / 2;
    } else if (roomLeft >= tooltipRect.width + gap + margin) {
      left = ownerRect.left - tooltipRect.width - gap;
      top = ownerRect.top + ownerRect.height / 2 - tooltipRect.height / 2;
    } else {
      left = ownerRect.left + ownerRect.width / 2 - tooltipRect.width / 2;
      const roomAbove = ownerRect.top;
      const roomBelow = window.innerHeight - ownerRect.bottom;
      top = roomAbove >= tooltipRect.height + gap || roomAbove >= roomBelow
        ? ownerRect.top - tooltipRect.height - gap
        : ownerRect.bottom + gap;
    }
  } else {
    top = ownerRect.top - tooltipRect.height - gap;
    if (top < margin) top = ownerRect.bottom + gap;
    left = ownerRect.left + ownerRect.width / 2 - tooltipRect.width / 2;
  }
  top = Math.min(
    window.innerHeight - tooltipRect.height - margin,
    Math.max(margin, top),
  );
  left = Math.min(
    window.innerWidth - tooltipRect.width - margin,
    Math.max(margin, left),
  );

  element.style.translate = "none";
  element.style.left = `${Math.round(left)}px`;
  element.style.top = `${Math.round(top)}px`;
  owner.setAttribute("aria-describedby", element.id);
}

function hideTooltip(owner?: HTMLElement, force = false) {
  if (!tooltip || (owner && tooltipOwner !== owner)) return;
  const currentOwner = tooltipOwner;
  const hide = () => {
    if (
      !force &&
      currentOwner?.dataset.olwlgTooltipKind === "matrix-cell" &&
      (currentOwner.matches(":hover") ||
        currentOwner.contains(document.activeElement))
    )
      return;
    currentOwner?.removeAttribute("aria-describedby");
    if (tooltipOwner === currentOwner) tooltipOwner = undefined;
    if (tooltip && !tooltipOwner) tooltip.hidden = true;
  };
  window.clearTimeout(tooltipHideTimer);
  if (!force && currentOwner?.dataset.olwlgTooltipKind === "matrix-cell") {
    tooltipHideTimer = window.setTimeout(hide, 120);
  } else hide();
}

function tooltipControl(target: EventTarget | null) {
  return target instanceof Element
    ? target.closest<HTMLElement>(
        ".olwlg-icon-control[data-olwlg-tooltip], .olwlg-tooltip-target[data-olwlg-tooltip]",
      )
    : null;
}

document.addEventListener("pointerover", (event) => {
  const control = tooltipControl(event.target);
  if (control) showTooltip(control);
});

document.addEventListener("pointerout", (event) => {
  const control = tooltipControl(event.target);
  const nextTarget =
    event.relatedTarget instanceof Node ? event.relatedTarget : null;
  if (control && !control.contains(nextTarget))
    hideTooltip(control);
});

document.addEventListener("focusin", (event) => {
  const control = tooltipControl(event.target);
  if (control) showTooltip(control);
});

document.addEventListener("focusout", (event) => {
  const control = tooltipControl(event.target);
  if (control) hideTooltip(control);
});

window.addEventListener("scroll", () => hideTooltip(), true);
window.addEventListener("resize", () => hideTooltip());

async function initializeEnhancements() {
  try {
    readPageGuides();
    enhanceNavbar();
    if (location.pathname.endsWith("/mywants.cgi"))
      await configureCatalogParticipation([]);
    enhanceHomePage();
    enhanceTradeListings();
    await enhanceCatalogPage();
    enhanceWantListPages();
    enhanceIcons();
    organizeAppPageFooter();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLImageElement) enhanceImage(node);
          else if (
            node instanceof HTMLInputElement &&
            node.type.toLowerCase() === "image"
          )
            enhanceImageInput(node);
          else if (node instanceof Element) enhanceIcons(node);
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  } finally {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove(CATALOG_BOOT_CLASS);
    });
  }
}
