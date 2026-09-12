import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { desktopBridge } from "@/lib/desktop";
import { DESKTOP_BUILDS, desktopZipPath } from "@/lib/desktop-builds";
import { APP_VERSION } from "@/lib/version";

export const GUIDE_SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "The desk",
    body: [
      "Sisyphus is a local-first novel studio. The manuscript lives on this device until you export or back it up.",
      "Left column: Find, Project Dashboard, then Manuscript. Library, Schematic, Lookups, and Trash sit compacted at the bottom. The project name lives in the top header — click it to return to Projects. Centre: the page you are writing, with split and book preview on the editor toolbar. Footer: Sisyphus, then Project, Save, Export, Cover studio, Preferences, About, and the palette on the right. The footer stays on one bar across the bottom of the desk.",
    ],
  },
  {
    title: "Footer",
    body: [
      "Project — Projects (returns to the landing page), Rename project, Project settings. New, open, import, and delete live on Projects.",
      "Save — save toast, save as JSON, manual backup, choose backup folder, restore the sample novel.",
      "Export window — pick front matter, volumes, chapters, scenes, back matter, and library pages. Book-page preview uses the selected Amazon KDP, IngramSpark, or Other trim. Formats: EPUB, PDF (downloads a file), PDF (Print), Cover PDF (KDP paperback wrap), DOCX, HTML, Markdown, Sisyphus JSON. Cover PDF uses Cover studio’s wrap measurements. EPUB, HTML, and PDF pick up the Cover-page picture from Cover studio.",
      "Preferences — two panes. Sisyphus Settings: default font, style, size, scheme, backup folder, projects folder. Project Settings: auto-replace, autocomplete, read-aloud, palettes, format, custom header/footer, show scene date in exported documents, install fonts, this project’s folder, delete.",
      "Cover studio — the book-image icon after Export. Front, spine, and back only. Series, title, and author (Cinzel, all caps) sit on both the KDP ebook and the paperback wrap, which share one set of fields and sit side by side. Cover colour fills the wrap; spine colour is a toggle over the spine only. Page count can be cleared and retyped. Apply writes the front onto the Cover page.",
      "Also on the footer: About (this guide is folded under User guide). Update sits at the top of About and pulls the latest writing desk from GitHub. The palette icon on the right is grouped: Toolbar (colour and text), Window (colour and text), and Linking (character, settlement, faction, species, monster, magic, lore). Coffee is the only desk, and it is dark.",
    ],
  },
  {
    title: "Manuscript",
    body: [
      "The tree is Volume → Chapter → Scene, under a Manuscript heading. The top bar is the project name (New Project until you rename it). Untitled Volume, Untitled Chapter, and Untitled Scene stay until you rename them. A volume is a folder, not a page — click it for a dashboard of its chapters and scenes. Front Matter and Back Matter start compacted. Drag a row to reorder. Every volume has a + that adds a chapter inside it; every chapter has a + that adds a scene. Front and Back Matter + can add a blank page you write yourself.",
      "Find sits under the project name: type to search scene text as you go. Tick Whole project to include titles, folders, libraries, and front/back matter. Results drop down, grouped by what they are.",
      "Project Dashboard sits under Find and opens in both writing panes: the left is this project, the split is a comparison project. Word counts are at the top.",
      "Each writing page has a chrome footer with Volume › Chapter › Scene and that page’s word count. Split view’s second pane has an X at the top right to close it. Scenes have a quiet Age / Year / Month / Day row instead of a POV menu. Scene dates stay off Book Preview and exports unless Project Settings ticks “Show scene date in exported documents.”",
      "Double-click a title to rename, or right-click for Rename, Duplicate, Delete. Deleted items go to Trash — they are not gone until you empty it.",
      "Undo and Redo sit in a small box beside the Manuscript heading. They restore accidental deletes and moves. They do not undo typing — the page still uses the usual editor undo.",
      "The + beside Front Matter, Manuscript, and Back Matter adds into that menu. Scene templates: blank, character summary, character quote, location description.",
    ],
  },
  {
    title: "Library",
    body: [
      "The Library stack holds Characters, Factions, Settlements, Species, Monsterpedia, Magic System, Lore, and Power Ranking. World and Wonders stay only if an older project already has them. The + beside each heading adds an entry there. Drag entries to reorder. Alignment on a character sheet is God, Hero, Villain, or Citizen.",
      "Factions pick which settlement they operate in. A settlement lists those factions, plus population, region, type (empire, principality, kingdom…), ruler, trade / war / allies with other settlements, landmarks, people, shops, and a headcount by species and monsters.",
      "Species are intelligent races (name, appearance, traits, strengths, weaknesses, what they are best at). Monsterpedia is beasts and monsters.",
      "Magic System opens with an Overview of every named system in the story. Each system is a template: name, origin or nature, then a list of spells / techniques / skills / runes with cost, duration, cast time, and cooldown. Faith-casting and water magic can sit side by side.",
      "Names and aliases tint in the manuscript. Hover for the condensed summary — the tint stays after you move away. Click to open the sheet in the split pane. Fill the summary field — it is what the hover card shows.",
    ],
  },
  {
    title: "Schematic",
    body: [
      "Schematic sits under Library. These are documents in the writing pane, not widgets in the sidebar. Order: Brief, Story Structure, World Timeline, Synopsis Timeline, Protagonist Timeline.",
      "Brief is the messy outline: a few paragraphs, the events you already know, and Sparks — the scene that made you want the book. A wizard leaping from a tower to catch someone falling is a Spark; the rest of the story can be written toward it.",
      "Story Structure lists every chapter synopsis in order. New chapters appear here as you add them. Click a row to open that chapter.",
      "World Timeline is a bulleted list grouped by date headings (Age / Year / Month / Day). Not a calendar.",
      "Synopsis Timeline lists scene titles under each chapter, with that scene’s date.",
      "Protagonist Timeline has three segments: pre-story (you add entries), during the story (scene titles and dates), and after the story (you add entries).",
    ],
  },
  {
    title: "Lookups",
    body: [
      "The search field is the lookup. Type a spell, a name, a wound, a phrase in the Lookups stack and press Enter — or open a saved row. It searches as you type. Toggle Both, Manuscript, or Library. Drag the list to reorder.",
      "The dashboard shows how many times the phrase appears, the first scene, the last scene, and the matching library sheet if there is one. Hits are grouped volume → chapter → scene → the line of text. Click a line to open that scene and land on the phrase.",
      "Who was there lists characters in those scenes. Also on the page lists places and other sheets. Told by is the POV of the hit scenes. Author notes are yours: usual cast, who knows the spell, proficiency, creative uses already spent.",
      "Library aliases (bound-light / bound light) count as the same lookup. Keep one lookup per thing you need to remember three hundred thousand words in. Deleting a lookup sends it to Trash.",
    ],
  },
  {
    title: "Trash",
    body: [
      "Deleted scenes, chapters, volumes, library entries, and lookups wait here. Restore puts them back where they were. The trash can empties only this project’s discarded items. Permanent delete is per item, or Empty trash.",
    ],
  },
  {
    title: "Writing tools",
    body: [
      "The editor toolbar is icon menus: Font (applies to the highlighted passage, not the whole scene), Size, Emphasis, Heading, Alignment, Clear formatting (restores the selection to the project’s body type), Genre emphasis (highlighter), Ornaments. Novel style lives in Project Settings, not on this bar.",
      "Genre emphasis is grouped. LitRPG: System notice, Level up, Private message (a game whisper). Lore: Inscription, Runic, Ancient. Literary: Verse, Letter, Epigraph. Right-click a selection for the same list.",
      "Read aloud sits on the same bar. Choose 1.0×, 1.5×, or 2.0×. Select a passage to hear only that; otherwise the whole scene is read.",
      "Spell check is quiet: native underlines. Library names are already known.",
      "Auto-replace lives in Project. Type teh, get the. Import and export the list, including from another .sisyphus.json project file.",
    ],
  },
  {
    title: "Front matter and cover",
    body: [
      "Cover sits above the Title Page. Build it in Cover studio (footer book-image icon): KDP ebook, or the paperback wrap. Choose which finished front this page uses, then Apply. You can still upload a file here. EPUB, HTML, and PDF use this picture. The paperback wrap PDF is a separate KDP upload — Export → Cover PDF.",
      "Title Page is Cinzel: series, book, author. Then Acknowledgments, Copyright, Foreword. Back matter: Afterword, Cast (everyone in the Character Library), other books in the series, other books by the author.",
      "Power Ranking sits under Lore in the Library stack. Drag character names onto E–S. Drop one name onto another in the same tier to shuffle their order. S is the top of the list. Unranked names wait in the side column.",
    ],
  },
  {
    title: "Project Dashboard",
    body: [
      "Project Dashboard is a sidebar button under Find. It opens in the writing pane and the split: left is this project, split is the comparison project you pick.",
      "Word Counts sit at the top: total words and average chapter length, then each volume. Character Metrics: unique people, related people (shared last / family / clan name), villains, heroes, citizens, gods. Click a name to open the sheet. Word Metrics: spelling slips, repeated phrases, most used nouns / adjectives / verbs. Counted from story text only.",
    ],
  },
  {
    title: "Importing other apps",
    body: [
      "Open project looks in the Projects folder for a Sisyphus project (project.sisyphus.json). Import brings in a foreign manuscript — Word, Google Docs export, Scrivener zip, Atticus/EPUB, RTF, HTML, Markdown, or plain text — as a new project. Characters and places it can name go into those libraries; everything else lands in Imported Library so you can copy it into the right sheet.",
      "A .sisyphus.json or a backup zip with one inside opens as a Sisyphus project, same as Open.",
    ],
  },
  {
    title: "How the book looks",
    body: [
      "Project settings choose the novel style (Classic Trade, Modern Ebook, Folio, Garamond Press, Baskerville), the running header (author, book, volume, POV, series, or custom text) and footer (page number, or custom). Tokens in custom text: {author} {book} {volume} {series} {pov} {page}. They show in Book preview and PDF, not on the writing page. Tick “Show scene date in exported documents” if a scene’s Age / Year / Month / Day should print under the scene title.",
    ],
  },
  {
    title: "Desk colours",
    body: [
      "The palette icon on the right of the footer opens toolbar colour, window colour, toolbar type, and window type. Coffee is the dark default. Reset to defaults in Preferences restores it.",
    ],
  },
  {
    title: "Backup",
    body: [
      "Backups run on their own: a silent copy about 45 seconds after you stop typing, and every five minutes. They zip the whole project folder (Manuscript, libraries, front and back matter, plus project.sisyphus.json) into the backup folder you chose. They never force a download.",
      "New Project asks where the project should live and writes that folder as you work. On Windows the picker opens at C:\\Users\\you\\Sisyphus. Preferences → Sisyphus Settings holds the backup folder and the default projects folder. Project Settings holds this project’s folder.",
    ],
  },
  {
    title: "Desktop app",
    body: [
      "A signed-later Electron build is available as a Windows test download from the links below and from About in the web studio. Unzip and run Sisyphus.exe. If Windows warns, More info → Run anyway. Current test version 1.11.0. About → Update pulls the latest writing desk from GitHub without a new zip. New Project names the book in the window and writes it under C:\\Users\\you\\Sisyphus. The exe icon is the same mountain-and-cobble mark as the studio.",
    ],
  },
  {
    title: "Shortcuts",
    body: [
      "⌘S — save toast (work is already kept on this device).",
      "⌘F — find in project.",
      "⌘N — new scene.",
      "⌘\\ — split editor.",
      "⌘/ — this guide.",
    ],
  },
];

export function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const desktop = typeof window !== "undefined" && Boolean(desktopBridge());
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(42rem,86vh)] w-[min(100%-2rem,40rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User guide</DialogTitle>
          <DialogDescription>How to write a book in Sisyphus.</DialogDescription>
        </DialogHeader>
        <div className="mt-1 flex flex-col gap-5">
          {GUIDE_SECTIONS.map((section) => (
            <section key={section.title}>
              <h3 className="font-display mb-1.5 text-xs tracking-widest text-muted uppercase">
                {section.title}
              </h3>
              {section.body.map((para) => (
                <p key={para.slice(0, 40)} className="mb-2 text-sm leading-relaxed text-fg last:mb-0">
                  {para}
                </p>
              ))}
            </section>
          ))}
          {!desktop && (
            <section>
              <h3 className="font-display mb-1.5 text-xs tracking-widest text-muted uppercase">
                Download the desktop build
              </h3>
              <p className="mb-3 text-sm leading-relaxed text-fg">
                Unsigned Windows test build {APP_VERSION}. Unzip, then run Sisyphus.exe. If Windows
                warns, More info → Run anyway. The exe icon is the mountain-and-cobble mark. Work stays on that computer and does not sync
                with this browser unless you import a backup. New Project will ask where the
                novel’s folder should live.
              </p>
              <ul className="flex flex-col gap-2">
                {DESKTOP_BUILDS.map((build) => (
                  <li key={build.file}>
                    <a
                      href={desktopZipPath(build.file)}
                      download={build.file}
                      className="text-sm text-accent underline-offset-2 hover:underline"
                    >
                      {build.label} — {build.file}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
