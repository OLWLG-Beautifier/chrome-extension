import {
  createButton,
  createLink,
} from "../../components";
import {
  buildCatalogCountdown,
} from "./countdown";
import {
  exactCatalogOfferDeadline,
  exactCatalogSubmissionDeadline,
  stableCatalogOfferDeadline,
  stableCatalogSubmissionDeadline,
} from "./deadlines";
import {
  removeCatalogDeadlineMessage,
  removeCatalogEditWantsPrompt,
} from "./footer";
import {
  normalizedText,
} from "./helpers";
import {
  enhanceCatalogMessages,
  removeCatalogItemCountFromMessage,
} from "./messages";
import {
  catalogListId,
  rememberCatalogTradeState,
  rememberedCatalogTradeState,
} from "./mode";
import {
  catalogIsReadOnly,
  installReadOnlyWantGuard,
} from "./participation";

export function createCatalogInfoCard(toolbar: HTMLElement) {
  const container = toolbar.parentElement;
  if (!container) return;
  const readOnly = catalogIsReadOnly();

  const card = document.createElement("section");
  const header = document.createElement("header");
  const title = document.createElement("h1");
  const overview = document.createElement("div");
  const notes = document.createElement("div");
  const actions = document.createElement("div");
  card.className = "olwlg-catalog-info-card";
  header.className = "olwlg-catalog-info-card__header";
  overview.className = "olwlg-catalog-info-card__overview";
  notes.className = "olwlg-catalog-info-card__notes";
  actions.className = "olwlg-catalog-info-card__actions";

  const candidates: ChildNode[] = [];
  let node: ChildNode | null = container.firstChild;
  while (node && node !== toolbar) {
    const next: ChildNode | null = node.nextSibling;
    if (
      !(node instanceof HTMLElement) ||
      (!node.matches(
        "#navbar, #spacer, #gamedesc, #gamedescframe, script, style, link, .olwlg-catalog-modal",
      ) &&
        !node.closest("#navbar"))
    )
      candidates.push(node);
    node = next;
  }

  const mainHeading = candidates
    .flatMap((candidate) => {
      if (!(candidate instanceof HTMLElement)) return [];
      if (candidate.matches("h3")) return [candidate];
      return [...candidate.querySelectorAll<HTMLHeadingElement>("h3")];
    })
    .find(
      (candidate) =>
        !/warning|note|important/i.test(normalizedText(candidate.textContent)),
    ) as HTMLHeadingElement | undefined;
  if (mainHeading) {
    [...mainHeading.childNodes].forEach((child) => {
      title.append(child.cloneNode(true));
    });
  } else {
    title.textContent = "Math trade catalog";
  }
  mainHeading?.remove();
  header.innerHTML =
    '<div><p class="olwlg-catalog-eyebrow">Current math trade</p></div>';
  header.firstElementChild?.append(title);
  if (readOnly) {
    const eyebrow = header.querySelector<HTMLElement>(".olwlg-catalog-eyebrow");
    if (eyebrow) eyebrow.textContent = "Read-only math trade";
  }

  candidates.forEach((candidate) => {
    if (!candidate.isConnected || candidate === mainHeading) return;
    if (candidate instanceof Text) {
      const text = normalizedText(candidate.data);
      if (!text) {
        candidate.remove();
        return;
      }
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      overview.append(paragraph);
      candidate.remove();
      return;
    }

    if (!(candidate instanceof HTMLElement)) return;
    const text = normalizedText(candidate.textContent);
    const isNote =
      candidate.matches(".olwlg-message, [role='alert']") ||
      /warning|important|only viewing new items|note:/i.test(text);
    const isAction =
      candidate.matches("form, a, button") ||
      Boolean(
        candidate.querySelector(
          ".olwlg-wants-cta, input[type='button'], input[type='submit'], button",
        ),
      ) ||
      (text.length < 300 &&
        candidate.querySelectorAll("a, input[type='image']").length > 1);

    if (isNote) notes.append(candidate);
    else if (isAction) actions.append(candidate);
    else overview.append(candidate);
  });

  const editWants = [
    ...actions.querySelectorAll<HTMLElement>(
      ".olwlg-wants-cta, a[href*='mywants'], a[href*='step4']",
    ),
    ...overview.querySelectorAll<HTMLElement>(
      ".olwlg-wants-cta, a[href*='mywants'], a[href*='step4']",
    ),
    ...notes.querySelectorAll<HTMLElement>(
      ".olwlg-wants-cta, a[href*='mywants'], a[href*='step4']",
    ),
  ][0];
  if (editWants && readOnly) {
    editWants.remove();
  } else if (editWants) {
    editWants.classList.add("olwlg-catalog-action--edit-wants");
    if (!actions.contains(editWants)) actions.append(editWants);
  }
  removeCatalogEditWantsPrompt();
  const hideComments = [
    ...actions.querySelectorAll<HTMLElement>("a, button, input"),
  ].find((control) =>
    /hide comments/i.test(
      normalizedText(
        control instanceof HTMLInputElement
          ? control.value
          : control.textContent,
      ),
    ),
  );
  if (hideComments) {
    hideComments.classList.add("olwlg-catalog-action--hide-comments");
    actions.append(hideComments);
  }

  [overview, notes, actions].forEach((section) => {
    section.querySelectorAll<HTMLElement>("*").forEach((element) => {
      if (/color coding and icon guide/i.test(normalizedText(element.textContent)))
        element.closest("details")?.remove() ?? element.remove();
    });
    const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
    textNodes.forEach((textNode) => {
      if (/^[\[\]()]+$/.test(normalizedText(textNode.data)))
        textNode.remove();
    });
  });
  notes.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6").forEach(
    (heading) => {
      if (/^warning!?$/i.test(normalizedText(heading.textContent)))
        heading.remove();
    },
  );
  const submissionAlert = [
    ...notes.querySelectorAll<HTMLElement>(".olwlg-message, [role='alert']"),
  ].find((message) =>
    /submission window is open for submitting your wants but you have not yet submitted/i.test(
      normalizedText(message.textContent),
    ),
  );
  if (submissionAlert && readOnly) {
    submissionAlert.remove();
    if (!normalizedText(notes.textContent)) notes.replaceChildren();
  } else if (submissionAlert) {
    submissionAlert.classList.add("olwlg-message--submission-alert");
    submissionAlert.setAttribute("role", "alert");
    submissionAlert.setAttribute("aria-live", "assertive");
    notes.prepend(submissionAlert);
  }

  const informationRoots: ParentNode[] = [overview, notes, actions, document];
  const timingMetadata = informationRoots.flatMap((root) =>
    [...root.querySelectorAll<HTMLElement>(
      "[title], [aria-label], img[alt], input[value], [data-deadline], " +
        "[data-submission-deadline], [data-wants-deadline], " +
        "[data-offer-deadline], [data-items-deadline]",
    )].flatMap((element) => [
      element.title,
      element.getAttribute("aria-label"),
      element instanceof HTMLImageElement ? element.alt : undefined,
      element instanceof HTMLInputElement ? element.value : undefined,
      element.getAttribute("data-deadline"),
      element.getAttribute("data-submission-deadline"),
      element.getAttribute("data-wants-deadline"),
      element.getAttribute("data-offer-deadline"),
      element.getAttribute("data-items-deadline"),
    ])
  ).filter(
    (value): value is string =>
      Boolean(value) &&
      /(?:days?|hours?|minutes?)\s+(?:left|until)|deadline|trade\s+is\s+over/i
        .test(value ?? ""),
  );
  const combinedInformation = normalizedText(
    `${overview.textContent} ${notes.textContent} ${actions.textContent} ${
      timingMetadata.join(" ")
    }`,
  );
  const activeThreadsSummary = [overview, notes, actions]
    .flatMap((section) => [
      ...section.querySelectorAll<HTMLElement>("summary, h2, h3, h4"),
    ])
    .find((element) =>
      /active olwlg threads/i.test(normalizedText(element.textContent)),
    );
  const activeThreads =
    activeThreadsSummary?.closest<HTMLElement>("details") ??
    activeThreadsSummary?.parentElement;
  if (activeThreads) {
    activeThreads.classList.add("olwlg-active-threads");
    document.body.append(activeThreads);
  }
  const deadlinePattern =
    /(\d+(?:\.\d+)?)\s+(days?|hours?|minutes?)\s+left\s+to\s+((?:re-?submit|submit(?:\/re-?submit)?)\s+your\s+wants)/i;
  const deadlineMatch = combinedInformation.match(deadlinePattern);
  const offerDeadlinePattern =
    /(\d+(?:\.\d+)?)\s+(days?|hours?|minutes?)\s+left\s+to\s+((?:offer(?:\s*(?:\/|\()\s*add\s*\)?)?|add)\s+(?:games?|items?))/i;
  const offerDeadlineMatch = combinedInformation.match(offerDeadlinePattern);
  const tradeEndTimingPattern =
    /(-?\d+(?:\.\d+)?)\s+(days?|hours?|minutes?)\s+(?:left\s+)?until\s+(?:the\s+)?(?:math\s+)?trade\s+is\s+over/i;
  const tradeEndTimingMatch = combinedInformation.match(tradeEndTimingPattern);
  const exactDeadline = exactCatalogSubmissionDeadline([
    overview,
    notes,
    actions,
    document,
  ]);
  const submissionDeadline = deadlineMatch
    ? stableCatalogSubmissionDeadline(
        deadlineMatch[1],
        deadlineMatch[2],
        exactDeadline,
      )
    : undefined;
  const exactOfferDeadline = exactCatalogOfferDeadline([
    overview,
    notes,
    actions,
    document,
  ]);
  const offerDeadline = offerDeadlineMatch
    ? stableCatalogOfferDeadline(
        offerDeadlineMatch[1],
        offerDeadlineMatch[2],
        exactOfferDeadline,
      )
    : exactOfferDeadline;
  const phaseContext = normalizedText(
    `${document.title} ${title.textContent}`,
  );
  const isStep3Page =
    /want list generator\s*:\s*step\s*3|\bstep\s*3\b/i.test(phaseContext);
  const endedStateText = normalizedText(
    `${document.title} ${combinedInformation}`,
  );
  const endedStateWithoutTiming = endedStateText.replace(
    new RegExp(tradeEndTimingPattern.source, "gi"),
    "",
  );
  const hasFutureTiming =
    Number.parseFloat(deadlineMatch?.[1] ?? "0") > 0 ||
    Number.parseFloat(offerDeadlineMatch?.[1] ?? "0") > 0 ||
    Number.parseFloat(tradeEndTimingMatch?.[1] ?? "0") > 0 ||
    (exactDeadline !== undefined && exactDeadline > Date.now()) ||
    (exactOfferDeadline !== undefined && exactOfferDeadline > Date.now());
  const hasExpiredTradeTiming =
    tradeEndTimingMatch !== null &&
    Number.parseFloat(tradeEndTimingMatch[1]) <= 0;
  const hasExplicitEndedState =
    /(?:math\s+)?trade\s+(?:has\s+ended|is\s+(?:over|closed|completed|finished))|ended\s+(?:math\s+)?trade|(?:offers?|submissions?|want\s*lists?).{0,60}(?:closed|ended|no\s+longer\s+accepted)/i
      .test(endedStateWithoutTiming);
  const isEndedTrade =
    !hasFutureTiming &&
    (hasExpiredTradeTiming ||
      hasExplicitEndedState ||
      rememberedCatalogTradeState() === "ended");
  if (hasFutureTiming) {
    const listId = catalogListId();
    if (listId) rememberCatalogTradeState(listId, "active");
  }
  const isOfferPhase =
    !isEndedTrade &&
    !deadlineMatch &&
    (Boolean(offerDeadlineMatch) || isStep3Page);
  if (isEndedTrade) {
    document.body.classList.add("olwlg-catalog-read-only");
    installReadOnlyWantGuard();
    const listId = catalogListId();
    if (listId) rememberCatalogTradeState(listId, "ended");
    card.classList.add("olwlg-catalog-info-card--ended");
    const eyebrow = header.querySelector<HTMLElement>(".olwlg-catalog-eyebrow");
    if (eyebrow) eyebrow.textContent = "Ended math trade";
    actions.replaceChildren();
    actions.hidden = true;
    notes.replaceChildren();
    notes.hidden = true;
  } else if (isOfferPhase) {
    const eyebrow = header.querySelector<HTMLElement>(".olwlg-catalog-eyebrow");
    if (eyebrow) eyebrow.textContent = "Offer phase";
  }
  overview.replaceChildren();
  if (isEndedTrade) {
    const { countdown, update: updateCountdown } = buildCatalogCountdown(
      "This math trade has ended.",
      Date.now(),
      "ended",
    );
    overview.append(countdown);
    updateCountdown();
  } else if (isOfferPhase && offerDeadline !== undefined) {
    removeCatalogDeadlineMessage(
      [notes, actions],
      new RegExp(offerDeadlinePattern.source, "i"),
    );
    const { countdown, update: updateCountdown } = buildCatalogCountdown(
      offerDeadlineMatch?.[3] ?? "Offer/add games",
      offerDeadline,
      "offer",
    );
    overview.append(countdown);
    updateCountdown();
    window.setInterval(updateCountdown, 1000);
  } else if (deadlineMatch && submissionDeadline !== undefined) {
    removeCatalogDeadlineMessage(
      [notes, actions],
      new RegExp(deadlinePattern.source, "i"),
    );
    const { countdown, update: updateCountdown } = buildCatalogCountdown(
      readOnly ? "Submission window closes" : deadlineMatch[3],
      submissionDeadline,
    );
    overview.append(countdown);
    updateCountdown();
    window.setInterval(updateCountdown, 1000);
  }
  if (isOfferPhase) {
    const offerNotice = document.createElement("p");
    offerNotice.className = "olwlg-catalog-offer-notice";
    offerNotice.textContent =
      "This math trade is open for item offers. Want-list submission has not started yet.";
    notes.append(offerNotice);
  }
  if (readOnly && !isEndedTrade) {
    const readOnlyNotice = document.createElement("p");
    readOnlyNotice.className =
      "olwlg-catalog-ended-notice olwlg-catalog-read-only-notice";
    readOnlyNotice.textContent =
      "You are not participating in this math trade. Want-list changes are unavailable.";
    notes.append(readOnlyNotice);
  }
  if (actions.childNodes.length) {
    const actionsTitle = document.createElement("h2");
    actionsTitle.textContent = "Actions";
    actions.prepend(actionsTitle);
    overview.append(actions);
  } else actions.hidden = true;

  if (overview.childNodes.length) {
    const overviewTitle = document.createElement("h2");
    overviewTitle.textContent = "Trade information";
    overview.prepend(overviewTitle);
  } else {
    overview.hidden = true;
    card.classList.add("olwlg-catalog-info-card--without-overview");
  }

  if (notes.childNodes.length) {
    const notesTitle = document.createElement("h2");
    notesTitle.textContent = "Important notes";
    notes.prepend(notesTitle);
  } else {
    notes.hidden = true;
    card.classList.add("olwlg-catalog-info-card--without-notes");
  }

  card.append(header, overview, notes);
  if (card.contains(toolbar) || toolbar.contains(card)) return;
  container.insertBefore(card, toolbar);
}

export function createMyWantsInfoCard(
  toolbar: HTMLElement,
  controlLabel: (control: HTMLElement) => string,
) {
  if (!location.pathname.endsWith("/mywants.cgi")) return;
  if (document.querySelector(".olwlg-mywants-info-card")) return;
  const readOnly = catalogIsReadOnly();

  enhanceCatalogMessages();
  const controls = [
    ...document.querySelectorAll<HTMLElement>(
      "a, button, input[type='button'], input[type='submit'], input[type='reset'], input[type='image']",
    ),
  ].filter(
    (control) =>
      !control.closest("#navbar, .olwlg-want-matrix-toolbar") &&
      !toolbar.contains(control),
  );
  const actionDefinitions = [
    {
      className: "olwlg-mywants-action--confirm",
      label: "Confirm Changes",
      pattern: /\bconfirm\s+changes\b/i,
    },
    {
      className: "olwlg-mywants-action--reset",
      label: "Reset Changes",
      pattern: /\breset\s+changes\b/i,
    },
    {
      className: "olwlg-mywants-action--submit",
      label: "Submit My Wants",
      pattern: /\bsubmit(?:\s+my)?\s+wants\b/i,
    },
  ];
  const actionSources = actionDefinitions.map((definition) => ({
    ...definition,
    source: controls.find((control) =>
      definition.pattern.test(
        normalizedText(
          `${controlLabel(control)} ${
            control.querySelector<HTMLImageElement>("img")?.alt ?? ""
          }`,
        ),
      )
    ),
  }));
  document.body.classList.add("olwlg-mywants-page");

  const headings = [
    ...document.querySelectorAll<HTMLHeadingElement>("h1, h2, h3, h4"),
  ];
  const mainHeading = headings.find((heading) =>
    /math trade gateway[\s\S]*steps?\s*4\s*(?:&|and)\s*5/i.test(
      normalizedText(heading.textContent),
    )
  );
  const instructionDetails = [
    ...document.querySelectorAll<HTMLDetailsElement>("details"),
  ].filter((details) =>
    /active olwlg threads|how to assign values and auto-check boxes/i.test(
      normalizedText(details.querySelector("summary")?.textContent),
    )
  );
  const messages = [
    ...document.querySelectorAll<HTMLElement>(".olwlg-message, [role='alert']"),
  ];
  const submissionAlert = messages.find((message) =>
    /submission window is open for submitting your wants but you have not yet submitted/i.test(
      normalizedText(message.textContent),
    )
  );
  const resubmissionWarning = messages.find((message) =>
    message.classList.contains("olwlg-message--resubmission-warning") ||
    /made changes(?:\/edits| or edits)? to your want lists? after your last submission/i.test(
      normalizedText(message.textContent),
    )
  );
  const commentsWarning = messages.find((message) =>
    /offerings?.{0,40}geeklist comments.{0,80}not replied/i.test(
      normalizedText(message.textContent),
    )
  );
  if (commentsWarning) removeCatalogItemCountFromMessage(commentsWarning);
  const deadlinePattern =
    /(\d+(?:\.\d+)?)\s+(days?|hours?|minutes?)\s+left\s+to\s+((?:re-?submit|submit(?:\/re-?submit)?)\s+your\s+wants)/i;
  const deadlineSource = [
    ...document.querySelectorAll<HTMLElement>("a, p, div, span, center"),
  ]
    .filter((element) => deadlinePattern.test(normalizedText(element.textContent)))
    .sort(
      (left, right) =>
        normalizedText(left.textContent).length -
        normalizedText(right.textContent).length,
    )[0];
  const deadlineMatch = normalizedText(deadlineSource?.textContent).match(
    deadlinePattern,
  );
  const exactDeadline = exactCatalogSubmissionDeadline([document]);
  const submissionDeadline = deadlineMatch
    ? stableCatalogSubmissionDeadline(
        deadlineMatch[1],
        deadlineMatch[2],
        exactDeadline,
      )
    : exactDeadline;

  const card = document.createElement("section");
  const header = document.createElement("header");
  const headerCopy = document.createElement("div");
  const eyebrow = document.createElement("p");
  const title = document.createElement("h1");
  const overview = document.createElement("div");
  const notes = document.createElement("div");
  const actions = document.createElement("div");
  card.className = "olwlg-catalog-info-card olwlg-mywants-info-card";
  header.className = "olwlg-catalog-info-card__header";
  overview.className = "olwlg-catalog-info-card__overview";
  notes.className = "olwlg-catalog-info-card__notes";
  actions.className = "olwlg-catalog-info-card__actions";
  eyebrow.className = "olwlg-catalog-eyebrow";
  eyebrow.textContent = readOnly ? "Read-only math trade" : "Current math trade";
  if (mainHeading) {
    [...mainHeading.childNodes].forEach((child) =>
      title.append(child.cloneNode(true))
    );
  } else {
    title.textContent = "Math Trade Gateway: Steps 4 & 5";
  }
  headerCopy.append(eyebrow, title);
  header.append(headerCopy);

  const overviewTitle = document.createElement("h2");
  overviewTitle.textContent = "Trade information";
  overview.append(overviewTitle);
  let readOnlyNotice: HTMLElement | undefined;
  if (readOnly) {
    readOnlyNotice = document.createElement("p");
    readOnlyNotice.className =
      "olwlg-catalog-ended-notice olwlg-catalog-read-only-notice";
    readOnlyNotice.textContent =
      "You are not participating in this math trade. Want-list changes are unavailable.";
  } else if (submissionDeadline !== undefined) {
    const { countdown, update: updateCountdown } = buildCatalogCountdown(
      deadlineMatch?.[3] ?? "Submit/re-submit your wants",
      submissionDeadline,
    );
    overview.append(countdown);
    updateCountdown();
    window.setInterval(updateCountdown, 1000);
  } else {
    const status = document.createElement("p");
    status.className = "olwlg-catalog-ended-notice";
    status.textContent = submissionAlert
      ? "The submission window is currently open."
      : "Want-list editing is available for this math trade.";
    overview.append(status);
  }

  const actionsTitle = document.createElement("h2");
  actionsTitle.textContent = "Actions";
  actions.append(actionsTitle);
  actionSources.forEach(({ className, label, source }) => {
    if (!source) return;
    source.classList.add("olwlg-mywants-original-action");
    if (readOnly) return;
    const isChangeAction =
      className === "olwlg-mywants-action--confirm" ||
      className === "olwlg-mywants-action--reset";
    const proxy = !isChangeAction && source instanceof HTMLAnchorElement
      ? createLink({
        className: `olwlg-mywants-action ${className}`,
        content: label,
        href: source.href,
        rel: source.rel,
        target: source.target,
      })
      : createButton({
        className: `olwlg-mywants-action ${className}`,
        content: label,
        onClick: () => source.click(),
        variant: "custom",
      });
    if (isChangeAction && proxy instanceof HTMLButtonElement) {
      proxy.disabled = true;
      proxy.setAttribute("aria-disabled", "true");
    }
    actions.append(proxy);
  });
  if (actions.childElementCount > 1) overview.append(actions);
  else actions.remove();

  if (overview.childElementCount === 1) {
    overview.hidden = true;
    card.classList.add("olwlg-catalog-info-card--without-overview");
  }

  const noteElements = [
    readOnlyNotice,
    submissionAlert,
    resubmissionWarning,
    commentsWarning,
  ].filter(
    (message): message is HTMLElement => Boolean(message),
  );
  if (noteElements.length) {
    const notesTitle = document.createElement("h2");
    notesTitle.textContent = "Important notes";
    notes.append(notesTitle);
    noteElements.forEach((message) => notes.append(message));
    submissionAlert?.classList.add("olwlg-message--submission-alert");
  } else {
    notes.hidden = true;
    card.classList.add("olwlg-catalog-info-card--without-notes");
  }

  card.append(header, overview, notes);

  const sourceElements = [
    mainHeading,
    ...instructionDetails,
    deadlineSource,
    submissionAlert,
    resubmissionWarning,
    commentsWarning,
  ].filter((element): element is HTMLElement => Boolean(element));
  const firstSource = sourceElements
    .filter((element) => element.isConnected)
    .sort((left, right) =>
      left === right
        ? 0
        : left.compareDocumentPosition(right) &
            Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1
    )[0];
  const insertionTarget = firstSource ?? toolbar;
  insertionTarget.parentElement?.insertBefore(card, insertionTarget);

  mainHeading?.classList.add("olwlg-mywants-source-hidden");
  deadlineSource?.classList.add("olwlg-mywants-source-hidden");
  headings
    .filter((heading) =>
      /^warning!?$/i.test(normalizedText(heading.textContent))
    )
    .forEach((heading) =>
      heading.classList.add("olwlg-mywants-source-hidden")
    );
  instructionDetails.forEach((details) => {
    if (/active olwlg threads/i.test(normalizedText(details.textContent))) {
      details.classList.add("olwlg-active-threads");
      document.body.append(details);
    } else details.classList.add("olwlg-mywants-source-hidden");
  });
}
