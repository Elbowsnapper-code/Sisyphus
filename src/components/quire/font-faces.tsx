import { useStudio } from "@/lib/store";

export function FontFaces() {
  const fonts = useStudio((s) => s.prefs.customFonts);
  if (!fonts.length) return null;
  const css = fonts
    .map((f) => {
      const family = JSON.stringify(f.name);
      const url = JSON.stringify(f.dataUrl);
      return `@font-face{font-family:${family};src:url(${url});font-display:swap;}`;
    })
    .join("");
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
