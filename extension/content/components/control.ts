import { createButton, type ButtonOptions } from "./button";
import { createLink, type LinkOptions } from "./link";

export type ControlOptions =
  | ({ href: string } & Omit<LinkOptions, "href">)
  | ({ href?: undefined } & ButtonOptions);

export function createControl(options: ControlOptions) {
  if (options.href !== undefined) return createLink(options);
  return createButton(options);
}