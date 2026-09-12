import { useRef } from "react";
import { BookImage } from "lucide-react";
import { PaneShell } from "@/components/quire/active-frame";
import { coverStudioOf, type CoverUse, type Doc } from "@/lib/types";
import { useStudio } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { paperbackLayout, studioPages } from "@/lib/cover";

function readCover(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.86));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function CoverEditor({
  doc,
  pane,
  active,
  onActivate,
  onClose,
}: {
  doc: Doc;
  pane: "main" | "split";
  active: boolean;
  onActivate: () => void;
  onClose?: () => void;
}) {
  const updateDoc = useStudio((s) => s.updateDoc);
  const patchProject = useStudio((s) => s.patchProject);
  const openSpecial = useStudio((s) => s.openSpecial);
  const project = useStudio((s) => s.docs[s.currentProjectId]);
  const docs = useStudio((s) => s.docs);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const fileRef = useRef<HTMLInputElement>(null);
  const studio = coverStudioOf(project);
  const preview = doc.coverImage || studio.art.image;
  const use = (project?.coverUse ?? "ebook") as CoverUse;
  const pages = studioPages(studio, docs, currentProjectId);
  const layout = paperbackLayout(project?.trimSize, pages, studio.paper);

  return (
    <PaneShell active={active} onActivate={onActivate} onClose={onClose}>
      <div className="flex h-10 items-center bg-chrome px-3 pr-10 text-xs tracking-widest text-chrome-fg uppercase">
        Cover · {pane === "split" ? "split" : "main"}
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center gap-4 overflow-auto p-6">
        {preview ? (
          <img src={preview} alt="Cover" className="max-h-[28rem] w-auto max-w-full shadow-page" />
        ) : (
          <div className="flex h-80 w-52 items-center justify-center border border-dashed border-rule text-sm text-muted">
            No cover yet
          </div>
        )}
        <div className="flex max-w-md flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted">
            This page shows the finished cover used in EPUB, HTML, and the book. Build it in Cover studio — ebook
            front or paperback wrap — then apply it here.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <span className="font-display text-[10px] tracking-widest text-muted uppercase">Use</span>
            <select
              className="h-9 rounded-[var(--radius-sm)] border border-rule bg-cream px-2 text-sm"
              value={use}
              onChange={(e) => patchProject({ coverUse: e.target.value as CoverUse })}
            >
              <option value="ebook">KDP ebook cover</option>
              <option value="paperback">Paperback front (from the wrap)</option>
            </select>
          </label>
          {use === "paperback" && (
            <p className="text-xs text-muted">
              Wrap {layout.width.toFixed(4)} × {layout.height.toFixed(4)} in · spine {layout.spine.toFixed(4)} in ·{" "}
              {layout.pages} pages. The wrap PDF is a separate KDP upload; this page shows the front only.
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={() => openSpecial("cover-studio")}>
              <BookImage className="size-3.5" /> Cover studio
            </Button>
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
              {doc.coverImage ? "Replace with a file" : "Upload a file"}
            </Button>
            {doc.coverImage && (
              <Button type="button" variant="outline" onClick={() => updateDoc(doc.id, { coverImage: "" })}>
                Remove
              </Button>
            )}
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const data = await readCover(file);
            updateDoc(doc.id, { coverImage: data });
          }}
        />
      </div>
    </PaneShell>
  );
}
