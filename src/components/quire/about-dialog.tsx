import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SisyphusMark } from "@/components/quire/sisyphus-mark";
import { GUIDE_SECTIONS } from "@/components/quire/help-dialog";
import { APP_AUTHOR, APP_NAME, APP_TAGLINE, APP_VERSION } from "@/lib/version";
import { desktopBridge } from "@/lib/desktop";
import { DESKTOP_BUILDS, desktopZipPath } from "@/lib/desktop-builds";
import { fetchLatest, versionAhead } from "@/lib/update";

export function AboutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const desktop = typeof window !== "undefined" && Boolean(desktopBridge());
  const [guideOpen, setGuideOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const update = async () => {
    setBusy(true);
    setStatus("Checking GitHub…");
    try {
      const bridge = desktopBridge();
      if (bridge?.checkUpdate) {
        const check = await bridge.checkUpdate();
        if (!check.ok) throw new Error(check.error || "Could not reach GitHub");
        if (!check.newer) {
          setStatus(`You're on the latest (${check.current})`);
          toast.success(`You're on ${check.current}`);
          return;
        }
        setStatus(`Applying ${check.latest?.version}…`);
        const applied = await bridge.applyUpdate?.();
        if (!applied?.ok) throw new Error(applied?.error || "Could not apply the update");
        setStatus(`Updated to ${applied.version}`);
        toast.success(`Updated to ${applied.version}`);
        return;
      }
      const latest = await fetchLatest();
      if (!versionAhead(latest.version, APP_VERSION)) {
        setStatus(`You're on the latest (${APP_VERSION})`);
        toast.success(`You're on ${APP_VERSION}`);
        return;
      }
      setStatus(`${latest.version} is on GitHub`);
      toast.message(`Version ${latest.version} is on GitHub. Open the Windows app and press Update.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not check for updates";
      setStatus(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(42rem,86vh)] w-[min(100%-2rem,32rem)] flex-col overflow-hidden p-0">
        <div className="desk-bar px-5 pr-12">
          <DialogHeader>
            <div className="flex items-center gap-2 text-chrome-fg">
              <SisyphusMark className="size-7" />
              <DialogTitle className="text-chrome-fg">{APP_NAME}</DialogTitle>
            </div>
          </DialogHeader>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" disabled={busy} onClick={() => void update()}>
              Update
            </Button>
            <span className="text-sm text-muted">{status || `Version ${APP_VERSION}`}</span>
          </div>
          <DialogDescription className="mt-3">{APP_TAGLINE}</DialogDescription>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="font-display tracking-widest text-muted uppercase">Version</dt>
            <dd>{APP_VERSION}</dd>
            <dt className="font-display tracking-widest text-muted uppercase">Author</dt>
            <dd>{APP_AUTHOR}</dd>
            <dt className="font-display tracking-widest text-muted uppercase">Build</dt>
            <dd>{desktop ? "Desktop" : "Web studio"}</dd>
          </dl>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Update pulls the latest writing desk from GitHub, so you do not need a new Windows zip each
            time. Manuscripts stay on this device.
          </p>
          <div className="mt-4 border-t border-rule pt-3">
            <button
              type="button"
              className="desk-bar-title flex w-full items-center gap-1 py-1 text-left text-muted"
              onClick={() => setGuideOpen((v) => !v)}
              aria-expanded={guideOpen}
            >
              {guideOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              User guide
            </button>
            {guideOpen && (
              <div className="mt-2 flex flex-col gap-2">
                {GUIDE_SECTIONS.map((section) => {
                  const open = openSection === section.title;
                  return (
                    <section key={section.title}>
                      <button
                        type="button"
                        className="font-display flex w-full items-center gap-1 text-left text-[11px] tracking-widest text-muted uppercase"
                        onClick={() => setOpenSection(open ? null : section.title)}
                      >
                        {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                        {section.title}
                      </button>
                      {open &&
                        section.body.map((para) => (
                          <p key={para.slice(0, 40)} className="mt-1.5 text-sm leading-relaxed text-fg">
                            {para}
                          </p>
                        ))}
                    </section>
                  );
                })}
                {!desktop && (
                  <ul className="mt-2 flex flex-col gap-2">
                    {DESKTOP_BUILDS.map((build) => (
                      <li key={build.file}>
                        <a
                          href={desktopZipPath(build.file)}
                          download={build.file}
                          className="text-sm text-accent underline-offset-2 hover:underline"
                        >
                          {build.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
