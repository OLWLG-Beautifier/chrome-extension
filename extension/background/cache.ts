import { bggApiConfigured, fetchBggImages } from "./bgg-api";
import type {
  BggImage,
  BggImageResponse,
} from "./types";

const BGG_CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1_000;
const BGG_CACHE_LIMIT = 2_000;
const BGG_IMAGE_CACHE_KEY = "bggImageCacheV1";

interface CachedBggImage extends BggImage {
  cachedAt: number;
}

function pruneImageCache(cache: Record<string, CachedBggImage>) {
  return Object.fromEntries(
    Object.entries(cache)
      .sort((left, right) => right[1].cachedAt - left[1].cachedAt)
      .slice(0, BGG_CACHE_LIMIT),
  );
}

export async function handleBggImageRequest(
  ids: string[],
): Promise<BggImageResponse> {
  if (!bggApiConfigured()) return { error: "not-configured", ok: false };

  const stored = await chrome.storage.local.get(BGG_IMAGE_CACHE_KEY);
  const cache = (stored[BGG_IMAGE_CACHE_KEY] ?? {}) as Record<
    string,
    CachedBggImage
  >;
  const now = Date.now();
  const missing = ids.filter(
    (id) => !cache[id] || now - cache[id].cachedAt > BGG_CACHE_MAX_AGE_MS,
  );

  if (missing.length) {
    const fetched = await fetchBggImages(missing);
    missing.forEach((id) => {
      cache[id] = { ...(fetched[id] ?? {}), cachedAt: Date.now() };
    });
    await chrome.storage.local.set({
      [BGG_IMAGE_CACHE_KEY]: pruneImageCache(cache),
    });
  }

  const images: Record<string, BggImage> = {};
  ids.forEach((id) => {
    const cached = cache[id];
    if (cached?.image || cached?.thumbnail)
      images[id] = { image: cached.image, thumbnail: cached.thumbnail };
  });
  return { images, ok: true };
}