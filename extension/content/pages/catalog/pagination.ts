export type CatalogPageNumber = number | "ellipsis";

export function catalogPageNumbers(
  currentPage: number,
  totalPages: number,
): CatalogPageNumber[] {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages]);
  for (
    let page = Math.max(2, currentPage - 1);
    page <= Math.min(totalPages - 1, currentPage + 1);
    page += 1
  )
    pages.add(page);

  const compact: CatalogPageNumber[] = [];
  [...pages].sort((left, right) => left - right).forEach((page, index, sorted) => {
    if (index && page - sorted[index - 1] > 1) compact.push("ellipsis");
    compact.push(page);
  });
  return compact;
}