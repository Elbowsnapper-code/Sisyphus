import { formatWordCount } from "@/lib/text";

export function EditorFooter({ path, words }: { path?: string; words?: number }) {
  return (
    <div className="desk-bar no-print gap-3 px-3">
      {path ? (
        <span className="font-display min-w-0 truncate text-[10px] tracking-wide text-chrome-fg/80" title={path}>
          {path}
        </span>
      ) : (
        <span />
      )}
      {typeof words === "number" ? (
        <span className="ml-auto shrink-0 text-xs tabular-nums text-chrome-fg/80">
          {formatWordCount(words)} {words === 1 ? "word" : "words"}
        </span>
      ) : null}
    </div>
  );
}