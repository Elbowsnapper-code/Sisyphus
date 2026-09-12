import { createFileRoute } from "@tanstack/react-router";
import { BookPreview } from "@/components/quire/book-preview";

export const Route = createFileRoute("/preview")({
  component: PreviewWindow,
});

function PreviewWindow() {
  return (
    <div className="flex h-dvh flex-col bg-paper-deep">
      <BookPreview active />
    </div>
  );
}
