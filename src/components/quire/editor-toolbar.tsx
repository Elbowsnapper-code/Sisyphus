import { useEffect, useState, type RefObject } from "react";
import {
  AlignLeft,
  Bold,
  BookOpen,
  Columns2,
  Heading1,
  Eraser,
  Highlighter,
  Sparkles,
  Square,
  Type,
  Volume2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { htmlToPlain } from "@/lib/text";
import type { FontSize, PanePrefs } from "@/lib/store";
import { useStudio } from "@/lib/store";
import { styleById } from "@/lib/novel-style";
import { fontFamilyOf, fontOptions } from "@/lib/fonts";
import { canSpeak, isSpeaking, speak, stopSpeaking } from "@/lib/speech";
import type { SpeechRate } from "@/lib/types";
import { applyGenreEmphasis, clearFormatting, GENRE_EMPHASIS } from "@/lib/genre";

const SIZES: FontSize[] = [16, 18, 20, 22, 24];
const RATES: SpeechRate[] = [1, 1.5, 2];
const ORNAMENTS = [
  { glyph: "* * *", label: "Stars" },
  { glyph: "· · ·", label: "Dots" },
  { glyph: "⁂", label: "Asterism" },
  { glyph: "❧", label: "Fleuron" },
  { glyph: "◆", label: "Diamond" },
  { glyph: "✦ ✦ ✦", label: "Sparks" },
];

function run(command: string, value?: string) {
  document.execCommand("styleWithCSS", false, "true");
  document.execCommand(command, false, value);
}

export function EditorToolbar({
  editor,
  prefs,
  onPrefs,
  onClose,
}: {
  editor: RefObject<HTMLDivElement | null>;
  prefs: PanePrefs;
  onPrefs: (prefs: Partial<PanePrefs>) => void;
  onClose?: () => void;
}) {
  const [speaking, setSpeaking] = useState(false);
  const docs = useStudio((s) => s.docs);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const setPrefs = useStudio((s) => s.setPrefs);
  const patchProject = useStudio((s) => s.patchProject);
  const customFonts = useStudio((s) => s.prefs.customFonts);
  const speechRate = useStudio((s) => s.docs[s.currentProjectId]?.speechRate ?? s.prefs.speechRate);
  const splitOpen = useStudio((s) => s.splitOpen);
  const previewOpen = useStudio((s) => s.previewOpen);
  const toggleSplit = useStudio((s) => s.toggleSplit);
  const togglePreview = useStudio((s) => s.togglePreview);
  const style = styleById(docs[currentProjectId]?.novelStyle);
  const fonts = fontOptions(customFonts);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const apply = (command: string, value?: string) => {
    editor.current?.focus();
    run(command, value);
    editor.current?.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const applyFontToSelection = (family: string) => {
    editor.current?.focus();
    run("fontName", family);
    editor.current?.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const applyGenre = (kind: string) => {
    editor.current?.focus();
    applyGenreEmphasis(kind);
    editor.current?.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const insertBreak = (glyph: string) => {
    editor.current?.focus();
    run("insertHTML", `<p class="scene-break">${glyph}</p><p></p>`);
    editor.current?.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const toggleSpeak = () => {
    if (speaking || isSpeaking()) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    if (!canSpeak()) {
      toast.error("Read-aloud is not available in this browser");
      return;
    }
    const sel = window.getSelection();
    const selected =
      sel && editor.current && editor.current.contains(sel.anchorNode) ? sel.toString().trim() : "";
    const text = selected || htmlToPlain(editor.current?.innerHTML ?? "");
    setSpeaking(true);
    speak(text, speechRate, {
      onend: () => setSpeaking(false),
      onerror: () => setSpeaking(false),
    });
  };

  return (
    <div className="desk-bar no-print gap-0.5 overflow-x-auto px-2">
      <ToolMenu icon={<Type />} label="Font for selection">
        {fonts.map((f) => (
          <DropdownMenuItem
            key={f.id}
            onSelect={() => applyFontToSelection(fontFamilyOf(f.id, customFonts) ?? f.label)}
          >
            {f.label}
          </DropdownMenuItem>
        ))}
      </ToolMenu>
      <ToolMenu icon={<span className="text-[10px] font-semibold">{prefs.size}</span>} label={`Size: ${prefs.size}`}>
        {SIZES.map((n) => (
          <DropdownMenuCheckboxItem
            key={n}
            checked={prefs.size === n}
            onCheckedChange={() => onPrefs({ size: n })}
          >
            {n}
          </DropdownMenuCheckboxItem>
        ))}
      </ToolMenu>
      <ToolMenu icon={<Bold />} label="Emphasis">
        <DropdownMenuItem onSelect={() => apply("bold")}>Bold</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => apply("italic")}>Italic</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => apply("underline")}>Underline</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => apply("strikeThrough")}>Strikethrough</DropdownMenuItem>
      </ToolMenu>
      <ToolMenu icon={<Heading1 />} label="Heading">
        <DropdownMenuItem onSelect={() => apply("formatBlock", "h1")}>Heading 1</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => apply("formatBlock", "h2")}>Heading 2</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => apply("formatBlock", "h3")}>Heading 3</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => apply("formatBlock", "p")}>Body</DropdownMenuItem>
      </ToolMenu>
      <ToolMenu icon={<AlignLeft />} label="Alignment">
        <DropdownMenuItem onSelect={() => apply("justifyLeft")}>Left</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => apply("justifyCenter")}>Center</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => apply("justifyRight")}>Right</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => apply("justifyFull")}>Justify</DropdownMenuItem>
      </ToolMenu>
      <Button
        type="button"
        variant="toolbar"
        size="toolbar"
        aria-label="Clear formatting"
        title="Clear formatting"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          editor.current?.focus();
          clearFormatting(editor.current);
        }}
      >
        <Eraser />
      </Button>
      <ToolMenu icon={<Highlighter />} label="Genre emphasis">
        {GENRE_EMPHASIS.map((group, i) => (
          <div key={group.group}>
            {i > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel>{group.group}</DropdownMenuLabel>
            {group.items.map((item) => (
              <DropdownMenuItem key={item.id} onSelect={() => applyGenre(item.id)}>
                {item.label}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => applyGenre("clear")}>Clear emphasis</DropdownMenuItem>
      </ToolMenu>
      <ToolMenu icon={<Sparkles />} label="Ornaments">
        <DropdownMenuItem onSelect={() => insertBreak(style.sceneBreak)}>
          Scene break ({style.sceneBreak})
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {ORNAMENTS.map((item) => (
          <DropdownMenuItem key={item.label} onSelect={() => insertBreak(item.glyph)}>
            {item.label} · {item.glyph}
          </DropdownMenuItem>
        ))}
      </ToolMenu>
      <div className="mx-1 h-5 w-px bg-chrome-fg/15" />
      <Button
        type="button"
        variant="toolbar"
        size="toolbar"
        aria-label={speaking ? "Stop reading" : "Read aloud"}
        aria-pressed={speaking}
        data-active={speaking || undefined}
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggleSpeak}
      >
        {speaking ? <Square /> : <Volume2 />}
      </Button>
      <select
        aria-label="Read-aloud speed"
        className="h-7 rounded-sm border-0 bg-ink-soft px-1 text-xs text-chrome-fg outline-none"
        value={String(speechRate)}
        onChange={(e) => {
          const rate = Number(e.target.value) as SpeechRate;
          patchProject({ speechRate: rate });
          setPrefs({ speechRate: rate });
        }}
      >
        {RATES.map((r) => (
          <option key={r} value={r} className="bg-chrome text-chrome-fg">
            {r.toFixed(1)}×
          </option>
        ))}
      </select>
      <div className="ml-auto flex items-center gap-0.5">
        <Button
          type="button"
          variant="toolbar"
          size="toolbar"
          aria-label="Split editor"
          title="Split editor"
          aria-pressed={splitOpen && !previewOpen}
          data-active={splitOpen && !previewOpen ? true : undefined}
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggleSplit}
        >
          <Columns2 />
        </Button>
        <Button
          type="button"
          variant="toolbar"
          size="toolbar"
          aria-label="Book preview"
          title="Book preview"
          aria-pressed={previewOpen}
          data-active={previewOpen || undefined}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => togglePreview()}
        >
          <BookOpen />
        </Button>
        {onClose ? (
          <Button
            type="button"
            variant="toolbar"
            size="toolbar"
            aria-label="Close pane"
            title="Close pane"
            onClick={onClose}
          >
            <X />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function ToolMenu({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="toolbar"
          size="toolbar"
          aria-label={label}
          title={label}
          onMouseDown={(e) => e.preventDefault()}
        >
          {icon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
