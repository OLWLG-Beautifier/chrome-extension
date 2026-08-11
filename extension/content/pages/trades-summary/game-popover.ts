import { createLink } from "../../components";
import { tradeSummaryGames, type TradeSummaryGame } from "./renderer";

export interface BggImage {
  image?: string;
  thumbnail?: string;
}

export interface BggImageResponse {
  images?: Record<string, BggImage>;
  ok: boolean;
}

interface TradeSummaryPopoverData {
  error?: boolean;
  game?: TradeSummaryGame;
  image?: BggImage;
}

const popoverData = new WeakMap<HTMLElement, TradeSummaryPopoverData>();
const popoverRequests = new WeakSet<HTMLElement>();

export function renderTradeSummaryGameTooltip(
  owner: HTMLElement,
  element: HTMLElement,
) {
  const data = popoverData.get(owner);
  const heading = document.createElement("div");
  const source = document.createElement("span");
  const content = document.createElement("div");
  heading.className = "olwlg-matrix-popover__heading";
  source.className = "olwlg-matrix-popover__coordinates";
  source.textContent = "BoardGameGeek";
  content.className = "olwlg-summary-game-popover__content";
  heading.append(source);
  element.replaceChildren(heading, content);

  if (!data) {
    const loading = document.createElement("p");
    loading.className = "olwlg-summary-game-popover__loading";
    loading.textContent = `Loading ${owner.dataset.olwlgGameTitle ?? "game"} details…`;
    content.append(loading);
    return;
  }
  if (data.error || !data.game) {
    const unavailable = document.createElement("p");
    unavailable.className = "olwlg-summary-game-popover__loading";
    unavailable.textContent =
      "BoardGameGeek details are unavailable for this item.";
    content.append(unavailable);
    return;
  }

  const media = document.createElement("div");
  const details = document.createElement("div");
  const title = document.createElement("strong");
  const facts = document.createElement("dl");
  const imageUrl = data.image?.thumbnail ?? data.image?.image;
  media.className = "olwlg-summary-game-popover__media";
  details.className = "olwlg-summary-game-popover__details";
  title.textContent = data.game.title;
  if (imageUrl) {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = `${data.game.title} cover`;
    image.loading = "eager";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    media.append(image);
  } else {
    media.textContent = data.game.title.slice(0, 1).toLocaleUpperCase() || "?";
  }
  const gameFacts: Array<[string, string | undefined]> = [
    ["BGG rank", data.game.rank?.toLocaleString()],
    ["Rating", data.game.rating?.toFixed(2)],
  ];
  gameFacts.forEach(([label, value]) => {
    if (!value) return;
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    facts.append(term, description);
  });
  const link = createLink({
    content: "View on BoardGameGeek",
    external: true,
    href: data.game.bggUrl,
  });
  details.append(title);
  if (facts.childElementCount) details.append(facts);
  details.append(link);
  content.append(media, details);
}

export async function hydrateTradeSummaryGameTooltip(
  owner: HTMLElement,
  requestImages: (ids: string[]) => Promise<BggImageResponse>,
  onHydrated: () => void,
) {
  if (popoverRequests.has(owner)) return;
  popoverRequests.add(owner);
  try {
    const glNumber = owner.dataset.olwlgGlNumber;
    const game = glNumber ? (await tradeSummaryGames()).get(glNumber) : undefined;
    if (!game) {
      popoverData.set(owner, { error: true });
    } else {
      const response = await requestImages([game.bggId]);
      popoverData.set(owner, {
        game,
        image: response.ok ? response.images?.[game.bggId] : undefined,
      });
    }
  } catch {
    popoverData.set(owner, { error: true });
  }
  onHydrated();
}