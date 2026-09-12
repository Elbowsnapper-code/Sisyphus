const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("sisyphusDesktop", {
  isDesktop: true,
  platform: process.platform,
  chooseFolder: (title, defaultPath) => ipcRenderer.invoke("sisyphus:choose-folder", title, defaultPath),
  writeFile: (filePath, bytes) => ipcRenderer.invoke("sisyphus:write-file", filePath, bytes),
  readFile: (filePath) => ipcRenderer.invoke("sisyphus:read-file", filePath),
  listDir: (folder) => ipcRenderer.invoke("sisyphus:list-dir", folder),
  joinPath: (folder, name) => ipcRenderer.invoke("sisyphus:join-path", folder, name),
  resolveIn: (folder, relative) => ipcRenderer.invoke("sisyphus:resolve-in", folder, relative),
  defaultProjectsRoot: () => ipcRenderer.invoke("sisyphus:default-projects-root"),
  renameDir: (from, newName) => ipcRenderer.invoke("sisyphus:rename-dir", from, newName),
  checkUpdate: () => ipcRenderer.invoke("sisyphus:check-update"),
  applyUpdate: () => ipcRenderer.invoke("sisyphus:apply-update"),
});
