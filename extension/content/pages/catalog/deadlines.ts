import { normalizeWhitespace } from "../../core/dom";
import {
  CATALOG_DAY_MS,
  parseCatalogDeadlineValue,
  type CatalogDeadlineKind,
} from "./countdown";
import { catalogListId } from "./mode";

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
    const context = normalizeWhitespace(
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

export function exactCatalogSubmissionDeadline(
  roots: ParentNode[] = [document],
) {
  return exactCatalogDeadline("submission", roots);
}

export function exactCatalogOfferDeadline(roots: ParentNode[] = [document]) {
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
  const reconciliationWindow = Math.max(displayedStep * 1.5, 5 * 60_000);

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

  const deadline = exactDeadline ??
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

export function stableCatalogSubmissionDeadline(
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

export function stableCatalogOfferDeadline(
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