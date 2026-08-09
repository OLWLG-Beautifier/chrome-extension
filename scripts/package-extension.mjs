import { execFile } from "node:child_process";
import { mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = process.cwd();
const distDir = join(root, "dist");
const releaseDir = join(root, "release");
const manifest = JSON.parse(
  await readFile(join(distDir, "manifest.json"), "utf8"),
);
const requiredManifestFields = [
  "manifest_version",
  "name",
  "version",
  "description",
  "icons",
];
for (const field of requiredManifestFields) {
  if (!manifest[field]) throw new Error(`Missing manifest field: ${field}`);
}
if (manifest.manifest_version !== 3)
  throw new Error("Chrome Web Store releases must use Manifest V3.");

await mkdir(releaseDir, { recursive: true });
const archive = join(
  releaseDir,
  `olwlg-beautifier-${manifest.version}-chrome-web-store.zip`,
);
await rm(archive, { force: true });
await run(
  "zip",
  ["-q", "-r", archive, ".", "-x", "*.DS_Store", "__MACOSX/*", "*.map"],
  { cwd: distDir },
);

const { stdout } = await run("unzip", ["-Z1", archive]);
const entries = stdout.trim().split("\n").filter(Boolean);
if (!entries.includes("manifest.json"))
  throw new Error("Packaged archive does not contain manifest.json at its root.");
if (entries.some((entry) => /(^|\/)\.DS_Store$|^__MACOSX\//.test(entry)))
  throw new Error("Packaged archive contains macOS metadata.");

console.log(`Created ${archive}`);

