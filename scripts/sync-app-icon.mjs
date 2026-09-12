#!/usr/bin/env node
/**
 * Rasterize public/favicon.svg into PNG + ICO used by Electron, Tauri, and the Windows exe.
 * If electron/icon-source.png exists (sculptural raster), it is used for the 256 px
 * Windows/Tauri icon; 16/32/48 stay the filled SVG so they stay crisp.
 * Run whenever the Sisyphus mark changes.
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync, unlinkSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = path.join(root, "public/favicon.svg");
const pngPath = path.join(root, "electron/icon.png");
const icoPath = path.join(root, "electron/icon.ico");
const sourcePath = path.join(root, "electron/icon-source.png");
const tauriPng = path.join(root, "src-tauri/icons/icon.png");

async function rasterize(size, dest) {
  const { chromium } = await import("playwright");
  const svg = readFileSync(svgPath, "utf8").replace("<svg", `<svg width="${size}" height="${size}"`);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${svg}</body></html>`,
    { waitUntil: "load" },
  );
  await page.screenshot({ path: dest, omitBackground: false });
  await browser.close();
}

function writeIco(pngs, dest) {
  const py = `
import struct, sys
blobs = []
for p in sys.argv[1:-1]:
    with open(p, "rb") as f:
        blobs.append(f.read())
count = len(blobs)
header = struct.pack("<HHH", 0, 1, count)
offset = 6 + 16 * count
entries = b""
payload = b""
for data in blobs:
    # PNG IHDR is at byte 16: width, height as uint32 BE
    w = struct.unpack(">I", data[16:20])[0]
    h = struct.unpack(">I", data[20:24])[0]
    entries += struct.pack("<BBBBHHII", 0 if w >= 256 else w, 0 if h >= 256 else h, 0, 0, 1, 32, len(data), offset)
    payload += data
    offset += len(data)
open(sys.argv[-1], "wb").write(header + entries + payload)
`;
  const tmp = pngs.map((p, i) => {
    const destPng = path.join(root, "electron", `_ico_${i}.png`);
    if (p !== destPng) {
      writeFileSync(destPng, readFileSync(p));
    }
    return destPng;
  });
  const result = spawnSync("python3", ["-c", py, ...tmp, dest], { stdio: "inherit" });
  if (result.status !== 0) throw new Error("ico write failed");
}

function resizePng(src, dest, size) {
  const result = spawnSync(
    "python3",
    [
      "-c",
      "from PIL import Image; import sys\n"
      + "im = Image.open(sys.argv[1]).convert('RGBA')\n"
      + "im.resize((int(sys.argv[3]), int(sys.argv[3])), Image.Resampling.LANCZOS).save(sys.argv[2])\n",
      src,
      dest,
      String(size),
    ],
    { stdio: "inherit" },
  );
  if (result.status !== 0) throw new Error("png resize failed");
}

async function main() {
  if (!existsSync(svgPath)) throw new Error("public/favicon.svg missing");
  mkdirSync(path.join(root, "electron"), { recursive: true });
  mkdirSync(path.join(root, "src-tauri/icons"), { recursive: true });
  if (existsSync(sourcePath)) {
    resizePng(sourcePath, pngPath, 256);
  } else {
    await rasterize(256, pngPath);
  }
  writeFileSync(tauriPng, readFileSync(pngPath));
  const tauriSvg = path.join(root, "src-tauri/icons/icon.svg");
  copyFileSync(svgPath, tauriSvg);
  const sizes = [16, 32, 48, 256];
  const files = [];
  for (const size of sizes) {
    const dest = path.join(root, "electron", `_ico_${size}.png`);
    if (size === 256 && existsSync(pngPath)) {
      copyFileSync(pngPath, dest);
    } else {
      await rasterize(size, dest);
    }
    files.push(dest);
  }
  writeIco(files, icoPath);
  for (const file of files) {
    try {
      unlinkSync(file);
    } catch {
      /* ignore */
    }
  }
  for (let i = 0; i < files.length; i++) {
    try {
      unlinkSync(path.join(root, "electron", `_ico_${i}.png`));
    } catch {
      /* ignore */
    }
  }
  console.log("Wrote", pngPath, icoPath, tauriPng, tauriSvg);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
