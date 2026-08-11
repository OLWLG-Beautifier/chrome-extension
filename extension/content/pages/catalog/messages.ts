import {
  normalizedText,
} from "./helpers";

export function promoteCatalogMessage(needle: string, variant: "info" | "warning") {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let textNode: Text | undefined;

  while (walker.nextNode()) {
    const current = walker.currentNode as Text;
    if (normalizedText(current.data).toLowerCase().includes(needle)) {
      textNode = current;
      break;
    }
  }
  if (!textNode?.parentElement) return;

  const parent = textNode.parentElement;
  if (
    parent !== document.body &&
    normalizedText(parent.textContent).length < 500
  ) {
    parent.classList.add(
      "olwlg-message",
      `olwlg-message--${variant}`,
    );
    return;
  }

  const message = document.createElement("aside");
  message.className = `olwlg-message olwlg-message--${variant}`;
  message.setAttribute("role", variant === "warning" ? "alert" : "status");
  parent.insertBefore(message, textNode);

  let node: ChildNode | null = textNode;
  while (node) {
    const next: ChildNode | null = node.nextSibling;
    if (node instanceof HTMLBRElement) {
      node.remove();
      break;
    }
    if (
      node !== textNode &&
      node instanceof HTMLElement &&
      /^(H[1-6]|TABLE|DETAILS|FORM)$/i.test(node.tagName)
    )
      break;
    message.append(node);
    node = next;
  }
}

export function enhanceCatalogMessages() {
  promoteCatalogMessage(
    "you are only viewing new items added since you last viewed",
    "info",
  );
  promoteCatalogMessage("note: submission window is open", "warning");
  promoteCatalogMessage(
    "you have made changes/edits to your want lists after your last submission",
    "warning",
  );
  promoteCatalogMessage(
    "of your offerings has/have geeklist comments to which you have not replied",
    "warning",
  );

  const resubmissionWarning = [
    ...document.querySelectorAll<HTMLElement>(".olwlg-message, [role='alert']"),
  ].find((message) =>
    /made changes(?:\/edits| or edits)? to your want lists? after your last submission/i.test(
      normalizedText(message.textContent),
    )
  );
  if (resubmissionWarning) {
    const heading = document.createElement("strong");
    const copy = document.createElement("span");
    heading.className = "olwlg-message__title";
    heading.textContent = "Your latest changes are not submitted";
    copy.className = "olwlg-message__copy";
    copy.textContent =
      "Your want list changed after your last submission. Resubmit it before the deadline for the latest changes to be used.";
    resubmissionWarning.replaceChildren(heading, copy);
    resubmissionWarning.classList.add(
      "olwlg-message--warning",
      "olwlg-message--resubmission-warning",
    );
    resubmissionWarning.setAttribute("role", "alert");
    resubmissionWarning.setAttribute("aria-live", "polite");
  }
}

export function removeCatalogItemCountFromMessage(message: HTMLElement) {
  const itemCountPattern =
    /\b\d[\d,]*\s+items?\s*\(\s*\d[\d,]*\s+unique\s+games?\s*\[\s*items?\s*(?:&|and)\s*sweeteners?\s*\]\s*\)/gi;
  const walker = document.createTreeWalker(message, NodeFilter.SHOW_TEXT);
  const matches: Text[] = [];
  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text;
    itemCountPattern.lastIndex = 0;
    if (itemCountPattern.test(textNode.data)) matches.push(textNode);
  }
  matches.forEach((textNode) => {
    itemCountPattern.lastIndex = 0;
    const remainingText = textNode.data.replace(itemCountPattern, "");
    if (normalizedText(remainingText)) {
      textNode.data = remainingText;
      return;
    }

    const container = textNode.parentElement?.closest<HTMLElement>(
      "p, li, div, span, font, strong, b",
    );
    itemCountPattern.lastIndex = 0;
    const containsOnlyItemCount =
      Boolean(container) &&
      !normalizedText(container?.textContent).replace(itemCountPattern, "");
    if (
      container &&
      container !== message &&
      containsOnlyItemCount &&
      !container.querySelector("a, button, input, img")
    ) {
      container.remove();
    } else textNode.parentNode?.removeChild(textNode);
  });
}
