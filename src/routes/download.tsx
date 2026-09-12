import { createFileRoute, Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SisyphusMark } from "@/components/quire/sisyphus-mark";
import { DESKTOP_BUILDS, desktopZipPath } from "@/lib/desktop-builds";
import { APP_VERSION } from "@/lib/version";

export const Route = createFileRoute("/download")({
  component: DownloadPage,
});

function DownloadPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center bg-cream px-6 py-16 text-fg">
      <div className="flex w-full max-w-lg flex-col gap-8">
        <header className="flex items-center gap-3">
          <SisyphusMark className="size-10 text-fg" />
          <div>
            <p className="font-display text-xs tracking-widest text-muted uppercase">Sisyphus</p>
            <h1 className="font-display text-2xl tracking-tight">Desktop test build</h1>
          </div>
        </header>
        <p className="text-sm leading-relaxed text-muted">
          Unsigned Electron build {APP_VERSION} for trying the studio on your computer. About 150 MB.
          Your novel stays on that machine and does not sync with the browser unless you import
          a backup. Windows is the current test build. New Project will ask where the folder
          should live.
        </p>
        <ul className="flex flex-col gap-3">
          {DESKTOP_BUILDS.map((build) => (
            <li key={build.file}>
              <a
                href={desktopZipPath(build.file)}
                download={build.file}
                className="flex min-h-12 items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-accent px-4 py-3 text-accent-fg hover:bg-accent/90"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Download className="size-4 shrink-0" />
                  <span className="truncate font-medium">Download {build.label}</span>
                </span>
                <span className="font-display hidden shrink-0 text-xs tracking-widest uppercase sm:inline">
                  Zip
                </span>
              </a>
              <p className="mt-1.5 px-1 text-xs text-muted">{build.hint}</p>
            </li>
          ))}
        </ul>
        <Button variant="outline" asChild>
          <Link to="/">Back to the desk</Link>
        </Button>
      </div>
    </main>
  );
}
