import {
  createButton,
  createInput,
  createLink,
  createSelect,
} from "../../components";
import {
  normalizedText,
} from "./helpers";

export const CATALOG_IFRAME_STYLE_ID = "olwlg-beautifier-iframe-theme";

export function styleCatalogIframe(frame: HTMLIFrameElement) {
  try {
    const document = frame.contentDocument;
    if (!document?.head || !document.body) return false;

    let style = document.getElementById(CATALOG_IFRAME_STYLE_ID);
    if (!(style instanceof HTMLStyleElement)) {
      style = document.createElement("style");
      style.id = CATALOG_IFRAME_STYLE_ID;
      style.textContent = `
        :root {
          color-scheme: light;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: #fff;
          color: #292750;
        }
        *, *::before, *::after { box-sizing: border-box; }
        html, body {
          min-height: 100%;
          margin: 0 !important;
          background: #fff !important;
          color: #343248 !important;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
          font-size: 15px !important;
          line-height: 1.55 !important;
        }
        body, body * {
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        }
        body { padding: 22px 24px 32px !important; }
        a {
          color: #4338ca !important;
          font-weight: 700;
          text-decoration-thickness: 1px;
          text-underline-offset: 3px;
        }
        a:hover { color: #292750 !important; }
        table {
          width: 100% !important;
          margin: 14px 0 !important;
          overflow: hidden;
          border: 1px solid #d9d8e7 !important;
          border-collapse: separate !important;
          border-spacing: 0 !important;
          border-radius: 12px;
          background: #fff;
        }
        th {
          position: sticky;
          z-index: 1;
          top: 0;
          padding: 10px 12px !important;
          border: 0 !important;
          border-bottom: 1px solid #cfcede !important;
          background: #efeff8 !important;
          color: #292750 !important;
          font-size: 12px !important;
          font-weight: 850 !important;
          letter-spacing: .035em;
          text-align: left;
        }
        td {
          padding: 10px 12px !important;
          border: 0 !important;
          border-bottom: 1px solid #e7e6ef !important;
          color: #46445c !important;
          vertical-align: top;
        }
        tr:nth-child(even) td { background: #fafaff !important; }
        tr:last-child td { border-bottom: 0 !important; }
        img {
          max-width: 100%;
          height: auto;
          border-radius: 10px;
        }
        body > img:not([src*="close" i]):not([src*="redx" i]) {
          width: 76px;
          height: 76px;
          margin: 0 16px 12px 0;
          float: left;
          object-fit: cover;
          box-shadow: 0 4px 14px rgba(41, 39, 80, .14);
        }
        img[src*="close" i],
        img[src*="redx" i],
        img[alt*="close" i],
        img[title*="close" i] { display: none !important; }
        input, button, select, textarea {
          min-height: 38px;
          padding: 7px 11px;
          border: 1px solid #cfcede;
          border-radius: 9px;
          background: #fff;
          color: #292750;
          font: inherit;
        }
        button, input[type="button"], input[type="submit"] {
          cursor: pointer;
          background: #292750;
          color: #fff;
          font-weight: 750;
        }
        b, strong { color: #292750; }
        hr { border: 0; border-top: 1px solid #e3e2ec; }
        .olwlg-user-profile {
          width: min(100%, 780px);
          margin: 0 auto;
          color: #343248;
        }
        .olwlg-user-profile__hero {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 20px;
          border: 1px solid #deddea;
          border-radius: 16px;
          background: linear-gradient(135deg, #f7f6ff, #fff);
          box-shadow: 0 8px 24px rgba(41, 39, 80, .08);
        }
        .olwlg-user-profile__avatar {
          width: 88px !important;
          height: 88px !important;
          flex: 0 0 88px;
          margin: 0 !important;
          float: none !important;
          border: 3px solid #fff;
          border-radius: 18px !important;
          object-fit: cover;
          box-shadow: 0 6px 18px rgba(41, 39, 80, .18);
        }
        .olwlg-user-profile__eyebrow {
          margin: 0 0 4px;
          color: #77748d;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: .09em;
          text-transform: uppercase;
        }
        .olwlg-user-profile h1 {
          margin: 0;
          color: #292750;
          font-size: 28px;
          line-height: 1.15;
          letter-spacing: -.025em;
        }
        .olwlg-user-profile__handle {
          display: inline-flex;
          margin-top: 7px;
          align-items: center;
          gap: 5px;
          font-size: 14px;
          text-decoration: none;
        }
        .olwlg-user-profile__stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin: 16px 0;
        }
        .olwlg-user-profile__stat {
          display: grid;
          gap: 4px;
          padding: 15px 16px;
          border: 1px solid #deddea;
          border-radius: 13px;
          background: #fafaff;
        }
        .olwlg-user-profile__stat-label,
        .olwlg-user-profile__activity-label {
          color: #77748d;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .075em;
          text-transform: uppercase;
        }
        .olwlg-user-profile__stat-value {
          color: #292750 !important;
          font-size: 20px;
          font-weight: 850;
          text-decoration: none;
        }
        .olwlg-user-profile__activity {
          overflow: hidden;
          border: 1px solid #deddea;
          border-radius: 14px;
          background: #fff;
        }
        .olwlg-user-profile__activity h2 {
          margin: 0;
          padding: 14px 16px;
          border-bottom: 1px solid #e6e5ed;
          background: #f4f3fa;
          color: #292750;
          font-size: 14px;
        }
        .olwlg-user-profile__activity-row {
          display: grid;
          grid-template-columns: minmax(150px, .7fr) minmax(0, 1.3fr);
          gap: 18px;
          align-items: center;
          padding: 13px 16px;
          border-bottom: 1px solid #ecebf2;
        }
        .olwlg-user-profile__activity-row:last-child { border-bottom: 0; }
        .olwlg-user-profile__activity-value {
          color: #343248;
          font-size: 15px;
          font-weight: 750;
          overflow-wrap: anywhere;
        }
        .olwlg-user-profile__activity-value a { font-weight: 800; }
        .olwlg-price-history {
          width: 100%;
          margin: 0 auto;
        }
        .olwlg-price-history__sections {
          display: grid;
          gap: 14px;
          margin: 18px 0;
        }
        .olwlg-price-history__section {
          overflow: hidden;
          border: 1px solid #d9d8e7;
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 5px 18px rgba(41, 39, 80, .07);
        }
        .olwlg-price-history__section-summary {
          position: relative;
          display: flex;
          min-height: 58px;
          align-items: center;
          padding: 14px 52px 14px 18px;
          border-radius: 14px;
          cursor: pointer;
          list-style: none;
          background: #f4f3fa;
          color: #292750;
          font-size: 16px;
          font-weight: 850;
          user-select: none;
        }
        .olwlg-price-history__section-summary::-webkit-details-marker {
          display: none;
        }
        .olwlg-price-history__section-summary::after {
          position: absolute;
          top: 50%;
          right: 18px;
          width: 10px;
          height: 10px;
          border-right: 2px solid #5c5877;
          border-bottom: 2px solid #5c5877;
          content: "";
          rotate: 45deg;
          translate: 0 -70%;
          transition: rotate 140ms ease;
        }
        .olwlg-price-history__section[open]
          > .olwlg-price-history__section-summary {
          border-bottom: 1px solid #deddea;
          border-radius: 14px 14px 0 0;
          background: #eeedf7;
        }
        .olwlg-price-history__section[open] { overflow: visible; }
        .olwlg-price-history__section[open]
          > .olwlg-price-history__section-summary::after {
          rotate: 225deg;
          translate: 0 0;
        }
        .olwlg-price-history__section-panel {
          padding: 16px;
          border-radius: 0 0 14px 14px;
          background: #fff;
        }
        .olwlg-price-history__marketplace-heading {
          margin: 0 0 14px;
          color: #292750;
          font-size: 15px;
          font-weight: 800;
        }
        .olwlg-price-history__section-loading {
          margin: 0;
          padding: 22px 18px;
          color: #6f6c84;
          font-weight: 700;
        }
        .olwlg-price-history__filters {
          display: grid;
          grid-template-columns: repeat(4, minmax(135px, 1fr)) auto;
          gap: 10px;
          align-items: end;
          margin: 0 0 16px;
          padding: 14px;
          border: 1px solid #deddea;
          border-radius: 14px;
          background: #f8f8fc;
        }
        .olwlg-price-history__filter {
          display: grid;
          gap: 5px;
          min-width: 0;
        }
        .olwlg-price-history__filter > span {
          color: #6f6c84;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .07em;
          text-transform: uppercase;
        }
        .olwlg-price-history__filter select,
        .olwlg-price-history__filter input {
          width: 100%;
          min-width: 0;
          background: #fff;
        }
        .olwlg-price-history__clear {
          min-width: 108px;
          white-space: nowrap;
        }
        .olwlg-price-history__summary {
          grid-column: 1 / -1;
          margin: 0;
          color: #6f6c84;
          font-size: 12px;
          font-weight: 700;
        }
        table.olwlg-price-history__table {
          table-layout: fixed !important;
        }
        .olwlg-price-history__table th.olwlg-price-history__sortable {
          cursor: pointer;
          user-select: none;
        }
        .olwlg-price-history__table
          th.olwlg-price-history__sortable::after {
          display: inline-grid;
          width: 22px;
          height: 22px;
          margin-left: 7px;
          place-items: center;
          border-radius: 6px;
          background: #deddf0;
          color: #555179;
          content: "↕";
          font-family: ui-sans-serif, system-ui, sans-serif;
          font-size: 13px;
          font-weight: 900;
          line-height: 1;
          vertical-align: middle;
        }
        .olwlg-price-history__table
          th.olwlg-price-history__sortable[data-olwlg-sort="asc"]::after {
          background: #292750;
          color: #fff;
          content: "↑";
        }
        .olwlg-price-history__table
          th.olwlg-price-history__sortable[data-olwlg-sort="desc"]::after {
          background: #292750;
          color: #fff;
          content: "↓";
        }
        .olwlg-price-history__price {
          color: #292750 !important;
          font-size: 16px;
          font-weight: 900 !important;
          white-space: normal;
        }
        .olwlg-price-history__condition {
          color: #44415a !important;
          font-weight: 750;
        }
        .olwlg-price-history__date {
          white-space: normal;
        }
        .olwlg-price-history__notes {
          color: #555268 !important;
          font-size: 14px;
          line-height: 1.55;
        }
        .olwlg-price-history__listing-heading,
        .olwlg-price-history__listing {
          text-align: center;
        }
        .olwlg-price-history__listing-link {
          position: relative;
          display: inline-grid;
          width: 38px;
          height: 38px;
          place-items: center;
          border: 1px solid #cfcede;
          border-radius: 10px;
          background: #fff;
          box-shadow: 0 3px 9px rgba(41, 39, 80, .08);
          color: #292750 !important;
          text-decoration: none !important;
        }
        .olwlg-price-history__listing-link:hover,
        .olwlg-price-history__listing-link:focus-visible {
          border-color: #918db2;
          background: #f3f2fa;
          color: #292750 !important;
        }
        .olwlg-price-history__listing-link svg {
          width: 18px;
          height: 18px;
          pointer-events: none;
        }
        .olwlg-price-history__listing-link::after {
          position: absolute;
          z-index: 6;
          top: 50%;
          right: calc(100% + 8px);
          width: max-content;
          max-width: 220px;
          padding: 7px 9px;
          border-radius: 7px;
          background: #292750;
          box-shadow: 0 6px 16px rgba(41, 39, 80, .18);
          color: #fff;
          content: attr(data-tooltip);
          font-size: 11px;
          font-weight: 750;
          line-height: 1.25;
          opacity: 0;
          pointer-events: none;
          translate: 3px -50%;
          transition: opacity 120ms ease, translate 120ms ease;
          white-space: nowrap;
        }
        .olwlg-price-history__listing-link:hover::after,
        .olwlg-price-history__listing-link:focus-visible::after {
          opacity: 1;
          translate: 0 -50%;
        }
        .olwlg-price-history__listing-empty {
          color: #9693a7;
          font-weight: 750;
        }
        .olwlg-price-history__empty {
          padding: 30px !important;
          color: #77748d !important;
          font-weight: 750;
          text-align: center;
        }
        select.olwlg-custom-select__native {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          min-height: 0 !important;
          padding: 0 !important;
          pointer-events: none;
          opacity: 0;
          clip-path: inset(50%);
        }
        .olwlg-custom-select {
          position: relative;
          min-width: 0;
        }
        button.olwlg-custom-select__trigger {
          position: relative;
          display: flex;
          width: 100%;
          min-height: 38px;
          align-items: center;
          padding: 7px 32px 7px 10px;
          border: 1px solid #cfcede;
          border-radius: 9px;
          background: #fff;
          box-shadow: none;
          color: #292750;
          font-weight: 750;
          text-align: left;
        }
        button.olwlg-custom-select__trigger::after {
          position: absolute;
          top: 50%;
          right: 12px;
          width: 8px;
          height: 8px;
          border-right: 1.5px solid currentColor;
          border-bottom: 1.5px solid currentColor;
          content: "";
          rotate: 45deg;
          translate: 0 -70%;
        }
        .olwlg-custom-select.is-open
          button.olwlg-custom-select__trigger {
          border-color: #7773bd;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, .12);
        }
        .olwlg-custom-select.is-open
          button.olwlg-custom-select__trigger::after {
          rotate: 225deg;
          translate: 0 0;
        }
        .olwlg-custom-select__panel {
          position: absolute;
          z-index: 20;
          top: calc(100% + 6px);
          left: 0;
          width: max(100%, 230px);
          padding: 8px;
          border: 1px solid #d7d6e4;
          border-radius: 11px;
          background: #fff;
          box-shadow: 0 14px 34px rgba(26, 24, 57, .18);
        }
        .olwlg-custom-select__panel[hidden] { display: none !important; }
        input.olwlg-custom-select__search {
          width: 100%;
          min-height: 36px;
          margin: 0 0 6px;
          background: #f8f8fc;
        }
        .olwlg-custom-select__options {
          display: grid;
          max-height: 230px;
          gap: 2px;
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        button.olwlg-custom-select__option {
          position: relative;
          width: 100%;
          min-height: 34px;
          padding: 7px 9px 7px 29px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          box-shadow: none;
          color: #45425c;
          font-weight: 700;
          text-align: left;
        }
        button.olwlg-custom-select__option:hover,
        button.olwlg-custom-select__option:focus-visible {
          background: #f0eff8;
          color: #292750;
        }
        button.olwlg-custom-select__option[aria-selected="true"] {
          background: #e9e8f5;
          color: #292750;
          font-weight: 850;
        }
        button.olwlg-custom-select__option[aria-selected="true"]::before {
          position: absolute;
          left: 9px;
          content: "✓";
        }
        .olwlg-custom-select__empty {
          margin: 0;
          padding: 14px 8px;
          color: #77748d;
          font-size: 12px;
          font-weight: 700;
          text-align: center;
        }
        img[src$="/x.gif" i],
        img[src*="delete" i] { display: none !important; }
        @media (max-width: 600px) {
          body { padding: 16px !important; }
          .olwlg-user-profile__hero { align-items: flex-start; padding: 16px; }
          .olwlg-user-profile__avatar {
            width: 64px !important;
            height: 64px !important;
            flex-basis: 64px;
          }
          .olwlg-user-profile h1 { font-size: 22px; }
          .olwlg-user-profile__stats { grid-template-columns: 1fr; }
          .olwlg-user-profile__activity-row {
            grid-template-columns: 1fr;
            gap: 4px;
          }
          .olwlg-price-history__filters {
            grid-template-columns: 1fr 1fr;
          }
          .olwlg-price-history__clear { width: 100%; }
        }
      `;
      document.head.append(style);
    }
    document.body.classList.add("olwlg-embedded-content");
    return true;
  } catch {
    return false;
  }
}

export function enhanceCatalogUserInformation(frame: HTMLIFrameElement) {
  try {
    const document = frame.contentDocument;
    const body = document?.body;
    if (!document || !body) return false;
    if (body.querySelector(".olwlg-user-profile")) return true;

    const lines = (body.innerText || body.textContent || "")
      .split(/\n+/)
      .map((line) => normalizedText(line))
      .filter(Boolean);
    const combined = normalizedText(lines.join(" "));
    if (!/\bbgg registered\s*:|\btrade rating\s*:/i.test(combined))
      return false;

    const labels = [
      "BGG Registered",
      "Name",
      "BGG",
      "Trade rating",
      "Country",
      "Number of items in this math trade",
      "Number of math trades",
      "First math trade",
    ];
    const valueFor = (label: string) => {
      const lineValue = lines
        .find((line) =>
          line.toLocaleLowerCase().startsWith(`${label.toLocaleLowerCase()}:`),
        )
        ?.slice(label.length + 1)
        .trim();
      if (lineValue) return lineValue;
      const followingLabels = labels
        .filter((candidate) => candidate !== label)
        .map((candidate) =>
          candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        )
        .join("|");
      return combined.match(
        new RegExp(
          `${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*(.*?)(?=\\s+(?:${followingLabels})\\s*:|$)`,
          "i",
        ),
      )?.[1]?.trim();
    };
    const linkFor = (value: string | undefined) => {
      if (!value) return undefined;
      const normalizedValue = normalizedText(value).toLocaleLowerCase();
      return [...body.querySelectorAll<HTMLAnchorElement>("a")].find((link) => {
        const linkText = normalizedText(link.textContent).toLocaleLowerCase();
        return linkText === normalizedValue ||
          normalizedValue.startsWith(linkText) ||
          linkText.startsWith(normalizedValue);
      });
    };
    const linkedValue = (value: string | undefined) => {
      const sourceLink = linkFor(value);
      if (!sourceLink) {
        const text = document.createElement("span");
        text.textContent = value || "—";
        return text;
      }
      return createLink({
        content: value || normalizedText(sourceLink.textContent),
        external: true,
        href: sourceLink.href,
      });
    };

    const images = [...body.querySelectorAll<HTMLImageElement>("img")];
    const avatarSource = images
      .filter(
        (image) =>
          !/close|redx|cancel|(?:^|\/)x\.(?:gif|png)/i.test(image.src) &&
          !/close|cancel/i.test(`${image.alt} ${image.title}`),
      )
      .sort((left, right) => {
        const leftArea =
          (left.naturalWidth || left.width) * (left.naturalHeight || left.height);
        const rightArea =
          (right.naturalWidth || right.width) *
          (right.naturalHeight || right.height);
        return rightArea - leftArea;
      })[0];

    const profile = document.createElement("main");
    const hero = document.createElement("header");
    const identity = document.createElement("div");
    const eyebrow = document.createElement("p");
    const name = document.createElement("h1");
    const stats = document.createElement("section");
    const activity = document.createElement("section");
    profile.className = "olwlg-user-profile";
    hero.className = "olwlg-user-profile__hero";
    identity.className = "olwlg-user-profile__identity";
    eyebrow.className = "olwlg-user-profile__eyebrow";
    stats.className = "olwlg-user-profile__stats";
    activity.className = "olwlg-user-profile__activity";
    eyebrow.textContent = "BoardGameGeek trader";
    name.textContent = valueFor("Name") || valueFor("BGG") || "Trader";

    if (avatarSource) {
      const avatar = document.createElement("img");
      avatar.className = "olwlg-user-profile__avatar";
      avatar.src = avatarSource.src;
      avatar.alt = `${name.textContent} avatar`;
      hero.append(avatar);
    }
    identity.append(eyebrow, name);
    const bggName = valueFor("BGG");
    if (bggName) {
      const handle = linkedValue(bggName);
      handle.classList.add("olwlg-user-profile__handle");
      handle.textContent = `@${bggName}`;
      identity.append(handle);
    }
    hero.append(identity);

    const addStat = (label: string, value: string | undefined) => {
      const item = document.createElement("div");
      const itemLabel = document.createElement("span");
      const itemValue = linkedValue(value);
      item.className = "olwlg-user-profile__stat";
      itemLabel.className = "olwlg-user-profile__stat-label";
      itemValue.classList.add("olwlg-user-profile__stat-value");
      itemLabel.textContent = label;
      item.append(itemLabel, itemValue);
      stats.append(item);
    };
    addStat("Trade rating", valueFor("Trade rating"));
    addStat("BGG member since", valueFor("BGG Registered"));
    addStat("Country", valueFor("Country"));

    const activityTitle = document.createElement("h2");
    activityTitle.textContent = "Trade activity";
    activity.append(activityTitle);
    const addActivity = (label: string, value: string | undefined) => {
      const row = document.createElement("div");
      const rowLabel = document.createElement("span");
      const rowValue = document.createElement("div");
      row.className = "olwlg-user-profile__activity-row";
      rowLabel.className = "olwlg-user-profile__activity-label";
      rowValue.className = "olwlg-user-profile__activity-value";
      rowLabel.textContent = label;
      rowValue.append(linkedValue(value));
      row.append(rowLabel, rowValue);
      activity.append(row);
    };
    addActivity(
      "Items in this math trade",
      valueFor("Number of items in this math trade"),
    );
    addActivity("Math trades", valueFor("Number of math trades"));
    addActivity("First math trade", valueFor("First math trade"));

    profile.append(hero, stats, activity);
    body.replaceChildren(profile);
    return true;
  } catch {
    return false;
  }
}

export function enhanceCatalogPriceHistory(frame: HTMLIFrameElement) {
  try {
    const document = frame.contentDocument;
    const body = document?.body;
    if (!document || !body) return false;
    if (body.querySelector(".olwlg-price-history__filters")) return true;

    const table = [...body.querySelectorAll<HTMLTableElement>("table")].find(
      (candidate) => {
        const headings = [...candidate.rows[0]?.cells ?? []].map((cell) =>
          normalizedText(cell.textContent).toLocaleLowerCase(),
        );
        return (
          headings.includes("price") &&
          headings.some((heading) => /^cond(?:ition)?$/.test(heading)) &&
          headings.includes("listed") &&
          headings.includes("sold")
        );
      },
    );
    if (!table || table.rows.length < 2) return false;

    const headerCells = [...table.rows[0].cells];
    const headingIndex = (pattern: RegExp) =>
      headerCells.findIndex((cell) =>
        pattern.test(normalizedText(cell.textContent).toLocaleLowerCase()),
      );
    const priceIndex = headingIndex(/^price$/);
    const conditionIndex = headingIndex(/^cond(?:ition)?$/);
    const listedIndex = headingIndex(/^listed$/);
    const soldIndex = headingIndex(/^sold$/);
    const notesIndex = headingIndex(/^notes?$/);
    if (
      priceIndex < 0 ||
      conditionIndex < 0 ||
      listedIndex < 0 ||
      soldIndex < 0
    )
      return false;

    body.classList.add("olwlg-price-history");
    table.classList.add("olwlg-price-history__table");
    table.querySelector("colgroup")?.remove();
    const columnGroup = document.createElement("colgroup");
    const widths = headerCells.map((_, index) =>
      index === priceIndex
        ? "13%"
        : index === conditionIndex
          ? "17%"
          : index === listedIndex || index === soldIndex
            ? "15%"
            : index === notesIndex
              ? "40%"
              : `${100 / headerCells.length}%`,
    );
    widths.forEach((width) => {
      const column = document.createElement("col");
      column.style.width = width;
      columnGroup.append(column);
    });
    table.prepend(columnGroup);

    let activeSort: HTMLTableCellElement | undefined;
    let sortDirection: "asc" | "desc" = "asc";
    headerCells.forEach((cell) => {
      cell.classList.add("olwlg-price-history__sortable");
      cell.tabIndex = 0;
      cell.setAttribute("role", "button");
      cell.setAttribute(
        "aria-label",
        `Sort by ${normalizedText(cell.textContent)}`,
      );
      cell.addEventListener("click", () => {
        if (activeSort === cell)
          sortDirection = sortDirection === "asc" ? "desc" : "asc";
        else {
          activeSort = cell;
          sortDirection = "asc";
        }
        headerCells.forEach((header) => {
          header.removeAttribute("data-olwlg-sort");
          header.setAttribute("aria-sort", "none");
        });
        cell.dataset.olwlgSort = sortDirection;
        cell.setAttribute(
          "aria-sort",
          sortDirection === "asc" ? "ascending" : "descending",
        );
      });
      cell.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        cell.click();
      });
    });

    const formatCondition = (value: string) => {
      const compact = normalizedText(value)
        .toLocaleLowerCase()
        .replace(/[\s_-]+/g, "");
      const known: Record<string, string> = {
        acceptable: "Acceptable",
        good: "Good",
        likenew: "Like New",
        mint: "Mint",
        new: "New",
        verygood: "Very Good",
      };
      return known[compact] ??
        normalizedText(value)
          .toLocaleLowerCase()
          .replace(/\b\w/g, (letter) => letter.toLocaleUpperCase());
    };
    const currencyFor = (value: string) => {
      const price = normalizedText(value);
      if (/^(?:US\$|USD\b)/i.test(price)) return "USD";
      if (/^(?:CA\$|CAD\b)/i.test(price)) return "CAD";
      if (/^(?:A\$|AU\$|AUD\b)/i.test(price)) return "AUD";
      if (/^(?:NZ\$|NZD\b)/i.test(price)) return "NZD";
      if (/^(?:€|EUR\b)/i.test(price)) return "EUR";
      if (/^(?:£|GBP\b)/i.test(price)) return "GBP";
      if (/^(?:₪|ILS\b)/i.test(price)) return "ILS";
      if (/^(?:¥|JPY\b)/i.test(price)) return "JPY";
      if (/^\$/.test(price)) return "USD";
      return price.match(/^([A-Z]{2,3})(?:\$|\b)/)?.[1] ?? "Other";
    };
    const dateFor = (value: string) => {
      const parsed = Date.parse(normalizedText(value));
      if (!Number.isFinite(parsed)) return "";
      const date = new Date(parsed);
      return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");
    };

    const rows = [...table.rows].slice(1).filter((row) => row.cells.length > 1);
    const currencies = new Set<string>();
    const conditions = new Set<string>();
    rows.forEach((row) => {
      const priceCell = row.cells[priceIndex];
      const conditionCell = row.cells[conditionIndex];
      const listedCell = row.cells[listedIndex];
      const soldCell = row.cells[soldIndex];
      const notesCell = notesIndex >= 0 ? row.cells[notesIndex] : undefined;
      const currency = currencyFor(priceCell?.textContent ?? "");
      const condition = formatCondition(conditionCell?.textContent ?? "");
      row.dataset.olwlgCurrency = currency;
      row.dataset.olwlgCondition = condition;
      row.dataset.olwlgDate =
        dateFor(soldCell?.textContent ?? "") ||
        dateFor(listedCell?.textContent ?? "");
      currencies.add(currency);
      if (condition) conditions.add(condition);
      priceCell?.classList.add("olwlg-price-history__price");
      conditionCell?.classList.add("olwlg-price-history__condition");
      if (conditionCell) conditionCell.textContent = condition;
      listedCell?.classList.add("olwlg-price-history__date");
      soldCell?.classList.add("olwlg-price-history__date");
      notesCell?.classList.add("olwlg-price-history__notes");
    });

    const filters = document.createElement("section");
    const currency = createSelect({
      options: [
        { label: "All currencies", value: "" },
        ...[...currencies].sort().map((value) => ({ label: value, value })),
      ],
    });
    const condition = createSelect({
      options: [
        { label: "All conditions", value: "" },
        ...[...conditions].sort().map((value) => ({ label: value, value })),
      ],
    });
    const startDate = createInput({ type: "date", variant: "custom" });
    const endDate = createInput({ type: "date", variant: "custom" });
    const clear = createButton({
      className: "olwlg-price-history__clear",
      content: "Clear filters",
      variant: "custom",
    });
    const summary = document.createElement("p");
    filters.className = "olwlg-price-history__filters";
    filters.setAttribute("aria-label", "Price history filters");
    summary.className = "olwlg-price-history__summary";
    summary.setAttribute("aria-live", "polite");
    const filterControl = (
      labelText: string,
      control: HTMLElement,
    ) => {
      const label = document.createElement("label");
      const text = document.createElement("span");
      label.className = "olwlg-price-history__filter";
      text.textContent = labelText;
      label.append(text, control);
      return label;
    };
    filters.append(
      filterControl("Currency", currency),
      filterControl("Condition", condition),
      filterControl("Start sold date", startDate),
      filterControl("End sold date", endDate),
      clear,
      summary,
    );
    table.insertAdjacentElement("beforebegin", filters);

    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyRow.hidden = true;
    emptyRow.className = "olwlg-price-history__empty-row";
    emptyCell.className = "olwlg-price-history__empty";
    emptyCell.colSpan = headerCells.length;
    emptyCell.textContent = "No price records match these filters.";
    emptyRow.append(emptyCell);
    table.tBodies[0]?.append(emptyRow);

    const render = () => {
      let visible = 0;
      rows.forEach((row) => {
        const rowDate = row.dataset.olwlgDate ?? "";
        const matches =
          (!currency.value ||
            row.dataset.olwlgCurrency === currency.value) &&
          (!condition.value ||
            row.dataset.olwlgCondition === condition.value) &&
          (!startDate.value || (rowDate && rowDate >= startDate.value)) &&
          (!endDate.value || (rowDate && rowDate <= endDate.value));
        row.hidden = !matches;
        if (matches) visible += 1;
      });
      emptyRow.hidden = visible > 0;
      summary.textContent =
        `${visible} of ${rows.length} price records displayed`;
      clear.disabled =
        !currency.value &&
        !condition.value &&
        !startDate.value &&
        !endDate.value;
    };
    [currency, condition, startDate, endDate].forEach((control) => {
      control.addEventListener("change", render);
    });
    clear.addEventListener("click", () => {
      currency.value = "";
      condition.value = "";
      startDate.value = "";
      endDate.value = "";
      render();
    });
    render();

    const firstTable = table;
    body.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
      const context = normalizedText(
        `${image.src} ${image.alt} ${image.title} ${image.getAttribute("onclick")}`,
      );
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      const appearsBeforeTable = Boolean(
        image.compareDocumentPosition(firstTable) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      );
      if (
        /close|cancel|redx|hide(?:game)?desc|\/x\.(?:gif|png)/i.test(
          context,
        ) ||
        (appearsBeforeTable && width > 0 && height > 0 && width <= 56 && height <= 56)
      )
        image.closest("a, button")?.remove() ?? image.remove();
    });
    return true;
  } catch {
    return false;
  }
}
