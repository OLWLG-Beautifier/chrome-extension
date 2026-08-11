export type WantListWorkspaceView = "focus" | "matrix" | "review";

export interface WantListMatrix {
  columns: number[];
  header: HTMLTableRowElement;
  repeatedHeaders: HTMLTableRowElement[];
  rows: HTMLTableRowElement[];
  table: HTMLTableElement;
}

export interface WantListRowIdentity {
  detailCell?: HTMLTableCellElement;
  item: string;
  label: string;
  owner: string;
  ownerUrl?: string;
  searchText: string;
}