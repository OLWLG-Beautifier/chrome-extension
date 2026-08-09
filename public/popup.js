const toggle = document.querySelector("#beautifier-toggle");
const statusCopy = document.querySelector("#status-copy");

function render(enabled) {
  if (!(toggle instanceof HTMLInputElement) || !statusCopy) return;

  toggle.checked = enabled;
  statusCopy.textContent = enabled
    ? "Active on every OLWLG page."
    : "Original OLWLG styles are showing.";
}

function isOlwlgPage(url) {
  if (!url) return false;

  try {
    const page = new URL(url);
    return (
      page.protocol === "https:" &&
      page.hostname === "bgg.activityclub.org" &&
      (page.pathname === "/olwlg" || page.pathname.startsWith("/olwlg/"))
    );
  } catch {
    return false;
  }
}

function refreshActiveOlwlgTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.id === undefined || !isOlwlgPage(tab.url)) return;
    chrome.tabs.reload(tab.id);
  });
}

if (toggle instanceof HTMLInputElement) {
  chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
    render(Boolean(enabled));
  });

  toggle.addEventListener("change", () => {
    const enabled = toggle.checked;
    render(enabled);
    chrome.storage.sync.set({ enabled }, () => {
      if (enabled) refreshActiveOlwlgTab();
    });
  });
}
