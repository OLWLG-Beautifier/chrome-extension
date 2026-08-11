import type { CatalogRow } from "./types";

export interface CatalogFilterState {
  compactQuery: string;
  maximumMoney?: number;
  minimumMoney?: number;
  query: string;
  selectedCollection: string;
  selectedParticipant: string;
  selectedRank: string;
  selectedType: string;
}

export function filterCatalogRows(
  rows: CatalogRow[],
  state: CatalogFilterState,
) {
  return rows.filter((row) => {
    const matchesSearch =
      !state.query ||
      row.searchText.includes(state.query) ||
      row.compactSearchText.includes(state.compactQuery);
    const matchesParticipant =
      !state.selectedParticipant ||
      row.participant.toLocaleLowerCase() === state.selectedParticipant;
    const matchesType =
      !state.selectedType || row.itemType === state.selectedType;
    const matchesMoney =
      state.selectedType !== "money" ||
      (row.moneyAmount !== undefined &&
        (state.minimumMoney === undefined ||
          row.moneyAmount >= state.minimumMoney) &&
        (state.maximumMoney === undefined ||
          row.moneyAmount <= state.maximumMoney));
    const matchesCollection =
      !state.selectedCollection ||
      row.collectionTags.some(
        (tag) => tag.toLocaleLowerCase() === state.selectedCollection,
      );
    const matchesRank =
      !state.selectedRank ||
      (state.selectedRank === "ranked" && row.rank !== undefined) ||
      (state.selectedRank === "unranked" && row.rank === undefined) ||
      (/^\d+$/.test(state.selectedRank) &&
        row.rank !== undefined &&
        row.rank <= Number(state.selectedRank));
    return (
      matchesSearch &&
      matchesParticipant &&
      matchesType &&
      matchesMoney &&
      matchesCollection &&
      matchesRank
    );
  });
}