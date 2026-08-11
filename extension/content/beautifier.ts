import {
  catalogLoggedInUsername,
  collectionStatusLabel,
  configureCatalogParticipation,
  enhanceCatalogPage,
  enhanceHomePage,
  enhanceNavbar,
  enhanceTradeListings,
  enhanceTradesSummaryPage,
  enhanceWantListPages,
  organizeAppPageFooter,
  registerColorGuideSample,
} from "./pages";
import { readPageGuides } from "./core/guide-parser";
import { ICONS } from "./core/icon-definitions";
import {
  createDecorativeIcon,
  enhanceIcons,
  enhanceImage,
  enhanceImageInput,
  inferIcon,
} from "./core/icon-system";
import { hideTooltip, showTooltip } from "./core/tooltips";

const ROOT_CLASS = "olwlg-beautified";
const CATALOG_BOOT_CLASS = "olwlg-catalog-booting";

let enhancementsInitialized = false;
let preferenceEnabled = false;

function pageNeedsEnhancementCover() {
  return (
    location.pathname === "/olwlg" ||
    location.pathname.startsWith("/olwlg/")
  );
}

if (pageNeedsEnhancementCover()) {
  document.documentElement.classList.add(ROOT_CLASS, CATALOG_BOOT_CLASS);
}

function applyPreference(enabled: boolean, restoreOriginalPage = false) {
  const wasEnabled = document.documentElement.classList.contains(ROOT_CLASS);
  document.documentElement.classList.toggle(ROOT_CLASS, enabled);
  if (enabled && pageNeedsEnhancementCover())
    document.documentElement.classList.add(CATALOG_BOOT_CLASS);
  if (!enabled) {
    document.documentElement.classList.remove(CATALOG_BOOT_CLASS);
    if (wasEnabled) hideTooltip();
    if (restoreOriginalPage && wasEnabled && enhancementsInitialized)
      location.reload();
  }
}

function startEnhancements() {
  if (enhancementsInitialized) return;
  const start = () => {
    if (enhancementsInitialized || !preferenceEnabled) return;
    enhancementsInitialized = true;
    void initializeEnhancements();
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}

chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
  preferenceEnabled = Boolean(enabled);
  applyPreference(preferenceEnabled);
  if (preferenceEnabled) startEnhancements();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync" || !changes.enabled) return;
  preferenceEnabled = Boolean(changes.enabled.newValue);
  applyPreference(preferenceEnabled, true);
  if (preferenceEnabled) startEnhancements();
});

async function initializeEnhancements() {
  try {
    readPageGuides(
      registerColorGuideSample,
      (value) => Boolean(collectionStatusLabel(value)),
    );
    enhanceNavbar();
    if (location.pathname.endsWith("/mywants.cgi"))
      await configureCatalogParticipation([]);
    enhanceHomePage({
      createDecorativeIcon,
      iconTooltip: (image) => {
        const iconName = inferIcon(image);
        return iconName ? ICONS[iconName].tooltip : undefined;
      },
    });
    enhanceTradeListings();
    enhanceTradesSummaryPage({
      getLoggedInUsername: catalogLoggedInUsername,
      hideTooltip,
      showTooltip,
    });
    await enhanceCatalogPage();
    enhanceWantListPages();
    enhanceIcons();
    organizeAppPageFooter();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLImageElement) enhanceImage(node);
          else if (
            node instanceof HTMLInputElement &&
            node.type.toLowerCase() === "image"
          )
            enhanceImageInput(node);
          else if (node instanceof Element) enhanceIcons(node);
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  } finally {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove(CATALOG_BOOT_CLASS);
    });
  }
}
