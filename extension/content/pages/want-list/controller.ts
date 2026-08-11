import { createButton, createInput, createLink, createSelect } from "../../components";
import { colorGuideLabels } from "../../core/guide-parser";
import { hideTooltip, showTooltip } from "../../core/tooltips";
import {
  backgroundColorKeys,
  catalogIsReadOnly,
  cloneElement,
  createMyWantsInfoCard,
  isValueOrderWarningColor,
  normalizedText,
  participantFromRow,
  participantUrlFromRow,
} from "../catalog";
import { wantListControlLabel, wantListNavigationLabel } from "./controls";
import {
  findWantListMatrix,
  normalizedWantListSearchText,
  readableWantListHeading,
} from "./parsing";
import {
  cleanWantListPageFooter,
  enhanceWantListSubmissionConfirmation,
  enhanceWantListSubmissionError,
} from "./submission";
import { createWantListTabs } from "./tabs";
import type { WantListRowIdentity, WantListWorkspaceView } from "./types";
import { wantListPageMode } from "./mode";

export function enhanceWantListPages() {
  const mode = wantListPageMode();
  if (!mode) return;
  const readOnly = catalogIsReadOnly();

  const matrix = findWantListMatrix();
  if (!matrix || matrix.table.dataset.olwlgWantMatrix) return;

  const { columns, header, repeatedHeaders, rows, table } = matrix;
  const sourceCellPresentation = new WeakMap<
    HTMLTableCellElement,
    { colorKeys: string[]; statusHint: string }
  >();
  [header, ...rows, ...repeatedHeaders].forEach((row) => {
    [...row.cells].forEach((cell) => {
      sourceCellPresentation.set(cell, {
        colorKeys: backgroundColorKeys(cell),
        statusHint: normalizedText(
          [
            cell.className,
            cell.id,
            cell.title,
            cell.getAttribute("aria-label"),
            cell.getAttribute("data-status"),
            cell.getAttribute("data-warning"),
          ].filter(Boolean).join(" "),
        ).toLocaleLowerCase(),
      });
    });
  });
  const form = table.closest("form");
  const matrixInputs = [
    ...table.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"], input[type="number"], input[type="text"]',
    ),
  ];
  if (readOnly) {
    matrixInputs.forEach((input) => {
      input.disabled = true;
      input.setAttribute("aria-disabled", "true");
    });
  }
  const initialValues = new Map<HTMLInputElement, string | boolean>(
    matrixInputs.map((input) => [
      input,
      input.type === "checkbox" ? input.checked : input.value,
    ]),
  );
  const columnLabels = new Map<number, string>();
  let activeColumn = -1;
  let activeFocusColumn = columns[0];
  let workspaceView: WantListWorkspaceView = mode === "review"
    ? "review"
    : "matrix";
  let setWorkspaceView = (_view: WantListWorkspaceView) => {};
  const detailColumnWidth = 400;
  const offerColumnWidth = 118;
  const matrixWidth =
    detailColumnWidth + columns.length * offerColumnWidth;

  table.dataset.olwlgWantMatrix = mode;
  table.classList.add("olwlg-want-matrix");
  table.style.setProperty(
    "width",
    `${matrixWidth}px`,
    "important",
  );
  table.style.setProperty(
    "min-width",
    `${matrixWidth}px`,
    "important",
  );
  table.style.setProperty("table-layout", "fixed", "important");
  document.body.classList.add(
    "olwlg-want-list-page",
    `olwlg-want-list-page--${mode}`,
  );
  let tableHead = table.tHead;
  if (!tableHead) {
    tableHead = document.createElement("thead");
    table.insertBefore(tableHead, table.firstChild);
  }
  if (header.parentElement !== tableHead) tableHead.append(header);
  const matrixBodies = new Set<HTMLTableSectionElement>();
  rows.forEach((row) => {
    if (row.parentElement instanceof HTMLTableSectionElement)
      matrixBodies.add(row.parentElement);
  });
  matrixBodies.forEach((body) =>
    body.classList.add("olwlg-want-matrix__body")
  );
  header.classList.add("olwlg-want-matrix__header");
  rows.forEach((row) => row.classList.add("olwlg-want-matrix__row"));
  const itemCells = [
    header.cells[0],
    ...rows.map((row) => row.cells[0]),
  ].filter(
    (cell): cell is HTMLTableCellElement =>
      cell instanceof HTMLTableCellElement,
  );
  itemCells.forEach((cell) => {
    cell.hidden = true;
    cell.setAttribute("aria-hidden", "true");
    cell.classList.add("olwlg-want-matrix__item-column");
    cell
      .querySelectorAll<HTMLElement>("a, button, input, [tabindex]")
      .forEach((control) => control.tabIndex = -1);
  });
  repeatedHeaders.forEach((row) => {
    row.hidden = true;
    row.setAttribute("aria-hidden", "true");
    row.classList.add("olwlg-want-matrix__repeated-header");
  });

  const wrapper = document.createElement("div");
  const headerViewport = document.createElement("div");
  const headerTable = table.cloneNode(false) as HTMLTableElement;
  const bodyViewport = document.createElement("div");
  wrapper.className = "olwlg-want-matrix__scroll";
  headerViewport.className = "olwlg-want-matrix__header-viewport";
  headerTable.classList.add("olwlg-want-matrix__header-table");
  headerTable.removeAttribute("data-olwlg-want-matrix");
  bodyViewport.className = "olwlg-want-matrix__body-viewport";
  wrapper.tabIndex = 0;
  wrapper.setAttribute(
    "aria-label",
    "Want-list relationship matrix. Drag to pan horizontally or vertically.",
  );
  table.insertAdjacentElement("beforebegin", wrapper);
  headerTable.append(tableHead);
  headerViewport.append(headerTable);
  bodyViewport.append(table);
  wrapper.append(headerViewport, bodyViewport);
  wrapper.style.setProperty(
    "--olwlg-want-matrix-width",
    `${matrixWidth}px`,
  );
  wrapper.style.maxWidth = "1380px";
  bodyViewport.tabIndex = 0;
  bodyViewport.setAttribute(
    "aria-label",
    "Want-list rows and columns. Drag to pan; use the checkboxes to select trades.",
  );
  const syncMatrixViewport = () => {
    const headerHeight = Math.max(
      Math.ceil(tableHead.getBoundingClientRect().height),
      1,
    );
    wrapper.style.setProperty(
      "--olwlg-want-matrix-header-height",
      `${headerHeight}px`,
    );
  };
  syncMatrixViewport();
  requestAnimationFrame(syncMatrixViewport);
  window.addEventListener("resize", syncMatrixViewport);
  if (typeof ResizeObserver !== "undefined")
    new ResizeObserver(syncMatrixViewport).observe(tableHead);

  const toolbar = document.createElement("section");
  const toolbarHeading = document.createElement("div");
  const toolbarTitle = document.createElement("div");
  const step = document.createElement("span");
  const title = document.createElement("strong");
  const summary = document.createElement("span");
  const controls = document.createElement("div");
  const search = createInput({
    ariaLabel: "Search games or participants",
    className: "olwlg-want-matrix-toolbar__search",
    placeholder: "Search games or participants…",
    type: "search",
    variant: "custom",
  });
  const filter = createSelect({
    ariaLabel: "Filter want-list rows",
    className: "olwlg-want-matrix-toolbar__filter",
    options: [
      { label: "All rows", value: "all" },
      { label: "Selected only", value: "selected" },
      { label: "Unselected only", value: "unselected" },
    ],
  });
  const viewSwitch = document.createElement("div");
  const focusView = createButton({
    attributes: { "aria-pressed": "true" },
    className: "olwlg-want-view-switch__option",
    content: "Focused",
    variant: "custom",
  });
  const matrixView = createButton({
    attributes: { "aria-pressed": "false" },
    className: "olwlg-want-view-switch__option",
    content: "Matrix",
    variant: "custom",
  });
  const revert = createButton({
    className: "olwlg-want-matrix-toolbar__secondary",
    content: "Revert edits",
    hidden: readOnly,
    variant: "custom",
  });
  const actions = document.createElement("div");
  const backToStep3 = createLink({
    className: "olwlg-mywants-back-link olwlg-tooltip-target",
    content: "Back to Step 3",
    href: "#",
    tooltip:
      "Return to Want List Generator: Step 3 to add or remove wanted items.",
  });
  const save = createButton({
    className: "olwlg-want-matrix-toolbar__save",
    content: [],
    variant: "custom",
  });
  const cancel = createButton({
    className: "olwlg-want-matrix-toolbar__secondary",
    content: [],
    variant: "custom",
  });
  const actionHelp = document.createElement("span");
  const announcement = document.createElement("div");

  toolbar.className = "olwlg-want-matrix-toolbar";
  toolbarHeading.className = "olwlg-want-matrix-toolbar__heading";
  toolbarTitle.className = "olwlg-want-matrix-toolbar__title";
  step.className = "olwlg-want-matrix-toolbar__step";
  step.textContent = mode === "review" ? "Step 5 of 5" : "Step 4 of 5";
  title.textContent = mode === "review" ? "Review & submit" : "Build wants";
  summary.className = "olwlg-want-matrix-toolbar__summary";
  controls.className = "olwlg-want-matrix-toolbar__controls";
  viewSwitch.className = "olwlg-want-view-switch";
  viewSwitch.setAttribute("role", "group");
  viewSwitch.setAttribute("aria-label", "Want-list editor view");
  viewSwitch.append(matrixView, focusView);
  actions.className = "olwlg-want-matrix-toolbar__actions";
  actionHelp.className = "olwlg-want-matrix-toolbar__action-help";
  actionHelp.textContent = "Saving edits does not submit your want lists.";
  announcement.className = "olwlg-want-announcement";
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", "polite");
  announcement.setAttribute("aria-atomic", "true");

  const pageControls = [
    ...document.querySelectorAll<HTMLElement>(
      "button, input[type='button'], input[type='submit'], input[type='reset'], input[type='image'], a",
    ),
  ].filter(
    (control) =>
      !toolbar.contains(control) &&
      !control.closest("#navbar"),
  );
  const nativeConfirm = pageControls.find((control) =>
    /\bconfirm\s+changes\b|\bsave\s+(?:edits|changes)\b/i.test(
      wantListControlLabel(control),
    )
  );
  const nativeReset = pageControls.find((control) =>
    /\breset\s+changes\b|\brevert\s+(?:edits|changes)\b/i.test(
      wantListControlLabel(control),
    )
  );
  const nativeSubmit = pageControls.find((control) =>
    /\bsubmit(?:\s+my)?\s+wants?\b|\bresubmit(?:\s+updated)?\s+wants?\b/i.test(
      wantListControlLabel(control),
    )
  );
  const nativeSubmissionView = pageControls.find((control) =>
    /\bsubmit\s+your\s+lists?\s+here\b|\bsubmission\s+(?:view|step)\b/i.test(
      wantListControlLabel(control),
    )
  );
  const nativeStep3 = pageControls.find((control) => {
    const href = control instanceof HTMLAnchorElement ? control.href : "";
    const context = normalizedText(
      `${wantListControlLabel(control)} ${href}`,
    );
    return (
      /want\s*list\s*generator\s*:?\s*step\s*3|\b(?:back\s+to\s+)?step\s*3\b/i
        .test(context) ||
      /\/viewlist\.cgi(?:[?#]|$)/i.test(href)
    );
  });
  const step3FallbackUrl = new URL(location.href);
  step3FallbackUrl.pathname = step3FallbackUrl.pathname.replace(
    /\/[^/]*$/,
    "/viewlist.cgi",
  );
  ["step", "format", "mode"].forEach((parameter) =>
    step3FallbackUrl.searchParams.delete(parameter)
  );
  [nativeConfirm, nativeReset, nativeSubmit]
    .filter((control): control is HTMLElement => Boolean(control))
    .forEach((control) => control.classList.add("olwlg-want-native-action"));

  save.addEventListener("click", () => {
    if (workspaceView === "review") {
      (nativeSubmit ?? nativeSubmissionView)?.click();
      return;
    }
    nativeConfirm?.click();
  });
  backToStep3.href = nativeStep3 instanceof HTMLAnchorElement
    ? nativeStep3.href
    : step3FallbackUrl.href;
  if (nativeStep3 instanceof HTMLAnchorElement) {
    backToStep3.target = nativeStep3.target;
    backToStep3.rel = nativeStep3.rel;
  }
  nativeStep3?.classList.add("olwlg-want-matrix-navigation__original");
  cancel.addEventListener("click", () => {
    setWorkspaceView(workspaceView === "review" ? "matrix" : "review");
  });
  focusView.addEventListener("click", () => setWorkspaceView("focus"));
  matrixView.addEventListener("click", () => setWorkspaceView("matrix"));

  toolbarTitle.append(step, title, summary);
  controls.append(search, filter, viewSwitch, revert);
  actions.append(actionHelp, cancel, save);
  toolbarHeading.append(toolbarTitle, actions);
  toolbar.append(toolbarHeading, controls, announcement);

  let bulkAnnouncementTimer = 0;
  const applyBulkSelection = (
    checkboxes: HTMLInputElement[],
    checked: boolean,
  ) => {
    const previous = checkboxes
      .filter((checkbox) => checkbox.checked !== checked)
      .map((checkbox) => [checkbox, checkbox.checked] as const);
    previous.forEach(([checkbox]) => checkbox.click());
    window.clearTimeout(bulkAnnouncementTimer);
    const message = document.createElement("span");
    const undo = createButton({
      className: "olwlg-want-announcement__undo",
      content: "Undo",
      hidden: !previous.length,
      onClick: () => {
        previous.forEach(([checkbox, wasChecked]) => {
          if (checkbox.checked !== wasChecked) checkbox.click();
        });
        announcement.textContent = "Bulk change undone.";
      },
      variant: "custom",
    });
    message.textContent =
      `${checked ? "Selected" : "Cleared"} ${previous.length} visible trade${previous.length === 1 ? "" : "s"}.`;
    announcement.replaceChildren(message, undo);
    bulkAnnouncementTimer = window.setTimeout(() => {
      announcement.replaceChildren();
    }, 8000);
  };

  const navigation = document.createElement("nav");
  navigation.className = "olwlg-want-matrix-navigation";
  navigation.setAttribute("aria-label", "Want-list steps and table views");
  const renderedNavigation = new Set<string>();
  pageControls
    .filter(
      (control) =>
        control !== nativeConfirm &&
        control !== nativeReset &&
        control !== nativeSubmit &&
        control !== nativeStep3,
    )
    .forEach((control) => {
      if (table.contains(control)) return;
      const label = wantListNavigationLabel(control);
      const href =
        control instanceof HTMLAnchorElement ? control.href : "";
      const context = normalizedText(
        `${label} ${href} ${
          control instanceof HTMLInputElement ? control.src : ""
        }`,
      );
      if (
        !/\bstep\s*[1-6]\b|\bprevious\b|\bnext\b|\bback\b|\btable\b.*\bformat\b|\b(?:edit|view)\s+format\b/i.test(
          context,
        )
      )
        return;

      const key = `${label.toLocaleLowerCase()}|${href}`;
      if (!label || renderedNavigation.has(key)) return;
      renderedNavigation.add(key);
      const proxy = control instanceof HTMLAnchorElement
        ? createLink({
          className: "olwlg-want-matrix-navigation__item",
          content: label,
          href: control.href,
          rel: control.rel,
          target: control.target,
        })
        : createButton({
          className: "olwlg-want-matrix-navigation__item",
          content: label,
          onClick: () => control.click(),
          variant: "custom",
        });
      control.classList.add("olwlg-want-matrix-navigation__original");
      navigation.append(proxy);
    });
  if (navigation.childElementCount) toolbar.append(navigation);
  wrapper.insertAdjacentElement("beforebegin", toolbar);
  createWantListTabs(toolbar);
  createMyWantsInfoCard(toolbar, wantListControlLabel);
  const infoCard = document.querySelector<HTMLElement>(
    ".olwlg-mywants-info-card",
  );
  (infoCard ?? toolbar).insertAdjacentElement("beforebegin", backToStep3);
  cleanWantListPageFooter();
  const geekMailDeliveryFailed = enhanceWantListSubmissionError();
  const submissionConfirmed = enhanceWantListSubmissionConfirmation(
    toolbar,
    geekMailDeliveryFailed,
  );

  const review = document.createElement("section");
  review.className = "olwlg-want-review";
  review.setAttribute("aria-label", "Want-list review by offered item");
  toolbar.insertAdjacentElement("afterend", review);

  const rowIdentityCache = new WeakMap<
    HTMLTableRowElement,
    WantListRowIdentity
  >();
  const rowIdentity = (row: HTMLTableRowElement): WantListRowIdentity => {
    const cached = rowIdentityCache.get(row);
    if (cached) return cached;
    const detailCells = [...row.cells].filter(
      (_, column) => !columns.includes(column),
    );
    const detailCell = detailCells
      .filter((cell) => normalizedText(cell.textContent))
      .sort(
        (left, right) =>
          normalizedText(right.textContent).length -
          normalizedText(left.textContent).length,
      )[0] ?? row.cells[1];
    const titleLink = [...(detailCell?.querySelectorAll("a") ?? [])].find(
      (link) => normalizedText(link.textContent).length > 1,
    );
    const item = normalizedText(titleLink?.textContent) ||
      readableWantListHeading(detailCell?.textContent) ||
      "Item";
    const participant = participantFromRow(row);
    const ownerCandidates = [
      ...(detailCell?.querySelectorAll<HTMLElement>(
        ".owner, .username, [data-username], [data-geekname], i, em, small, font, span, a",
      ) ?? []),
    ].reverse();
    const ownerFromMarkup = ownerCandidates
      .map((element) => ({
        element,
        text: normalizedText(
          element.dataset.username ??
            element.dataset.geekname ??
            element.textContent,
        ),
      }))
      .find(({ element, text }) =>
        text.length > 1 &&
        text.length <= 80 &&
        text !== item &&
        !element.contains(titleLink ?? null) &&
        !/^(?:value|price|history|show|hide|delete)$/i.test(text)
      )?.text;
    let owner = participant !== "Unknown participant"
      ? participant
      : ownerFromMarkup ?? "";
    if (!owner && detailCell) {
      const clone = detailCell.cloneNode(true) as HTMLTableCellElement;
      [...clone.querySelectorAll("a")]
        .find((link) => normalizedText(link.textContent) === item)
        ?.remove();
      clone
        .querySelectorAll("input, button, img, script, style")
        .forEach((element) => element.remove());
      const remainder = normalizedText(clone.textContent)
        .replace(item, "")
        .replace(/\bvalue\b/gi, "")
        .trim();
      if (remainder.length > 1 && remainder.length <= 80) owner = remainder;
    }
    const identity = {
      detailCell,
      item,
      owner,
      ownerUrl: owner
        ? participantUrlFromRow(row) ??
          `https://boardgamegeek.com/user/${encodeURIComponent(owner)}`
        : undefined,
      label: owner ? `${item} — ${owner}` : item,
      searchText: normalizedWantListSearchText(
        [
          row.textContent,
          ...[
            ...row.querySelectorAll<HTMLElement>(
              "[aria-label], [title], img[alt], input",
            ),
          ].flatMap((element) =>
            element instanceof HTMLInputElement
              ? [
                element.value,
                element.getAttribute("aria-label"),
                element.title,
              ]
              : [
                element.getAttribute("aria-label"),
                element.title,
                element instanceof HTMLImageElement ? element.alt : "",
              ]
          ),
        ]
          .filter(Boolean)
          .join(" "),
      ),
    };
    rowIdentityCache.set(row, identity);
    return identity;
  };

  const decorateGameCell = (cell?: HTMLTableCellElement) => {
    if (!cell || cell.dataset.olwlgGameCell === "true") return;
    cell.dataset.olwlgGameCell = "true";
    cell.classList.add("olwlg-want-matrix__game-cell");

    const source = document.createElement("div");
    while (cell.firstChild) source.append(cell.firstChild);
    const titleLink = [...source.querySelectorAll<HTMLAnchorElement>("a")].find(
      (link) => normalizedText(link.textContent).length > 1,
    );
    const owner = source.querySelector<HTMLElement>("i, em");
    const valueInput = source.querySelector<HTMLInputElement>(
      "input[type='number'], input[type='text']",
    );
    const images = [...source.querySelectorAll<HTMLImageElement>("img")];
    const flag = images.find((image) =>
      /flag|country|\/flags?\//i.test(
        `${image.src} ${image.alt} ${image.title} ${image.className}`,
      )
    );
    const priceImage = images.find((image) =>
      image !== flag &&
      /price|history|dollar|currency|bgg|\$/i.test(
        `${image.src} ${image.alt} ${image.title} ${image.className}`,
      )
    );
    const priceControl = priceImage?.closest<HTMLElement>("a, button") ??
      priceImage;

    const layout = document.createElement("div");
    const identity = document.createElement("div");
    const titleRow = document.createElement("div");
    const metadata = document.createElement("div");
    layout.className = "olwlg-want-game";
    identity.className = "olwlg-want-game__identity";
    titleRow.className = "olwlg-want-game__title-row";
    metadata.className = "olwlg-want-game__meta";

    if (titleLink) {
      titleLink.classList.add("olwlg-want-game__title");
      titleRow.append(titleLink);
    }
    if (
      priceControl &&
      priceControl !== titleLink &&
      (!titleLink || !priceControl.contains(titleLink))
    ) {
      priceControl.classList.add("olwlg-want-game__price");
      titleRow.append(priceControl);
    }
    if (owner) {
      owner.classList.add("olwlg-want-game__owner");
      metadata.append(owner);
    }
    if (flag && !metadata.contains(flag)) {
      flag.classList.add("olwlg-want-game__flag");
      metadata.append(flag);
    }

    [...source.childNodes].forEach((node) => {
      if (
        node === valueInput ||
        node === titleLink ||
        node === owner ||
        node === flag ||
        node === priceControl ||
        (node instanceof HTMLElement &&
          (node.contains(titleLink ?? null) ||
            node.contains(owner ?? null) ||
            node.contains(flag ?? null) ||
            node.contains(priceControl ?? null) ||
            node.contains(valueInput ?? null)))
      )
        return;
      if (node instanceof HTMLBRElement) {
        node.remove();
        return;
      }
      if (node instanceof Text && !normalizedText(node.data)) {
        node.remove();
        return;
      }
      metadata.append(node);
    });

    if (titleRow.childNodes.length) identity.append(titleRow);
    if (metadata.childNodes.length) identity.append(metadata);
    if (!identity.childNodes.length) identity.append(source);
    layout.append(identity);

    if (valueInput) {
      const valueField = document.createElement("label");
      const valueLabel = document.createElement("span");
      valueField.className = "olwlg-want-game__value";
      valueLabel.textContent = "Value";
      valueInput.classList.add("olwlg-want-game__value-input");
      valueField.append(valueLabel, valueInput);
      layout.append(valueField);
    }
    cell.replaceChildren(layout);
  };

  const setActiveColumn = (column: number) => {
    if (column === activeColumn) return;
    if (activeColumn >= 0) {
      header.cells[activeColumn]?.classList.remove(
        "olwlg-want-matrix__cell--active-column",
      );
      rows.forEach((row) =>
        row.cells[activeColumn]?.classList.remove(
          "olwlg-want-matrix__cell--active-column",
        )
      );
    }
    activeColumn = column;
    if (column < 0) return;
    header.cells[column]?.classList.add(
      "olwlg-want-matrix__cell--active-column",
    );
    rows.forEach((row) =>
      row.cells[column]?.classList.add(
        "olwlg-want-matrix__cell--active-column",
      )
    );
  };

  const visibleCheckboxes = (column: number) =>
    rows.flatMap((row) => {
      if (row.hidden) return [];
      const checkbox = row.cells[column]?.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      );
      return checkbox && !checkbox.disabled ? [checkbox] : [];
    });

  const toggleColumn = (column: number, checked: boolean) => {
    applyBulkSelection(visibleCheckboxes(column), checked);
  };

  columns.forEach((column, index) => {
    const cell = header.cells[column];
    if (!cell) return;
    const labelText =
      readableWantListHeading(cell.getAttribute("aria-label")) ||
      readableWantListHeading(cell.title) ||
      readableWantListHeading(cell.textContent) ||
      `Offered item ${index + 1}`;
    columnLabels.set(column, labelText);
    cell.scope = "col";
    cell.classList.add("olwlg-want-matrix__offer-header");
    cell.removeAttribute("title");
    cell.style.setProperty("width", `${offerColumnWidth}px`, "important");
    cell.style.setProperty("min-width", `${offerColumnWidth}px`, "important");
    cell.style.setProperty("max-width", `${offerColumnWidth}px`, "important");

    const legacy = document.createElement("div");
    const headerLabel = document.createElement("span");
    const identifier = document.createElement("span");
    legacy.className = "olwlg-want-matrix__legacy-header";
    legacy.hidden = true;
    while (cell.firstChild) legacy.append(cell.firstChild);
    identifier.className = "olwlg-want-matrix__column-id";
    identifier.textContent = String.fromCharCode(65 + (index % 26));
    headerLabel.className = "olwlg-want-matrix__column-title";
    headerLabel.textContent = labelText;
    headerLabel.classList.add("olwlg-tooltip-target");
    headerLabel.dataset.olwlgTooltip = labelText;
    headerLabel.setAttribute("aria-label", labelText);
    headerLabel.tabIndex = 0;
    const bulk = createButton({
      ariaLabel: `Select all visible items for ${labelText}`,
      className: "olwlg-want-matrix__bulk",
      content: "Select All",
      disabled: readOnly,
      onClick: () => {
        if (readOnly) return;
        const checkboxes = visibleCheckboxes(column);
        const shouldCheck = checkboxes.some((checkbox) => !checkbox.checked);
        toggleColumn(column, shouldCheck);
      },
      variant: "custom",
    });
    cell.append(legacy, identifier, headerLabel, bulk);
  });

  let valueOrderLegendLabel: Text | undefined;
  let valueOrderLegendItem: HTMLElement | undefined;
  [...header.cells].forEach((cell, column) => {
    cell.classList.add("olwlg-want-matrix__heading-cell");
    if (column < columns[0]) {
      cell.classList.add("olwlg-want-matrix__frozen");
      if (column === 0) return;
      cell.classList.add("olwlg-want-matrix__game-header");
      const axisLabel = document.createElement("span");
      const legend = document.createElement("span");
      const legendTitle = document.createElement("small");
      axisLabel.className = "olwlg-want-matrix__axis-label";
      axisLabel.innerHTML =
        "<span>Your offers →</span><strong>Wanted items ↓</strong>";
      legend.className = "olwlg-want-matrix__legend";
      legend.setAttribute("role", "list");
      legend.setAttribute("aria-label", "Matrix highlights");
      legendTitle.className = "olwlg-want-matrix__legend-title";
      legendTitle.textContent = "Highlights";
      legend.append(legendTitle);
      [
        ["selected", "Selected"],
        ["warning", "Review value order"],
        ["active", "Current row or column"],
        ["normal", "Not selected"],
      ].forEach(([kind, label]) => {
        const legendItem = document.createElement("span");
        const swatch = document.createElement("i");
        const labelNode = document.createTextNode(label);
        legendItem.className = "olwlg-want-matrix__legend-item";
        legendItem.setAttribute("role", "listitem");
        legendItem.dataset.olwlgLegendKind = kind;
        swatch.className =
          `olwlg-want-matrix__legend-swatch olwlg-want-matrix__legend-swatch--${kind}`;
        swatch.setAttribute("aria-hidden", "true");
        legendItem.append(swatch, labelNode);
        if (kind === "warning") {
          valueOrderLegendItem = legendItem;
          valueOrderLegendLabel = labelNode;
        }
        legend.append(legendItem);
      });
      axisLabel.append(legend);
      cell.prepend(axisLabel);
      cell.querySelectorAll<HTMLElement>(
        "a, button, input[type='button'], input[type='image'], input[type='submit']",
      ).forEach((control) => {
        const description = normalizedText(
          `${wantListControlLabel(control)} ${
            control.querySelector<HTMLImageElement>("img")?.alt ?? ""
          } ${control.querySelector<HTMLImageElement>("img")?.title ?? ""}`,
        );
        if (/\bhide\b/i.test(description)) control.remove();
      });
      cell
        .querySelectorAll<HTMLImageElement>(
          "img.hideimg, img.unhideimg, img[title*='hide' i]",
        )
        .forEach((image) => image.remove());
      cell.querySelectorAll("hr").forEach((separator) => separator.remove());
      const legacyHeader = document.createElement("div");
      legacyHeader.className = "olwlg-want-matrix__legacy-game-header";
      legacyHeader.hidden = true;
      [...cell.childNodes]
        .filter((node) => node !== axisLabel)
        .forEach((node) => legacyHeader.append(node));
      cell.append(legacyHeader);
      const width = detailColumnWidth;
      cell.style.setProperty("width", `${width}px`, "important");
      cell.style.setProperty("min-width", `${width}px`, "important");
      cell.style.setProperty("max-width", `${width}px`, "important");
    }
  });

  const valueOrderWarningDescription =
    "Based on your values and selections, OLWLG thinks you may be offering a higher-valued item without also offering this lower-valued one. This is only a consistency hint; it does not block saving or affect TradeMaximizer.";

  rows.forEach((row) => {
    const identity = rowIdentity(row);
    decorateGameCell(identity.detailCell);
    row.dataset.olwlgWantSearch = identity.searchText;
    [...row.cells].forEach((cell, column) => {
      if (column < columns[0]) {
        cell.classList.add("olwlg-want-matrix__frozen");
        if (column === 0) return;
        const width = detailColumnWidth;
        cell.style.setProperty("width", `${width}px`, "important");
        cell.style.setProperty("min-width", `${width}px`, "important");
        cell.style.setProperty("max-width", `${width}px`, "important");
      }
      if (!columns.includes(column)) return;
      cell.classList.add("olwlg-want-matrix__choice");
      cell.style.setProperty("width", `${offerColumnWidth}px`, "important");
      cell.style.setProperty("min-width", `${offerColumnWidth}px`, "important");
      cell.style.setProperty("max-width", `${offerColumnWidth}px`, "important");
      const sourcePresentation = sourceCellPresentation.get(cell);
      const sourceColorKeys =
        sourcePresentation?.colorKeys ?? backgroundColorKeys(cell);
      const isRedHighlight = sourceColorKeys.some((color) =>
        [
          "red",
          "#f00",
          "#ff0000",
          "rgb(255,0,0)",
          "rgba(255,0,0,1)",
        ].includes(color)
      );
      const isYellowHighlight =
        sourceColorKeys.some(isValueOrderWarningColor) ||
        /(?:^|[\s_-])(?:yellow|value[\s_-]*order|order[\s_-]*warning)(?:$|[\s_-])/i
          .test(sourcePresentation?.statusHint ?? "");
      const originalColor = getComputedStyle(cell).backgroundColor;
      if (isRedHighlight) {
        cell.style.removeProperty("background");
        cell.style.removeProperty("background-color");
        cell.removeAttribute("bgcolor");
        cell.classList.add("olwlg-want-matrix__choice--red-neutralized");
      } else if (
        originalColor &&
        originalColor !== "rgba(0, 0, 0, 0)" &&
        originalColor !== "rgb(255, 255, 255)"
      ) {
        cell.style.setProperty("--olwlg-want-status-color", originalColor);
        cell.classList.add("olwlg-want-matrix__choice--status");
      }

      const checkbox = cell.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      );
      if (!checkbox) return;
      const columnLabel = columnLabels.get(column) ?? `offered item ${column}`;
      const colorLabel = sourceColorKeys
        .map((color) => colorGuideLabels.get(color))
        .find(Boolean);
      const statusLabel = isYellowHighlight
        ? "OLWLG value-order warning"
        : colorLabel ??
          (cell.classList.contains("olwlg-want-matrix__choice--status")
            ? "Highlighted by OLWLG"
            : "");
      const checkboxLabel =
        `Accept ${identity.item} in exchange for ${columnLabel}${
          statusLabel ? `. Status: ${statusLabel}` : ""
        }`;
      checkbox.setAttribute("aria-label", checkboxLabel);
      if (isYellowHighlight) {
        checkbox.setAttribute(
          "aria-description",
          valueOrderWarningDescription,
        );
        cell.classList.add("olwlg-want-matrix__choice--value-warning");
      }
      checkbox.removeAttribute("title");
      cell.classList.add("olwlg-tooltip-target");
      cell.dataset.olwlgTooltipKind = "matrix-cell";
      cell.dataset.olwlgRowNumber = String(rows.indexOf(row) + 1);
      cell.dataset.olwlgRowLabel = identity.item;
      cell.dataset.olwlgRowOwner = identity.owner;
      cell.dataset.olwlgColumnId = String.fromCharCode(
        65 + (columns.indexOf(column) % 26),
      );
      cell.dataset.olwlgColumnLabel = columnLabel;
      cell.dataset.olwlgStatusLabel = statusLabel;
      cell.dataset.olwlgStatusKind = isYellowHighlight
        ? "value-order-warning"
        : statusLabel
          ? "legacy-highlight"
          : "";
      if (isYellowHighlight)
        cell.dataset.olwlgStatusDescription = valueOrderWarningDescription;
      cell.dataset.olwlgTooltip = checkboxLabel;
    });
  });

  const valueOrderWarningCount = rows.reduce(
    (count, row) =>
      count + row.querySelectorAll(
        ".olwlg-want-matrix__choice--value-warning",
      ).length,
    0,
  );
  if (valueOrderLegendLabel && valueOrderLegendItem) {
    valueOrderLegendLabel.data =
      `Review value order (${valueOrderWarningCount})`;
    valueOrderLegendItem.classList.toggle(
      "olwlg-want-matrix__legend-item--inactive",
      valueOrderWarningCount === 0,
    );
    valueOrderLegendItem.title = valueOrderWarningCount
      ? `${valueOrderWarningCount} value-order warning${valueOrderWarningCount === 1 ? "" : "s"} in this matrix.`
      : "OLWLG did not report any value-order warnings in this matrix.";
  }

  const focusEditor = document.createElement("section");
  const offerRail = document.createElement("aside");
  const offerRailHeading = document.createElement("div");
  const offerRailList = document.createElement("div");
  const focusPanel = document.createElement("div");
  const focusPanelHeading = document.createElement("header");
  const focusPanelCopy = document.createElement("div");
  const focusPanelTitle = document.createElement("h2");
  const focusPanelSummary = document.createElement("p");
  const focusBulk = createButton({
    className: "olwlg-want-focus__bulk",
    content: [],
    variant: "custom",
  });
  const focusList = document.createElement("ul");
  const focusEmpty = document.createElement("p");
  const offerButtons = new Map<number, HTMLButtonElement>();
  const offerCounts = new Map<number, HTMLElement>();
  const focusedRows = new Map<
    HTMLTableRowElement,
    {
      element: HTMLLIElement;
      status: HTMLElement;
      toggle: HTMLButtonElement;
      valueProxy?: HTMLInputElement;
      valueSource?: HTMLInputElement;
    }
  >();

  focusEditor.className = "olwlg-want-focus";
  focusEditor.setAttribute("aria-label", "Focused want-list editor");
  offerRail.className = "olwlg-want-focus__offers";
  offerRailHeading.className = "olwlg-want-focus__offers-heading";
  offerRailHeading.innerHTML =
    "<strong>Your offers</strong><span>Choose one item to edit</span>";
  offerRailList.className = "olwlg-want-focus__offer-list";
  offerRailList.setAttribute("aria-label", "Your offered items");
  focusPanel.className = "olwlg-want-focus__panel";
  focusPanelHeading.className = "olwlg-want-focus__panel-heading";
  focusPanelCopy.className = "olwlg-want-focus__panel-copy";
  focusPanelTitle.className = "olwlg-want-focus__panel-title";
  focusPanelSummary.className = "olwlg-want-focus__panel-summary";
  focusList.className = "olwlg-want-focus__list";
  focusList.setAttribute("role", "list");
  focusEmpty.className = "olwlg-want-focus__empty";
  focusEmpty.textContent = "No wanted items match the current filters.";
  focusEmpty.hidden = true;

  columns.forEach((column, index) => {
    const identifier = document.createElement("span");
    const label = document.createElement("span");
    const count = document.createElement("strong");
    identifier.className = "olwlg-want-focus__offer-id";
    identifier.textContent = String.fromCharCode(65 + (index % 26));
    label.className = "olwlg-want-focus__offer-name";
    label.textContent = columnLabels.get(column) ?? `Offered item ${index + 1}`;
    count.className = "olwlg-want-focus__offer-count";
    const button = createButton({
      attributes: {
        "aria-pressed": String(column === activeFocusColumn),
      },
      className: "olwlg-want-focus__offer olwlg-tooltip-target",
      content: [identifier, label, count],
      onClick: () => {
        activeFocusColumn = column;
        render();
      },
      tooltip: `Edit acceptable trades for ${label.textContent}`,
      variant: "custom",
    });
    offerButtons.set(column, button);
    offerCounts.set(column, count);
    offerRailList.append(button);
  });

  rows.forEach((row) => {
    const identity = rowIdentity(row);
    const item = document.createElement("li");
    const itemCopy = document.createElement("div");
    const titleRow = document.createElement("div");
    const metadata = document.createElement("div");
    const sourceTitle = identity.detailCell?.querySelector<HTMLAnchorElement>(
      ".olwlg-want-game__title",
    );
    const itemTitle = sourceTitle
      ? cloneElement(sourceTitle)
      : document.createElement("strong");
    const owner = identity.owner
      ? createLink({
        ariaLabel: `View ${identity.owner} on BoardGameGeek`,
        className: "olwlg-want-focus__item-owner olwlg-tooltip-target",
        content: `From ${identity.owner}`,
        href: identity.ownerUrl ??
          `https://boardgamegeek.com/user/${encodeURIComponent(identity.owner)}`,
        rel: "noreferrer",
        target: "_blank",
        tooltip: `View ${identity.owner} on BoardGameGeek`,
      })
      : document.createElement("span");
    const status = document.createElement("span");
    const controls = document.createElement("div");
    const toggleMark = document.createElement("span");
    const toggleLabel = document.createElement("span");
    const valueSource = identity.detailCell?.querySelector<HTMLInputElement>(
      ".olwlg-want-game__value-input",
    ) ?? undefined;
    let valueProxy: HTMLInputElement | undefined;

    item.className = "olwlg-want-focus__item";
    itemCopy.className = "olwlg-want-focus__item-copy";
    titleRow.className = "olwlg-want-focus__item-title-row";
    metadata.className = "olwlg-want-focus__item-meta";
    itemTitle.classList.add("olwlg-want-focus__item-title");
    if (!(itemTitle instanceof HTMLAnchorElement))
      itemTitle.textContent = identity.item;
    itemTitle.classList.add("olwlg-tooltip-target");
    itemTitle.dataset.olwlgTooltip = identity.owner
      ? `${identity.item} — offered by ${identity.owner}`
      : identity.item;
    owner.classList.add("olwlg-want-focus__item-owner");
    owner.textContent = identity.owner ? `From ${identity.owner}` : "Participant unknown";
    status.className = "olwlg-want-focus__item-status";
    controls.className = "olwlg-want-focus__item-controls";
    toggleMark.className = "olwlg-want-focus__toggle-mark";
    toggleMark.setAttribute("aria-hidden", "true");
    toggleMark.textContent = "✓";
    toggleLabel.textContent = "Accept this trade";
    const toggle = createButton({
      attributes: { "aria-checked": "false" },
      className: "olwlg-want-focus__toggle",
      content: [toggleMark, toggleLabel],
      onClick: () => {
        const checkbox = row.cells[activeFocusColumn]
          ?.querySelector<HTMLInputElement>('input[type="checkbox"]');
        if (checkbox && !checkbox.disabled) checkbox.click();
      },
      role: "checkbox",
      variant: "custom",
    });

    titleRow.append(itemTitle);
    metadata.append(owner, status);
    itemCopy.append(titleRow, metadata);

    if (valueSource) {
      const valueField = document.createElement("label");
      const valueLabel = document.createElement("span");
      valueProxy = createInput({
        ariaLabel: `Value for ${identity.item}`,
        disabled: readOnly || valueSource.disabled,
        onChange: () => {
          valueSource.dispatchEvent(new Event("change", { bubbles: true }));
        },
        onInput: () => {
          if (valueSource.value === valueProxy?.value) return;
          valueSource.value = valueProxy?.value ?? "";
          valueSource.dispatchEvent(new Event("input", { bubbles: true }));
        },
        type: "text",
        value: valueSource.value,
        variant: "custom",
      });
      valueField.className = "olwlg-want-focus__value";
      valueLabel.textContent = "Value";
      valueField.append(valueLabel, valueProxy);
      controls.append(valueField);
    }
    controls.append(toggle);
    item.append(itemCopy, controls);
    focusList.append(item);
    focusedRows.set(row, { element: item, status, toggle, valueProxy, valueSource });
  });

  focusBulk.addEventListener("click", () => {
    const visible = rows.flatMap((row) => {
      const focused = focusedRows.get(row);
      const checkbox = row.cells[activeFocusColumn]
        ?.querySelector<HTMLInputElement>('input[type="checkbox"]');
      return focused && !focused.element.hidden && checkbox && !checkbox.disabled
        ? [checkbox]
        : [];
    });
    const shouldCheck = visible.some((checkbox) => !checkbox.checked);
    applyBulkSelection(visible, shouldCheck);
  });

  offerRail.append(offerRailHeading, offerRailList);
  focusPanelCopy.append(focusPanelTitle, focusPanelSummary);
  focusPanelHeading.append(focusPanelCopy, focusBulk);
  focusPanel.append(focusPanelHeading, focusList, focusEmpty);
  focusEditor.append(offerRail, focusPanel);
  review.insertAdjacentElement("afterend", focusEditor);

  const cellInformation = document.getElementById("cellinfo");
  if (cellInformation instanceof HTMLElement) {
    cellInformation.hidden = true;
    cellInformation.setAttribute("aria-hidden", "true");
    cellInformation.classList.add("olwlg-want-matrix__cell-info-source");
  }

  const updateCellInformationTooltip = (cell: HTMLTableCellElement) => {
    const checkbox = cell.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    if (!checkbox) return;
    cell.dataset.olwlgSelected = String(checkbox.checked);
    showTooltip(cell);
  };

  let openReviewGroup: HTMLDetailsElement | undefined;
  const closeReviewGroup = () => {
    if (openReviewGroup) openReviewGroup.open = false;
    openReviewGroup = undefined;
  };
  document.addEventListener("pointerdown", (event) => {
    if (
      openReviewGroup &&
      event.target instanceof Node &&
      !openReviewGroup.contains(event.target)
    )
      closeReviewGroup();
  });
  window.addEventListener(
    "scroll",
    (event) => {
      if (
        openReviewGroup &&
        event.target instanceof Node &&
        openReviewGroup.contains(event.target)
      ) {
        return;
      }

      closeReviewGroup();
    },
    true,
  );
  window.addEventListener("resize", closeReviewGroup);

  const renderReview = (dirty: boolean) => {
    openReviewGroup = undefined;
    review.replaceChildren();
    const selectedByColumn = new Map(
      columns.map((column) => [
        column,
        rows.filter((row) =>
          row.cells[column]?.querySelector<HTMLInputElement>(
            'input[type="checkbox"]',
          )?.checked
        ),
      ]),
    );
    const selectedCount = [...selectedByColumn.values()].reduce(
      (total, selectedRows) => total + selectedRows.length,
      0,
    );
    const emptyColumns = columns.filter(
      (column) => !selectedByColumn.get(column)?.length,
    );
    const status = document.createElement("header");
    const statusCopy = document.createElement("div");
    const eyebrow = document.createElement("span");
    const heading = document.createElement("h2");
    const metrics = document.createElement("p");
    const validation = document.createElement("div");
    status.className = "olwlg-want-review__status";
    statusCopy.className = "olwlg-want-review__status-copy";
    eyebrow.className = "olwlg-want-review__eyebrow";
    eyebrow.textContent = dirty
      ? "Save required"
      : emptyColumns.length
        ? "Check before submission"
        : submissionConfirmed
          ? "Submission confirmed"
          : "Review complete";
    heading.textContent = dirty
      ? "Save your latest edits before submitting"
      : emptyColumns.length
        ? `Review ${emptyColumns.length} offer${emptyColumns.length === 1 ? "" : "s"} with no acceptable trades`
        : submissionConfirmed
          ? "Want list submitted successfully"
          : "Ready to submit";
    metrics.textContent =
      `${columns.length} offered item${columns.length === 1 ? "" : "s"} · ${selectedCount} acceptable trade${selectedCount === 1 ? "" : "s"} · ${columns.length - emptyColumns.length}/${columns.length} offers covered`;
    statusCopy.append(eyebrow, heading, metrics);
    status.append(statusCopy);
    review.append(status);

    validation.className = "olwlg-want-review__validation";
    if (dirty) {
      status.classList.add("olwlg-want-review__status--blocking");
      validation.classList.add("olwlg-want-review__validation--blocking");
      validation.innerHTML =
        "<strong>Unsaved changes</strong><span>Use Save edits before submitting. Step 5 only submits the last saved version.</span>";
      review.append(validation);
    } else if (emptyColumns.length) {
      status.classList.add("olwlg-want-review__status--warning");
      validation.innerHTML =
        `<strong>${emptyColumns.length} offer${emptyColumns.length === 1 ? " has" : "s have"} no acceptable trades</strong><span>This can be intentional, but those items cannot trade under the current list.</span>`;
      review.append(validation);
    }

    const groupHeading = document.createElement("div");
    const groupTitle = document.createElement("strong");
    const groupHint = document.createElement("span");
    groupHeading.className = "olwlg-want-review__heading";
    groupTitle.textContent = "Selections by your offered item";
    groupHint.textContent = "Expand a group to inspect what you would accept.";
    groupHeading.append(groupTitle, groupHint);
    review.append(groupHeading);

    const groups = document.createElement("div");
    groups.className = "olwlg-want-review__groups";
    columns.forEach((column, index) => {
      const selectedRows = selectedByColumn.get(column) ?? [];
      const group = selectedRows.length
        ? document.createElement("details")
        : document.createElement("article");
      const groupSummary = selectedRows.length
        ? document.createElement("summary")
        : document.createElement("div");
      const groupIdentity = document.createElement("span");
      const groupIdentifier = document.createElement("small");
      const groupName = document.createElement("span");
      const count = document.createElement("strong");
      const list = document.createElement("ul");
      group.className = "olwlg-want-review__group";
      groupSummary.className = "olwlg-want-review__group-summary";
      groupIdentity.className = "olwlg-want-review__group-identity";
      groupIdentifier.textContent = String.fromCharCode(65 + (index % 26));
      groupName.textContent =
        columnLabels.get(column) ?? `Offered item ${index + 1}`;
      groupIdentity.append(groupIdentifier, groupName);
      count.textContent = selectedRows.length
        ? `${selectedRows.length} acceptable trade${selectedRows.length === 1 ? "" : "s"}`
        : "No acceptable trades";
      if (!selectedRows.length) {
        group.classList.add("olwlg-want-review__group--empty");
        groupSummary.setAttribute("aria-disabled", "true");
      }
      groupSummary.append(groupIdentity, count);
      selectedRows.forEach((row) => {
        const item = document.createElement("li");
        item.textContent = rowIdentity(row).label;
        list.append(item);
      });
      if (group instanceof HTMLDetailsElement) {
        list.setAttribute(
          "aria-label",
          `Acceptable trades for ${groupName.textContent}`,
        );
        group.addEventListener("toggle", () => {
          if (!group.open) {
            if (openReviewGroup === group) openReviewGroup = undefined;
            return;
          }
          if (openReviewGroup && openReviewGroup !== group)
            openReviewGroup.open = false;
          openReviewGroup = group;
          requestAnimationFrame(() => {
            if (!group.open) return;
            const summaryRect = groupSummary.getBoundingClientRect();
            const margin = 16;
            const gap = 7;
            const width = Math.min(
              Math.max(summaryRect.width, 320),
              window.innerWidth - margin * 2,
            );
            const height = Math.min(Math.max(list.scrollHeight, 80), 280);
            const left = Math.min(
              window.innerWidth - width - margin,
              Math.max(margin, summaryRect.left),
            );
            const fitsBelow =
              window.innerHeight - summaryRect.bottom >= height + gap + margin;
            const top = fitsBelow
              ? summaryRect.bottom + gap
              : Math.max(margin, summaryRect.top - height - gap);
            list.style.width = `${Math.round(width)}px`;
            list.style.left = `${Math.round(left)}px`;
            list.style.top = `${Math.round(top)}px`;
            list.style.maxHeight = `${Math.round(height)}px`;
          });
        });
        group.append(groupSummary, list);
      } else group.append(groupSummary);
      groups.append(group);
    });
    review.append(groups);

    if (!nativeSubmit && nativeSubmissionView) {
      const continuation = document.createElement("p");
      continuation.className = "olwlg-want-review__continuation";
      continuation.textContent =
        "OLWLG provides the final submission control in its submission view. Continue there after reviewing this summary.";
      review.append(continuation);
    }
  };

  const isDirty = () =>
    matrixInputs.some((input) => {
      const initial = initialValues.get(input);
      return input.type === "checkbox"
        ? input.checked !== initial
        : input.value !== initial;
    });

  const render = () => {
    const queryTokens = normalizedWantListSearchText(search.value)
      .split(" ")
      .filter(Boolean);
    const selectedFilter = filter.value;
    let focusedVisibleCount = 0;
    rows.forEach((row) => {
      const selectedAnywhere = columns.some((column) =>
        row.cells[column]?.querySelector<HTMLInputElement>(
          'input[type="checkbox"]',
        )?.checked
      );
      const activeCell = row.cells[activeFocusColumn];
      const activeCheckbox = activeCell?.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      );
      const selectedForActiveOffer = Boolean(activeCheckbox?.checked);
      const rowSearchText = row.dataset.olwlgWantSearch ??
        rowIdentity(row).searchText;
      const matchesSearch = queryTokens.every((token) =>
        rowSearchText.includes(token)
      );
      const matchesMatrixFilter = selectedFilter === "all" ||
        (selectedFilter === "selected" && selectedAnywhere) ||
        (selectedFilter === "unselected" && !selectedAnywhere);
      const matchesFocusFilter = selectedFilter === "all" ||
        (selectedFilter === "selected" && selectedForActiveOffer) ||
        (selectedFilter === "unselected" && !selectedForActiveOffer);
      row.hidden = !matchesSearch || !matchesMatrixFilter;

      const focused = focusedRows.get(row);
      if (!focused) return;
      focused.element.hidden =
        !activeCheckbox || !matchesSearch || !matchesFocusFilter;
      if (!focused.element.hidden) focusedVisibleCount += 1;
      focused.toggle.disabled = readOnly || !activeCheckbox || activeCheckbox.disabled;
      focused.toggle.setAttribute(
        "aria-checked",
        String(selectedForActiveOffer),
      );
      focused.toggle.classList.add("olwlg-tooltip-target");
      focused.toggle.dataset.olwlgTooltip =
        `${selectedForActiveOffer ? "Remove" : "Add"} ${rowIdentity(row).item} ${
          selectedForActiveOffer ? "from" : "to"
        } the acceptable trades for ${columnLabels.get(activeFocusColumn) ?? "this offer"}.`;
      focused.toggle.classList.toggle(
        "olwlg-want-focus__toggle--selected",
        selectedForActiveOffer,
      );
      const toggleText = focused.toggle.querySelector<HTMLElement>(
        ".olwlg-want-focus__toggle-mark + span",
      );
      if (toggleText)
        toggleText.textContent = selectedForActiveOffer
          ? "Selected"
          : "Select this item";
      const statusLabel = activeCell?.dataset.olwlgStatusLabel;
      const isValueWarning =
        activeCell?.dataset.olwlgStatusKind === "value-order-warning";
      focused.status.textContent = isValueWarning
        ? "⚠ Review value order"
        : statusLabel
          ? `Collection: ${statusLabel}`
          : "";
      focused.status.classList.toggle(
        "olwlg-want-focus__item-status--value-warning",
        isValueWarning,
      );
      focused.status.classList.toggle(
        "olwlg-tooltip-target",
        isValueWarning,
      );
      if (isValueWarning) {
        focused.status.dataset.olwlgTooltip =
          activeCell?.dataset.olwlgStatusDescription ??
            valueOrderWarningDescription;
        focused.status.tabIndex = 0;
        focused.status.setAttribute(
          "aria-label",
          "Review value order warning",
        );
      } else {
        delete focused.status.dataset.olwlgTooltip;
        focused.status.removeAttribute("tabindex");
        focused.status.removeAttribute("aria-label");
        focused.status.removeAttribute("aria-describedby");
      }
      focused.status.hidden = !statusLabel;
      if (
        focused.valueProxy &&
        focused.valueSource &&
        focused.valueProxy.value !== focused.valueSource.value
      )
        focused.valueProxy.value = focused.valueSource.value;
    });

    const allCheckboxes = columns.flatMap((column) =>
      rows.flatMap((row) => {
        const checkbox = row.cells[column]?.querySelector<HTMLInputElement>(
          'input[type="checkbox"]',
        );
        return checkbox ? [checkbox] : [];
      })
    );
    const selectedCount = allCheckboxes.filter(
      (checkbox) => checkbox.checked,
    ).length;
    const populatedColumns = columns.filter((column) =>
      rows.some((row) =>
        row.cells[column]?.querySelector<HTMLInputElement>(
          'input[type="checkbox"]',
        )?.checked
      )
    ).length;
    const visibleRowCount = rows.filter((row) => !row.hidden).length;
    const dirty = isDirty();
    const displayedRowCount = workspaceView === "focus"
      ? focusedVisibleCount
      : visibleRowCount;
    summary.textContent =
      `${displayedRowCount}/${rows.length} wanted items · ${selectedCount} acceptable trade${selectedCount === 1 ? "" : "s"} · ${populatedColumns}/${columns.length} offers covered${
        dirty ? " · Unsaved changes" : ""
      }`;
    summary.classList.toggle(
      "olwlg-want-matrix-toolbar__summary--dirty",
      dirty,
    );
    revert.disabled = !dirty;
    save.disabled = workspaceView === "review" ? dirty : !dirty;
    save.setAttribute("aria-disabled", String(save.disabled));
    document
      .querySelectorAll<HTMLButtonElement>(
        ".olwlg-mywants-action--confirm, .olwlg-mywants-action--reset",
      )
      .forEach((action) => {
        action.disabled = !dirty;
        action.setAttribute("aria-disabled", String(!dirty));
      });

    columns.forEach((column, index) => {
      const checkboxes = visibleCheckboxes(column);
      const selectedForColumn = rows.filter((row) =>
        row.cells[column]?.querySelector<HTMLInputElement>(
          'input[type="checkbox"]',
        )?.checked
      ).length;
      const offerButton = offerButtons.get(column);
      const offerCount = offerCounts.get(column);
      offerButton?.classList.toggle(
        "olwlg-want-focus__offer--active",
        column === activeFocusColumn,
      );
      offerButton?.setAttribute(
        "aria-pressed",
        String(column === activeFocusColumn),
      );
      if (offerCount)
        offerCount.textContent = `${selectedForColumn} accepted`;
      const bulk = header.cells[column]?.querySelector<HTMLButtonElement>(
        ".olwlg-want-matrix__bulk",
      );
      if (!bulk) return;
      const allChecked =
        checkboxes.length > 0 &&
        checkboxes.every((checkbox) => checkbox.checked);
      const columnLabel =
        columnLabels.get(column) ?? `offered item ${column}`;
      bulk.textContent = allChecked
        ? "Clear All"
        : "Select All";
      bulk.setAttribute(
        "aria-label",
        allChecked
          ? `Clear all visible selections for ${columnLabel}`
          : `Select all visible items for ${columnLabel}`,
      );
      bulk.disabled = readOnly || !checkboxes.length;
      bulk.dataset.olwlgColumnIndex = String(index);
    });

    const activeLabel = columnLabels.get(activeFocusColumn) ?? "Offered item";
    const activeVisibleCheckboxes = rows.flatMap((row) => {
      const focused = focusedRows.get(row);
      const checkbox = row.cells[activeFocusColumn]
        ?.querySelector<HTMLInputElement>('input[type="checkbox"]');
      return focused && !focused.element.hidden && checkbox && !checkbox.disabled
        ? [checkbox]
        : [];
    });
    const activeSelected = rows.filter((row) =>
      row.cells[activeFocusColumn]?.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      )?.checked
    ).length;
    const allVisibleChecked = activeVisibleCheckboxes.length > 0 &&
      activeVisibleCheckboxes.every((checkbox) => checkbox.checked);
    focusPanelTitle.textContent = `Acceptable trades for ${activeLabel}`;
    focusPanelTitle.classList.add("olwlg-tooltip-target");
    focusPanelTitle.dataset.olwlgTooltip = activeLabel;
    focusPanelSummary.textContent =
      `${activeSelected} selected · ${focusedVisibleCount} shown.`;
    focusBulk.textContent = allVisibleChecked
      ? "Clear visible"
      : "Select visible";
    focusBulk.disabled = readOnly || !activeVisibleCheckboxes.length;
    focusBulk.setAttribute(
      "aria-label",
      `${allVisibleChecked ? "Clear" : "Select"} all visible trades for ${activeLabel}`,
    );
    focusBulk.classList.add("olwlg-tooltip-target");
    focusBulk.dataset.olwlgTooltip =
      `${allVisibleChecked ? "Clear" : "Select"} the ${activeVisibleCheckboxes.length} currently visible trade${activeVisibleCheckboxes.length === 1 ? "" : "s"} for ${activeLabel}.`;
    focusEmpty.hidden = focusedVisibleCount > 0;

    if (workspaceView === "review") {
      step.textContent = "Step 5 of 5";
      title.textContent = "Review & submit";
      search.hidden = true;
      filter.hidden = true;
      viewSwitch.hidden = true;
      revert.hidden = true;
      cancel.hidden = false;
      cancel.textContent = readOnly ? "Back to offers" : "Back to editing";
      const submitSource = nativeSubmit ?? nativeSubmissionView;
      save.hidden = readOnly || !submitSource;
      save.textContent = nativeSubmit
        ? submissionConfirmed ||
            /\bresubmit/i.test(wantListControlLabel(nativeSubmit))
          ? "Resubmit want lists"
          : "Submit want lists"
        : "Continue to submission";
      actionHelp.textContent = dirty
        ? "Save edits before submitting. Step 5 uses the last saved version."
        : submissionConfirmed
          ? "You can edit and resubmit your want lists until the deadline."
        : nativeSubmit
          ? "Submission sends the reviewed want lists to OLWLG."
          : "Continue to OLWLG’s submission view to finish.";
    } else {
      step.textContent = "Step 4 of 5";
      title.textContent = "Build wants";
      search.hidden = false;
      filter.hidden = false;
      viewSwitch.hidden = false;
      revert.hidden = readOnly;
      cancel.hidden = false;
      cancel.textContent = "Review →";
      save.hidden = readOnly || !nativeConfirm;
      save.textContent = "Save edits";
      actionHelp.textContent = readOnly
        ? "This trade is read-only; selections cannot be changed."
        : "Saving edits does not submit your want lists.";
    }
    renderReview(dirty);
  };

  setWorkspaceView = (view) => {
    hideTooltip(undefined, true);
    workspaceView = view;
    document.body.dataset.olwlgWantView = view;
    focusEditor.hidden = view !== "focus";
    wrapper.hidden = view !== "matrix";
    review.hidden = view !== "review";
    focusView.classList.toggle(
      "olwlg-want-view-switch__option--active",
      view === "focus",
    );
    matrixView.classList.toggle(
      "olwlg-want-view-switch__option--active",
      view === "matrix",
    );
    focusView.setAttribute("aria-pressed", String(view === "focus"));
    matrixView.setAttribute("aria-pressed", String(view === "matrix"));
    render();
    scheduleStickyHeaderUpdate();
  };

  search.addEventListener("input", render);
  filter.addEventListener("change", render);
  revert.addEventListener("click", () => {
    matrixInputs.forEach((input) => {
      const initial = initialValues.get(input);
      if (input.type === "checkbox") {
        const checked = Boolean(initial);
        if (input.checked !== checked) input.click();
      } else {
        input.value = String(initial ?? "");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    render();
  });
  table.addEventListener("change", (event) => {
    render();
    const cell = event.target instanceof Element
      ? event.target.closest<HTMLTableCellElement>(
        "td.olwlg-want-matrix__choice",
      )
      : null;
    if (cell && (cell.matches(":hover") || cell.contains(document.activeElement)))
      updateCellInformationTooltip(cell);
  });
  table.addEventListener("input", render);

  let matrixPan: {
    dragged: boolean;
    pointerId: number;
    scrollLeft: number;
    scrollY: number;
    startX: number;
    startY: number;
  } | undefined;
  let suppressMatrixClick = false;
  const finishMatrixPan = (pointerId: number) => {
    if (!matrixPan || matrixPan.pointerId !== pointerId) return;
    const dragged = matrixPan.dragged;
    matrixPan = undefined;
    wrapper.classList.remove("olwlg-want-matrix__scroll--dragging");
    document.body.classList.remove("olwlg-matrix-pan-active");
    if (wrapper.hasPointerCapture(pointerId))
      wrapper.releasePointerCapture(pointerId);
    if (dragged) {
      hideTooltip(undefined, true);
      suppressMatrixClick = true;
      window.setTimeout(() => {
        suppressMatrixClick = false;
      }, 0);
    }
  };
  wrapper.addEventListener("pointerdown", (event) => {
    if (
      event.pointerType !== "mouse" ||
      event.button !== 0 ||
      !(event.target instanceof Element) ||
      event.target.closest(
        "a, button, input, label, select, textarea, [contenteditable='true']",
      )
    )
      return;

    event.preventDefault();
    matrixPan = {
      dragged: false,
      pointerId: event.pointerId,
      scrollLeft: bodyViewport.scrollLeft,
      scrollY: window.scrollY,
      startX: event.clientX,
      startY: event.clientY,
    };
    wrapper.setPointerCapture(event.pointerId);
  });
  wrapper.addEventListener("pointermove", (event) => {
    if (!matrixPan || matrixPan.pointerId !== event.pointerId) return;
    if (!(event.buttons & 1)) {
      finishMatrixPan(event.pointerId);
      return;
    }

    const deltaX = event.clientX - matrixPan.startX;
    const deltaY = event.clientY - matrixPan.startY;
    if (!matrixPan.dragged && Math.hypot(deltaX, deltaY) < 5) return;
    if (!matrixPan.dragged) {
      matrixPan.dragged = true;
      wrapper.classList.add("olwlg-want-matrix__scroll--dragging");
      document.body.classList.add("olwlg-matrix-pan-active");
      hideTooltip(undefined, true);
    }

    event.preventDefault();
    bodyViewport.scrollLeft = matrixPan.scrollLeft - deltaX;
    window.scrollTo({
      behavior: "auto",
      left: window.scrollX,
      top: matrixPan.scrollY - deltaY,
    });
  });
  wrapper.addEventListener("pointerup", (event) => {
    finishMatrixPan(event.pointerId);
  });
  wrapper.addEventListener("pointercancel", (event) => {
    finishMatrixPan(event.pointerId);
  });
  wrapper.addEventListener("lostpointercapture", (event) => {
    finishMatrixPan(event.pointerId);
  });
  wrapper.addEventListener(
    "click",
    (event) => {
      if (!suppressMatrixClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressMatrixClick = false;
    },
    true,
  );

  table.addEventListener("pointerover", (event) => {
    const cell =
      event.target instanceof Element ? event.target.closest("td, th") : null;
    const row = cell?.closest("tr");
    if (!(cell instanceof HTMLTableCellElement) || !row) return;
    rows.forEach((candidate) =>
      candidate.classList.toggle(
        "olwlg-want-matrix__row--active",
        candidate === row,
      )
    );
    setActiveColumn(columns.includes(cell.cellIndex) ? cell.cellIndex : -1);
    if (cell.classList.contains("olwlg-want-matrix__choice"))
      updateCellInformationTooltip(cell);
  });
  table.addEventListener("pointerout", (event) => {
    const cell =
      event.target instanceof Element
        ? event.target.closest<HTMLTableCellElement>(
          "td.olwlg-want-matrix__choice",
        )
        : null;
    const nextTarget =
      event.relatedTarget instanceof Node ? event.relatedTarget : null;
    if (!cell || cell.contains(nextTarget)) return;
    hideTooltip(cell);
  });
  table.addEventListener("pointerleave", () => {
    rows.forEach((row) =>
      row.classList.remove("olwlg-want-matrix__row--active")
    );
    setActiveColumn(-1);
  });
  table.addEventListener("focusin", (event) => {
    const cell =
      event.target instanceof Element ? event.target.closest("td, th") : null;
    if (!(cell instanceof HTMLTableCellElement)) return;
    rows.forEach((row) =>
      row.classList.toggle(
        "olwlg-want-matrix__row--active",
        row === cell.parentElement,
      )
    );
    setActiveColumn(columns.includes(cell.cellIndex) ? cell.cellIndex : -1);
    if (cell.classList.contains("olwlg-want-matrix__choice"))
      updateCellInformationTooltip(cell);
  });
  table.addEventListener("keydown", (event) => {
    if (
      !(event.target instanceof HTMLInputElement) ||
      event.target.type !== "checkbox" ||
      !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
    )
      return;
    const cell = event.target.closest<HTMLTableCellElement>("td");
    const row = cell?.parentElement;
    if (!cell || !(row instanceof HTMLTableRowElement)) return;
    const visibleRows = rows.filter((candidate) => !candidate.hidden);
    const rowIndex = visibleRows.indexOf(row);
    const columnIndex = columns.indexOf(cell.cellIndex);
    const targetRow = event.key === "ArrowUp"
      ? visibleRows[rowIndex - 1]
      : event.key === "ArrowDown"
        ? visibleRows[rowIndex + 1]
        : row;
    const targetColumn = event.key === "ArrowLeft"
      ? columns[columnIndex - 1]
      : event.key === "ArrowRight"
        ? columns[columnIndex + 1]
        : cell.cellIndex;
    const target = targetRow?.cells[targetColumn]?.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    if (!target) return;
    event.preventDefault();
    target.focus();
  });
  let formIsSubmitting = false;
  form?.addEventListener("reset", () => window.setTimeout(render, 0));
  form?.addEventListener("submit", () => {
    formIsSubmitting = true;
    summary.textContent = "Saving want list…";
    summary.classList.remove(
      "olwlg-want-matrix-toolbar__summary--dirty",
    );
    window.setTimeout(() => {
      formIsSubmitting = false;
    }, 2500);
  });
  window.addEventListener("beforeunload", (event) => {
    if (formIsSubmitting || !isDirty()) return;
    event.preventDefault();
    event.returnValue = "";
  });

  const stickyHeader = document.createElement("div");
  const stickyTable = table.cloneNode(false) as HTMLTableElement;
  const stickyHeaderRow = header.cloneNode(true) as HTMLTableRowElement;
  stickyHeader.className = "olwlg-want-matrix-sticky-header";
  stickyHeader.setAttribute("aria-hidden", "true");
  stickyHeader.inert = true;
  stickyHeader.hidden = true;
  stickyTable.className = table.className;
  stickyTable.removeAttribute("data-olwlg-want-matrix");
  stickyTable.style.cssText = table.style.cssText;
  stickyHeaderRow.classList.add("olwlg-want-matrix__header--clone");
  stickyTable.append(stickyHeaderRow);
  stickyHeader.append(stickyTable);
  document.body.append(stickyHeader);

  const navbar = document.getElementById("navbar");
  const syncToolbarTop = () => {
    const navbarBottom = navbar instanceof HTMLElement
      ? Math.max(0, navbar.getBoundingClientRect().bottom)
      : 0;
    toolbar.style.setProperty(
      "--olwlg-want-toolbar-top",
      `${Math.round(navbarBottom)}px`,
    );
  };
  syncToolbarTop();
  window.addEventListener("resize", syncToolbarTop);
  if (navbar instanceof HTMLElement && typeof ResizeObserver !== "undefined")
    new ResizeObserver(syncToolbarTop).observe(navbar);

  const originalBulkControls = [
    ...header.querySelectorAll<HTMLButtonElement>(
      ".olwlg-want-matrix__bulk",
    ),
  ];
  stickyHeaderRow
    .querySelectorAll<HTMLElement>("a, button, input, [tabindex]")
    .forEach((control) => {
      control.tabIndex = -1;
    });

  let stickyHeaderFrame = 0;
  const updateStickyHeader = () => {
    stickyHeaderFrame = 0;
    const horizontalOffset = Math.round(bodyViewport.scrollLeft);
    const navbarBottom = navbar instanceof HTMLElement
      ? navbar.getBoundingClientRect().bottom
      : 0;
    const toolbarRect = toolbar.getBoundingClientRect();
    const toolbarGap = Number.parseFloat(
      getComputedStyle(toolbar).marginBottom,
    ) || 14;
    const wrapperRect = wrapper.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const stickyTop = Math.max(
      navbarBottom,
      toolbarRect.bottom + toolbarGap,
      0,
    );
    const headerHeight = Math.max(headerRect.height, 1);
    const shouldShow =
      workspaceView === "matrix" &&
      headerRect.top < stickyTop &&
      wrapperRect.bottom > stickyTop + headerHeight &&
      wrapperRect.top < window.innerHeight;

    stickyHeader.hidden = !shouldShow;
    if (!shouldShow) return;

    stickyHeader.style.top = `${Math.round(stickyTop)}px`;
    stickyHeader.style.left = `${Math.round(wrapperRect.left)}px`;
    stickyHeader.style.width = `${Math.round(wrapperRect.width)}px`;
    stickyHeader.style.height = `${Math.round(headerHeight)}px`;
    stickyTable.style.transform =
      `translateX(${-horizontalOffset}px)`;

    [...stickyHeaderRow.cells].forEach((cell, index) => {
      const sourceCell = header.cells[index];
      if (!sourceCell) return;
      const width = sourceCell.getBoundingClientRect().width;
      cell.style.setProperty("width", `${width}px`, "important");
      cell.style.setProperty("min-width", `${width}px`, "important");
      cell.style.setProperty("max-width", `${width}px`, "important");
    });
    stickyHeaderRow
      .querySelectorAll<HTMLButtonElement>(".olwlg-want-matrix__bulk")
      .forEach((control, index) => {
        const source = originalBulkControls[index];
        if (!source) return;
        control.textContent = source.textContent;
        control.disabled = source.disabled;
        control.setAttribute(
          "aria-label",
          source.getAttribute("aria-label") ?? source.textContent ?? "",
        );
      });
    const frozenDetailCell = stickyHeaderRow.cells[1];
    if (frozenDetailCell)
      frozenDetailCell.style.transform =
        `translateX(${horizontalOffset}px)`;
  };
  const scheduleStickyHeaderUpdate = () => {
    if (stickyHeaderFrame) return;
    stickyHeaderFrame = requestAnimationFrame(updateStickyHeader);
  };
  window.addEventListener("scroll", scheduleStickyHeaderUpdate, {
    passive: true,
  });
  window.addEventListener("resize", scheduleStickyHeaderUpdate);
  if (typeof ResizeObserver !== "undefined")
    new ResizeObserver(scheduleStickyHeaderUpdate).observe(toolbar);
  bodyViewport.addEventListener(
    "scroll",
    () => {
      const horizontalOffset = Math.round(bodyViewport.scrollLeft);
      header.style.transform = `translateX(${-horizontalOffset}px)`;
      const frozenDetailCell = header.cells[1];
      if (frozenDetailCell)
        frozenDetailCell.style.transform =
          `translateX(${horizontalOffset}px)`;
      scheduleStickyHeaderUpdate();
    },
    { passive: true },
  );

  setWorkspaceView(workspaceView);
  window.addEventListener("resize", () => {
    if (window.innerWidth <= 720 && workspaceView === "matrix")
      setWorkspaceView("focus");
  });
}

