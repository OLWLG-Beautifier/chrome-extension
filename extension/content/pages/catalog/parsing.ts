import {
  colorGuideLabels,
  imageFilename,
} from "../../core/guide-parser";
import {
  catalogNativeActionContext,
} from "./actions";
import {
  backgroundColorKeys,
  embeddedCollectionStatusLabel,
  normalizedText,
} from "./helpers";
import {
  catalogTitleLink,
} from "./presentation";
import {
  type CatalogCollectionStatus,
} from "./types";

export function findCatalogTable(root: ParentNode = document) {
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

export function catalogParticipantCandidate(value: string | null | undefined) {
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

export function participantFromRow(row: HTMLTableRowElement) {
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

export function participantUrlFromRow(row: HTMLTableRowElement) {
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

export function decorateCatalogGameCell(cell: HTMLTableCellElement) {
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

export function catalogCollectionStatuses(
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

export function actionCandidateFromCell(cell: HTMLTableCellElement) {
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

export function addedCandidateFromCell(cell: HTMLTableCellElement) {
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
