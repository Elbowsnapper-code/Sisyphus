import { ingestFile, INGEST_ACCEPT, type IngestPiece } from "@/lib/ingest";
import { chooseDirectory, rememberProjectPath } from "@/lib/folders";
import { desktopBridge } from "@/lib/desktop";
import { isProjectBackup, type ProjectBackup } from "@/lib/types";
import { unzip } from "@/lib/zip";
import { useStudio } from "@/lib/store";

export { INGEST_ACCEPT };

export type BringInResult =
  | { kind: "cancelled" }
  | { kind: "error"; message: string }
  | { kind: "backup"; backup: ProjectBackup; folder?: string }
  | { kind: "pieces"; pieces: IngestPiece[]; name: string };

async function parseBackupText(text: string): Promise<ProjectBackup | null> {
  try {
    const data = JSON.parse(text) as unknown;
    return isProjectBackup(data) ? data : null;
  } catch {
    return null;
  }
}

async function backupFromZip(buf: ArrayBuffer): Promise<ProjectBackup | null> {
  try {
    const files = await unzip(buf);
    const hit = files.find((f) => /project\.sisyphus\.json$|\.sisyphus\.json$/i.test(f.name));
    if (!hit) return null;
    return parseBackupText(new TextDecoder().decode(hit.data));
  } catch {
    return null;
  }
}

async function readProjectJsonFromFolder(folder: string): Promise<string | null> {
  const desktop = desktopBridge();
  if (!desktop?.readFile) return null;
  const join = desktop.resolveIn ?? ((base: string, rel: string) => desktop.joinPath(base, rel));
  const tryNames = ["project.sisyphus.json"];
  try {
    const names = desktop.listDir ? await desktop.listDir(folder) : [];
    for (const name of names) {
      if (/\.sisyphus\.json$/i.test(name) && !tryNames.includes(name)) tryNames.push(name);
    }
  } catch {
    /* list not available */
  }
  for (const name of tryNames) {
    try {
      const dest = await join(folder, name);
      const bytes = await desktop.readFile(dest);
      return new TextDecoder().decode(bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes);
    } catch {
      /* try next */
    }
  }
  return null;
}

export async function openProjectFromDisk(projectsRoot?: string | null): Promise<BringInResult> {
  const picked = await chooseDirectory("Open a Sisyphus project", projectsRoot);
  if (!picked.ok) {
    if (picked.reason === "cancelled") return { kind: "cancelled" };
    return { kind: "error", message: picked.reason || "Could not open that folder." };
  }
  if (picked.path) {
    const text = await readProjectJsonFromFolder(picked.path);
    if (text) {
      const backup = await parseBackupText(text);
      if (backup) return { kind: "backup", backup, folder: picked.path };
    }
  }
  if (picked.handle) {
    const text = await readJsonFromHandle(picked.handle as never);
    if (text) {
      const backup = await parseBackupText(text);
      if (backup) return { kind: "backup", backup, folder: picked.path };
    }
  }
  return { kind: "error", message: "That folder does not contain a Sisyphus project." };
}

async function readJsonFromHandle(handle: {
  getFileHandle: (name: string) => Promise<{ getFile?: () => Promise<File> }>;
  values?: () => AsyncIterable<{ kind?: string; name: string; getFile?: () => Promise<File> }>;
}): Promise<string | null> {
  try {
    const fh = await handle.getFileHandle("project.sisyphus.json");
    const file = await fh.getFile?.();
    if (file) return file.text();
  } catch {
    /* continue */
  }
  if (!handle.values) return null;
  for await (const entry of handle.values()) {
    if (entry.kind === "file" && /\.sisyphus\.json$/i.test(entry.name)) {
      const file = await entry.getFile?.();
      if (file) return file.text();
    }
  }
  return null;
}

export async function bringInFiles(files: File[]): Promise<BringInResult> {
  if (!files.length) return { kind: "cancelled" };
  const pieces: IngestPiece[] = [];
  let name = files[0]?.name.replace(/\.[^.]+$/, "") || "Imported";
  for (const file of files) {
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".json") || lower.endsWith(".sisyphus.json") || lower.endsWith(".quire.json")) {
      const backup = await parseBackupText(await file.text());
      if (backup) return { kind: "backup", backup };
      return { kind: "error", message: "That JSON is not a Sisyphus project." };
    }
    if (lower.endsWith(".zip")) {
      const fromZip = await backupFromZip(await file.arrayBuffer());
      if (fromZip) return { kind: "backup", backup: fromZip };
    }
    const next = await ingestFile(file);
    pieces.push(...next);
  }
  if (!pieces.length) return { kind: "error", message: "Nothing readable in that file." };
  return { kind: "pieces", pieces, name };
}

export async function bindOpenedFolder(projectId: string, folder?: string) {
  if (folder) await rememberProjectPath(projectId, folder);
}

export async function applyBringIn(result: BringInResult): Promise<{ ok: boolean; message: string }> {
  if (result.kind === "cancelled") return { ok: false, message: "" };
  if (result.kind === "error") return { ok: false, message: result.message };
  const s = useStudio.getState();
  if (result.kind === "backup") {
    s.importProject(result.backup);
    const id = useStudio.getState().currentProjectId;
    if (result.folder) {
      useStudio.getState().patchProject({ projectFolder: result.folder });
      await rememberProjectPath(id, result.folder);
    }
    const title = useStudio.getState().docs[id]?.title ?? "project";
    return { ok: true, message: `Opened ${title}` };
  }
  s.createProject(result.name);
  useStudio.getState().ingestPieces(result.pieces);
  return { ok: true, message: `Imported ${result.pieces.length} items into ${result.name}` };
}
