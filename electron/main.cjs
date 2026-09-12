const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

app.setName("Sisyphus");
app.setAppUserModelId("app.sisyphus.desktop");

function rendererIndex() {
  return path.join(__dirname, "..", "renderer", "index.html");
}

function appIcon() {
  const ico = path.join(__dirname, "icon.ico");
  const png = path.join(__dirname, "icon.png");
  if (fs.existsSync(ico)) return ico;
  if (fs.existsSync(png)) return png;
  return undefined;
}

function sisyphusRoot() {
  const dir = path.join(app.getPath("home"), "Sisyphus");
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* still return the path so the picker can open there */
  }
  return dir;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#0c100e",
    title: "Sisyphus",
    icon: appIcon(),
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });

  win.once("ready-to-show", () => win.show());
  win.loadFile(rendererIndex());

  win.webContents.setWindowOpenHandler(({ url }) => {
    const isRenderer =
      url === "about:blank" ||
      url.startsWith("about:") ||
      (url.startsWith("file:") && (url.includes("index.html") || url.includes("renderer")));
    if (isRenderer) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          width: 1280,
          height: 820,
          minWidth: 720,
          minHeight: 480,
          backgroundColor: "#0c100e",
          title: "Sisyphus",
          icon: appIcon(),
          autoHideMenuBar: true,
          webPreferences: {
            preload: path.join(__dirname, "preload.cjs"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            spellcheck: true,
          },
        },
      };
    }
    void shell.openExternal(url);
    return { action: "deny" };
  });
}

function installMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    { role: "fileMenu" },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  installMenu();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("sisyphus:default-projects-root", async () => sisyphusRoot());

ipcMain.handle("sisyphus:choose-folder", async (_event, title, defaultPath) => {
  const result = await dialog.showOpenDialog({
    title: typeof title === "string" && title.trim() ? title.trim() : "Choose folder",
    defaultPath:
      typeof defaultPath === "string" && defaultPath.trim() ? defaultPath.trim() : sisyphusRoot(),
    properties: ["openDirectory", "createDirectory"],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return result.filePaths[0];
});

ipcMain.handle("sisyphus:write-file", async (_event, filePath, bytes) => {
  if (typeof filePath !== "string" || !filePath) throw new Error("Missing path");
  const resolved = path.resolve(filePath);
  await fs.promises.mkdir(path.dirname(resolved), { recursive: true });
  await fs.promises.writeFile(resolved, Buffer.from(bytes));
});

ipcMain.handle("sisyphus:read-file", async (_event, filePath) => {
  if (typeof filePath !== "string" || !filePath) throw new Error("Missing path");
  const buf = await fs.promises.readFile(path.resolve(filePath));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
});

ipcMain.handle("sisyphus:list-dir", async (_event, folder) => {
  if (typeof folder !== "string" || !folder) throw new Error("Missing folder");
  const names = await fs.promises.readdir(path.resolve(folder));
  return names;
});

ipcMain.handle("sisyphus:join-path", async (_event, folder, name) => {
  const base = String(folder || "");
  const leaf = path.basename(String(name || "backup.zip"));
  if (!base) throw new Error("Missing folder");
  return path.join(base, leaf);
});

ipcMain.handle("sisyphus:resolve-in", async (_event, folder, relative) => {
  const base = path.resolve(String(folder || ""));
  if (!base) throw new Error("Missing folder");
  const dest = path.resolve(base, String(relative || ""));
  const root = base.endsWith(path.sep) ? base : base + path.sep;
  if (dest !== base && !dest.startsWith(root)) throw new Error("Path not in folder");
  return dest;
});

ipcMain.handle("sisyphus:rename-dir", async (_event, from, newName) => {
  const src = path.resolve(String(from || ""));
  if (!src) throw new Error("Missing path");
  const leaf = path.basename(String(newName || "").trim() || "project");
  const dest = path.join(path.dirname(src), leaf);
  if (src === dest) return src;
  await fs.promises.rename(src, dest);
  return dest;
});

const UPDATE_OWNER = "Elbowsnapper-code";
const UPDATE_REPO = "Sisyphus";
const UPDATE_BRANCH = "main";
const UPDATE_UA = "Sisyphus-Desktop";

function latestUrl() {
  return `https://raw.githubusercontent.com/${UPDATE_OWNER}/${UPDATE_REPO}/${UPDATE_BRANCH}/latest.json`;
}

function fileUrl(rel) {
  return `https://raw.githubusercontent.com/${UPDATE_OWNER}/${UPDATE_REPO}/${UPDATE_BRANCH}/desktop-dist/${String(rel).replace(/^\/+/, "")}`;
}

function parseVersion(v) {
  return String(v || "0")
    .split(".")
    .map((n) => parseInt(n, 10) || 0);
}

function versionAhead(remote, local) {
  const a = parseVersion(remote);
  const b = parseVersion(local);
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if ((a[i] || 0) > (b[i] || 0)) return true;
    if ((a[i] || 0) < (b[i] || 0)) return false;
  }
  return false;
}

function currentVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
    return pkg.version || "0";
  } catch {
    return "0";
  }
}

async function fetchLatest() {
  const res = await fetch(latestUrl(), {
    headers: { "User-Agent": UPDATE_UA, Accept: "application/json" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error("Could not reach the Sisyphus repository on GitHub");
  const data = await res.json();
  if (!data || !data.version) throw new Error("GitHub did not return a version");
  return data;
}

ipcMain.handle("sisyphus:check-update", async () => {
  const current = currentVersion();
  try {
    const latest = await fetchLatest();
    return {
      ok: true,
      current,
      latest: { version: latest.version, notes: latest.notes },
      newer: versionAhead(latest.version, current),
    };
  } catch (err) {
    return { ok: false, current, error: err instanceof Error ? err.message : "Could not reach GitHub" };
  }
});

ipcMain.handle("sisyphus:apply-update", async () => {
  try {
    const latest = await fetchLatest();
    const files = Array.isArray(latest.files) ? latest.files : [];
    if (!files.length) throw new Error("Update list is empty");
    const renderer = path.join(__dirname, "..", "renderer");
    const tmp = path.join(app.getPath("temp"), "sisyphus-update");
    fs.rmSync(tmp, { recursive: true, force: true });
    fs.mkdirSync(tmp, { recursive: true });
    for (const file of files) {
      const rel = String(file.path || "").replace(/\\/g, "/").replace(/^\/+/, "");
      if (!rel || rel.includes("..")) continue;
      const res = await fetch(fileUrl(rel), { headers: { "User-Agent": UPDATE_UA }, redirect: "follow" });
      if (!res.ok) throw new Error(`Could not download ${rel}`);
      const dest = path.join(tmp, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    }
    const assets = path.join(renderer, "assets");
    if (fs.existsSync(assets)) fs.rmSync(assets, { recursive: true, force: true });
    fs.mkdirSync(renderer, { recursive: true });
    fs.cpSync(tmp, renderer, { recursive: true });
    try {
      const pkgPath = path.join(__dirname, "..", "package.json");
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      pkg.version = latest.version;
      fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
    } catch {
      /* packaged json is optional */
    }
    setImmediate(() => {
      for (const win of BrowserWindow.getAllWindows()) win.reload();
    });
    return { ok: true, version: latest.version };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Update failed" };
  }
});
