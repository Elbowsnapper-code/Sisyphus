import { BIBLE_SECTION, isBackKind, isBibleKind, isMatterKind, type Doc } from "@/lib/types";
import { books } from "@/lib/tree";
import { desktopBridge } from "@/lib/desktop";
import { projectFolderFiles, safeName } from "@/lib/backup";

const DB = "sisyphus-backup";
const STORE = "kv";

type DirectoryHandle = {
  name: string;
  getFileHandle: (
    name: string,
    opts?: { create?: boolean },
  ) => Promise<{
    createWritable: () => Promise<{ write: (d: Blob | BufferSource) => Promise<void>; close: () => Promise<void> }>;
  }>;
  getDirectoryHandle: (name: string, opts?: { create?: boolean }) => Promise<DirectoryHandle>;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  if (typeof indexedDB === "undefined") return undefined;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    if (value === undefined) tx.objectStore(STORE).delete(key);
    else tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function defaultProjectsRoot(): Promise<string | null> {
  const desktop = desktopBridge();
  if (!desktop?.defaultProjectsRoot) return null;
  try {
    return await desktop.defaultProjectsRoot();
  } catch {
    return null;
  }
}

export async function chooseDirectory(
  title = "Choose folder",
  defaultPath?: string | null,
): Promise<{ ok: boolean; name?: string; path?: string; handle?: DirectoryHandle; reason?: string }> {
  const desktop = desktopBridge();
  if (desktop) {
    const fallback = defaultPath ?? (await defaultProjectsRoot());
    const folder = await desktop.chooseFolder(title, fallback ?? undefined);
    if (!folder) return { ok: false, reason: "cancelled" };
    const name = folder.split(/[/\\]/).filter(Boolean).pop() ?? folder;
    return { ok: true, name, path: folder };
  }
  const picker = (
    window as Window & {
      showDirectoryPicker?: (opts: { mode: string }) => Promise<DirectoryHandle>;
    }
  ).showDirectoryPicker;
  if (typeof picker !== "function") {
    return { ok: false, reason: "This browser cannot keep a folder open." };
  }
  try {
    const handle = await picker({ mode: "readwrite" });
    return { ok: true, name: handle.name, path: handle.name, handle };
  } catch (err) {
    const name = (err as { name?: string })?.name;
    if (name === "AbortError") return { ok: false, reason: "cancelled" };
    return { ok: false, reason: "Could not open that folder." };
  }
}

export async function rememberProjectHandle(projectId: string, handle: unknown) {
  await idbSet(`project-folder-${projectId}`, handle);
}

export async function rememberProjectPath(projectId: string, path: string) {
  await idbSet(`project-path-${projectId}`, path);
}

export async function renameProjectDirectory(
  oldPath: string | null | undefined,
  newTitle: string,
): Promise<string | null> {
  if (!oldPath) return null;
  const desktop = desktopBridge();
  if (!desktop?.renameDir) return null;
  try {
    return await desktop.renameDir(oldPath, safeName(newTitle));
  } catch {
    return null;
  }
}

export async function projectPathOf(projectId: string): Promise<string | null> {
  return (await idbGet<string>(`project-path-${projectId}`)) ?? null;
}

export async function bindProjectFolder(
  projectId: string,
  title = "Choose project folder",
): Promise<{ ok: boolean; name?: string; path?: string; reason?: string }> {
  const picked = await chooseDirectory(title);
  if (!picked.ok) return picked;
  const desktop = desktopBridge();
  if (desktop && picked.path) {
    await rememberProjectPath(projectId, picked.path);
    return picked;
  }
  if (picked.handle) {
    await rememberProjectHandle(projectId, picked.handle);
    return { ok: true, name: picked.name, path: picked.path };
  }
  return picked;
}

export async function makeProjectDirectory(
  projectTitle: string,
  parent?: { path?: string; handle?: DirectoryHandle },
): Promise<{ ok: boolean; path?: string; handle?: DirectoryHandle; name?: string; reason?: string }> {
  const leaf = safeName(projectTitle);
  const desktop = desktopBridge();
  if (desktop) {
    let parentPath = parent?.path;
    if (!parentPath) {
      const picked = await chooseDirectory("Where should this project live?");
      if (!picked.ok || !picked.path) return picked;
      parentPath = picked.path;
    }
    const dest = desktop.resolveIn ? await desktop.resolveIn(parentPath, leaf) : `${parentPath}/${leaf}`;
    return { ok: true, path: dest, name: leaf };
  }
  let handle = parent?.handle;
  if (!handle) {
    const picked = await chooseDirectory("Where should this project live?");
    if (!picked.ok) return picked;
    handle = picked.handle;
  }
  if (!handle?.getDirectoryHandle) return { ok: false, reason: "This browser cannot keep a folder open." };
  try {
    const nested = await handle.getDirectoryHandle(leaf, { create: true });
    return { ok: true, handle: nested, name: nested.name, path: nested.name };
  } catch {
    return { ok: false, reason: "Could not create that folder." };
  }
}

async function writeHandleTree(root: DirectoryHandle, relative: string, data: Uint8Array) {
  const parts = relative.split("/").filter(Boolean);
  const file = parts.pop();
  if (!file) return;
  let dir = root;
  for (const part of parts) {
    dir = await dir.getDirectoryHandle(part, { create: true });
  }
  const fh = await dir.getFileHandle(file, { create: true });
  const w = await fh.createWritable();
  await w.write(new Uint8Array(data));
  await w.close();
}

export async function writeProjectTree(
  docs: Record<string, Doc>,
  projectId: string,
  backupJson: string,
): Promise<boolean> {
  const project = docs[projectId];
  if (!project) return false;
  const files = projectFolderFiles(docs, projectId, backupJson, { nestedRoot: false });
  const desktop = desktopBridge();
  const folder = project.projectFolder || (await projectPathOf(projectId));
  if (desktop && folder) {
    try {
      for (const file of files) {
        const dest = desktop.resolveIn
          ? await desktop.resolveIn(folder, file.name)
          : await desktop.joinPath(folder, file.name);
        const copy = new Uint8Array(file.data);
        await desktop.writeFile(dest, copy.buffer as ArrayBuffer);
      }
      return true;
    } catch {
      return false;
    }
  }
  const handle = await idbGet<DirectoryHandle>(`project-folder-${projectId}`);
  if (!handle?.getDirectoryHandle) return false;
  try {
    for (const file of files) {
      await writeHandleTree(handle, file.name, file.data);
    }
    return true;
  } catch {
    return false;
  }
}

export function describeTree(docs: Record<string, Doc>, projectId: string): string {
  const names = new Set<string>();
  for (const book of books(docs, projectId)) names.add(`Manuscript/${book.title}`);
  for (const doc of Object.values(docs)) {
    if (doc.parentId !== projectId) continue;
    if (isMatterKind(doc.kind)) names.add(isBackKind(doc.kind) ? "Back Matter" : "Front Matter");
    if (isBibleKind(doc.kind)) names.add(BIBLE_SECTION[doc.kind]);
  }
  return [...names].sort().join(", ");
}

