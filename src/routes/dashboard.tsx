import { createFileRoute } from "@tanstack/react-router";
import { SeriesDashboard } from "@/components/quire/series-dashboard";

export const Route = createFileRoute("/dashboard")({
  component: DashboardWindow,
});

function DashboardWindow() {
  return (
    <div className="h-dvh">
      <SeriesDashboard standalone />
    </div>
  );
}
