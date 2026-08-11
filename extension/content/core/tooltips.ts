import { requestBggImageBatch } from "./bgg-images";
import {
  hydrateTradeSummaryGameTooltip,
  renderTradeSummaryGameTooltip,
} from "../pages/trades-summary";

const ROOT_CLASS = "olwlg-beautified";

let tooltip: HTMLDivElement | undefined;
let tooltipOwner: HTMLElement | undefined;
let tooltipHideTimer = 0;

function getTooltip() {
  if (tooltip) return tooltip;

  tooltip = document.createElement("div");
  tooltip.className = "olwlg-tooltip";
  tooltip.id = "olwlg-icon-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = true;
  document.body.append(tooltip);
  return tooltip;
}

export function showTooltip(owner: HTMLElement) {
  if (!document.documentElement.classList.contains(ROOT_CLASS)) return;
  if (owner.closest(".olwlg-want-matrix__scroll--dragging")) return;

  const message = owner.dataset.olwlgTooltip;
  if (!message) return;

  window.clearTimeout(tooltipHideTimer);
  const element = getTooltip();
  tooltipOwner = owner;
  const isMatrixCell = owner.dataset.olwlgTooltipKind === "matrix-cell";
  const isSummaryGame = owner.dataset.olwlgTooltipKind === "summary-game";
  element.classList.toggle("olwlg-tooltip--matrix-cell", isMatrixCell);
  element.classList.toggle("olwlg-tooltip--summary-game", isSummaryGame);
  if (isMatrixCell) {
    const checkbox = owner.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    const selected = checkbox?.checked ??
      owner.dataset.olwlgSelected === "true";
    const heading = document.createElement("div");
    const coordinates = document.createElement("span");
    const state = document.createElement("span");
    const relationship = document.createElement("div");
    const row = document.createElement("div");
    const rowLabel = document.createElement("span");
    const rowValue = document.createElement("strong");
    const column = document.createElement("div");
    const columnLabel = document.createElement("span");
    const columnValue = document.createElement("strong");
    const warning = document.createElement("div");
    const warningTitle = document.createElement("strong");
    const warningText = document.createElement("p");
    const warningNote = document.createElement("small");
    const explanation = document.createElement("p");
    const panNote = document.createElement("p");
    heading.className = "olwlg-matrix-popover__heading";
    coordinates.className = "olwlg-matrix-popover__coordinates";
    state.className =
      `olwlg-matrix-popover__state${
        selected ? " olwlg-matrix-popover__state--selected" : ""
      }`;
    relationship.className = "olwlg-matrix-popover__relationship";
    row.className =
      "olwlg-matrix-popover__entry olwlg-matrix-popover__entry--receive";
    column.className =
      "olwlg-matrix-popover__entry olwlg-matrix-popover__entry--give";
    warning.className = "olwlg-matrix-popover__warning";
    warning.setAttribute("role", "note");
    explanation.className = "olwlg-matrix-popover__explanation";
    panNote.className = "olwlg-matrix-popover__pan-note";
    panNote.textContent =
      "Click and drag outside the checkbox to pan the table.";
    coordinates.textContent =
      `Row ${owner.dataset.olwlgRowNumber ?? "—"} · Column ${
        owner.dataset.olwlgColumnId ?? "—"
      }`;
    state.textContent = selected ? "Selected" : "Not selected";
    rowLabel.textContent = "You receive · Row";
    rowValue.textContent = owner.dataset.olwlgRowLabel ?? "Unknown item";
    const participant = owner.dataset.olwlgRowOwner;
    if (participant) {
      const ownerLabel = document.createElement("small");
      ownerLabel.textContent = `From ${participant}`;
      row.append(rowLabel, rowValue, ownerLabel);
    } else row.append(rowLabel, rowValue);
    columnLabel.textContent = "You give · Column";
    columnValue.textContent =
      owner.dataset.olwlgColumnLabel ?? "Unknown offered item";
    column.append(columnLabel, columnValue);
    relationship.append(row, column);
    const isValueOrderWarning =
      owner.dataset.olwlgStatusKind === "value-order-warning";
    if (isValueOrderWarning) {
      warningTitle.textContent = "Review value order";
      warningText.textContent =
        "OLWLG thinks you may be offering a higher-valued item without also offering this lower-valued one.";
      warningNote.textContent =
        "This is only a consistency hint. It does not block saving or affect TradeMaximizer.";
      warning.append(warningTitle, warningText, warningNote);
    }
    explanation.textContent = selected
      ? "This exchange is currently included in your want list."
      : "Select this cell to include this exchange in your want list.";
    const statusLabel = owner.dataset.olwlgStatusLabel;
    if (statusLabel && !isValueOrderWarning) {
      const status = document.createElement("span");
      status.className = "olwlg-matrix-popover__status";
      status.textContent = statusLabel;
      explanation.append(" ", status);
    }
    heading.append(coordinates, state);
    element.replaceChildren(heading, relationship);
    if (isValueOrderWarning) element.append(warning);
    element.append(explanation, panNote);
  } else if (isSummaryGame) {
    renderTradeSummaryGameTooltip(owner, element);
    void hydrateTradeSummaryGameTooltip(owner, requestBggImageBatch, () => {
      if (tooltipOwner === owner && tooltip)
        renderTradeSummaryGameTooltip(owner, tooltip);
    });
  } else {
    element.textContent = message;
  }
  element.hidden = false;

  const ownerRect = owner.getBoundingClientRect();
  const tooltipRect = element.getBoundingClientRect();
  const gap = 9;
  const margin = 8;
  let top: number;
  let left: number;
  if (isMatrixCell) {
    const roomRight = window.innerWidth - ownerRect.right;
    const roomLeft = ownerRect.left;
    if (roomRight >= tooltipRect.width + gap + margin) {
      left = ownerRect.right + gap;
      top = ownerRect.top + ownerRect.height / 2 - tooltipRect.height / 2;
    } else if (roomLeft >= tooltipRect.width + gap + margin) {
      left = ownerRect.left - tooltipRect.width - gap;
      top = ownerRect.top + ownerRect.height / 2 - tooltipRect.height / 2;
    } else {
      left = ownerRect.left + ownerRect.width / 2 - tooltipRect.width / 2;
      const roomAbove = ownerRect.top;
      const roomBelow = window.innerHeight - ownerRect.bottom;
      top = roomAbove >= tooltipRect.height + gap || roomAbove >= roomBelow
        ? ownerRect.top - tooltipRect.height - gap
        : ownerRect.bottom + gap;
    }
  } else {
    top = ownerRect.top - tooltipRect.height - gap;
    if (top < margin) top = ownerRect.bottom + gap;
    left = ownerRect.left + ownerRect.width / 2 - tooltipRect.width / 2;
  }
  top = Math.min(
    window.innerHeight - tooltipRect.height - margin,
    Math.max(margin, top),
  );
  left = Math.min(
    window.innerWidth - tooltipRect.width - margin,
    Math.max(margin, left),
  );

  element.style.translate = "none";
  element.style.left = `${Math.round(left)}px`;
  element.style.top = `${Math.round(top)}px`;
  owner.setAttribute("aria-describedby", element.id);
}

export function hideTooltip(owner?: HTMLElement, force = false) {
  if (!tooltip || (owner && tooltipOwner !== owner)) return;
  const currentOwner = tooltipOwner;
  const hide = () => {
    if (
      !force &&
      currentOwner?.dataset.olwlgTooltipKind === "matrix-cell" &&
      (currentOwner.matches(":hover") ||
        currentOwner.contains(document.activeElement))
    )
      return;
    currentOwner?.removeAttribute("aria-describedby");
    if (tooltipOwner === currentOwner) tooltipOwner = undefined;
    if (tooltip && !tooltipOwner) tooltip.hidden = true;
  };
  window.clearTimeout(tooltipHideTimer);
  if (!force && currentOwner?.dataset.olwlgTooltipKind === "matrix-cell")
    tooltipHideTimer = window.setTimeout(hide, 120);
  else hide();
}

function tooltipControl(target: EventTarget | null) {
  return target instanceof Element
    ? target.closest<HTMLElement>(
        ".olwlg-icon-control[data-olwlg-tooltip], .olwlg-tooltip-target[data-olwlg-tooltip]",
      )
    : null;
}

document.addEventListener("pointerover", (event) => {
  const control = tooltipControl(event.target);
  if (control) showTooltip(control);
});

document.addEventListener("pointerout", (event) => {
  const control = tooltipControl(event.target);
  const nextTarget =
    event.relatedTarget instanceof Node ? event.relatedTarget : null;
  if (control && !control.contains(nextTarget)) hideTooltip(control);
});

document.addEventListener("focusin", (event) => {
  const control = tooltipControl(event.target);
  if (control) showTooltip(control);
});

document.addEventListener("focusout", (event) => {
  const control = tooltipControl(event.target);
  if (control) hideTooltip(control);
});

window.addEventListener("scroll", () => hideTooltip(), true);
window.addEventListener("resize", () => hideTooltip());