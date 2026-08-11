import type { BggImage } from "./types";

declare const __BGG_API_TOKEN__: string;

const BGG_API_ROOT = "https://boardgamegeek.com/xmlapi2/thing";
const BGG_REQUEST_INTERVAL_MS = 5_100;
const BGG_LAST_REQUEST_KEY = "bggLastRequestAtV1";

let requestQueue: Promise<void> = Promise.resolve();

export class BggRequestDeferredError extends Error {
  constructor(readonly retryAfterMs: number) {
    super("BGG API request must be retried later");
  }
}

export function bggApiConfigured() {
  return Boolean(__BGG_API_TOKEN__);
}

function decodeXmlText(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_match, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/&#x([\da-f]+);/gi, (_match, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
}

function xmlTag(body: string, tag: "image" | "thumbnail") {
  const match = body.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
  if (!match) return undefined;
  const value = decodeXmlText(match[1]);
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function parseBggImages(xml: string) {
  const images: Record<string, BggImage> = {};
  const itemPattern = /<item\b([^>]*)>([\s\S]*?)<\/item>/gi;
  for (const match of xml.matchAll(itemPattern)) {
    const id = match[1].match(/\bid=["'](\d+)["']/i)?.[1];
    if (!id) continue;
    const image = xmlTag(match[2], "image");
    const thumbnail = xmlTag(match[2], "thumbnail");
    if (image || thumbnail) images[id] = { image, thumbnail };
  }
  return images;
}

function queueBggRequest<T>(request: () => Promise<T>) {
  const result = requestQueue.then(request, request);
  requestQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function claimBggRequestSlot() {
  return queueBggRequest(async () => {
    const stored = await chrome.storage.local.get(BGG_LAST_REQUEST_KEY);
    const previous = Number(stored[BGG_LAST_REQUEST_KEY]) || 0;
    const retryAfterMs = BGG_REQUEST_INTERVAL_MS - (Date.now() - previous);
    if (retryAfterMs > 0) return retryAfterMs;
    await chrome.storage.local.set({ [BGG_LAST_REQUEST_KEY]: Date.now() });
    return 0;
  });
}

export async function fetchBggImages(ids: string[]) {
  const retryAfterMs = await claimBggRequestSlot();
  if (retryAfterMs > 0) throw new BggRequestDeferredError(retryAfterMs);

  const url = new URL(BGG_API_ROOT);
  url.searchParams.set("id", ids.join(","));
  const response = await fetch(url, {
    headers: {
      Accept: "application/xml",
      Authorization: `Bearer ${__BGG_API_TOKEN__}`,
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (response.ok) return parseBggImages(await response.text());
  if ([429, 500, 502, 503, 504].includes(response.status))
    throw new BggRequestDeferredError(BGG_REQUEST_INTERVAL_MS);
  throw new Error(`BGG API request failed with status ${response.status}`);
}