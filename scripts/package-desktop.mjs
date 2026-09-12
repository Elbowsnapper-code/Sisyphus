#!/usr/bin/env node
/**
 * Build the client-only Sisyphus renderer and wrap it in portable Electron zips.
 * Downloads official Electron binaries (no native compile). Unsigned test builds.
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ELECTRON_VERSION = "44.2.0";
const TARGETS = [
  { id: "windows-x64", platform: "win32", arch: "x64", zipName: "Sisyphus-windows-x64.zip" },
  { id: "mac-arm64", platform: "darwin", arch: "arm64", zipName: "Sisyphus-mac-arm64.zip" },
  { id: "mac-x64", platform: "darwin", arch: "x64", zipName: "Sisyphus-mac-x64.zip" },
  { id: "linux-x64", platform: "linux", arch: "x64", zipName: "Sisyphus-linux-x64.zip" },
];

function run(cmd, args, cwd = root) {
  const result = spawnSync(cmd, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed (${result.status})`);
  }
}

async function download(url, dest) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "sisyphus-desktop-packager" },
  });
  if (!res.ok) throw new Error(`Download failed ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
}

function zipDir(sourceDir, destZip) {
  if (existsSync(destZip)) rmSync(destZip);
  const base = destZip.replace(/\.zip$/i, "");
  run("python3", ["-c", "import shutil, sys; shutil.make_archive(sys.argv[1], 'zip', sys.argv[2])", base, sourceDir]);
}

const README = `Sisyphus — desktop test build
================================

This is an unsigned Electron build of the current Sisyphus writing studio,
for finding issues on a real computer. It is not a signed store release.

Windows
  Unzip. Open Sisyphus.exe. If Windows warns, More info → Run anyway.

Mac
  Unzip. Right-click Sisyphus.app → Open (Gatekeeper will warn because
  the app is unsigned). Apple silicon: use the mac-arm64 zip. Intel: mac-x64.

Linux
  Unzip. Run ./sisyphus (or ./Sisyphus). You may need:
  chmod +x sisyphus

Your novel stays on this computer. Project → New project asks where the
folder should live, then writes Manuscript, Character Library, and the rest
as text files. Preferences holds the backup folder and this project’s folder.
Save → Manual backup zips that whole tree.

Work in the web studio and this desktop app do not share storage unless you
import a .sisyphus.json or backup zip.
`;

function writeAppPayload(appDir) {
  mkdirSync(appDir, { recursive: true });
  writeFileSync(
    path.join(appDir, "package.json"),
    JSON.stringify(
      {
        name: "sisyphus",
        productName: "Sisyphus",
        version: "1.11.0",
        private: true,
        main: "electron/main.cjs",
        description: "A local-first novel studio.",
      },
      null,
      2,
    ),
  );
  mkdirSync(path.join(appDir, "electron"), { recursive: true });
  copyFileSync(path.join(root, "electron/main.cjs"), path.join(appDir, "electron/main.cjs"));
  copyFileSync(path.join(root, "electron/preload.cjs"), path.join(appDir, "electron/preload.cjs"));
  for (const name of ["icon.ico", "icon.png"]) {
    const src = path.join(root, "electron", name);
    if (existsSync(src)) copyFileSync(src, path.join(appDir, "electron", name));
  }
  cpSync(path.join(root, "desktop-dist"), path.join(appDir, "renderer"), { recursive: true });
  writeFileSync(path.join(appDir, "README.txt"), README);
}

async function stampWindowsIcon(exePath, icoPath) {
  if (!existsSync(exePath) || !existsSync(icoPath)) {
    console.warn("Skipping exe icon stamp — missing", exePath, icoPath);
    return;
  }
  const ResEdit = await import("resedit");
  const exe = ResEdit.NtExecutable.from(readFileSync(exePath), { ignoreCert: true });
  const res = ResEdit.NtExecutableResource.from(exe);
  const iconFile = ResEdit.Data.IconFile.from(readFileSync(icoPath));
  const icons = iconFile.icons.map((item) => item.data);
  const groups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
  if (groups.length) {
    for (const group of groups) {
      ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, group.id, group.lang, icons);
    }
  } else {
    ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, 1, 1033, icons);
  }
  const version = "1.11.0";
  const [maj, min, pat] = version.split(".").map((n) => Number(n) || 0);
  const versionInfos = ResEdit.Resource.VersionInfo.fromEntries(res.entries);
  for (const vi of versionInfos) {
    vi.fixedInfo.fileVersionMS = ((maj & 0xffff) << 16) | (min & 0xffff);
    vi.fixedInfo.fileVersionLS = ((pat & 0xffff) << 16);
    vi.fixedInfo.productVersionMS = vi.fixedInfo.fileVersionMS;
    vi.fixedInfo.productVersionLS = vi.fixedInfo.fileVersionLS;
    const langs = vi.getAllLanguagesForStringValues();
    const lang = langs[0] ?? { lang: 1033, codepage: 1200 };
    vi.setStringValues(lang, {
      FileDescription: "Sisyphus",
      ProductName: "Sisyphus",
      ProductVersion: version,
      FileVersion: version,
      OriginalFilename: "Sisyphus.exe",
      InternalName: "Sisyphus",
      CompanyName: "Elbowsnapper",
      LegalCopyright: "Elbowsnapper",
    });
    vi.outputToResourceEntries(res.entries);
  }
  res.outputResource(exe, true);
  writeFileSync(exePath, Buffer.from(exe.generate()));
  console.log("Stamped Sisyphus.exe icon and version", version);
}

function patchMacPlist(appPath) {
  const plist = path.join(appPath, "Contents/Info.plist");
  if (!existsSync(plist)) return;
  let text = readFileSync(plist, "utf8");
  text = text.replace(/<string>Electron<\/string>/g, "<string>Sisyphus</string>");
  text = text.replace(/<string>com\.github\.Electron<\/string>/g, "<string>app.sisyphus.desktop</string>");
  writeFileSync(plist, text);
}

async function packageTarget(target, cacheDir, outDir) {
  const artifact = `electron-v${ELECTRON_VERSION}-${target.platform}-${target.arch}.zip`;
  const url = `https://github.com/electron/electron/releases/download/v${ELECTRON_VERSION}/${artifact}`;
  const zipPath = path.join(cacheDir, artifact);
  if (!existsSync(zipPath)) {
    console.log(`Downloading ${artifact}…`);
    await download(url, zipPath);
  }
  const extract = mkdtempSync(path.join(tmpdir(), `sisyphus-${target.id}-`));
  run("unzip", ["-q", zipPath, "-d", extract]);

  if (target.platform === "darwin") {
    const appPath = path.join(extract, "Electron.app");
    const destApp = path.join(extract, "Sisyphus.app");
    run("mv", [appPath, destApp]);
    writeAppPayload(path.join(destApp, "Contents/Resources/app"));
    patchMacPlist(destApp);
  } else if (target.platform === "win32") {
    const exe = path.join(extract, "electron.exe");
    const destExe = path.join(extract, "Sisyphus.exe");
    if (existsSync(exe)) run("mv", [exe, destExe]);
    writeAppPayload(path.join(extract, "resources/app"));
    writeFileSync(path.join(extract, "README.txt"), README);
    const ico = path.join(root, "electron/icon.ico");
    if (existsSync(ico)) copyFileSync(ico, path.join(extract, "Sisyphus.ico"));
    await stampWindowsIcon(destExe, ico);
  } else {
    const bin = path.join(extract, "electron");
    if (existsSync(bin)) run("mv", [bin, path.join(extract, "sisyphus")]);
    writeAppPayload(path.join(extract, "resources/app"));
    writeFileSync(path.join(extract, "README.txt"), README);
    try {
      run("chmod", ["+x", path.join(extract, "sisyphus")]);
    } catch {
      /* ignore */
    }
  }

  const destZip = path.join(outDir, target.zipName);
  console.log(`Zipping ${target.zipName}…`);
  zipDir(extract, destZip);
  rmSync(extract, { recursive: true, force: true });
  return destZip;
}

async function main() {
  console.log("Rasterizing app icon from public/favicon.svg…");
  run("node", [path.join(root, "scripts/sync-app-icon.mjs")]);
  console.log("Building desktop renderer…");
  run("npm", ["run", "desktop:build"]);
  if (!existsSync(path.join(root, "desktop-dist/index.html"))) {
    throw new Error("desktop-dist/index.html missing after build");
  }

  const cacheDir = path.join(root, ".cache/electron");
  mkdirSync(cacheDir, { recursive: true });
  const artifactsDir = path.join(root, "artifacts/desktop");
  mkdirSync(artifactsDir, { recursive: true });

  const only = process.argv[2];
  const selected = only ? TARGETS.filter((t) => t.id === only || t.platform === only) : TARGETS;
  if (!selected.length) throw new Error(`Unknown target ${only}`);

  for (const target of selected) {
    const zip = await packageTarget(target, cacheDir, artifactsDir);
    console.log(`Wrote ${zip}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
