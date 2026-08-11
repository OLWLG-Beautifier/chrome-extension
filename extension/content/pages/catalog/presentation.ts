import {
  iconGuideLabels,
  imageFilename,
} from "../../core/guide-parser";
import {
  createDecorativeIcon,
} from "../../core/icon-system";
import {
  normalizedText,
} from "./helpers";
import {
  catalogToolTarget,
  catalogToolUrl,
} from "./tools";

export function catalogBggLink(cell: HTMLTableCellElement | undefined) {
  if (!cell) return undefined;
  return [...cell.querySelectorAll<HTMLAnchorElement>("a")].find((link) =>
    /boardgamegeek\.com\/(?:boardgame|boardgameexpansion|thing)\//i.test(
      link.href,
    ),
  )?.href;
}

export function catalogBggId(cell: HTMLTableCellElement | undefined) {
  return catalogBggLink(cell)?.match(
    /boardgamegeek\.com\/(?:boardgame|boardgameexpansion|thing)\/(\d+)/i,
  )?.[1];
}

export function catalogTitleLink(cell: HTMLTableCellElement | undefined) {
  if (!cell) return undefined;
  return [...cell.querySelectorAll<HTMLAnchorElement>("a")].find((link) =>
    /boardgamegeek\.com\/(?:boardgame|boardgameexpansion|thing)\//i.test(
      link.href,
    ),
  );
}

export function catalogGameTitle(cell: HTMLTableCellElement | undefined) {
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

export function removeCloneIds(element: HTMLElement) {
  element.removeAttribute("id");
  element.querySelectorAll<HTMLElement>("[id]").forEach((child) => {
    child.removeAttribute("id");
  });
}

export function catalogStat(label: string, value: number | undefined) {
  const item = document.createElement("span");
  item.className = "olwlg-item-card__stat";
  item.innerHTML = `<small>${label}</small><strong>${
    value === undefined ? "—" : value
  }</strong>`;
  return item;
}

export function cloneElement(element: HTMLElement) {
  const clone = element.cloneNode(true) as HTMLElement;
  removeCloneIds(clone);
  return clone;
}

export function enhanceCatalogDescriptionNotices(container: HTMLElement) {
  const commentNoticePattern =
    /there are comments from other users other than the item['’]s owner/i;
  const commentLinkPattern = /view the item with all (?:of )?the comments/i;
  const candidates = [...container.querySelectorAll<HTMLElement>("*")]
    .filter((element) =>
      commentNoticePattern.test(normalizedText(element.textContent))
    )
    .sort(
      (left, right) =>
        normalizedText(left.textContent).length -
        normalizedText(right.textContent).length,
    );
  const noteElement = candidates[0];
  if (!noteElement) return;

  const sourceLink = [...container.querySelectorAll<HTMLAnchorElement>("a")]
    .find((link) => commentLinkPattern.test(normalizedText(link.textContent)));
  const ancestors: HTMLElement[] = [];
  let ancestor: HTMLElement | null = noteElement;
  while (ancestor && ancestor !== container) {
    ancestors.push(ancestor);
    ancestor = ancestor.parentElement;
  }
  const source =
    ancestors.find((element) => {
      const legacyColor = `${element.getAttribute("style") ?? ""} ${
        element.getAttribute("bgcolor") ?? ""
      }`;
      return /background|#[\da-f]{3,8}|rgb\(/i.test(legacyColor) &&
        (!sourceLink || element.contains(sourceLink));
    }) ??
    ancestors.find((element) =>
      Boolean(sourceLink && element.contains(sourceLink)) &&
      normalizedText(element.textContent).length < 700
    ) ??
    noteElement;

  const notice = document.createElement("aside");
  const content = document.createElement("div");
  const title = document.createElement("strong");
  const message = document.createElement("p");
  notice.className = "olwlg-item-card__notice";
  notice.setAttribute("role", "note");
  content.className = "olwlg-item-card__notice-content";
  title.className = "olwlg-item-card__notice-title";
  title.textContent = "Comments may need attention";
  message.textContent =
    "Other users have commented on this item and may be waiting for a response.";
  content.append(title, message);
  if (sourceLink) {
    const link = cloneElement(sourceLink) as HTMLAnchorElement;
    link.className = "olwlg-item-card__notice-link";
    link.removeAttribute("style");
    link.textContent = "View all comments";
    content.append(link);
  }
  notice.append(
    createDecorativeIcon(
      "messages-square",
      "olwlg-item-card__notice-icon",
    ),
    content,
  );

  const linkWasInsideSource = Boolean(sourceLink && source.contains(sourceLink));
  source.replaceWith(notice);
  if (sourceLink && !linkWasInsideSource) {
    const linkParent = sourceLink.parentElement;
    sourceLink.remove();
    if (linkParent && linkParent !== container && !normalizedText(linkParent.textContent))
      linkParent.remove();
  }
}

export function catalogSection(
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

export function decodeLegacyCatalogComments(container: HTMLElement) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

  textNodes.forEach((node) => {
    const match = node.data.match(
      /^([\s\S]*?)<div\s+class=["']?comment["']?\s*>\s*<hr\s+class=["']?chr["']?\s*>\s*<font\s+color=["']?green["']?\s*>(Comment\s*\(added[^<]*\):)<\/font>\s*([\s\S]*?)\s*<\/div>\s*$/i,
    );
    if (!match) return;

    const comment = document.createElement("aside");
    const heading = document.createElement("strong");
    const body = document.createElement("p");
    comment.className = "olwlg-item-card__owner-comment";
    comment.setAttribute("role", "note");
    heading.textContent = normalizedText(match[2]);
    body.textContent = normalizedText(match[3]);
    comment.append(heading, body);
    node.replaceWith(
      ...(normalizedText(match[1]) ? [document.createTextNode(match[1])] : []),
      comment,
    );
  });
}

export function cleanDescription(container: HTMLElement) {
  decodeLegacyCatalogComments(container);
  container
    .querySelectorAll<HTMLElement>("script, style, .olwlg-catalog-metadata, .olwlg-catalog-version")
    .forEach((element) => element.remove());
  container.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
    const label = normalizedText(link.textContent);
    const cleanedLabel = label
      .replace(/^["“”']+/, "")
      .replace(/\s+(?:rank|rating)\s*=\s*[\d.]+[\s\S]*$/i, "")
      .replace(/["“”']+$/, "")
      .trim();
    if (cleanedLabel) link.textContent = cleanedLabel;
    link.classList.remove(
      "olwlg-catalog-color-code",
      "olwlg-tooltip-target",
    );
    link.removeAttribute("style");
    link.removeAttribute("bgcolor");
    link.removeAttribute("tabindex");
    delete link.dataset.olwlgCollectionColor;
    delete link.dataset.olwlgCollectionTag;
    delete link.dataset.olwlgTooltip;
  });
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
  enhanceCatalogDescriptionNotices(container);
}

export function catalogDescription(cell: HTMLTableCellElement) {
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

export function toolLabel(element: HTMLElement) {
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

export function catalogTools(cell: HTMLTableCellElement) {
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

export function catalogToolIdentity(tool: HTMLElement) {
  const image =
    tool instanceof HTMLImageElement
      ? tool
      : tool.querySelector<HTMLImageElement>("img");
  return [
    toolLabel(tool)?.toLocaleLowerCase() ?? "",
    image ? imageFilename(image) ?? "" : "",
  ].join("|");
}

export function isCatalogExpansionTool(tool: HTMLElement) {
  return /^(?:this item is an expansion|expansion for a game you own)$/i.test(
    normalizedText(toolLabel(tool)),
  );
}

export function catalogExpansionBadge(cell: HTMLTableCellElement | undefined) {
  if (!cell) return undefined;
  if (/\/boardgameexpansion\//i.test(catalogTitleLink(cell)?.href ?? ""))
    return "expansion";
  return catalogTools(cell).some(isCatalogExpansionTool)
    ? "inc. expansion"
    : undefined;
}
