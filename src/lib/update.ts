import { APP_VERSION } from "@/lib/version";

export const UPDATE_OWNER = "Elbowsnapper-code";
export const UPDATE_REPO = "Sisyphus";
export const UPDATE_BRANCH = "main";
export const UPDATE_UA = "Sisyphus";

export const UPDATE_REPO_URL = `https://github.com/${UPDATE_OWNER}/${UPDATE_REPO}`;
export const UPDATE_COMMITS_URL = `https://api.github.com/repos/${UPDATE_OWNER}/${UPDATE_REPO}/commits/${UPDATE_BRANCH}`;

export interface LatestFile {
  path: string;
}

export interface LatestInfo {
  version: string;
  notes?: string;
  files: LatestFile[];
  sha?: string;
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

export function rawUrl(rel: string, sha: string): string {
  return `https://raw.githubusercontent.com/${UPDATE_OWNER}/${UPDATE_REPO}/${sha}/${String(rel).replace(/^\/+/, "")}`;
}

export async function resolveHeadSha(): Promise<string> {
  const res = await fetch(UPDATE_COMMITS_URL, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": UPDATE_UA },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Could not reach the Sisyphus repository on GitHub");
  const data = (await res.json()) as { sha?: string };
  if (!data?.sha) throw new Error("GitHub did not return a version");
  return data.sha;
}

export async function fetchLatest(): Promise<LatestInfo> {
  const sha = await resolveHeadSha();
  const res = await fetch(rawUrl("latest.json", sha), {
    headers: { Accept: "application/json", "User-Agent": UPDATE_UA },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Could not reach the Sisyphus repository on GitHub");
  const data = (await res.json()) as LatestInfo;
  if (!data?.version) throw new Error("GitHub did not return a version");
  return { version: data.version, notes: data.notes, files: data.files ?? [], sha };
}

export function installedVersion(): string {
  return APP_VERSION;
}
