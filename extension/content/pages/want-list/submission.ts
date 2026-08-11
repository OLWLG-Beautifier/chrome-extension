import { normalizedText } from "../catalog";

export function cleanWantListPageFooter() {
  const duplicatePatterns = [
    /Note:\s*Confirm Changes does not submit your WANTS/i,
    /Note:\s*Submission window is open for submitting your wants/i,
    /\d+(?:\.\d+)?\s+days?\s+left to submit\/re-submit your wants/i,
    /^\d+\s+check\s*boxes$/i,
  ];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const duplicateNodes: Text[] = [];
  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text;
    if (
      textNode.parentElement?.closest(
        ".olwlg-mywants-info-card, .olwlg-want-matrix-toolbar",
      )
    )
      continue;
    if (
      duplicatePatterns.some((pattern) =>
        pattern.test(normalizedText(textNode.data))
      )
    )
      duplicateNodes.push(textNode);
  }
  duplicateNodes.forEach((textNode) => {
    const parent = textNode.parentElement;
    const compactContainer = parent?.closest<HTMLElement>(
      "p, li, mark, font, a, span",
    );
    const compactText = normalizedText(compactContainer?.textContent);
    if (
      compactContainer &&
      compactText.length < 320 &&
      duplicatePatterns.some((pattern) => pattern.test(compactText))
    ) {
      const previous = compactContainer.previousSibling;
      const next = compactContainer.nextSibling;
      compactContainer.remove();
      if (previous instanceof HTMLBRElement) previous.remove();
      if (next instanceof HTMLBRElement) next.remove();
      return;
    }
    const previous = textNode.previousSibling;
    const next = textNode.nextSibling;
    textNode.remove();
    if (previous instanceof HTMLBRElement) previous.remove();
    if (next instanceof HTMLBRElement) next.remove();
  });

}

export function enhanceWantListSubmissionError() {
  const errorPattern = /^error:\s*(sendgeekmail\b.*)$/i;
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
  );
  let errorNode: Text | undefined;
  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text;
    if (
      textNode.parentElement?.closest(
        ".olwlg-want-submission-error, script, style",
      )
    )
      continue;
    if (errorPattern.test(normalizedText(textNode.data))) {
      errorNode = textNode;
      break;
    }
  }
  if (!errorNode) return false;

  const sourceParent = errorNode.parentElement;
  const semanticSource = sourceParent?.closest<HTMLElement>(
    "p, li, pre, blockquote",
  );
  const source = semanticSource &&
      normalizedText(semanticSource.textContent).length < 300
    ? semanticSource
    : sourceParent &&
        sourceParent !== document.body &&
        normalizedText(sourceParent.textContent).length < 160
    ? sourceParent
    : errorNode;
  const detail = normalizedText(errorNode.data).replace(/^error:\s*/i, "");
  const alert = document.createElement("aside");
  const icon = document.createElement("span");
  const copy = document.createElement("div");
  const eyebrow = document.createElement("span");
  const heading = document.createElement("h2");
  const message = document.createElement("p");
  const technicalDetail = document.createElement("p");
  const code = document.createElement("code");

  alert.className = "olwlg-want-submission-error";
  alert.setAttribute("role", "alert");
  alert.setAttribute("aria-live", "assertive");
  alert.setAttribute("aria-label", "BGG GeekMail confirmation error");
  icon.className = "olwlg-want-submission-error__icon";
  icon.textContent = "!";
  icon.setAttribute("aria-hidden", "true");
  copy.className = "olwlg-want-submission-error__copy";
  eyebrow.className = "olwlg-want-submission-error__eyebrow";
  eyebrow.textContent = "Confirmation delivery error";
  heading.textContent = "The BGG GeekMail confirmation was not sent";
  message.textContent =
    "Your want-list submission is shown as confirmed, but OLWLG could not send its confirmation message through BGG GeekMail.";
  technicalDetail.className = "olwlg-want-submission-error__detail";
  technicalDetail.append("Technical detail: ");
  code.textContent = detail;
  technicalDetail.append(code);
  copy.append(eyebrow, heading, message, technicalDetail);
  alert.append(icon, copy);

  if (source instanceof HTMLElement && source.parentNode) {
    source.parentNode.insertBefore(alert, source);
    source.classList.add("olwlg-want-submission-error__source");
    source.setAttribute("aria-hidden", "true");
  } else if (source.parentNode) {
    source.parentNode.insertBefore(alert, source);
    source.parentNode.removeChild(source);
  }
  [alert.previousSibling, alert.nextSibling].forEach((sibling) => {
    if (sibling instanceof HTMLBRElement) sibling.remove();
    else if (
      sibling instanceof Text &&
      /^[.\u00b7]+$/.test(normalizedText(sibling.data))
    )
      sibling.remove();
  });
  return true;
}

export function enhanceWantListSubmissionConfirmation(
  toolbar: HTMLElement,
  geekMailDeliveryFailed = false,
) {
  const headingPattern =
    /thank you for confirming your wants for (?:the|this) math trade/i;
  const messagePattern =
    /confirmation and summary (?:has|have) been geekmailed to you on BGG/i;
  const matchingElement = (pattern: RegExp) =>
    [
      ...document.querySelectorAll<HTMLElement>(
        "h1, h2, h3, h4, p, li, div, section, article, td, center, font, strong, b, span",
      ),
    ]
      .filter(
        (element) =>
          !element.closest(".olwlg-want-submission-success") &&
          pattern.test(normalizedText(element.textContent)),
      )
      .sort(
        (left, right) =>
          normalizedText(left.textContent).length -
          normalizedText(right.textContent).length,
      )[0];
  const textWalker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
  );
  let headingNode: Text | undefined;
  let messageNode: Text | undefined;
  while (textWalker.nextNode() && (!headingNode || !messageNode)) {
    const textNode = textWalker.currentNode as Text;
    if (textNode.parentElement?.closest(".olwlg-want-submission-success"))
      continue;
    const text = normalizedText(textNode.data);
    if (!headingNode && headingPattern.test(text)) headingNode = textNode;
    if (!messageNode && messagePattern.test(text)) messageNode = textNode;
  }
  const headingElement = matchingElement(headingPattern);
  const messageElement = matchingElement(messagePattern);
  if (!headingNode && !headingElement) return false;

  const sourceBlock = (textNode: Text) => {
    const parent = textNode.parentElement;
    const semanticBlock = parent?.closest<HTMLElement>(
      "h1, h2, h3, h4, p, li",
    );
    if (semanticBlock) return semanticBlock;
    if (
      parent &&
      parent !== document.body &&
      normalizedText(parent.textContent).length < 420
    )
      return parent;
    return textNode;
  };
  const headingSource = headingNode
    ? sourceBlock(headingNode)
    : headingElement;
  const messageSource = messageNode
    ? sourceBlock(messageNode)
    : messageElement;
  const card = document.createElement("section");
  const icon = document.createElement("span");
  const copy = document.createElement("div");
  const eyebrow = document.createElement("span");
  const heading = document.createElement("h2");
  const message = document.createElement("p");
  card.className = "olwlg-want-submission-success";
  card.setAttribute("role", "status");
  card.setAttribute("aria-live", "polite");
  card.setAttribute("aria-label", "Want-list submission confirmed");
  icon.className = "olwlg-want-submission-success__icon";
  icon.textContent = "✓";
  icon.setAttribute("aria-hidden", "true");
  copy.className = "olwlg-want-submission-success__copy";
  eyebrow.className = "olwlg-want-submission-success__eyebrow";
  eyebrow.textContent = "Submission confirmed";
  heading.textContent =
    "Thank you for confirming your wants for the math trade.";
  message.textContent = geekMailDeliveryFailed
    ? "Your wants are confirmed for this math trade. OLWLG could not send the usual summary through BGG GeekMail; see the delivery error above. You can still make changes and re-submit your lists until the deadline."
    : "A confirmation and summary has been sent to you through BGG GeekMail. You can still make changes and re-submit your lists until the deadline.";
  copy.append(eyebrow, heading, message);
  card.append(icon, copy);

  const insertionAnchor = headingSource instanceof HTMLElement
    ? headingSource
    : headingNode?.parentElement;
  if (insertionAnchor?.parentNode)
    insertionAnchor.parentNode.insertBefore(card, insertionAnchor);
  else toolbar.insertAdjacentElement("beforebegin", card);

  const sources = new Set<HTMLElement | Text>(
    [headingSource, messageSource].filter(
      (source): source is HTMLElement | Text => source !== undefined,
    ),
  );
  sources.forEach((source) => {
    [source.previousSibling, source.nextSibling].forEach((sibling) => {
      if (sibling instanceof HTMLBRElement) {
        sibling.classList.add("olwlg-want-submission-success__source");
      } else if (
        sibling instanceof Text &&
        /^[.·]+$/.test(normalizedText(sibling.data))
      ) {
        sibling.parentNode?.removeChild(sibling);
      }
    });
    if (source instanceof HTMLElement) {
      source.classList.add("olwlg-want-submission-success__source");
      source.setAttribute("aria-hidden", "true");
    } else source.parentNode?.removeChild(source);
  });
  return true;
}

