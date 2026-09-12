import { PrefsDialog } from "@/components/quire/prefs-dialog";

export function ProjectSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return <PrefsDialog open={open} onOpenChange={onOpenChange} pane="project" />;
}
