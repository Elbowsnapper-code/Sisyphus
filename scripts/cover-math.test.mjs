import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const src = readFileSync(new URL("../src/lib/cover.ts", import.meta.url), "utf8");

test("cover.ts keeps Amazon’s published paper thickness", () => {
  assert.match(src, /bleedIn: 0\.125/);
  assert.match(src, /bleedMm: 3\.2/);
  assert.match(src, /spineSafeIn: 0\.0625/);
  assert.match(src, /barcodeWIn: 2/);
  assert.match(src, /barcodeHIn: 1\.2/);
  assert.match(src, /barcodeInsetIn: 0\.25/);
  assert.match(src, /spineTextMinPages: 79/);
  assert.match(src, /minPages: 24/);
  assert.match(src, /cream: 776/);
  assert.match(src, /white: 828/);
  assert.match(src, /cream: 0\.0025/);
  assert.match(src, /white: 0\.002252/);
  assert.match(src, /"premium-color": 0\.002347/);
  assert.match(src, /cream: 0\.0635/);
  assert.match(src, /ebookW: 1600/);
  assert.match(src, /ebookH: 2560/);
});

test("Amazon wrap formula for 6×9 cream 300 pages", () => {
  const bleed = 0.125;
  const trimW = 6;
  const trimH = 9;
  const spine = 300 * 0.0025;
  const width = bleed + trimW + spine + trimW + bleed;
  const height = bleed + trimH + bleed;
  assert.equal(spine, 0.75);
  assert.equal(width, 13);
  assert.equal(height, 9.25);
  const barcodeXFromSpine = 0.25;
  const barcodeYFromBottom = 0.25;
  const backRight = bleed + trimW;
  const barcodeRight = backRight - barcodeXFromSpine;
  const barcodeW = 2;
  const barcodeH = 1.2;
  const barcodeX = barcodeRight - barcodeW;
  const bottomTrim = bleed + trimH;
  const barcodeY = bottomTrim - barcodeYFromBottom - barcodeH;
  assert.equal(barcodeX, bleed + trimW - 0.25 - 2);
  assert.equal(barcodeY, bleed + trimH - 0.25 - 1.2);
});
