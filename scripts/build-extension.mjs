import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { build, transform } from "esbuild";

const root = process.cwd();
const outDir = join(root, "dist");

async function localEnvValue(name) {
  const processValue = process.env[name]?.trim();
  if (processValue) return processValue;

  try {
    const contents = await readFile(join(root, ".env.local"), "utf8");
    for (const sourceLine of contents.split(/\r?\n/)) {
      const line = sourceLine.trim();
      if (!line || line.startsWith("#")) continue;
      const match = line.match(/^export\s+([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i) ??
        line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
      if (!match || match[1] !== name) continue;
      const value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      )
        return value.slice(1, -1).trim();
      return value.replace(/\s+#.*$/, "").trim();
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return "";
}

const bggApiToken = await localEnvValue("BGG_API_TOKEN");
if (!bggApiToken) {
  console.warn(
    "BGG_API_TOKEN is not set; catalog cover images will be disabled.",
  );
}

await mkdir(join(outDir, "assets"), { recursive: true });

const exportedHtml = await readFile(join(root, "out/index.html"), "utf8");
const stylesheet = exportedHtml.match(
  /<link rel="stylesheet" href="([^"]+\.css)"[^>]*>/,
);

if (!stylesheet) {
  throw new Error("Could not find the exported Next.js stylesheet.");
}

const popupStylesheet = await readFile(
  join(root, "out", stylesheet[1].replace(/^\//, "")),
  "utf8",
);
const minifiedPopupStylesheet = await transform(popupStylesheet, {
  loader: "css",
  minify: true,
  legalComments: "none",
});
await writeFile(
  join(outDir, "assets/popup.css"),
  minifiedPopupStylesheet.code,
);

const extensionHtml = exportedHtml
  .replace(
    /<link rel="preload" href="\/_next\/[^"]+\.css" as="style"\/>/g,
    "",
  )
  .replace(stylesheet[0], '<link rel="stylesheet" href="/assets/popup.css"/>')
  .replace(
    /<script\b[^>]*\bsrc="\/_next\/[^"]+"[^>]*><\/script>/g,
    "",
  )
  .replace(
    /<script\b[^>]*\bid="__NEXT_DATA__"[^>]*>[\s\S]*?<\/script>/g,
    "",
  );

await writeFile(join(outDir, "index.html"), extensionHtml);

const lucideIconSet = JSON.parse(
  await readFile(
    join(root, "node_modules/@iconify-json/lucide/icons.json"),
    "utf8",
  ),
);
const selectedIconNames = [
  "bell",
  "chart-no-axes-column-increasing",
  "circle-check-big",
  "circle-chevron-right",
  "gift",
  "image",
  "life-buoy",
  "list-checks",
  "megaphone",
  "messages-square",
  "package",
  "package-plus",
  "refresh-cw",
  "shopping-cart",
  "square-arrow-out-up-right",
  "truck",
  "users-round",
];
const selectedIcons = Object.fromEntries(
  selectedIconNames.map((name) => {
    const icon = lucideIconSet.icons[name];
    if (!icon?.body) throw new Error(`Missing Iconify icon: ${name}`);
    return [name, icon.body];
  }),
);

await build({
  entryPoints: [join(root, "extension/content/index.ts")],
  bundle: true,
  format: "iife",
  target: "chrome120",
  outfile: join(outDir, "content/beautifier.js"),
  minify: true,
  sourcemap: false,
  legalComments: "none",
  define: {
    __OLWLG_ICONIFY_ICONS__: JSON.stringify(selectedIcons),
  },
});

await build({
  entryPoints: [join(root, "extension/background/index.ts")],
  bundle: true,
  format: "iife",
  target: "chrome120",
  outfile: join(outDir, "background.js"),
  minify: true,
  sourcemap: false,
  legalComments: "none",
  define: {
    __BGG_API_TOKEN__: JSON.stringify(bggApiToken),
  },
});

const assets = [
  ["extension/manifest.json", "manifest.json"],
  ["public/assets/powered-by-bgg.svg", "assets/powered-by-bgg.svg"],
  ["PRIVACY.md", "PRIVACY.md"],
  ["THIRD_PARTY_NOTICES.txt", "THIRD_PARTY_NOTICES.txt"],
];

for (const [source, destination] of assets) {
  const target = join(outDir, destination);
  await mkdir(dirname(target), { recursive: true });
  await cp(join(root, source), target);
}

const minifiedAssets = [
  ["public/popup.js", "popup.js", "js"],
];

for (const [source, destination, loader] of minifiedAssets) {
  const target = join(outDir, destination);
  const contents = await readFile(join(root, source), "utf8");
  const result = await transform(contents, {
    loader,
    minify: true,
    target: "chrome120",
    legalComments: "none",
  });
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, result.code);
}

await mkdir(join(outDir, "content"), { recursive: true });
await build({
  entryPoints: [join(root, "extension/content/styles/index.css")],
  bundle: true,
  outfile: join(outDir, "content/beautifier.css"),
  minify: true,
  target: "chrome120",
  legalComments: "none",
});

await cp(join(root, "extension/icons"), join(outDir, "icons"), {
  recursive: true,
});

const manifestPath = join(outDir, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const packageJson = JSON.parse(
  await readFile(join(root, "package.json"), "utf8"),
);
manifest.version = packageJson.version;
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
