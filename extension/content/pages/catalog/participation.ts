import {
  createButton,
} from "../../components";
import {
  catalogDirectWantControl,
  catalogWantControl,
} from "./actions";
import {
  normalizedText,
} from "./helpers";
import {
  activeCatalogMode,
  catalogListId,
  fullCatalogUrl,
} from "./mode";
import {
  findCatalogTable,
  participantFromRow,
} from "./parsing";

export function addCatalogBackToTop() {
  if (document.querySelector(".olwlg-back-to-top")) return;

  const button = createButton({
    ariaLabel: "Back to top",
    className: "olwlg-back-to-top",
    content: [],
    hidden: true,
    variant: "custom",
  });
  button.innerHTML =
    '<span aria-hidden="true">↑</span><span>Back to top</span>';

  let frame = 0;
  const updateVisibility = () => {
    frame = 0;
    button.hidden = window.scrollY < 600;
  };
  window.addEventListener(
    "scroll",
    () => {
      if (frame) return;
      frame = requestAnimationFrame(updateVisibility);
    },
    { passive: true },
  );
  button.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  });

  document.body.append(button);
  updateVisibility();
}

export function catalogLoggedInUsername() {
  const profileName = normalizedText(
    document.querySelector<HTMLElement>(".olwlg-profile-menu__heading strong")
      ?.textContent ??
      document.querySelector<HTMLElement>(".olwlg-profile-menu__trigger")
        ?.textContent,
  );
  if (profileName) return profileName;

  const profileLink = [
    ...document.querySelectorAll<HTMLAnchorElement>(
      "a[href*='/user/'], a[href*='geekname='], a[href*='username=']",
    ),
  ][0];
  if (!profileLink) return undefined;
  const url = new URL(profileLink.href);
  const encodedName =
    url.pathname.match(/\/user\/([^/?#]+)/i)?.[1] ??
    url.searchParams.get("geekname") ??
    url.searchParams.get("username");
  if (!encodedName) return undefined;
  try {
    return decodeURIComponent(encodedName);
  } catch {
    return encodedName;
  }
}

export async function configureCatalogParticipation(rows: HTMLTableRowElement[]) {
  const username = catalogLoggedInUsername();
  const listId = catalogListId();
  if (!username || !listId) {
    document.body.classList.add("olwlg-catalog-read-only");
    document.body.dataset.olwlgCatalogParticipation = "read-only";
    installReadOnlyWantGuard();
    return;
  }

  const storageKey = `olwlg-catalog-participation-${listId}-${username.toLocaleLowerCase()}`;
  let participates = rows.some(
    (row) =>
      participantFromRow(row).localeCompare(username, undefined, {
        sensitivity: "base",
      }) === 0,
  );
  const isVerifiedFullList =
    location.pathname.endsWith("/viewlist.cgi") &&
    activeCatalogMode() === "full";
  if (!participates && !isVerifiedFullList) {
    const verificationUrl = fullCatalogUrl();
    if (verificationUrl) {
      try {
        const response = await fetch(verificationUrl, {
          credentials: "same-origin",
          headers: { Accept: "text/html" },
        });
        if (response.ok) {
          const verificationDocument = new DOMParser().parseFromString(
            await response.text(),
            "text/html",
          );
          const verificationTable = findCatalogTable(verificationDocument);
          const verificationRows = verificationTable
            ? [...verificationTable.rows]
              .slice(1)
              .filter((row) => row.cells.length >= 2)
            : [];
          participates = verificationRows.some(
            (row) =>
              participantFromRow(row).localeCompare(username, undefined, {
                sensitivity: "base",
              }) === 0,
          );
        }
      } catch {
        participates = false;
      }
    }
  }
  const readOnly = !participates;
  sessionStorage.setItem(
    storageKey,
    participates ? "participant" : "read-only",
  );
  document.body.classList.toggle("olwlg-catalog-read-only", readOnly);
  document.body.dataset.olwlgCatalogParticipation = readOnly
    ? "read-only"
    : "participant";
  if (readOnly) installReadOnlyWantGuard();
}

export function catalogIsReadOnly() {
  return document.body.classList.contains("olwlg-catalog-read-only");
}

export let readOnlyWantGuardInstalled = false;

export function installReadOnlyWantGuard() {
  if (readOnlyWantGuardInstalled) return;
  readOnlyWantGuardInstalled = true;

  document.addEventListener(
    "click",
    (event) => {
      if (!catalogIsReadOnly() || !(event.target instanceof Element)) return;
      const target = event.target;
      let control = target.closest<HTMLElement>(
        ".olwlg-catalog-primary-action, .olwlg-catalog-add-action, " +
          ".olwlg-catalog-action--edit-wants, .olwlg-navbar__edit-wants, " +
          ".olwlg-mywants-action, .olwlg-want-matrix__bulk, " +
          "form[action*='mywants.cgi'] button, " +
          "form[action*='mywants.cgi'] input[type='submit'], " +
          "form[action*='mywants.cgi'] input[type='image'], " +
          "a[href*='mywants.cgi'], a[href*='step4']",
      );
      if (!control) {
        const row = target.closest<HTMLTableRowElement>("tr");
        const nativeControls = row
          ? [catalogWantControl(row), catalogDirectWantControl(row)].filter(
              (candidate): candidate is HTMLElement => Boolean(candidate),
            )
          : [];
        control = nativeControls.find(
          (candidate) =>
            candidate === target ||
            candidate.contains(target) ||
            target.contains(candidate),
        ) ?? null;
      }
      if (!control) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true,
  );
  document.addEventListener(
    "submit",
    (event) => {
      if (
        !catalogIsReadOnly() ||
        !(event.target instanceof HTMLFormElement) ||
        !/mywants\.cgi/i.test(event.target.action)
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true,
  );
}
