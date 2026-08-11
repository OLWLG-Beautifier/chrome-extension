import { createLabeledInput, createLink } from "../../components";
import { normalizeWhitespace } from "../../core/dom";
import { tradeSummaryLines, tradeSummarySource } from "./parser";

export interface TradeSummaryGame {
  bggId: string;
  bggUrl: string;
  rank?: number;
  rating?: number;
  title: string;
}

export interface TradesSummaryDependencies {
  getLoggedInUsername: () => string | undefined;
  hideTooltip: (owner?: HTMLElement) => void;
  showTooltip: (owner: HTMLElement) => void;
}

let tradeSummaryGamesRequest: Promise<Map<string, TradeSummaryGame>> | undefined;

function tradeSummaryCatalogUrl() {
  const url = new URL("viewlist.cgi", location.href);
  const listId = new URL(location.href).searchParams.get("listid");
  if (listId) url.searchParams.set("listid", listId);
  url.searchParams.set("viewall", "1");
  return url;
}

function catalogGameTitle(cell: HTMLTableCellElement | undefined) {
  const titleLink = cell
    ? [...cell.querySelectorAll<HTMLAnchorElement>("a")].find((link) =>
      /boardgamegeek\.com\/(?:boardgame|boardgameexpansion|thing)\//i.test(
        link.href,
      )
    )
    : undefined;
  const linkedTitle = normalizeWhitespace(titleLink?.textContent);
  const source = linkedTitle ||
    normalizeWhitespace(cell?.textContent)
      .replace(/^boardgame:\s*/i, "")
      .split(/\s+(?:rank=|rating=|ships from)\b/i)[0];
  return source
    .replace(/^["“”']+|["“”']+$/g, "")
    .replace(/\s+(?:rank|rating)\s*=\s*[\d.]+.*$/i, "")
    .trim() || "Trade item";
}

export function tradeSummaryGames() {
  tradeSummaryGamesRequest ??= fetch(tradeSummaryCatalogUrl(), {
    credentials: "same-origin",
  })
    .then((response) => {
      if (!response.ok)
        throw new Error(`Catalog request failed with status ${response.status}`);
      return response.text();
    })
    .then((html) => {
      const ownerDocument = new DOMParser().parseFromString(html, "text/html");
      const games = new Map<string, TradeSummaryGame>();
      ownerDocument.querySelectorAll<HTMLTableRowElement>("tr").forEach((row) => {
        const bggLink = [...row.querySelectorAll<HTMLAnchorElement>("a")].find(
          (link) =>
            /boardgamegeek\.com\/(?:boardgame|boardgameexpansion|thing)\/\d+/i
              .test(link.href),
        );
        const bggMatch = bggLink?.href.match(
          /boardgamegeek\.com\/(?:boardgame|boardgameexpansion|thing)\/(\d+)/i,
        );
        const glNumber = normalizeWhitespace(row.cells[0]?.textContent).match(
          /\d+/,
        )?.[0];
        if (!bggLink || !bggMatch || !glNumber) return;
        const rowText = normalizeWhitespace(row.textContent);
        const numericCells = [...row.cells].slice(-3);
        const rank = Number.parseInt(
          rowText.match(/\brank\s*=\s*(\d+)/i)?.[1] ??
            normalizeWhitespace(numericCells[0]?.textContent),
          10,
        );
        const rating = Number.parseFloat(
          rowText.match(/\brating\s*=\s*([\d.]+)/i)?.[1] ??
            normalizeWhitespace(numericCells[1]?.textContent),
        );
        games.set(glNumber, {
          bggId: bggMatch[1],
          bggUrl: bggLink.href,
          rank: Number.isFinite(rank) ? rank : undefined,
          rating: Number.isFinite(rating) ? rating : undefined,
          title: catalogGameTitle(row.cells[1]),
        });
      });
      return games;
    });
  return tradeSummaryGamesRequest;
}

function markTradeSummaryGame(
  item: HTMLElement,
  lineText: string,
  dependencies: TradesSummaryDependencies,
) {
  const match = lineText.match(
    /(?:gives|receives)\s+["“]?(.+?)\s+\((\d+)\)["”]?\s+(?:to|from)\b/i,
  );
  if (!match) return;
  const title = normalizeWhitespace(match[1]);
  if (/^alt\s+name\s*:/i.test(title)) return;
  const glNumber = match[2];
  const ownerDocument = item.ownerDocument;
  const walker = ownerDocument.createTreeWalker(item, NodeFilter.SHOW_TEXT);
  let titleNode: Text | undefined;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (node.data.includes(title)) {
      titleNode = node;
      break;
    }
  }
  if (!titleNode) return;

  const start = titleNode.data.indexOf(title);
  const game = ownerDocument.createElement("span");
  game.className = "olwlg-trades-summary__game olwlg-tooltip-target";
  game.textContent = title;
  game.tabIndex = 0;
  game.dataset.olwlgTooltip = `Loading BoardGameGeek details for ${title}`;
  game.dataset.olwlgTooltipKind = "summary-game";
  game.dataset.olwlgGameTitle = title;
  game.dataset.olwlgGlNumber = glNumber;
  game.addEventListener("pointerenter", () => dependencies.showTooltip(game));
  game.addEventListener("pointerleave", () => dependencies.hideTooltip(game));
  game.addEventListener("focus", () => dependencies.showTooltip(game));
  game.addEventListener("blur", () => dependencies.hideTooltip(game));
  titleNode.before(ownerDocument.createTextNode(titleNode.data.slice(0, start)), game);
  titleNode.data = titleNode.data.slice(start + title.length);
}

export function enhanceTradesSummaryPage(
  dependencies: TradesSummaryDependencies,
) {
  if (!location.pathname.endsWith("/trades-summary.cgi")) return;

  const source = tradeSummarySource();
  if (!source || source.dataset.olwlgTradeSummary === "true") return;
  const lines = tradeSummaryLines(source);
  const headingPattern =
    /^(.+?)\s*:\s*\(\s*(\d+)\s+trades?\s+of\s+(\d+)\s*,\s*(\d+)%\s*\)/i;
  const headingIndexes = lines
    .map((line, index) => (headingPattern.test(line.text) ? index : -1))
    .filter((index) => index >= 0);
  if (!headingIndexes.length) return;

  source.dataset.olwlgTradeSummary = "true";
  document.body.classList.add("olwlg-trades-summary-page");
  const page = document.createElement("main");
  const hero = document.createElement("header");
  const heroCopy = document.createElement("div");
  const eyebrow = document.createElement("p");
  const title = document.createElement("h1");
  const summary = document.createElement("p");
  const { field: searchLabel, input: search } = createLabeledInput({
    label: "Find participant",
    type: "search",
    placeholder: "Search by username",
    autocomplete: "off",
    fieldClassName: "olwlg-trades-summary__search",
  });
  const grid = document.createElement("section");
  const empty = document.createElement("p");

  page.className = "olwlg-trades-summary";
  hero.className = "olwlg-trades-summary__hero";
  heroCopy.className = "olwlg-trades-summary__hero-copy";
  eyebrow.className = "olwlg-trades-summary__eyebrow";
  eyebrow.textContent = "Completed math trade";
  title.textContent = "Trade summary";
  summary.className = "olwlg-trades-summary__summary";
  grid.className = "olwlg-trades-summary__grid";
  grid.setAttribute("aria-label", "Participant trade summaries");
  empty.className = "olwlg-trades-summary__empty";
  empty.textContent = "No participants match this search.";
  empty.hidden = true;
  heroCopy.append(eyebrow, title, summary);
  hero.append(heroCopy, searchLabel);
  page.append(hero, grid, empty);

  let totalTrades = 0;
  const loggedInUsername = dependencies.getLoggedInUsername();
  headingIndexes.forEach((startIndex, headingPosition) => {
    const headingLine = lines[startIndex];
    const match = headingLine.text.match(headingPattern);
    if (!match) return;
    const endIndex = headingIndexes[headingPosition + 1] ?? lines.length;
    const participant = normalizeWhitespace(match[1]);
    const completedTrades = Number(match[2]);
    const possibleTrades = Number(match[3]);
    const completion = Number(match[4]);
    totalTrades += completedTrades;

    const card = document.createElement("article");
    const cardHeader = document.createElement("header");
    const identity = document.createElement("div");
    const participantName = document.createElement("h2");
    const participantProfile = createLink({
      href: `https://boardgamegeek.com/user/${encodeURIComponent(participant)}`,
      content: participant,
      external: true,
      ariaLabel: `Open ${participant}'s BoardGameGeek profile`,
    });
    const participantLink = headingLine.nodes
      .flatMap((node) =>
        node instanceof Element ? [node, ...node.querySelectorAll("a")] : []
      )
      .find(
        (element): element is HTMLAnchorElement =>
          element instanceof HTMLAnchorElement &&
          normalizeWhitespace(element.textContent).toLocaleLowerCase() ===
            participant.toLocaleLowerCase(),
      );
    const stats = document.createElement("p");
    const columns = document.createElement("div");
    const gives = document.createElement("section");
    const receives = document.createElement("section");
    const givesTitle = document.createElement("h3");
    const receivesTitle = document.createElement("h3");
    const givesList = document.createElement("ol");
    const receivesList = document.createElement("ol");

    card.className = "olwlg-trades-summary__card";
    card.dataset.olwlgParticipant = participant.toLocaleLowerCase();
    participantName.append(participantProfile);
    cardHeader.className = "olwlg-trades-summary__card-header";
    identity.className = "olwlg-trades-summary__identity";
    if (participantLink?.id) card.id = participantLink.id;
    else if (participantLink?.getAttribute("name"))
      card.id = participantLink.getAttribute("name") ?? "";
    else card.id = participant.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();
    stats.className = "olwlg-trades-summary__stats";
    stats.textContent = `${completedTrades} of ${possibleTrades} trades · ${completion}%`;
    identity.append(participantName, stats);
    cardHeader.append(identity);

    columns.className = "olwlg-trades-summary__columns";
    gives.className =
      "olwlg-trades-summary__direction olwlg-trades-summary__direction--gives";
    receives.className =
      "olwlg-trades-summary__direction olwlg-trades-summary__direction--receives";
    givesTitle.textContent = "Gives";
    receivesTitle.textContent = "Receives";
    for (let index = startIndex + 1; index < endIndex; index += 1) {
      const line = lines[index];
      const direction = line.text.startsWith("--")
        ? "gives"
        : line.text.startsWith("++")
          ? "receives"
          : undefined;
      if (!direction) continue;
      const item = document.createElement("li");
      item.className = "olwlg-trades-summary__item";
      line.nodes.forEach((node) => item.append(node));
      const firstText = [...item.childNodes].find(
        (node): node is Text =>
          node instanceof Text && /^(?:--|\+\+)/.test(node.data.trim()),
      );
      if (firstText)
        firstText.data = firstText.data.replace(
          /^\s*(?:--|\+\+)\s*\d+\.\s*(?:gives|receives)\s*/i,
          "",
        );
      const involvesCurrentUser = Boolean(
        loggedInUsername &&
          participant.localeCompare(loggedInUsername, undefined, {
            sensitivity: "base",
          }) !== 0 &&
          [...item.querySelectorAll<HTMLAnchorElement>("a")].some(
            (link) =>
              normalizeWhitespace(link.textContent).localeCompare(
                loggedInUsername,
                undefined,
                { sensitivity: "base" },
              ) === 0,
          ),
      );
      if (involvesCurrentUser) {
        item.classList.add("olwlg-trades-summary__item--current-user");
        item.setAttribute(
          "aria-label",
          `${normalizeWhitespace(item.textContent)}. Involves you.`,
        );
      }
      markTradeSummaryGame(item, line.text, dependencies);
      (direction === "gives" ? givesList : receivesList).append(item);
    }
    gives.append(givesTitle, givesList);
    receives.append(receivesTitle, receivesList);
    columns.append(gives, receives);
    card.append(cardHeader, columns);
    grid.append(card);
  });

  const participantCount = grid.childElementCount;
  summary.textContent = `${participantCount} participants · ${totalTrades} completed trade entries`;
  search.addEventListener("input", () => {
    const query = normalizeWhitespace(search.value).toLocaleLowerCase();
    let visible = 0;
    grid.querySelectorAll<HTMLElement>(".olwlg-trades-summary__card").forEach(
      (card) => {
        card.hidden = Boolean(
          query && !card.dataset.olwlgParticipant?.includes(query),
        );
        if (!card.hidden) visible += 1;
      },
    );
    empty.hidden = visible !== 0;
  });

  source.replaceWith(page);
  const targetId = decodeURIComponent(location.hash.slice(1)).toLowerCase();
  if (!targetId) return;
  const target = [...grid.querySelectorAll<HTMLElement>("article[id]")].find(
    (card) => card.id.toLowerCase() === targetId,
  );
  if (target) {
    target.classList.add("olwlg-trades-summary__card--target");
    requestAnimationFrame(() => target.scrollIntoView({ block: "center" }));
  }
}