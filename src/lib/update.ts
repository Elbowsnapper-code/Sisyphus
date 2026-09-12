import { APP_VERSION } from "@/lib/version";

export const UPDATE_OWNER = "Elbowsnapper-code";
export const UPDATE_REPO = "Sisyphus";
export const UPDATE_BRANCH = "main";

export const UPDATE_LATEST_URL = `https://raw.githubusercontent.com/${UPDATE_OWNER}/${UPDATE_REPO}/${UPDATE_BRANCH}/latest.json`;
export const UPDATE_REPO_URL = `https://github.com/${UPDATE_OWNER}/${UPDATE_REPO}`;

export interface LatestFile {
  path: string;
}

export interface LatestInfo {
  version: string;
  notes?: string;
  files: LatestFile[];
}

export function versionAhead(remote: string, local: string): boolean {
  const parse = (v: string) =>
    String(v || "0")
      .split(".")
      .map((n) => parseInt(n, 10) || 0);
  const a = parse(remote);
  const b = parse(local);
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if ((a[i] ?? 0) > (b[i] ?? 0)) return true;
    if ((a[i] ?? 0) < (b[i] ?? 0)) return false;
  }
  return false;
}

export async function fetchLatest(): Promise<LatestInfo> {
  const res = await fetch(UPDATE_LATEST_URL, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Could not reach the Sisyphus repository on GitHub");
  const data = (await res.json()) as LatestInfo;
  if (!data?.version) throw new Error("GitHub did not return a version");
  return { version: data.version, notes: data.notes, files: data.files ?? [] };
}

export function installedVersion(): string {
  return APP_VERSION;
}
