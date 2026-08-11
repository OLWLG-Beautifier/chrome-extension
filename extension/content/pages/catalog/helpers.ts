import {
  normalizeWhitespace,
} from "../../core/dom";
import {
  colorGuideLabels,
} from "../../core/guide-parser";

export const COLLECTION_STATUS_LABELS = [
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

export function collectionStatusLabel(value: string | null | undefined) {
  const text = normalizedText(value).toLocaleLowerCase();
  return COLLECTION_STATUS_LABELS.find((label) => text === label);
}

export function embeddedCollectionStatusLabel(element: HTMLElement) {
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

export function backgroundColorKeys(element: HTMLElement) {
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

export function cssColorChannels(value: string) {
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

export function isValueOrderWarningColor(value: string) {
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

export function registerColorGuideSample(
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

export function normalizedText(value: string | null | undefined) {
  return normalizeWhitespace(value);
}

export function moneyAmountFromText(text: string) {
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

export function moneyAmountFromAlternativeTitle(title: string) {
  const alternativeTitle = normalizedText(title)
    .replace(/^.*?\balt\s+name\s*:\s*/i, "");
  const moneyPrefix = alternativeTitle.match(
    /^(?:(?:[$€£₪]|usd|eur|gbp|ils|nis)\s*[0-9]+(?:[.,][0-9]{1,2})?|[0-9]+(?:[.,][0-9]{1,2})?\s*(?:[$€£₪]|usd|eur|gbp|ils|nis|dollars?|euros?|pounds?|shekels?|דולר(?:ים)?|ש["״']?ח))/i,
  )?.[0];
  return moneyPrefix ? moneyAmountFromText(moneyPrefix) : undefined;
}
