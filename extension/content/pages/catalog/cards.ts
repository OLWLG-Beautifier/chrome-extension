import {
  createButton,
  createLink,
} from "../../components";
import {
  catalogDirectWantControl,
  catalogWantControl,
  catalogWantPanelForRow,
  createCatalogAction,
  createCatalogOfferAction,
  createCatalogPanelAction,
  ensureCatalogOwnItemIndicator,
  showAddedFeedback,
} from "./actions";
import {
  createCatalogMedia,
} from "./images";
import { openCatalogModal } from "./modal";
import {
  catalogIsReadOnly,
} from "./participation";
import {
  catalogBggLink,
  catalogDescription,
  catalogExpansionBadge,
  catalogSection,
  catalogStat,
  catalogToolIdentity,
  catalogTools,
  cloneElement,
  isCatalogExpansionTool,
  toolLabel,
} from "./presentation";
import {
  cloneCatalogTool,
  createCatalogUserInformationControl,
} from "./tools";
import {
  type CatalogRow,
} from "./types";

export function syncCatalogCardActions(
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

export function createCatalogCards(rows: CatalogRow[]) {
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
    const media = createCatalogMedia(row, bggLink);
    if (media) card.classList.add("olwlg-item-card--with-media");

    const identity = document.createElement("div");
    identity.className = "olwlg-item-card__identity";
    const number = document.createElement("span");
    const titleLine = document.createElement("div");
    const title = createLink({
      className: "olwlg-item-card__title",
      content: row.gameTitle,
      href: bggLink ?? "#",
      rel: bggLink ? "noreferrer" : undefined,
      target: bggLink ? "_blank" : undefined,
    });
    const participant = row.participantUrl
      ? createLink({
        className: "olwlg-item-card__participant",
        content: `Offered by ${row.participant}`,
        href: row.participantUrl,
        rel: "noreferrer",
        target: "_blank",
      })
      : document.createElement("span");
    number.className = "olwlg-item-card__number";
    number.textContent = `GL #${row.glNumber}`;
    titleLine.className = "olwlg-item-card__title-line";
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
    const expansionBadge = catalogExpansionBadge(gameCell);
    if (expansionBadge) {
      const badge = document.createElement("span");
      badge.className =
        "olwlg-item-card__status-badge olwlg-item-card__status-badge--expansion";
      badge.textContent = expansionBadge;
      badge.setAttribute(
        "aria-label",
        expansionBadge === "expansion"
          ? "This item is an expansion"
          : "This item includes an expansion",
      );
      statusBadges.append(badge);
    }
    participant.className = "olwlg-item-card__participant";
    participant.textContent = `Offered by ${row.participant}`;
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
        if (isCatalogExpansionTool(tool)) return;
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
          const toggle = createButton({
            className: "olwlg-item-card__description-toggle",
            content: "Show more",
            onClick: () => {
              const collapsed = description.classList.toggle(
                "olwlg-item-card__description--collapsed",
              );
              toggle.textContent = collapsed ? "Show more" : "Show less";
            },
            variant: "custom",
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
    const details = createButton({
      ariaLabel: `View details for ${row.gameTitle}`,
      className: "olwlg-item-card__details",
      content: "View details",
      onClick: () => {
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
      },
      variant: "custom",
    });
    const attribution = createLink({
      className: "olwlg-item-card__attribution",
      content: "Powered by BoardGameGeek",
      href: "https://boardgamegeek.com/",
      rel: "noreferrer",
      target: "_blank",
    });
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
    if (media) card.append(media);
    card.append(content);
    grid.append(card);
    row.card = card;
  });

  return grid;
}
