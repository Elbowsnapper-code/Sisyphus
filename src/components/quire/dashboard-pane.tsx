import { useStudio } from "@/lib/store";
import { projects } from "@/lib/tree";
import { PaneShell } from "@/components/quire/active-frame";
import { DashPane } from "@/components/quire/series-dashboard";

export function DashboardPane({
  pane,
  active,
  onActivate,
  onClose,
}: {
  pane: "main" | "split";
  active: boolean;
  onActivate: () => void;
  onClose?: () => void;
}) {
  const docs = useStudio((s) => s.docs);
  const currentProjectId = useStudio((s) => s.currentProjectId);
  const patchProject = useStudio((s) => s.patchProject);
  const list = projects(docs);
  const others = list.filter((p) => p.id !== currentProjectId);
  const compareId = docs[currentProjectId]?.compareProjectId;
  const projectId =
    pane === "main" ? currentProjectId : compareId && docs[compareId] ? compareId : others[0]?.id ?? currentProjectId;

  return (
    <PaneShell active={active} onActivate={onActivate} onClose={onClose}>
      <div className="desk-bar no-print px-3 pr-10">
        <span className="font-display text-xs tracking-widest uppercase">Project Dashboard</span>
        <span className="ml-2 truncate text-[10px] text-chrome-fg/70">
          {pane === "main" ? docs[currentProjectId]?.title : "Compare"}
        </span>
      </div>
      <DashPane
        projectId={projectId}
        hideProjectSelect={pane === "main"}
        onProject={(id) => {
          if (pane === "split") patchProject({ compareProjectId: id });
        }}
      />
    </PaneShell>
  );
}
