import { createLink } from "../../components";
import {
  BGG_IMAGE_BATCH_SIZE,
  requestBggImageBatch,
  type BggCatalogImage,
} from "../../core/bgg-images";
import type { CatalogRow } from "./types";

function catalogImagePlaceholder(row: CatalogRow, loading: boolean) {
  const placeholder = document.createElement("span");
  placeholder.className = "olwlg-item-card__placeholder";
  if (loading)
    placeholder.classList.add("olwlg-item-card__placeholder--loading");
  placeholder.setAttribute("aria-hidden", "true");
  placeholder.textContent = row.gameTitle.slice(0, 1).toLocaleUpperCase() || "?";
  return placeholder;
}

export function createCatalogMedia(
  row: CatalogRow,
  bggLink: string | undefined,
) {
  if (!row.bggId) return undefined;
  const media = document.createElement("div");
  const frame = bggLink
    ? createLink({
      ariaLabel: `View ${row.gameTitle} on BoardGameGeek`,
      className: "olwlg-item-card__media-frame",
      content: catalogImagePlaceholder(row, false),
      external: true,
      href: bggLink,
      rel: "noreferrer",
    })
    : document.createElement("div");
  media.className = "olwlg-item-card__media";
  media.dataset.olwlgBggId = row.bggId;
  frame.className = "olwlg-item-card__media-frame";
  if (!bggLink) frame.append(catalogImagePlaceholder(row, false));
  media.append(frame);
  return media;
}

function beginCatalogImageLoad(row: CatalogRow) {
  const media = row.card?.querySelector<HTMLElement>(
    ".olwlg-item-card__media",
  );
  if (!media) return;
  media.classList.add("olwlg-item-card__media--loading");
  media.setAttribute("aria-busy", "true");
  media
    .querySelector(".olwlg-item-card__placeholder")
    ?.classList.add("olwlg-item-card__placeholder--loading");
}

function settleCatalogImage(row: CatalogRow) {
  const media = row.card?.querySelector<HTMLElement>(
    ".olwlg-item-card__media",
  );
  if (!media) return;
  media.classList.remove("olwlg-item-card__media--loading");
  media.removeAttribute("aria-busy");
  media
    .querySelector(".olwlg-item-card__placeholder--loading")
    ?.classList.remove("olwlg-item-card__placeholder--loading");
}

function applyCatalogImage(row: CatalogRow, source: BggCatalogImage) {
  const media = row.card?.querySelector<HTMLElement>(
    ".olwlg-item-card__media",
  );
  const frame = media?.querySelector<HTMLElement>(
    ".olwlg-item-card__media-frame",
  );
  const imageUrl = source.thumbnail ?? source.image;
  const fallbackImageUrl = imageUrl === source.thumbnail
    ? source.image
    : source.thumbnail;
  if (!media || !frame || !imageUrl) {
    settleCatalogImage(row);
    return;
  }

  const image = document.createElement("img");
  image.src = imageUrl;
  image.alt = `${row.gameTitle} cover from BoardGameGeek`;
  image.loading = "lazy";
  image.decoding = "async";
  image.referrerPolicy = "no-referrer";
  image.addEventListener(
    "load",
    () => {
      media.classList.remove("olwlg-item-card__media--loading");
      media.removeAttribute("aria-busy");
    },
    { once: true },
  );
  image.addEventListener(
    "error",
    () => {
      if (fallbackImageUrl && image.src !== fallbackImageUrl) {
        image.src = fallbackImageUrl;
        return;
      }
      frame.replaceChildren(catalogImagePlaceholder(row, false));
      media.classList.remove("olwlg-item-card__media--loading");
      media.removeAttribute("aria-busy");
    },
  );
  frame.replaceChildren(image);
}

export function loadCatalogImages(rows: CatalogRow[]) {
  interface ImageLoadState {
    requested: boolean;
    rows: CatalogRow[];
    visibleRows: Set<CatalogRow>;
    source?: BggCatalogImage | null;
  }

  const states = new Map<string, ImageLoadState>();
  rows.forEach((row) => {
    if (!row.bggId) return;
    const state = states.get(row.bggId) ?? {
      requested: false,
      rows: [],
      visibleRows: new Set<CatalogRow>(),
    };
    state.rows.push(row);
    states.set(row.bggId, state);
  });
  if (states.size === 0) return;

  const pendingIds = new Set<string>();
  const rowByMedia = new WeakMap<Element, CatalogRow>();
  let flushTimer = 0;
  let flushing = false;
  let stopped = false;

  const settleAll = () => {
    states.forEach((state) => state.rows.forEach(settleCatalogImage));
  };
  const stop = (observer: IntersectionObserver) => {
    stopped = true;
    pendingIds.clear();
    window.clearTimeout(flushTimer);
    observer.disconnect();
    settleAll();
  };
  const flush = async (observer: IntersectionObserver) => {
    if (flushing || stopped) return;
    flushing = true;
    while (pendingIds.size > 0 && !stopped) {
      const batch = [...pendingIds].slice(0, BGG_IMAGE_BATCH_SIZE);
      batch.forEach((id) => pendingIds.delete(id));
      try {
        const response = await requestBggImageBatch(batch);
        if (!response.ok) {
          stop(observer);
          if (response.error !== "not-configured")
            console.warn(
              "OLWLG Beautifier could not load BGG catalog images:",
              response.error ?? "Unknown error",
            );
          break;
        }
        batch.forEach((id) => {
          const state = states.get(id);
          if (!state) return;
          state.source = response.images?.[id] ?? null;
          state.visibleRows.forEach((row) => {
            if (state.source) applyCatalogImage(row, state.source);
            else settleCatalogImage(row);
          });
        });
      } catch (error) {
        stop(observer);
        console.warn(
          "OLWLG Beautifier could not contact its BGG image service:",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }
    flushing = false;
  };
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        const row = rowByMedia.get(entry.target);
        if (!row?.bggId) return;
        const state = states.get(row.bggId);
        if (!state) return;
        state.visibleRows.add(row);
        if (state.source !== undefined) {
          if (state.source) applyCatalogImage(row, state.source);
          else settleCatalogImage(row);
          return;
        }
        beginCatalogImageLoad(row);
        if (!state.requested) {
          state.requested = true;
          pendingIds.add(row.bggId);
        }
      });
      window.clearTimeout(flushTimer);
      flushTimer = window.setTimeout(() => void flush(observer), 80);
    },
    { rootMargin: "700px 0px" },
  );

  states.forEach((state) => {
    state.rows.forEach((row) => {
      const media = row.card?.querySelector(".olwlg-item-card__media");
      if (media) {
        rowByMedia.set(media, row);
        observer.observe(media);
      }
    });
  });
}