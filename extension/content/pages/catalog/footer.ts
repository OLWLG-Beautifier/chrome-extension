import {
  normalizedText,
} from "./helpers";

export function removeCatalogDeadlineMessage(
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

export function catalogFooterTextRow(
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

export function removeEmptyCatalogFooterAncestors(
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

export function removeCatalogEditWantsPrompt() {
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

export function removeCatalogDisplayedCount() {
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

export function organizeCatalogPageFooter() {
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

export function organizeAppPageFooter() {
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
