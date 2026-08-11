declare const __OLWLG_ICONIFY_ICONS__: Record<string, string>;

export type IconName =
  | "add"
  | "added"
  | "cart"
  | "discussion"
  | "externalList"
  | "myItems"
  | "open"
  | "logout"
  | "statistics"
  | "users"
  | "wants";

export interface IconDefinition {
  label: string;
  tooltip: string;
  svg: string;
}

export const ICONS: Record<IconName, IconDefinition> = {
  open: {
    label: "Want-list submission is open",
    tooltip:
      "Want lists are open. You can choose and submit the trades you would accept.",
    svg: __OLWLG_ICONIFY_ICONS__["circle-chevron-right"],
  },
  add: {
    label: "Offer items",
    tooltip: "Add or offer items in this math trade.",
    svg: __OLWLG_ICONIFY_ICONS__["package-plus"],
  },
  added: {
    label: "Added to your wants",
    tooltip:
      "This item is already attached to your want list. Select it to review or change what you would trade for it.",
    svg: __OLWLG_ICONIFY_ICONS__["circle-check-big"],
  },
  wants: {
    label: "Edit wants",
    tooltip:
      "Edit your want list and choose which offered items you would accept.",
    svg: __OLWLG_ICONIFY_ICONS__["list-checks"],
  },
  logout: {
    label: "Log out",
    tooltip: "Log out of your OLWLG account.",
    svg: __OLWLG_ICONIFY_ICONS__["log-out"],
  },
  externalList: {
    label: "Open GeekList",
    tooltip: "Open the original math-trade GeekList on BoardGameGeek.",
    svg: __OLWLG_ICONIFY_ICONS__["square-arrow-out-up-right"],
  },
  discussion: {
    label: "Open discussion",
    tooltip: "Open this math trade’s discussion thread on BoardGameGeek.",
    svg: __OLWLG_ICONIFY_ICONS__["messages-square"],
  },
  cart: {
    label: "Your added items",
    tooltip: "View the items you have already added to this math trade.",
    svg: __OLWLG_ICONIFY_ICONS__["shopping-cart"],
  },
  myItems: {
    label: "Your offered items",
    tooltip: "View your own items in this math trade.",
    svg: __OLWLG_ICONIFY_ICONS__.package,
  },
  statistics: {
    label: "Trade statistics",
    tooltip: "View statistics for this math trade.",
    svg: __OLWLG_ICONIFY_ICONS__["chart-no-axes-column-increasing"],
  },
  users: {
    label: "Participants",
    tooltip:
      "View participants, submission status, and want-list submission times.",
    svg: __OLWLG_ICONIFY_ICONS__["users-round"],
  },
};

export const FILE_ICONS: Record<string, IconName> = {
  "arrow.gif": "open",
  "plusbox.png": "add",
  "added.gif": "added",
  "check.gif": "added",
  "checked.gif": "added",
  "checkmark.gif": "added",
  "ok.gif": "added",
  "step4.gif": "wants",
  "geeklist.gif": "externalList",
  "forum.gif": "discussion",
  "cart.png": "cart",
  "myown.gif": "myItems",
  "stats.gif": "statistics",
  "users.gif": "users",
};