import {
  imageFilename,
} from "../../core/guide-parser";
import {
  normalizedText,
} from "./helpers";
import { openCatalogModal } from "./modal";
import {
  cloneElement,
} from "./presentation";

export let legacyUserInformationObserver: MutationObserver | undefined;

export let openingLegacyUserInformation = false;

export function legacyUserInformationContent() {
  const candidates: HTMLElement[] = [];
  const description = document.getElementById("gamedesc");
  const frame = document.getElementById("gamedescframe");
  if (description instanceof HTMLElement) candidates.push(description);
  if (frame instanceof HTMLIFrameElement) {
    try {
      if (frame.contentDocument?.body)
        candidates.push(frame.contentDocument.body);
    } catch {
      // OLWLG normally uses same-origin content, but fall back to the frame.
    }
  }
  if (frame instanceof HTMLElement) candidates.push(frame);

  return candidates.sort(
    (left, right) =>
      normalizedText(right.textContent).length -
      normalizedText(left.textContent).length,
  )[0];
}

export function enhanceLegacyGameDescription() {
  const sources = [
    document.getElementById("gamedescframe"),
    document.getElementById("gamedesc"),
  ].filter((element): element is HTMLElement => element instanceof HTMLElement);
  sources.forEach((source) => {
    if (source.dataset.olwlgEnhanced !== "true")
      source.dataset.olwlgEnhanced = "true";
    if (!source.classList.contains("olwlg-game-description-source"))
      source.classList.add("olwlg-game-description-source");
  });

  const openUserInformation = () => {
    if (openingLegacyUserInformation) return;
    const currentSources = [
      document.getElementById("gamedescframe"),
      document.getElementById("gamedesc"),
    ].filter(
      (element): element is HTMLElement => element instanceof HTMLElement,
    );
    const frame = document.getElementById("gamedescframe");
    const description = document.getElementById("gamedesc");
    const explicitlyRequested = (source: HTMLElement) => {
      const visibility = source.style.visibility.toLowerCase();
      const display = source.style.display.toLowerCase();
      return (
        visibility === "visible" ||
        (visibility !== "hidden" && /^(block|grid|flex)$/i.test(display))
      );
    };
    const requested =
      frame instanceof HTMLElement
        ? explicitlyRequested(frame) ||
          (frame.style.visibility.toLowerCase() !== "hidden" &&
            description instanceof HTMLElement &&
            description.style.visibility.toLowerCase() === "visible")
        : description instanceof HTMLElement &&
          explicitlyRequested(description);
    if (!requested) return;

    openingLegacyUserInformation = true;
    let attempts = 0;
    const populateModal = () => {
      const modalSource = legacyUserInformationContent();
      const contentText = normalizedText(modalSource?.textContent);
      if (contentText.length < 12 && attempts < 200) {
        attempts += 1;
        window.setTimeout(populateModal, 50);
        return;
      }

      if (modalSource) {
      const content = cloneElement(modalSource);
      content.className = "olwlg-user-information";
      content.removeAttribute("style");
      content.querySelectorAll<HTMLElement>("[style]").forEach((element) => {
        element.removeAttribute("style");
      });
      content
        .querySelectorAll<HTMLElement>("button, input, img, a")
        .forEach((element) => {
          const image =
            element instanceof HTMLImageElement
              ? element
              : element.querySelector<HTMLImageElement>("img");
          const label = normalizedText(
            `${element.textContent} ${element.title} ${image?.alt} ${image?.title} ${image ? imageFilename(image) : ""}`,
          );
          if (/\bclose(?: window)?\b|\bredx(?:\.[a-z]+)?\b|^x$/i.test(label))
            element.remove();
        });
      openCatalogModal("User information", content);
      }
      currentSources.forEach((source) => {
        source.style.visibility = "hidden";
      });
      openingLegacyUserInformation = false;
    };
    populateModal();
  };

  if (!legacyUserInformationObserver) {
    legacyUserInformationObserver = new MutationObserver(() => {
      enhanceLegacyGameDescription();
      openUserInformation();
    });
    legacyUserInformationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "style"],
      childList: true,
      subtree: true,
    });
  }
  requestAnimationFrame(openUserInformation);
}
