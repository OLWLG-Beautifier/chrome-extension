import {
  createButton,
  createLink,
} from "../../components";
import {
  iconGuideLabels,
  imageFilename,
} from "../../core/guide-parser";
import {
  normalizedText,
} from "./helpers";
import {
  enhanceCatalogUserInformation,
  styleCatalogIframe,
} from "./iframe";
import {
  enhanceCatalogMarketplaceSections,
} from "./marketplace";
import { openCatalogModal } from "./modal";
import {
  participantFromRow,
  participantUrlFromRow,
} from "./parsing";
import {
  catalogBggLink,
  catalogTitleLink,
  cloneElement,
  removeCloneIds,
  toolLabel,
} from "./presentation";
import {
  type CatalogRow,
} from "./types";

export const catalogToolFrames = new WeakMap<HTMLElement, HTMLIFrameElement>();

export function catalogUserInformation(
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
      const link = createLink({ content: value, external: true, href });
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

export function catalogUserInformationContext(cell: HTMLTableCellElement) {
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

export function catalogUserInformationSummary(
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

export function createCatalogUserInformationControl(
  row: CatalogRow,
  cell: HTMLTableCellElement,
) {
  const icon = document.createElement("img");
  const label = document.createElement("span");
  const userInformation = catalogUserInformationContext(cell);
  const tooltip = catalogUserInformationSummary(
    userInformation,
    row.participant,
  );

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
  const control = createButton({
    className: "olwlg-item-card__tool",
    content: [icon, label],
    dataset: { olwlgModalTool: "true" },
    onClick: () => {
      const nativeProxy = createButton({
        attributes: {
          onclick: `showuserinfo(${JSON.stringify(row.participant)})`,
        },
        content: [],
        hidden: true,
        variant: "custom",
      });
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
    },
    variant: "custom",
  });
  return control;
}

export function catalogToolTarget(tool: HTMLElement) {
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

export function legacyCatalogToolSource(tool: HTMLElement) {
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

export function catalogToolUrl(tool: HTMLElement) {
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

export function bggPriceHistoryUrl(tool: HTMLElement) {
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

export function catalogToolFrame(tool: HTMLElement, sourceUrl: string) {
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

export function catalogSourceIframe(source: HTMLElement) {
  return source instanceof HTMLIFrameElement
    ? source
    : source.querySelector<HTMLIFrameElement>("iframe");
}

export function removeLegacyCatalogCloseControls(source: HTMLElement) {
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

export function watchCatalogIframe(source: HTMLElement, title: string) {
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

export function openCatalogToolModal(
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

export function cloneCatalogTool(tool: HTMLElement) {
  const labelText = toolLabel(tool);
  if (!labelText) return undefined;

  const image =
    tool instanceof HTMLImageElement
      ? tool
      : tool.querySelector<HTMLImageElement>("img");
  const tooltipText = normalizedText(
    tool.dataset.olwlgTooltip ||
      image?.dataset.olwlgTooltip ||
      tool.title ||
      image?.title,
  );
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
      : createButton({ content: [], variant: "custom" });
  if (control instanceof HTMLButtonElement) {
    control.type = "button";
    if (image) control.append(image.cloneNode(true));
  }
  const label = document.createElement("span");
  removeCloneIds(control);
  control.className = "olwlg-item-card__tool";
  if (tooltipText) {
    control.classList.add("olwlg-tooltip-target");
    control.dataset.olwlgTooltip = tooltipText;
  }
  control.removeAttribute("onclick");
  control.removeAttribute("style");
  control.querySelectorAll<HTMLElement>("*").forEach((element) => {
    element.removeAttribute("style");
    element.removeAttribute("title");
    element.removeAttribute("data-olwlg-tooltip");
    element.classList.remove("olwlg-tooltip-target");
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
