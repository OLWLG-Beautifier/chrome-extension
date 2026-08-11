import { normalizedText } from "../catalog";
import type { WantListMatrix } from "./types";

export function findWantListMatrix(): WantListMatrix | undefined {
  const candidates = [...document.querySelectorAll<HTMLTableElement>("table")]
    .filter((table) => !table.parentElement?.closest("table"))
    .map((table) => {
      const header = table.rows[0];
      const candidateRows = [...table.rows]
        .slice(1)
        .filter((row) => row.cells.length > 2);
      if (!header || candidateRows.length < 2) return undefined;

      const columns = [...header.cells]
        .map((_, column) => column)
        .filter((column) => {
          const checkboxCount = candidateRows.filter((row) =>
            Boolean(
              row.cells[column]?.querySelector<HTMLInputElement>(
                'input[type="checkbox"]',
              ),
            )
          ).length;
          return checkboxCount >=
            Math.max(2, Math.floor(candidateRows.length * 0.15));
        });
      const rows = candidateRows.filter((row) =>
        columns.some((column) =>
          Boolean(
            row.cells[column]?.querySelector<HTMLInputElement>(
              'input[type="checkbox"]',
            ),
          )
        )
      );
      const lastDataRowIndex = Math.max(
        ...rows.map((row) => candidateRows.indexOf(row)),
      );
      const headerLabels = new Set(
        [...header.cells]
          .map((cell) => readableWantListHeading(cell.textContent))
          .filter(Boolean),
      );
      const repeatedHeaders = candidateRows.filter((row, rowIndex) => {
        if (rows.includes(row)) return false;
        const rowLabels = [...row.cells]
          .map((cell) => readableWantListHeading(cell.textContent))
          .filter(Boolean);
        const matchingLabels = rowLabels.filter((label) =>
          headerLabels.has(label)
        );
        const isTrailingHeaderShape =
          rowIndex > lastDataRowIndex &&
          row.cells.length >= Math.max(3, Math.floor(columns.length * 0.6));
        return matchingLabels.length >= 2 || isTrailingHeaderShape;
      });
      const checkboxCount = rows.reduce(
        (total, row) =>
          total +
          columns.filter((column) =>
            Boolean(
              row.cells[column]?.querySelector('input[type="checkbox"]'),
            )
          ).length,
        0,
      );
      if (!columns.length || checkboxCount < 4) return undefined;
      return {
        columns,
        header,
        repeatedHeaders,
        rows,
        table,
        score: checkboxCount,
      };
    })
    .filter(
      (
        candidate,
      ): candidate is WantListMatrix & { score: number } =>
        Boolean(candidate),
    )
    .sort((left, right) => right.score - left.score);

  return candidates[0];
}

export function readableWantListHeading(value: string | null | undefined) {
  return normalizedText(value)
    .replace(
      /\b(?:[A-Za-z]\s+){2,}[A-Za-z]\b/g,
      (word) => word.replace(/\s+/g, ""),
    );
}

export function normalizedWantListSearchText(value: string | null | undefined) {
  return normalizedText(value)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase();
}

