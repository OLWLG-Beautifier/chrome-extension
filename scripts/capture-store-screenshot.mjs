import { spawn } from "node:child_process";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";

const root = process.cwd();
const chromePath = process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const targetUrl = "https://bgg.activityclub.org/olwlg/";
const outputPath = join(
  root,
  "store-assets/screenshots/01-olwlg-dashboard-1280x800.png",
);
const profileDir = await mkdtemp(join(tmpdir(), "olwlg-store-capture-"));
const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

class DevToolsClient {
  constructor(url) {
    this.nextId = 1;
    this.pending = new Map();
    this.eventWaiters = new Map();
    this.socket = new WebSocket(url);
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.socket.once("open", resolve);
      this.socket.once("error", reject);
    });
    this.socket.on("message", (payload) => {
      const message = JSON.parse(payload.toString());
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      const waiters = this.eventWaiters.get(message.method) ?? [];
      this.eventWaiters.delete(message.method);
      waiters.forEach((resolve) => resolve(message.params));
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  waitForEvent(method) {
    return new Promise((resolve) => {
      const waiters = this.eventWaiters.get(method) ?? [];
      waiters.push(resolve);
      this.eventWaiters.set(method, waiters);
    });
  }

  close() {
    this.socket.close();
  }
}

async function devToolsPort() {
  const activePortPath = join(profileDir, "DevToolsActivePort");
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const [port] = (await readFile(activePortPath, "utf8")).split("\n");
      if (port) return port;
    } catch {
      // Chrome has not created the endpoint yet.
    }
    await sleep(100);
  }
  throw new Error("Chrome did not expose a DevTools endpoint.");
}

const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--disable-default-apps",
    "--disable-background-networking",
    "--hide-scrollbars",
    "--no-first-run",
    "--remote-debugging-port=0",
    `--user-data-dir=${profileDir}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

let client;
try {
  const port = await devToolsPort();
  const pageResponse = await fetch(
    `http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`,
    { method: "PUT" },
  );
  if (!pageResponse.ok)
    throw new Error(`Could not create capture tab: ${pageResponse.status}`);
  const page = await pageResponse.json();
  client = new DevToolsClient(page.webSocketDebuggerUrl);
  await client.open();
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const loaded = client.waitForEvent("Page.loadEventFired");
  await client.send("Page.navigate", { url: targetUrl });
  await loaded;

  const [css, script, iconSvg] = await Promise.all([
    readFile(join(root, "dist/content/beautifier.css"), "utf8"),
    readFile(join(root, "dist/content/beautifier.js"), "utf8"),
    readFile(join(root, "dist/icons/icon.svg"), "utf8"),
  ]);
  const iconDataUrl =
    `data:image/svg+xml;base64,${Buffer.from(iconSvg).toString("base64")}`;
  await client.send("Runtime.evaluate", {
    expression: `(() => {
      globalThis.chrome = {
        runtime: { getURL: () => ${JSON.stringify(iconDataUrl)} },
        storage: {
          sync: {
            get: (defaults, callback) => queueMicrotask(() => callback(defaults)),
            set: (_value, callback) => queueMicrotask(() => callback?.())
          },
          onChanged: { addListener: () => {} }
        }
      };
      globalThis.__olwlgCaptureErrors = [];
      addEventListener("error", (event) => {
        globalThis.__olwlgCaptureErrors.push(
          event.error?.stack ?? event.message ?? "Unknown page error"
        );
      });
      addEventListener("unhandledrejection", (event) => {
        globalThis.__olwlgCaptureErrors.push(
          event.reason?.stack ?? String(event.reason)
        );
      });
      const style = document.createElement("style");
      style.textContent = ${JSON.stringify(css)} +
        "\\nhtml { scrollbar-width: none; } ::-webkit-scrollbar { display: none; }";
      document.head.append(style);
    })()`,
  });
  const injection = await client.send("Runtime.evaluate", { expression: script });
  if (injection.exceptionDetails) {
    const details = injection.exceptionDetails;
    const description =
      details.exception?.description ?? details.text ?? "Unknown injection error";
    throw new Error(`Could not inject the extension: ${description}`);
  }

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const state = await client.send("Runtime.evaluate", {
      expression:
        "document.body.classList.contains('olwlg-home-page') && " +
        "!document.documentElement.classList.contains('olwlg-catalog-booting')",
      returnByValue: true,
    });
    if (state.result.value) break;
    if (attempt === 79) {
      const diagnostics = await client.send("Runtime.evaluate", {
        expression: `JSON.stringify({
          url: location.href,
          readyState: document.readyState,
          htmlClasses: document.documentElement.className,
          bodyClasses: document.body?.className,
          title: document.title,
          errors: globalThis.__olwlgCaptureErrors
        })`,
        returnByValue: true,
      });
      throw new Error(
        `Enhanced dashboard did not become ready. ${diagnostics.result.value}`,
      );
    }
    await sleep(100);
  }
  await client.send("Runtime.evaluate", {
    expression: "window.scrollTo(0, 0)",
  });
  await sleep(300);
  const screenshot = await client.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
    fromSurface: true,
  });
  await mkdir(join(root, "store-assets/screenshots"), { recursive: true });
  await writeFile(outputPath, Buffer.from(screenshot.data, "base64"));
  console.log(`Created ${outputPath}`);
} finally {
  client?.close();
  chrome.kill("SIGTERM");
  await rm(profileDir, { recursive: true, force: true });
}
