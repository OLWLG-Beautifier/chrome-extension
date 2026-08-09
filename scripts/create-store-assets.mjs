import { copyFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const assetsDir = join(root, "store-assets");
const promoSource = join(assetsDir, "promo-small-440x280.svg");
const promoTarget = join(assetsDir, "promo-small-440x280.png");
const iconSource = join(root, "extension/icons/icon-128.png");
const iconTarget = join(assetsDir, "icon-128.png");

await mkdir(join(assetsDir, "screenshots"), { recursive: true });
await sharp(await readFile(promoSource))
  .resize(440, 280, { fit: "fill" })
  .png({ compressionLevel: 9, palette: true })
  .toFile(promoTarget);
await copyFile(iconSource, iconTarget);

const requiredDimensions = [
  [iconTarget, 128, 128],
  [promoTarget, 440, 280],
];
for (const [path, expectedWidth, expectedHeight] of requiredDimensions) {
  const metadata = await sharp(path).metadata();
  if (
    metadata.width !== expectedWidth ||
    metadata.height !== expectedHeight
  ) {
    throw new Error(
      `${path} is ${metadata.width}x${metadata.height}; expected ${expectedWidth}x${expectedHeight}.`,
    );
  }
}

console.log("Chrome Web Store icon and promotional tile are ready.");

