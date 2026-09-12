import type { ChapterSpan, EraDate, ProjectTimeline, ProtagonistSpan, WorldEvent } from "@/lib/types";
import { emptyTimeline } from "@/lib/types";

export function formatEra(date: EraDate | undefined): string {
  if (!date) return "";
  return [date.age, date.year, date.month, date.day].map((p) => p.trim()).filter(Boolean).join(" · ");
}

export function eraKey(date: EraDate | undefined): string {
  if (!date) return "";
  const year = Number.parseInt(date.year.replace(/[^\d-]/g, ""), 10);
  const day = Number.parseInt(date.day.replace(/[^\d-]/g, ""), 10);
  const y = Number.isFinite(year) ? String(year).padStart(6, "0") : date.year.toLowerCase();
  const d = Number.isFinite(day) ? String(day).padStart(3, "0") : date.day.toLowerCase();
  return [date.age.toLowerCase(), y, date.month.toLowerCase(), d].join("|");
}

export function sortWorld(events: WorldEvent[]): WorldEvent[] {
  return [...events].sort((a, b) => eraKey(a.date).localeCompare(eraKey(b.date)) || a.title.localeCompare(b.title));
}

export function latestChapterEnd(timeline: ProjectTimeline | undefined): EraDate | undefined {
  const list = timeline?.chapters ?? [];
  let latest: ChapterSpan | undefined;
  for (const span of list) {
    const end = span.end ?? span.start;
    if (!formatEra(end)) continue;
    if (!latest) {
      latest = span;
      continue;
    }
    const prev = eraKey(latest.end?.age || latest.start ? latest.end ?? latest.start : undefined);
    if (eraKey(end) > prev) latest = span;
  }
  return latest ? latest.end ?? latest.start : undefined;
}

export function timelineOf(value: ProjectTimeline | undefined): ProjectTimeline {
  return value ?? emptyTimeline();
}

export function spanForChapter(timeline: ProjectTimeline | undefined, chapterId: string): ChapterSpan | undefined {
  return timeline?.chapters.find((c) => c.chapterId === chapterId);
}

export function spanForPerson(timeline: ProjectTimeline | undefined, characterId: string): ProtagonistSpan | undefined {
  return timeline?.protagonists.find((p) => p.characterId === characterId);
}
