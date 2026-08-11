import { normalizeWhitespace } from "../../core/dom";

export type WantListMode = "edit" | "review";

export function wantListPageMode(
  ownerDocument: Document = document,
  currentLocation: Location = location,
): WantListMode | undefined {
  if (currentLocation.pathname.endsWith("/viewlist.cgi")) return undefined;

  const pageContext = normalizeWhitespace(
    [
      ownerDocument.title,
      ...ownerDocument.querySelectorAll<HTMLElement>("h1, h2, h3, legend"),
    ]
      .map((element) =>
        typeof element === "string" ? element : element.textContent
      )
      .join(" "),
  );
  const routeContext = `${currentLocation.pathname} ${currentLocation.search}`;
  if (
    !/step\s*[45]|edit (?:your )?wants|want\s*list|mywants/i.test(
      `${routeContext} ${pageContext}`,
    )
  )
    return undefined;

  return /step\s*5|review|confirm|submit.*want/i.test(
      `${routeContext} ${pageContext}`,
    )
    ? "review"
    : "edit";
}