import { normalizeWhitespace } from "./dom";

export const colorGuideLabels = new Map<string, string>();
export const iconGuideLabels = new Map<string, string>();

export function imageFilename(image: HTMLImageElement) {
  return new URL(image.src, location.href).pathname
    .split("/")
    .pop()
    ?.toLowerCase();
}

function nearestGuideLabel(image: HTMLImageElement) {
  if (image.title || image.alt)
    return normalizeWhitespace(image.title || image.alt);

  let sibling = image.nextSibling;
  let label = "";
  while (sibling && !(sibling instanceof HTMLBRElement)) {
    label += ` ${sibling.textContent ?? ""}`;
    sibling = sibling.nextSibling;
  }
  if (normalizeWhitespace(label)) return normalizeWhitespace(label);
  return normalizeWhitespace(image.closest("li, tr")?.textContent);
}

export function readPageGuides(
  registerColorGuideSample: (
    sample: HTMLElement,
    fallbackLabel?: string,
  ) => void,
  isCollectionStatusLabel: (value: string | null | undefined) => boolean,
) {
  document.querySelectorAll("details").forEach((details) => {
    const heading =
      details.querySelector("summary")?.textContent?.toLowerCase() ?? "";

    if (heading.includes("icon") && heading.includes("guide")) {
      details.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
        const filename = imageFilename(image);
        const label = nearestGuideLabel(image);
        if (filename && label) iconGuideLabels.set(filename, label);
      });
    }

    if (heading.includes("color") && heading.includes("coding")) {
      details
        .querySelectorAll<HTMLElement>("[style*='background'], [bgcolor]")
        .forEach((sample) => {
          registerColorGuideSample(
            sample,
            sample.closest("li, tr")?.textContent ?? undefined,
          );
        });
    }
  });

  document
    .querySelectorAll<HTMLElement>("[style*='background'], [bgcolor]")
    .forEach((sample) => {
      if (isCollectionStatusLabel(sample.textContent))
        registerColorGuideSample(sample);
    });
}