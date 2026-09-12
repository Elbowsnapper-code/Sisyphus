import { BODY_FONTS, type BodyFontId } from "@/lib/novel-style";
import type { CustomFont } from "@/lib/types";

export function sanitizeFonts(list: unknown): CustomFont[] {
  if (!Array.isArray(list)) return [];
  const out: CustomFont[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const f = item as Record<string, unknown>;
    if (typeof f.id !== "string" || typeof f.name !== "string" || typeof f.dataUrl !== "string") continue;
    if (!f.dataUrl.startsWith("data:")) continue;
    if (f.dataUrl.length > 2_500_000) continue;
    out.push({ id: f.id, name: f.name.slice(0, 80), dataUrl: f.dataUrl });
    if (out.length >= 16) break;
  }
  return out;
}

export function fontOptions(custom: CustomFont[] = []): { id: string; label: string }[] {
  return [
    ...BODY_FONTS.map((f) => ({ id: f.id, label: f.label })),
    ...custom.map((f) => ({ id: f.id, label: f.name })),
  ];
}

export function fontFamilyOf(id: string | undefined, custom: CustomFont[] = []): string | undefined {
  const built: Record<BodyFontId, string> = {
    times: '"Times New Roman", Times, serif',
    georgia: 'Georgia, "Times New Roman", serif',
    palatino: 'Palatino, "Palatino Linotype", "Book Antiqua", serif',
    garamond: '"EB Garamond", Garamond, "Times New Roman", serif',
    baskerville: '"Libre Baskerville", Baskerville, "Times New Roman", serif',
    literata: "Literata, Georgia, serif",
    sans: "Figtree, ui-sans-serif, system-ui, sans-serif",
  };
  if (id && id in built) return built[id as BodyFontId];
  const customFont = custom.find((f) => f.id === id);
  if (customFont) return `"${customFont.name}", "Times New Roman", serif`;
  return undefined;
}

export function isBuiltInFont(id: string | undefined): id is BodyFontId {
  return Boolean(id && BODY_FONTS.some((f) => f.id === id));
}

export async function readFontFile(file: File): Promise<CustomFont | null> {
  if (file.size > 1_800_000) return null;
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  if (!dataUrl.startsWith("data:")) return null;
  const base = file.name.replace(/\.(ttf|otf|woff2?|TTF|OTF|WOFF2?)$/, "").trim() || "Custom font";
  return {
    id: `cf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: base.slice(0, 80),
    dataUrl,
  };
}
