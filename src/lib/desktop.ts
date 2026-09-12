export interface UpdateCheck {
  ok: boolean;
  current: string;
  newer?: boolean;
  latest?: { version: string; notes?: string };
  error?: string;
}

export interface UpdateApply {
  ok: boolean;
  version?: string;
  error?: string;
}

export interface DesktopBridge {
  isDesktop: true;
  platform: string;
  chooseFolder: (title?: string, defaultPath?: string) => Promise<string | null>;
  writeFile: (filePath: string, bytes: ArrayBuffer) => Promise<void>;
  readFile: (filePath: string) => Promise<ArrayBuffer>;
  listDir: (folder: string) => Promise<string[]>;
  joinPath: (folder: string, name: string) => Promise<string>;
  resolveIn?: (folder: string, relative: string) => Promise<string>;
  defaultProjectsRoot?: () => Promise<string>;
  renameDir?: (from: string, newName: string) => Promise<string>;
  checkUpdate?: () => Promise<UpdateCheck>;
  applyUpdate?: () => Promise<UpdateApply>;
}

declare global {
  interface Window {
    sisyphusDesktop?: DesktopBridge;
  }
}

export function desktopBridge(): DesktopBridge | null {
  if (typeof window === "undefined") return null;
  const api = window.sisyphusDesktop;
  return api?.isDesktop ? api : null;
}
