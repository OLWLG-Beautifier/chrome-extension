import { createLink } from "../../components";
import { normalizeWhitespace } from "../../core/dom";
import { imageFilename } from "../../core/guide-parser";
import { createModernIcon } from "../../core/icon-system";

const NAV_ICON_LABELS: Record<string, string> = {
  "auction.png": "Auctions",
  "cart.png": "Added items",
  "forum.gif": "Discussion",
  "geeklist.gif": "GeekList",
  "help.png": "Help",
  "home.png": "Home",
  "myown.gif": "My items",
  "plusbox.png": "Add items",
  "profile.png": "Profile",
  "stats.gif": "Statistics",
  "step4.gif": "Edit wants",
  "tipjar.png": "Tip",
  "users.gif": "Participants",
};

function conciseNavLabel(link: HTMLAnchorElement, image: HTMLImageElement) {
  const href = link.href.toLowerCase();
  const filename = imageFilename(image) ?? "";
  const description = normalizeWhitespace(
    link.title || image.alt || image.title,
  );

  if (/bgglogin/.test(href)) return "Log in";
  if (/profile/.test(href)) return "Profile";
  if (/addmygames|addgames/.test(href)) return "Add items";
  if (/mywants|step4/.test(href)) return "Edit wants";
  if (/viewlist/.test(href)) return "Browse items";
  if (/mtusers|users/.test(href)) return "Participants";
  if (/stats|statistics/.test(href)) return "Statistics";
  if (/auction/.test(href)) return "Auctions";
  if (/guild|wiki|help/.test(href)) return "Help";
  if (/geekgold\/transfer|tip/.test(href)) return "Tip";
  if (/boardgamearena/.test(href)) return "Play online";
  if (/result/.test(href)) return "Results";
  if (NAV_ICON_LABELS[filename]) return NAV_ICON_LABELS[filename];

  if (description) {
    const shortened = description.split(/[—–|:(]/)[0].trim();
    return shortened.length <= 28
      ? shortened
      : `${shortened.slice(0, 25).trim()}…`;
  }

  return filename
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Open";
}

export function enhanceNavbar() {
  const navbar = document.querySelector<HTMLElement>("#navbar");
  if (!navbar || navbar.dataset.olwlgEnhanced) return;

  navbar.dataset.olwlgEnhanced = "true";
  navbar.classList.add("olwlg-navbar");

  const brandLogo = document.createElement("img");
  const brandLabel = document.createElement("span");
  brandLogo.className = "olwlg-navbar__logo";
  brandLogo.src =
    typeof chrome.runtime?.getURL === "function"
      ? chrome.runtime.getURL("icons/icon.svg")
      : "";
  brandLogo.alt = "";
  brandLabel.textContent = "OLWLG";
  const brand = createLink({
    ariaLabel: "OLWLG home",
    className: "olwlg-navbar__brand",
    content: [brandLogo, brandLabel],
    href: new URL("/olwlg/", location.origin).href,
    target: "_self",
  });
  navbar.prepend(brand);

  for (const node of [...navbar.childNodes]) {
    if (!(node instanceof Text)) continue;
    const text = normalizeWhitespace(node.data);
    if (!text || /^navigation:?$/i.test(text) || text === "-") {
      node.remove();
      continue;
    }
    if (/logged in as|you are not logged in/i.test(text)) {
      const account = document.createElement("span");
      account.className = "olwlg-navbar__account";
      account.textContent = text;
      node.replaceWith(account);
    }
  }

  navbar.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
    if (link === brand) return;
    const image = link.querySelector<HTMLImageElement>("img");
    if (!image) {
      link.classList.add("olwlg-nav-text-link");
      return;
    }
    const labelText = conciseNavLabel(link, image);
    const label = document.createElement("span");
    label.className = "olwlg-nav-item__label";
    label.textContent = labelText;
    link.classList.add("olwlg-nav-item");
    link.setAttribute("aria-label", labelText);
    link.append(label);
  });

  navbar.querySelectorAll<HTMLFormElement>("form").forEach((form) => {
    const submit = form.querySelector<HTMLInputElement>(
      'input[type="image"], input[type="submit"]',
    );
    if (!submit) return;
    const label = document.createElement("span");
    label.className = "olwlg-nav-item__label";
    label.textContent = "Donate";
    form.classList.add("olwlg-nav-donate");
    form.setAttribute("aria-label", "Donate");
    form.append(label);
  });

  const menus = document.createElement("nav");
  const user = document.createElement("div");
  menus.className = "olwlg-navbar__menus";
  menus.setAttribute("aria-label", "Primary navigation");
  user.className = "olwlg-navbar__user";

  const groups = new Map<string, HTMLElement[]>([
    ["Trade", []],
    ["Insights", []],
    ["Resources", []],
    ["Support", []],
  ]);
  const accountLabels = /profile|log in|log out|logout|sign out|account/i;
  let profileLink: HTMLElement | undefined;
  let logoutLink: HTMLElement | undefined;
  let editWantsLink: HTMLElement | undefined;
  const isCatalogPage = location.pathname.endsWith("/viewlist.cgi");
  const catalogEditWantsItems = isCatalogPage
    ? [...navbar.querySelectorAll<HTMLElement>(".olwlg-nav-item")].filter(
        (item) =>
          /edit (?:your )?wants/i.test(
            normalizeWhitespace(
              item.querySelector(".olwlg-nav-item__label")?.textContent,
            ),
          ),
      )
    : [];
  editWantsLink =
    catalogEditWantsItems.find((item) => {
      const image = item.querySelector<HTMLImageElement>("img");
      return (
        (image && imageFilename(image) === "step4.gif") ||
        (item instanceof HTMLAnchorElement && /step4/i.test(item.href))
      );
    }) ?? catalogEditWantsItems[0];

  navbar.querySelectorAll<HTMLElement>(".olwlg-nav-item").forEach((item) => {
    const label = normalizeWhitespace(
      item.querySelector(".olwlg-nav-item__label")?.textContent,
    );
    if (isCatalogPage && /edit (?:your )?wants/i.test(label)) {
      if (item !== editWantsLink) item.remove();
      return;
    }
    if (accountLabels.test(label)) {
      const href = item instanceof HTMLAnchorElement ? item.href : "";
      if (/log\s*out|logout|sign\s*out/i.test(`${label} ${href}`))
        logoutLink ??= item;
      else profileLink ??= item;
      return;
    }
    const category = /statistics|participants|results/i.test(label)
      ? "Insights"
      : /help|geeklist|discussion|play online/i.test(label)
        ? "Resources"
        : /tip|auction/i.test(label)
          ? "Support"
          : "Trade";
    groups.get(category)?.push(item);
  });

  const accountText = navbar.querySelector<HTMLElement>(
    ".olwlg-navbar__account",
  );
  const accountLinks = [
    ...navbar.querySelectorAll<HTMLAnchorElement>(".olwlg-nav-text-link"),
  ];
  if (isCatalogPage && !editWantsLink) {
    editWantsLink = accountLinks.find(
      (link) =>
        /mywants|step4/i.test(link.href) ||
        /edit (?:your )?wants/i.test(normalizeWhitespace(link.textContent)),
    );
  }
  if (editWantsLink) {
    navbar.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
      if (
        link !== editWantsLink &&
        (/mywants|step4/i.test(link.href) ||
          /edit (?:your )?wants/i.test(normalizeWhitespace(link.textContent)))
      )
        link.remove();
    });
  }
  const logoutTextLink = accountLinks.find((link) =>
    /log\s*out|logout|sign\s*out/i.test(
      `${normalizeWhitespace(link.textContent)} ${link.href}`,
    ),
  );
  const logoutControl = logoutLink ?? logoutTextLink;
  const profileTextLinks = accountLinks.filter(
    (link) =>
      link !== editWantsLink && link !== logoutControl && link.isConnected,
  );
  const usernameLink =
    profileTextLinks.find((link) =>
      /\/user\/|geekname=|username=|profile/i.test(link.href),
    ) ?? profileTextLinks[0];
  navbar
    .querySelectorAll<HTMLElement>(".olwlg-nav-donate")
    .forEach((item) => groups.get("Support")?.push(item));

  for (const [category, items] of groups) {
    if (!items.length) continue;
    const dropdown = document.createElement("details");
    const summary = document.createElement("summary");
    const panel = document.createElement("div");
    dropdown.className = "olwlg-nav-dropdown";
    summary.textContent = category;
    panel.className = "olwlg-nav-dropdown__panel";
    panel.append(...items);
    dropdown.append(summary, panel);
    menus.append(dropdown);
  }

  const brandElement = navbar.querySelector(".olwlg-navbar__brand");
  brandElement?.insertAdjacentElement("afterend", menus);

  if (editWantsLink) {
    editWantsLink.classList.remove("olwlg-nav-text-link");
    editWantsLink.classList.add("olwlg-nav-item", "olwlg-navbar__edit-wants");
    editWantsLink.querySelectorAll("img").forEach((image) => image.remove());
    let label = editWantsLink.querySelector(".olwlg-nav-item__label");
    if (!label) {
      label = document.createElement("span");
      label.className = "olwlg-nav-item__label";
      editWantsLink.replaceChildren(label);
    }
    const icon = createModernIcon("wants");
    icon.removeAttribute("aria-label");
    icon.removeAttribute("data-olwlg-tooltip");
    label.textContent = "Edit your wants";
    editWantsLink.prepend(icon);
    editWantsLink.setAttribute("aria-label", "Edit your wants");
    user.append(editWantsLink);
  }

  if (usernameLink || profileLink || logoutControl) {
    const accountMenu = document.createElement("details");
    const summary = document.createElement("summary");
    const panel = document.createElement("div");
    const heading = document.createElement("div");
    const avatar = createModernIcon("users");
    const username =
      normalizeWhitespace(usernameLink?.textContent) ||
      normalizeWhitespace(profileLink?.textContent) ||
      "Account";

    accountMenu.className = "olwlg-profile-menu";
    summary.className = "olwlg-profile-menu__trigger";
    panel.className = "olwlg-profile-menu__panel";
    heading.className = "olwlg-profile-menu__heading";
    avatar.classList.add("olwlg-profile-menu__avatar");
    avatar.removeAttribute("data-olwlg-tooltip");
    avatar.removeAttribute("aria-label");
    summary.setAttribute("aria-label", `Open ${username} account menu`);
    summary.append(avatar, document.createTextNode(username));

    const panelAvatar = createModernIcon("users");
    const identity = document.createElement("div");
    panelAvatar.classList.add("olwlg-profile-menu__avatar");
    panelAvatar.removeAttribute("data-olwlg-tooltip");
    panelAvatar.removeAttribute("aria-label");
    identity.innerHTML =
      `<strong>${username}</strong><span>Logged in as: ${username}</span>`;
    heading.append(panelAvatar, identity);
    panel.append(heading);

    if (usernameLink) {
      usernameLink.classList.add("olwlg-profile-menu__link");
      usernameLink.textContent = "View BGG profile";
      panel.append(usernameLink);
    }
    if (profileLink) {
      profileLink.classList.add("olwlg-profile-menu__link");
      const label = profileLink.querySelector(".olwlg-nav-item__label");
      if (label) label.textContent = "OLWLG profile settings";
      panel.append(profileLink);
    }
    if (logoutControl instanceof HTMLAnchorElement) {
      const logoutIcon = createModernIcon("logout");
      const logoutLabel = document.createElement("span");
      logoutControl.classList.remove("olwlg-nav-item", "olwlg-nav-text-link");
      logoutControl.classList.add(
        "olwlg-profile-menu__link",
        "olwlg-profile-menu__link--logout",
      );
      logoutIcon.removeAttribute("data-olwlg-tooltip");
      logoutIcon.removeAttribute("aria-label");
      logoutLabel.textContent = "Log out";
      logoutControl.replaceChildren(logoutIcon, logoutLabel);
      logoutControl.setAttribute("aria-label", "Log out");
      panel.append(logoutControl);
    }
    accountText?.remove();
    profileTextLinks
      .filter((link) => link !== usernameLink)
      .forEach((link) => panel.append(link));
    accountMenu.append(summary, panel);
    user.append(accountMenu);
  } else {
    if (accountText) user.append(accountText);
    profileTextLinks.forEach((link) => user.append(link));
  }

  const accountTextWalker = document.createTreeWalker(
    navbar,
    NodeFilter.SHOW_TEXT,
  );
  const accountTextNodes: Text[] = [];
  while (accountTextWalker.nextNode())
    accountTextNodes.push(accountTextWalker.currentNode as Text);
  accountTextNodes.forEach((textNode) => {
    textNode.data = textNode.data.replace(/logged\s+in\s+as\s*:\s*/gi, "");
  });

  for (const node of [...navbar.childNodes]) {
    if (
      node === brandElement ||
      node === menus ||
      node === user ||
      user.contains(node)
    )
      continue;
    if (node instanceof Text && !normalizeWhitespace(node.data)) {
      node.remove();
      continue;
    }
    user.append(node);
  }
  navbar.append(user);

  navbar.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const selected = event.target.closest(".olwlg-nav-dropdown__panel a");
    if (selected)
      selected.closest<HTMLDetailsElement>("details")?.removeAttribute("open");
  });
  const navDropdowns = [
    ...navbar.querySelectorAll<HTMLDetailsElement>(".olwlg-nav-dropdown"),
  ];
  navDropdowns.forEach((dropdown) => {
    let closeTimer: number | undefined;
    const cancelScheduledClose = () => {
      window.clearTimeout(closeTimer);
      closeTimer = undefined;
    };
    const scheduleClose = () => {
      cancelScheduledClose();
      closeTimer = window.setTimeout(() => {
        dropdown.removeAttribute("open");
      }, 240);
    };
    const closeOtherMenus = () => {
      navDropdowns
        .filter((other) => other !== dropdown)
        .forEach((other) => other.removeAttribute("open"));
      navbar
        .querySelector<HTMLDetailsElement>(".olwlg-profile-menu[open]")
        ?.removeAttribute("open");
    };
    dropdown.addEventListener("toggle", () => {
      if (dropdown.open) closeOtherMenus();
    });
    dropdown.addEventListener("mouseenter", () => {
      cancelScheduledClose();
      closeOtherMenus();
      dropdown.setAttribute("open", "");
    });
    dropdown.addEventListener("mouseleave", scheduleClose);
    dropdown
      .querySelector(".olwlg-nav-dropdown__panel")
      ?.addEventListener("mouseenter", cancelScheduledClose);
  });
  document.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Node && navbar.contains(event.target)) return;
    navbar
      .querySelectorAll<HTMLDetailsElement>(
        ".olwlg-nav-dropdown[open], .olwlg-profile-menu[open]",
      )
      .forEach((dropdown) => dropdown.removeAttribute("open"));
  });
}