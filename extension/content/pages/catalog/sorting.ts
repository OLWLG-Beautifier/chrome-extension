import type { CatalogRow } from "./types";

export function sortCatalogCards(
  rows: CatalogRow[],
  grid: HTMLElement,
  sortBy: string,
) {
  const sorted = [...rows].sort((left, right) => {
    if (sortBy === "title")
      return left.gameTitle.localeCompare(right.gameTitle, undefined, {
        sensitivity: "base",
      });
    if (sortBy === "rank")
      return (left.rank ?? Number.MAX_SAFE_INTEGER) -
        (right.rank ?? Number.MAX_SAFE_INTEGER);
    if (sortBy === "rating")
      return (right.rating ?? -1) - (left.rating ?? -1);
    if (sortBy === "bay")
      return (right.bayRating ?? -1) - (left.bayRating ?? -1);

    const leftNumber = Number.parseInt(left.glNumber, 10);
    const rightNumber = Number.parseInt(right.glNumber, 10);
    return (Number.isFinite(leftNumber) ? leftNumber : 0) -
      (Number.isFinite(rightNumber) ? rightNumber : 0);
  });
  sorted.forEach((row) => {
    if (row.card) grid.append(row.card);
  });
  return sorted;
}