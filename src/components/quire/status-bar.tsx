import { useMemo } from "react";
import { countWords, formatSavedAt, formatWordCount, readingMinutes } from "@/lib/text";
import { useStudio } from "@/lib/store";
import { currentBook, sceneWordCount } from "@/lib/tree";
import { HEADER_LABEL, FOOTER_LABEL } from "@/lib/types";
import { addToDictionary, projectDictionary, unknownWords } from "@/lib/spell";
import { povNameOf } from "@/lib/running-copy";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function StatusBar() {
  const docs = useStudio((s) => s.docs);
  const mainId = useStudio((s) => s.mainId);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const savedAt = useStudio((s) => s.savedAt);
  const lastBackupAt = useStudio((s) => s.lastBackupAt);
  const backupFolder = useStudio((s) => s.backupFolder);
  const prefs = useStudio((s) => s.prefs);
  const setPrefs = useStudio((s) => s.setPrefs);
  const doc = docs[mainId];
  const project = docs[currentProjectId];
  const book = currentBook(docs, mainId, currentProjectId);
  const sceneWords = doc ? countWords(doc.content) : 0;
  const bookWords = book ? sceneWordCount(docs, book.id) : 0;
  const extras = useMemo(
    () => projectDictionary(docs, currentProjectId, prefs.ignoreWords),
    [docs, currentProjectId, prefs.ignoreWords],
  );
  const unknown = useMemo(
    () => (prefs.spellCheck && doc ? unknownWords(doc.content, extras) : []),
    [prefs.spellCheck, doc, extras],
  );
  const pov = povNameOf(docs, doc);

  return (
    <footer className="no-print flex h-9 shrink-0 items-center justify-between gap-3 border-t border-ink bg-paper-deep px-3 text-xs text-muted">
      <div className="flex min-w-0 items-center gap-3 truncate">
        <span className="font-display hidden tracking-widest text-fg/70 uppercase sm:inline">Sisyphus</span>
        {project && <span className="truncate text-fg/80">{project.title}</span>}
        {book && <span className="truncate">{book.title}</span>}
        {doc && doc.kind !== "book" && doc.kind !== "project" && (
          <span className="truncate">
            {doc.kind === "scene" ? "Scene" : doc.kind === "chapter" ? "Chapter" : "Note"} · {doc.title}
          </span>
        )}
        {pov && <span className="truncate">POV {pov}</span>}
      </div>
      <div className="flex shrink-0 items-center gap-4 tabular-nums">
        {project && (
          <span className="hidden lg:inline">
            {HEADER_LABEL[project.headerMode ?? "book"]} · {FOOTER_LABEL[project.footerMode ?? "page"]}
          </span>
        )}
        {prefs.spellCheck && unknown.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="text-muted hover:text-fg">
                {unknown.length} spelling
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-2">
              <p className="font-display mb-2 px-1 text-xs tracking-widest text-muted uppercase">
                Unknown words
              </p>
              <ul className="flex flex-col">
                {unknown.slice(0, 8).map((word) => (
                  <li key={word} className="flex items-center justify-between gap-2 px-1 py-1 text-sm">
                    <span className="truncate">{word}</span>
                    <button
                      type="button"
                      className="shrink-0 text-xs text-accent hover:underline"
                      onClick={() => {
                        addToDictionary(word);
                        setPrefs({ ignoreWords: [...prefs.ignoreWords, word] });
                      }}
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        )}
        <span>
          {formatWordCount(sceneWords)} {sceneWords === 1 ? "word" : "words"}
        </span>
        {book && (
          <span>
            Volume {formatWordCount(bookWords)} · {readingMinutes(bookWords)} min
          </span>
        )}
        <span>{formatSavedAt(savedAt)}</span>
        {lastBackupAt > 0 && (
          <span className="hidden xl:inline" title={backupFolder ? `Folder: ${backupFolder}` : "Downloaded"}>
            Backup {formatSavedAt(lastBackupAt).replace("Saved ", "").toLowerCase()}
          </span>
        )}
      </div>
    </footer>
  );
}
