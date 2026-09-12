export const COLOR_SCHEMES = [
  {
    id: "coffee",
    label: "Coffee",
    blurb: "Dark roasted desk.",
  },
] as const;

export type ColorSchemeId = (typeof COLOR_SCHEMES)[number]["id"];

export const LINK_COLOR_KINDS = [
  "character",
  "faction",
  "city",
  "species",
  "monster",
  "magic",
  "lore",
  "world",
  "wonder",
  "political",
  "religion",
  "language",
] as const;

export type LinkColorKind = (typeof LINK_COLOR_KINDS)[number];

/** Libraries shown on the palette. Hidden kinds still tint in older projects. */
export const PALETTE_LINK_KINDS = [
  "character",
  "faction",
  "city",
  "species",
  "monster",
  "magic",
  "lore",
] as const satisfies readonly LinkColorKind[];

export const LINK_COLOR_LABEL: Record<LinkColorKind, string> = {
  character: "Character",
  faction: "Faction",
  city: "Settlement",
  species: "Species",
  monster: "Monster",
  magic: "Magic",
  lore: "Lore",
  world: "World",
  wonder: "Wonder",
  political: "Polity",
  religion: "Faith",
  language: "Language",
};

export const DEFAULT_LINK_COLORS: Record<LinkColorKind, string> = {
  character: "#d4a574",
  faction: "#d08878",
  city: "#c4b89a",
  species: "#8eaf8a",
  monster: "#c47b62",
  magic: "#c9a05a",
  lore: "#a89880",
  world: "#b8a06a",
  wonder: "#c4a574",
  political: "#b8a078",
  religion: "#c08070",
  language: "#b8a890",
};

export interface DeskTheme {
  toolbar: string;
  window: string;
  toolbarFg: string;
  bodyFg: string;
  linkColors: Record<LinkColorKind, string>;
}

export const COFFEE_THEME: DeskTheme = {
  toolbar: "#2c2118",
  window: "#1c1612",
  toolbarFg: "#f3ead8",
  bodyFg: "#ead9c4",
  linkColors: { ...DEFAULT_LINK_COLORS },
};

export function schemeById(_id: string | undefined): (typeof COLOR_SCHEMES)[number] {
  return COLOR_SCHEMES[0];
}

export function nextScheme(_id: string | undefined): ColorSchemeId {
  return "coffee";
}

function mixHex(hex: string, toward: string, amount: number): string {
  const a = parseHex(hex);
  const b = parseHex(toward);
  const n = Math.min(1, Math.max(0, amount));
  const ch = (x: number, y: number) => Math.round(x + (y - x) * n);
  return `#${[ch(a.r, b.r), ch(a.g, b.g), ch(a.b, b.b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function parseHex(color: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return { r: 44, g: 33, b: 24 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function hexColor(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#?[0-9a-f]{6}$/i.test(value.trim())
    ? value.startsWith("#")
      ? value
      : `#${value}`
    : fallback;
}

export function sanitizeDeskTheme(theme: Partial<DeskTheme> | undefined): DeskTheme {
  const incoming = (theme?.linkColors ?? {}) as Partial<Record<LinkColorKind, string>>;
  const linkColors = {} as Record<LinkColorKind, string>;
  for (const kind of LINK_COLOR_KINDS) {
    linkColors[kind] = hexColor(incoming[kind], DEFAULT_LINK_COLORS[kind]);
  }
  return {
    toolbar: hexColor(theme?.toolbar, COFFEE_THEME.toolbar),
    window: hexColor(theme?.window, COFFEE_THEME.window),
    toolbarFg: hexColor(theme?.toolbarFg, COFFEE_THEME.toolbarFg),
    bodyFg: hexColor(theme?.bodyFg, COFFEE_THEME.bodyFg),
    linkColors,
  };
}

export function applyDeskTheme(theme: Partial<DeskTheme> | undefined) {
  if (typeof document === "undefined") return;
  const t = sanitizeDeskTheme(theme);
  const root = document.documentElement;
  root.dataset.scheme = "coffee";
  const ink = mixHex(t.window, "#000000", 0.35);
  const paperDeep = mixHex(t.window, "#000000", 0.22);
  const rule = mixHex(t.bodyFg, t.window, 0.72);
  const muted = mixHex(t.bodyFg, t.window, 0.35);
  const soft = mixHex(t.toolbar, "#000000", 0.18);
  root.style.setProperty("--color-chrome", t.toolbar);
  root.style.setProperty("--color-chrome-fg", t.toolbarFg);
  root.style.setProperty("--color-cream", t.window);
  root.style.setProperty("--color-paper", t.window);
  root.style.setProperty("--color-paper-deep", paperDeep);
  root.style.setProperty("--color-fg", t.bodyFg);
  root.style.setProperty("--color-muted", muted);
  root.style.setProperty("--color-ink", ink);
  root.style.setProperty("--color-ink-soft", soft);
  root.style.setProperty("--color-rule", rule);
  root.style.setProperty("--color-name", t.linkColors.character);
  for (const kind of LINK_COLOR_KINDS) {
    root.style.setProperty(`--color-link-${kind}`, t.linkColors[kind]);
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", t.toolbar);
}

export function applyColorScheme(_id: string | undefined, theme?: Partial<DeskTheme>) {
  applyDeskTheme(theme ?? COFFEE_THEME);
}
