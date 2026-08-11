import { normalizeWhitespace } from "../../core/dom";

export const CATALOG_DAY_MS = 86_400_000;

export type CatalogDeadlineKind = "submission" | "offer";
export type CatalogCountdownKind = CatalogDeadlineKind | "ended";

export function buildCatalogCountdown(
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

  const unitEntries = (["days", "hrs", "min", "sec"] as const).map(
    (name) => {
      const unit = document.createElement("div");
      const value = document.createElement("strong");
      const label = document.createElement("span");
      unit.className = "olwlg-catalog-countdown__unit";
      label.textContent = name;
      unit.append(value, label);
      return { unit, value };
    },
  );
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

export function parseCatalogDeadlineValue(
  value: string | null | undefined,
) {
  const raw = normalizeWhitespace(value);
  if (!raw) return undefined;

  if (/^\d{10,13}$/.test(raw)) {
    const numeric = Number(raw);
    const timestamp = raw.length <= 10 ? numeric * 1000 : numeric;
    return Number.isFinite(timestamp) ? timestamp : undefined;
  }
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}
