import { createButton } from "../../components";
import { normalizedText } from "./helpers";
import { syncCatalogAddedItems } from "./actions";

export let modalReturnMarker: Comment | undefined;

export let modalMovedContent: HTMLElement | undefined;

export function getCatalogModal() {
  let modal = document.querySelector<HTMLElement>(".olwlg-catalog-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.className = "olwlg-catalog-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="olwlg-catalog-modal__backdrop" data-olwlg-modal-close></div>
    <section class="olwlg-catalog-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="olwlg-modal-title">
      <header>
        <div>
          <p>Math trade item</p>
          <h2 id="olwlg-modal-title"></h2>
        </div>
        <span data-olwlg-control="modal-close"></span>
      </header>
      <div class="olwlg-catalog-modal__body"></div>
    </section>
  `;
  modal
    .querySelector<HTMLElement>('[data-olwlg-control="modal-close"]')
    ?.replaceWith(createButton({
      ariaLabel: "Close dialog",
      className: "olwlg-catalog-modal__close",
      content: "×",
      dataset: { olwlgModalClose: "" },
      variant: "custom",
    }));
  modal.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLElement>("button, input");
    const buttonLabel =
      button instanceof HTMLInputElement
        ? button.value
        : button?.textContent ?? "";
    if (
      target.closest("[data-olwlg-modal-close]") ||
      buttonLabel.trim().toLowerCase() === "cancel"
    ) {
      closeCatalogModal();
      return;
    }
    if (buttonLabel.trim().toLowerCase() === "save") {
      window.setTimeout(syncCatalogAddedItems, 80);
      window.setTimeout(syncCatalogAddedItems, 350);
      window.setTimeout(closeCatalogModal, 0);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal?.hidden) closeCatalogModal();
  });
  document.body.append(modal);
  return modal;
}

export function closeCatalogModal() {
  const modal = document.querySelector<HTMLElement>(".olwlg-catalog-modal");
  if (!modal) return;
  if (modalMovedContent && modalReturnMarker?.parentNode) {
    modalReturnMarker.parentNode.insertBefore(
      modalMovedContent,
      modalReturnMarker,
    );
    modalMovedContent.style.visibility = "hidden";
    modalReturnMarker.remove();
  }
  const body = modal.querySelector<HTMLElement>(".olwlg-catalog-modal__body");
  body?.classList.remove("olwlg-catalog-modal__body--frame-loading");
  body?.replaceChildren();
  modalMovedContent = undefined;
  modalReturnMarker = undefined;
  modal.hidden = true;
  document.body.classList.remove("olwlg-modal-open");
}

export function decorateCatalogWantPanel(panel: HTMLElement) {
  if (panel.dataset.olwlgWantPanelDecorated === "true") return;

  const checkboxTables = new Set<HTMLTableElement>();
  panel
    .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    .forEach((checkbox) => {
      let table = checkbox.closest<HTMLTableElement>("table");
      while (table && panel.contains(table)) {
        checkboxTables.add(table);
        table = table.parentElement?.closest<HTMLTableElement>("table") ?? null;
      }
    });
  const offerTables = [...checkboxTables];
  offerTables
    .filter((table) => {
      const ancestor =
        table.parentElement?.closest<HTMLTableElement>("table");
      return !ancestor || !checkboxTables.has(ancestor);
    })
    .forEach((table) => table.classList.add("olwlg-want-offers"));
  offerTables
    .filter(
      (table) =>
        ![...table.querySelectorAll<HTMLTableElement>("table")].some(
          (nested) => checkboxTables.has(nested),
        ),
    )
    .forEach((table) => table.classList.add("olwlg-want-offers__group"));

  const actionLabel = (control: HTMLElement) =>
    normalizedText(
      control instanceof HTMLInputElement
        ? `${control.value} ${control.title} ${control.getAttribute("aria-label")}`
        : `${control.textContent} ${control.title} ${control.getAttribute("aria-label")}`,
    );
  const actionControls = [
    ...panel.querySelectorAll<HTMLElement>(
      "a, button, input:not([type='checkbox']):not([type='radio'])",
    ),
  ].filter((control) =>
    /\bsave\b|\bcancel\b|\bcheck all\b|\buncheck all\b|optional value/i.test(
      actionLabel(control),
    )
  );
  actionControls.forEach((control) => {
    const label = actionLabel(control).toLowerCase();
    if (/\b(?:save|cancel)\b/.test(label))
      control.classList.add("olwlg-want-panel__primary-action");
    if (/\b(?:check all|uncheck all)\b/.test(label)) {
      control.classList.add("olwlg-want-panel__bulk-action");
      if (/\bcheck all\b/.test(label) && !/\buncheck all\b/.test(label))
        control.classList.add("olwlg-want-panel__bulk-action--start");
    }
  });

  actionControls.forEach((control) => {
    let container = control.parentElement;
    while (container && container !== panel) {
      const labels = [
        ...container.querySelectorAll<HTMLElement>("a, button, input"),
      ].map(actionLabel).join(" ");
      if (
        !container.querySelector('input[type="checkbox"]') &&
        /\b(?:save|cancel)\b/i.test(labels) &&
        /\b(?:check all|uncheck all)\b/i.test(labels)
      ) {
        container.classList.add("olwlg-want-panel__actions");
        break;
      }
      container = container.parentElement;
    }
  });

  const actionContainers = new Set<HTMLElement>([panel]);
  actionControls.forEach((control) => {
    let container = control.parentElement;
    while (container && panel.contains(container)) {
      if (container.matches("form, div, center"))
        actionContainers.add(container);
      if (container === panel) break;
      container = container.parentElement;
    }
  });
  [...actionContainers].reverse().forEach((container) => {
    let segment: ChildNode[] = [];
    const wrapSegment = () => {
      if (!segment.length) return;
      const labels = segment
        .flatMap((node) => {
          if (!(node instanceof HTMLElement)) return [];
          const controls = node.matches("a, button, input")
            ? [node]
            : [...node.querySelectorAll<HTMLElement>("a, button, input")];
          return controls.map(actionLabel);
        })
        .join(" ");
      if (
        /\b(?:save|cancel)\b/i.test(labels) &&
        /\b(?:check all|uncheck all)\b/i.test(labels) &&
        !segment.some(
          (node) =>
            node instanceof Element &&
            node.closest(".olwlg-want-panel__actions"),
        )
      ) {
        const actions = document.createElement("div");
        actions.className = "olwlg-want-panel__actions";
        container.insertBefore(actions, segment[0]);
        segment.forEach((node) => actions.append(node));
      }
      segment = [];
    };

    [...container.childNodes].forEach((node) => {
      const containsOffers =
        node instanceof Element &&
        Boolean(node.querySelector('input[type="checkbox"]'));
      if (containsOffers) {
        wrapSegment();
        return;
      }
      segment.push(node);
    });
    wrapSegment();
  });

  const promptText = "which of your games would you trade";
  const prompt = [
    ...panel.querySelectorAll<HTMLElement>("p, div, strong, b, span"),
  ]
    .filter((element) =>
      normalizedText(element.textContent).toLowerCase().includes(promptText)
    )
    .sort(
      (left, right) =>
        normalizedText(left.textContent).length -
        normalizedText(right.textContent).length,
    )[0];
  if (prompt) {
    prompt.classList.add("olwlg-want-panel__prompt");
  } else {
    const walker = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = walker.currentNode as Text;
      if (!normalizedText(text.data).toLowerCase().includes(promptText))
        continue;
      const wrapper = document.createElement("div");
      wrapper.className = "olwlg-want-panel__prompt";
      text.parentNode?.insertBefore(wrapper, text);
      wrapper.append(text);
      break;
    }
  }

  panel.dataset.olwlgWantPanelDecorated = "true";
}

export function openCatalogModal(
  title: string,
  content: HTMLElement,
  moveContent = false,
) {
  closeCatalogModal();
  const modal = getCatalogModal();
  const heading = modal.querySelector<HTMLElement>("#olwlg-modal-title");
  const body = modal.querySelector<HTMLElement>(".olwlg-catalog-modal__body");
  if (!heading || !body) return;

  heading.textContent = title;
  body.replaceChildren();
  if (moveContent) {
    modalReturnMarker = document.createComment("olwlg-modal-return");
    content.parentNode?.insertBefore(modalReturnMarker, content);
    modalMovedContent = content;
    content.style.visibility = "visible";
    if (!content.classList.contains("olwlg-catalog-legacy-source"))
      content.classList.add("olwlg-want-panel");
    if (content.classList.contains("olwlg-want-panel"))
      decorateCatalogWantPanel(content);
    body.append(content);
  } else {
    body.append(content);
  }
  modal.hidden = false;
  document.body.classList.add("olwlg-modal-open");
  modal
    .querySelector<HTMLButtonElement>(".olwlg-catalog-modal__close")
    ?.focus();
}

