import type { SceneTemplate } from "@/lib/types";
import { TEMPLATE_LABEL } from "@/lib/types";

export const TEMPLATE_OPTIONS: { id: SceneTemplate; label: string; blurb: string }[] = [
  { id: "blank", label: TEMPLATE_LABEL.blank, blurb: "An empty scene." },
  {
    id: "character-summary",
    label: TEMPLATE_LABEL["character-summary"],
    blurb: "A short portrait, for lore between chapters.",
  },
  {
    id: "character-quote",
    label: TEMPLATE_LABEL["character-quote"],
    blurb: "An epigraph in a character’s voice.",
  },
  {
    id: "location",
    label: TEMPLATE_LABEL.location,
    blurb: "A place held still — smell, light, a reason to remember it.",
  },
];

export function templateHtml(id: SceneTemplate | undefined): string {
  switch (id) {
    case "character-summary":
      return (
        `<p class="lore-kicker">Character</p>` +
        `<p class="lore-body">Name — a sentence of who they are, what they want, and what the world does not yet know.</p>`
      );
    case "character-quote":
      return (
        `<p class="lore-quote">“Write the line they would not say in company.”</p>` +
        `<p class="lore-attr">— Name</p>`
      );
    case "location":
      return (
        `<p class="lore-kicker">Place</p>` +
        `<p class="lore-body">Where it is, what it smells of, and why a traveler would remember it.</p>`
      );
    default:
      return "";
  }
}

export function isLoreTemplate(id: SceneTemplate | undefined): boolean {
  return id === "character-summary" || id === "character-quote" || id === "location";
}
