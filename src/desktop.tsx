import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "@/components/quire/app-shell";
import { BookPreview } from "@/components/quire/book-preview";
import { SeriesDashboard } from "@/components/quire/series-dashboard";
import { SchemeToaster } from "@/components/quire/scheme-toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { applyDeskTheme } from "@/lib/theme";
import { useStudio } from "@/lib/store";
import "./styles.css";

applyDeskTheme(useStudio.getState().prefs.deskTheme);

const root = document.getElementById("root");
if (!root) throw new Error("Sisyphus desktop: missing #root");

function DesktopRoot() {
  const hash = window.location.hash.replace(/^#/, "");
  if (hash === "dashboard") return <SeriesDashboard standalone />;
  if (hash === "preview") return <BookPreview active />;
  return <AppShell />;
}

createRoot(root).render(
  <StrictMode>
    <TooltipProvider delayDuration={250}>
      <DesktopRoot />
      <SchemeToaster />
    </TooltipProvider>
  </StrictMode>,
);
