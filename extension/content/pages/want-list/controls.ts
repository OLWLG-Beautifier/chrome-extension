import { normalizedText } from "../catalog";
import { readableWantListHeading } from "./parsing";

export function wantListControlLabel(control: HTMLElement) {
  const image = control.querySelector<HTMLImageElement>("img");
  return normalizedText(
    [
      control instanceof HTMLInputElement
        ? control.value
        : control.textContent,
      control.getAttribute("aria-label"),
      control.title,
      control instanceof HTMLInputElement ? control.alt : "",
      control instanceof HTMLInputElement ? control.src : "",
      image?.alt,
      image?.title,
    ].filter(Boolean).join(" "),
  );
}

export function wantListNavigationLabel(control: HTMLElement) {
  const image = control.querySelector<HTMLImageElement>("img");
  const input = control instanceof HTMLInputElement ? control : undefined;
  const directLabel = [
    input?.value,
    control.textContent,
    control.getAttribute("aria-label"),
    control.title,
    input?.alt,
    image?.alt,
    image?.title,
  ].find((value) => normalizedText(value));
  if (directLabel) return readableWantListHeading(directLabel);

  const href =
    control instanceof HTMLAnchorElement ? control.href : "";
  const step = href.match(/step(?:=|\/|_|\s*)?([1-6])/i)?.[1];
  return step ? `Step ${step}` : "";
}

