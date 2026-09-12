import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/quire/app-shell";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <AppShell />;
}
