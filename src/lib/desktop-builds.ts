import { APP_VERSION } from "@/lib/version";

export const DESKTOP_BUILDS = [
  {
    id: "windows",
    file: "Sisyphus-windows-x64.zip",
    label: `Windows · ${APP_VERSION}`,
    hint: "Unzip, then open Sisyphus.exe. If Windows warns, More info → Run anyway.",
  },
] as const;

export function desktopZipPath(file: string): string {
  return `/desktop/${file}`;
}

export function downloadDesktopZip(file: string) {
  const a = document.createElement("a");
  a.href = desktopZipPath(file);
  a.download = file;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
