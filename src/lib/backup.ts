import { BIBLE_KINDS, BIBLE_SECTION, LIBRARY_KINDS, isBackKind, isBibleKind, isMatterKind, type Doc } from "@/lib/types";
import { books, childrenOf } from "@/lib/tree";
import { htmlToPlain } from "@/lib/text";
import { slugify } from "@/lib/utils";
import { zipFiles } from "@/lib/zip";
import { sheetOf } from "@/lib/entities";
import { desktopBridge } from "@/lib/desktop";

const DB = "sisyphus-backup";
const STORE = "kv";
const HANDLE_KEY = "folder";
const FOLDER_PATH_KEY = "folder-path";
const SNAPS_KEY = "snaps";
const MAX_SNAPS = 5;

export interface BackupSnap {
  id: string;
  name: string;
  at: number;
  bytes: number;
}

type DirectoryHandle = {
  name: string;
  getFileHandle: (name: string, opts?: { create?: boolean }) => Promise<{
    createWritable: () => Promise<{ write: (d: Blob) => Promise<void>; close: () => Promise<void> }>;
  }>;
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

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function textFile(path: string, text: string): { name: string; data: Uint8Array } {
  return { name: path, data: new TextEncoder().encode(text) };
}

function sheetNotes(doc: Doc): string {
  const s = sheetOf(doc);
  const lines: string[] = [`# ${doc.title}`, ""];
  if (s.summary) lines.push(s.summary, "");
  const extras: [string, string][] = [
    ["Type", s.polityType || s.worldType || s.groupType],
    ["Region", s.region],
    ["Climate", s.climate],
    ["Population", s.population],
    ["Ruler", s.ruler],
    ["Allegiance", s.allegiance],
    ["Seat", s.seat],
    ["Pantheon", s.pantheon],
    ["Tenets", s.tenets],
    ["Speakers", s.speakers],
    ["Script", s.script],
    ["Nature", s.nature],
    ["Origin", s.origin],
    ["Age", s.age],
    ["Sex", s.sex],
    ["Birthplace", s.birthplace],
    ["Appearance", s.appearance],
    ["Attributes", s.attributes],
    ["Strengths", s.strengths],
    ["Weaknesses", s.weaknesses],
    ["Best suited for", s.vocation],
    ["Habitat", s.habitat],
    ["Behavior", s.behavior],
    ["Exports", s.exports],
    ["Imports", s.imports],
    ["Landmarks", s.landmarks],
    ["Notable people", s.notablePeople],
    ["Shops", s.shops],
    ["Also known as", s.aliases],
  ];
  for (const [label, value] of extras) {
    if (value) lines.push(`${label}: ${value}`);
  }
  const notes = htmlToPlain(doc.content);
  if (notes) lines.push("", notes);
  return lines.join("\n").trim() + "\n";
}

export function safeName(value: string): string {
  return value.replace(/[<>:"/\\|?*]/g, "-").trim() || "untitled";
}

export function projectFolderFiles(
  docs: Record<string, Doc>,
  projectId: string,
  backupJson: string,
  opts?: { nestedRoot?: boolean },
): { name: string; data: Uint8Array }[] {
  const project = docs[projectId];
  const root = opts?.nestedRoot === false ? "" : safeName(project?.title || "project") + "/";
  const files: { name: string; data: Uint8Array }[] = [
    textFile(`${root}project.sisyphus.json`, backupJson),
    textFile(
      `${root}README.txt`,
      `${project?.title || "Project"}\n\nThis folder is the on-disk copy of the Sisyphus project.\nScenes, chapters, and library sheets are plain text so you can open them anywhere.\nproject.sisyphus.json is the file to import back into the studio.\n`,
    ),
  ];

  let hasFront = false;
  let hasBack = false;
  for (const doc of Object.values(docs).filter((d) => d.parentId === projectId && isMatterKind(d.kind))) {
    const folder = isBackKind(doc.kind) ? "Back Matter" : "Front Matter";
    if (isBackKind(doc.kind)) hasBack = true;
    else hasFront = true;
    if (doc.kind === "cover" && doc.coverImage?.startsWith("data:")) {
      const bin = dataUrlToBytes(doc.coverImage);
      if (bin) files.push({ name: `${root}${folder}/Cover.${bin.ext}`, data: bin.data });
      continue;
    }
    files.push(textFile(`${root}${folder}/${safeName(doc.title)}.txt`, htmlToPlain(doc.content) + "\n"));
  }
  if (!hasFront) files.push(textFile(`${root}Front Matter/.keep`, ""));
  if (!hasBack) files.push(textFile(`${root}Back Matter/.keep`, ""));

  const bookList = books(docs, projectId);
  if (!bookList.length) files.push(textFile(`${root}Manuscript/.keep`, ""));
  for (const book of bookList) {
    const chapters = childrenOf(docs, book.id).filter((d) => d.kind === "chapter");
    if (!chapters.length) {
      files.push(textFile(`${root}Manuscript/${safeName(book.title)}/.keep`, ""));
    }
    for (const chapter of chapters) {
      const scenes = childrenOf(docs, chapter.id).filter((d) => d.kind === "scene");
      if (!scenes.length) {
        files.push(
          textFile(`${root}Manuscript/${safeName(book.title)}/${safeName(chapter.title)}/.keep`, ""),
        );
      }
      for (const scene of scenes) {
        files.push(
          textFile(
            `${root}Manuscript/${safeName(book.title)}/${safeName(chapter.title)}/${safeName(scene.title)}.txt`,
            htmlToPlain(scene.content) + "\n",
          ),
        );
      }
    }
  }

  const filledLibs = new Set<string>();
  for (const doc of Object.values(docs)) {
    if (doc.parentId !== projectId || !isBibleKind(doc.kind)) continue;
    const lib = BIBLE_SECTION[doc.kind];
    filledLibs.add(doc.kind);
    files.push(textFile(`${root}${lib}/${safeName(doc.title)}.txt`, sheetNotes(doc)));
  }
  for (const kind of LIBRARY_KINDS) {
    if (filledLibs.has(kind)) continue;
    files.push(textFile(`${root}${BIBLE_SECTION[kind]}/.keep`, ""));
  }
  for (const kind of BIBLE_KINDS) {
    if ((LIBRARY_KINDS as readonly string[]).includes(kind)) continue;
    if (!filledLibs.has(kind)) continue;
    files.push(textFile(`${root}${BIBLE_SECTION[kind]}/.keep`, ""));
  }

  const trackers = project?.trackers ?? [];
  if (!trackers.length) files.push(textFile(`${root}Lookups/.keep`, ""));
  for (const tracker of trackers) {
    const name = safeName(tracker.query.trim() || tracker.name || "lookup");
    const body = [`# ${tracker.query.trim() || tracker.name}`, "", tracker.notes ?? ""].join("\n").trim() + "\n";
    files.push(textFile(`${root}Lookups/${name}.txt`, body));
  }

  const timeline = project?.timeline;
  if (timeline?.world.length) {
    const lines = timeline.world.map((ev) => {
      const when = [ev.date.age, ev.date.year, ev.date.month, ev.date.day].filter(Boolean).join(" / ");
      return `- ${ev.title}${when ? ` (${when})` : ""}${ev.notes ? `\n  ${ev.notes}` : ""}`;
    });
    files.push(textFile(`${root}Timeline/World.txt`, lines.join("\n") + "\n"));
  }
  const schematic = project?.schematic;
  const worldList = schematic?.world?.length
    ? schematic.world
    : (timeline?.world ?? []).map((ev) => ({ title: ev.title, date: ev.date, body: ev.notes ?? "" }));
  if (schematic && (schematic.brief || schematic.events || schematic.sparks.length)) {
    const sparks = schematic.sparks.map((s) => `## ${s.title}\n${s.body}`).join("\n\n");
    files.push(
      textFile(
        `${root}Schematic/Brief.txt`,
        [schematic.brief, schematic.events && `Events\n${schematic.events}`, sparks].filter(Boolean).join("\n\n") + "\n",
      ),
    );
  }
  if (worldList.length) {
    const lines = worldList.map((ev) => {
      const when = [ev.date.age, ev.date.year, ev.date.month, ev.date.day].filter(Boolean).join(" / ");
      return `- ${ev.title}${when ? ` (${when})` : ""}${ev.body ? `\n  ${ev.body}` : ""}`;
    });
    files.push(textFile(`${root}Schematic/World Timeline.txt`, lines.join("\n") + "\n"));
  }
  if (schematic?.preStory?.length || schematic?.afterStory?.length) {
    const block = (title: string, items: { title: string; date: { age: string; year: string; month: string; day: string }; body: string }[]) => {
      if (!items.length) return "";
      return [
        `# ${title}`,
        ...items.map((ev) => {
          const when = [ev.date.age, ev.date.year, ev.date.month, ev.date.day].filter(Boolean).join(" / ");
          return `- ${ev.title}${when ? ` (${when})` : ""}${ev.body ? `\n  ${ev.body}` : ""}`;
        }),
      ].join("\n");
    };
    files.push(
      textFile(
        `${root}Schematic/Protagonist Timeline.txt`,
        [block("Pre-story", schematic.preStory ?? []), block("After the story", schematic.afterStory ?? [])]
          .filter(Boolean)
          .join("\n\n") + "\n",
      ),
    );
  }
  if (!schematic?.brief && !schematic?.events && !schematic?.sparks.length && !worldList.length) {
    files.push(textFile(`${root}Schematic/.keep`, ""));
  }

  return files;
}

function dataUrlToBytes(url: string): { data: Uint8Array; ext: string } | null {
  const m = /^data:([^;]+);base64,(.+)$/.exec(url);
  if (!m) return null;
  const mime = m[1];
  const bin = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
  const ext = mime.includes("png") ? "png" : mime.includes("jpeg") || mime.includes("jpg") ? "jpg" : "png";
  return { data: bin, ext };
}

async function writeToFolder(handle: DirectoryHandle, filename: string, blob: Blob): Promise<boolean> {
  try {
    const file = await handle.getFileHandle(filename, { create: true });
    const writable = await file.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  } catch {
    return false;
  }
}

export async function chooseBackupFolder(): Promise<{ ok: boolean; name?: string; path?: string; reason?: string }> {
  const desktop = desktopBridge();
  if (desktop) {
    const folder = await desktop.chooseFolder("Choose backup folder");
    if (!folder) return { ok: false, reason: "cancelled" };
    await idbSet(FOLDER_PATH_KEY, folder);
    const name = folder.split(/[/\\]/).filter(Boolean).pop() ?? folder;
    return { ok: true, name, path: folder };
  }
  const picker = (
    window as Window & {
      showDirectoryPicker?: (opts: { mode: string }) => Promise<DirectoryHandle>;
    }
  ).showDirectoryPicker;
  if (typeof picker !== "function") {
    return { ok: false, reason: "This browser cannot keep a folder open. Backups will download instead." };
  }
  try {
    const handle = await picker({ mode: "readwrite" });
    await idbSet(HANDLE_KEY, handle);
    return { ok: true, name: handle.name };
  } catch (err) {
    const name = (err as { name?: string })?.name;
    if (name === "AbortError") return { ok: false, reason: "cancelled" };
    return { ok: false, reason: "Could not open that folder." };
  }
}

export async function backupFolderName(): Promise<string | null> {
  const desktop = desktopBridge();
  if (desktop) {
    const path = await idbGet<string>(FOLDER_PATH_KEY);
    if (!path) return null;
    return path.split(/[/\\]/).filter(Boolean).pop() ?? path;
  }
  const handle = await idbGet<DirectoryHandle>(HANDLE_KEY);
  return handle?.name ?? null;
}

export async function backupFolderPath(): Promise<string | null> {
  return (await idbGet<string>(FOLDER_PATH_KEY)) ?? null;
}

export async function listSnaps(): Promise<BackupSnap[]> {
  return (await idbGet<BackupSnap[]>(SNAPS_KEY)) ?? [];
}

export async function loadSnapBlob(id: string): Promise<Blob | null> {
  return (await idbGet<Blob>(`blob-${id}`)) ?? null;
}

export async function createProjectBackup(args: {
  projectTitle: string;
  backupJson: string;
  docs: Record<string, Doc>;
  projectId: string;
  silent?: boolean;
}): Promise<{ filename: string; where: "folder" | "download" | "browser"; folderName?: string }> {
  const files = projectFolderFiles(args.docs, args.projectId, args.backupJson);
  const blob = await zipFiles(files);
  const filename = `${slugify(args.projectTitle)}-${stamp()}.sisyphus.zip`;

  const id = `${Date.now()}`;
  const snap: BackupSnap = { id, name: filename, at: Date.now(), bytes: blob.size };
  const prev = ((await idbGet<BackupSnap[]>(SNAPS_KEY)) ?? []).slice(0, MAX_SNAPS - 1);
  await idbSet(SNAPS_KEY, [snap, ...prev]);
  await idbSet(`blob-${id}`, blob);

  const desktop = desktopBridge();
  if (desktop) {
    const folder = await idbGet<string>(FOLDER_PATH_KEY);
    if (folder) {
      try {
        const dest = await desktop.joinPath(folder, filename);
        await desktop.writeFile(dest, await blob.arrayBuffer());
        const name = folder.split(/[/\\]/).filter(Boolean).pop() ?? folder;
        return { filename, where: "folder", folderName: name };
      } catch {
        /* fall through to download unless silent */
      }
    }
    if (args.silent) return { filename, where: "browser" };
  }

  const handle = await idbGet<DirectoryHandle>(HANDLE_KEY);
  if (handle) {
    const written = await writeToFolder(handle, filename, blob);
    if (written) return { filename, where: "folder", folderName: handle.name };
  }

  if (args.silent) return { filename, where: "browser" };

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return { filename, where: "download" };
}
