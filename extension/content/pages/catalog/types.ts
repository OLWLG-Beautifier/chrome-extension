export interface CatalogCollectionStatus {
  color: string;
  label: string;
}

export interface CatalogRow {
  bayRating?: number;
  bggId?: string;
  collectionStatuses: CatalogCollectionStatus[];
  card?: HTMLElement;
  collectionTags: string[];
  element: HTMLTableRowElement;
  gameTitle: string;
  glNumber: string;
  itemType: "game" | "money" | "other";
  moneyAmount?: number;
  participant: string;
  participantUrl?: string;
  rank?: number;
  rating?: number;
  compactSearchText: string;
  searchText: string;
}

export type CatalogTradeState = "active" | "ended" | "mine";