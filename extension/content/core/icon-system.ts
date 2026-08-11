import { normalizeWhitespace } from "./dom";
import { FILE_ICONS, ICONS, type IconName } from "./icon-definitions";
import { iconGuideLabels, imageFilename } from "./guide-parser";

declare const __OLWLG_ICONIFY_ICONS__: Record<string, string>;

export function inferIcon(image: HTMLImageElement): IconName | undefined {
  const filename = imageFilename(image);
  const description =
    `${filename ?? ""} ${image.alt} ${image.title}`.toLowerCase();

  if (description.includes("wantlist submission window")) return "open";
  if (
    description.includes("already added") ||
    description.includes("added to your want")
  )
    return "added";
  if (description.includes("add games") || description.includes("offer items"))
    return "add";
  if (description.includes("step 4") || description.includes("edit your wants"))
    return "wants";
  if (description.includes("actual geeklist")) return "externalList";
  if (description.includes("discussion forum")) return "discussion";
  if (description.includes("what you added")) return "cart";
  if (description.includes("my items")) return "myItems";
  if (description.includes("statistics")) return "statistics";
  if (description.includes("users in math trade")) return "users";

  if (
    filename === "arrow.gif" &&
    image.closest<HTMLAnchorElement>("a")?.href.includes("boardgamegeek.com")
  )
    return "externalList";
  if (filename && FILE_ICONS[filename]) return FILE_ICONS[filename];
  return undefined;
}

export function createModernIcon(name: IconName) {
  const definition = ICONS[name];
  const icon = document.createElement("span");
  icon.className = `olwlg-modern-icon olwlg-modern-icon--${name}`;
  icon.dataset.olwlgTooltip = definition.tooltip;
  icon.setAttribute("aria-label", definition.label);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.innerHTML = definition.svg;
  icon.append(svg);
  return icon;
}

export function createDecorativeIcon(
  svgName: string,
  className = "olwlg-home__panel-icon",
) {
  const icon = document.createElement("span");
  icon.className = `olwlg-modern-icon ${className}`;
  icon.setAttribute("aria-hidden", "true");

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.innerHTML = __OLWLG_ICONIFY_ICONS__[svgName] ?? "";
  icon.append(svg);
  return icon;
}

export function enhanceImage(image: HTMLImageElement) {
  if (image.dataset.olwlgEnhanced) return;
  if (image.closest("#navbar")) return;

  const filename = imageFilename(image);
  const name = inferIcon(image);
  if (!name) {
    const link = image.closest<HTMLAnchorElement>("a");
    const isFlag = new URL(image.src, location.href).pathname.includes("/flags/");
    const inCatalog = image.closest(".olwlg-catalog-game");
    const description =
      image.title ||
      image.alt ||
      link?.title ||
      (filename ? iconGuideLabels.get(filename) : undefined);

    if (link && description && !isFlag && image.closest(".olwlg-trade-card")) {
      image.dataset.olwlgEnhanced = "tooltip";
      link.classList.add("olwlg-icon-control", "olwlg-icon-control--legacy");
      link.dataset.olwlgTooltip = description;
      link.setAttribute("aria-label", description);
      image.removeAttribute("title");
    } else if (inCatalog && description && !isFlag) {
      image.dataset.olwlgEnhanced = "guide";
      image.classList.add("olwlg-catalog-guide-icon", "olwlg-tooltip-target");
      image.dataset.olwlgTooltip = description;
      image.setAttribute("aria-label", description);
      image.tabIndex = 0;
      image.removeAttribute("title");
    }
    return;
  }

  const definition = ICONS[name];
  const icon = createModernIcon(name);
  const link = image.closest("a");
  image.dataset.olwlgEnhanced = name;
  image.classList.add("olwlg-legacy-icon");
  image.insertAdjacentElement("afterend", icon);

  if (link) {
    const hasVisibleLabel = normalizeWhitespace(link.textContent).length > 0;
    link.classList.add("olwlg-icon-control");
    link.dataset.olwlgTooltip = definition.tooltip;
    link.setAttribute("aria-label", definition.label);
    icon.removeAttribute("aria-label");
    if (name === "wants" && hasVisibleLabel) {
      const label = document.createElement("span");
      label.className = "olwlg-wants-cta__label";
      label.textContent = "Edit your wants";
      link.classList.add("olwlg-wants-cta");
      link.replaceChildren(image, icon, label);
    }
  } else {
    icon.classList.add("olwlg-icon-control");
    icon.tabIndex = 0;
    icon.setAttribute("role", "img");
  }
  image.removeAttribute("title");
}

export function enhanceImageInput(input: HTMLInputElement) {
  if (input.dataset.olwlgEnhanced) return;
  const filename = new URL(input.src, location.href).pathname
    .split("/")
    .pop()
    ?.toLowerCase();
  const description =
    `${filename ?? ""} ${input.alt} ${input.title} ${input.value}`.toLowerCase();
  let name = filename ? FILE_ICONS[filename] : undefined;
  if (!name && (description.includes("add") || description.includes("offer")))
    name = "add";
  if (!name) return;

  const definition = ICONS[name];
  const wrapper = document.createElement("span");
  const label = document.createElement("span");
  const icon = createModernIcon(name);
  wrapper.className = `olwlg-image-button olwlg-image-button--${name} olwlg-icon-control`;
  wrapper.dataset.olwlgTooltip = definition.tooltip;
  wrapper.setAttribute("aria-label", definition.label);
  label.className = "olwlg-image-button__label";
  label.textContent = name === "add" ? "Add item" : definition.label;
  icon.removeAttribute("aria-label");
  icon.removeAttribute("data-olwlg-tooltip");
  input.dataset.olwlgEnhanced = name;
  input.removeAttribute("title");
  input.insertAdjacentElement("beforebegin", wrapper);
  wrapper.append(input, icon, label);
}

export function enhanceIcons(root: ParentNode = document) {
  root.querySelectorAll<HTMLImageElement>("img").forEach(enhanceImage);
  root
    .querySelectorAll<HTMLInputElement>('input[type="image"]')
    .forEach(enhanceImageInput);
}