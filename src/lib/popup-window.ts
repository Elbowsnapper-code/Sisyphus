import { useStudio } from "@/lib/store";
import { desktopBridge } from "@/lib/desktop";

type ScreenLike = {
  availLeft: number;
  availTop: number;
  availWidth: number;
  availHeight: number;
  isPrimary?: boolean;
};

export async function openBookPreview(): Promise<"external" | "split"> {
  const opened = await tryOpenPopup(previewHref(), "sisyphus-book-preview");
  if (opened) return "external";
  useStudio.getState().togglePreview();
  return "split";
}

export async function openSeriesDashboard(): Promise<"external" | "overlay"> {
  const opened = await tryOpenPopup(dashboardHref(), "sisyphus-dashboard", { coverHost: true });
  if (opened) return "external";
  useStudio.getState().setDashboardOpen(true);
  return "overlay";
}

function previewHref(): string {
  if (desktopBridge()) return hashHref("preview");
  return "/preview";
}

function dashboardHref(): string {
  if (desktopBridge()) return hashHref("dashboard");
  return "/dashboard";
}

function hashHref(hash: string): string {
  const base = window.location.href.split("#")[0];
  return `${base}#${hash}`;
}

async function tryOpenPopup(
  href: string,
  name: string,
  opts?: { coverHost?: boolean },
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const placed = await screenBox(opts?.coverHost === true);
  const popup = window.open(
    href,
    name,
    `popup=yes,left=${placed.left},top=${placed.top},width=${placed.width},height=${placed.height}`,
  );
  if (!popup) return false;
  try {
    popup.moveTo(placed.left, placed.top);
    popup.resizeTo(placed.width, placed.height);
  } catch {
    /* some browsers block moveTo */
  }
  return true;
}

async function screenBox(coverHost: boolean): Promise<{
  left: number;
  top: number;
  width: number;
  height: number;
}> {
  const host = {
    left: window.screenX,
    top: window.screenY,
    width: Math.max(720, window.outerWidth),
    height: Math.max(480, window.outerHeight),
  };
  const getScreenDetails = (
    window as Window & {
      getScreenDetails?: () => Promise<{ screens: ScreenLike[]; currentScreen: ScreenLike }>;
    }
  ).getScreenDetails;
  if (typeof getScreenDetails !== "function") return host;
  try {
    const details = await getScreenDetails();
    if (!details?.screens || details.screens.length < 2) return host;
    const current = details.currentScreen;
    const other =
      details.screens.find((s) => s !== current && s.isPrimary === false) ??
      details.screens.find((s) => s !== current);
    if (!other) return host;
    return {
      left: other.availLeft,
      top: other.availTop,
      width: other.availWidth,
      height: other.availHeight,
    };
  } catch {
    return coverHost ? host : host;
  }
}
