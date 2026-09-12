export const MANUSCRIPT_KINDS = ["book", "chapter", "scene"] as const;
export const BIBLE_KINDS = [
  "world",
  "wonder",
  "city",
  "character",
  "faction",
  "political",
  "religion",
  "language",
  "lore",
  "magic",
  "import",
  "species",
  "monster",
] as const;
/** Libraries shown in the sidebar. World and Wonders stay on the type so old projects still open. */
export const LIBRARY_KINDS = [
  "character",
  "faction",
  "city",
  "species",
  "monster",
  "magic",
  "lore",
] as const;
export const FRONT_KINDS = ["cover", "title-page", "acknowledgments", "copyright", "foreword"] as const;
export const BACK_KINDS = ["afterword", "cast", "other-series", "other-author"] as const;
export const CUSTOM_FRONT_KIND = "front-page" as const;
export const CUSTOM_BACK_KIND = "back-page" as const;
export const SCENE_TEMPLATES = ["blank", "character-summary", "character-quote", "location"] as const;
export const HEADER_MODES = ["none", "author", "book", "volume", "pov", "series", "custom"] as const;
export const FOOTER_MODES = ["none", "page", "author", "book", "custom"] as const;
export const CITY_SIZES = ["metropolis", "city", "town", "village", "hamlet", "outpost"] as const;
export const WORLD_TYPES = ["landmass", "ocean", "realm"] as const;
export const FACTION_TYPES = ["faction", "guild", "order", "party", "company", "house", "crew"] as const;
export const POLITICAL_TYPES = ["empire", "kingdom", "republic", "confederacy", "city-state", "compact"] as const;
export const SETTLEMENT_TYPES = [
  "empire",
  "principality",
  "kingdom",
  "duchy",
  "republic",
  "city-state",
  "free-city",
  "colony",
  "town",
  "village",
  "other",
] as const;
export const MAGIC_ENTRY_KINDS = ["spell", "technique", "skill", "rune", "other"] as const;

export type ManuscriptKind = (typeof MANUSCRIPT_KINDS)[number];
export type BibleKind = (typeof BIBLE_KINDS)[number];
export type LibraryKind = (typeof LIBRARY_KINDS)[number];
export type FrontKind = (typeof FRONT_KINDS)[number] | typeof CUSTOM_FRONT_KIND;
export type BackKind = (typeof BACK_KINDS)[number] | typeof CUSTOM_BACK_KIND;
export type MatterKind = FrontKind | BackKind;
export type DocKind = "project" | ManuscriptKind | BibleKind | MatterKind;
export type SceneTemplate = (typeof SCENE_TEMPLATES)[number];
export type HeaderMode = (typeof HEADER_MODES)[number];
export type FooterMode = (typeof FOOTER_MODES)[number];
export type SpeechRate = 1 | 1.5 | 2;
export type CitySize = (typeof CITY_SIZES)[number];
export type WorldType = (typeof WORLD_TYPES)[number];
export type FactionType = (typeof FACTION_TYPES)[number];
export type PoliticalType = (typeof POLITICAL_TYPES)[number];
export type SettlementType = (typeof SETTLEMENT_TYPES)[number];
export type MagicEntryKind = (typeof MAGIC_ENTRY_KINDS)[number];
export const POWER_TIERS = ["S", "A", "B", "C", "D", "E"] as const;
export type PowerTier = (typeof POWER_TIERS)[number];
export const ALIGNMENTS = ["god", "hero", "villain", "citizen"] as const;
export type Alignment = (typeof ALIGNMENTS)[number];
export const ALIGNMENT_LABEL: Record<Alignment, string> = {
  god: "God",
  hero: "Hero",
  villain: "Villain",
  citizen: "Citizen",
};

export interface CharacterLocation {
  chapterId: string;
  location: string;
}

export interface MagicSpell {
  id: string;
  kind: MagicEntryKind;
  name: string;
  description: string;
  cost: string;
  duration: string;
  castTime: string;
  cooldown: string;
}

export interface EntitySheet {
  name: string;
  summary: string;
  aliases: string;
  age: string;
  sex: string;
  appearance: string;
  birthplace: string;
  locations: CharacterLocation[];
  worldType: string;
  climate: string;
  region: string;
  citySize: CitySize | "";
  population: string;
  groupType: string;
  allegiance: string;
  seat: string;
  pantheon: string;
  tenets: string;
  speakers: string;
  script: string;
  nature: string;
  powerTier: PowerTier | "";
  powerOrder: number;
  alignment: Alignment | "";
  settlementId: string;
  attributes: string;
  weaknesses: string;
  strengths: string;
  vocation: string;
  habitat: string;
  behavior: string;
  exports: string;
  imports: string;
  tradeWith: string[];
  warWith: string[];
  alliedWith: string[];
  polityType: string;
  ruler: string;
  landmarks: string;
  notablePeople: string;
  shops: string;
  populationBreakdown: Record<string, string>;
  origin: string;
  spells: MagicSpell[];
}

export type CharacterSheet = EntitySheet;

export interface TitlePage {
  seriesName: string;
  bookTitle: string;
  authorName: string;
}

export interface AutoReplaceRule {
  id: string;
  from: string;
  to: string;
}

export interface AutoReplaceFile {
  version: 1;
  rules: { from: string; to: string }[];
}

export interface Tracker {
  id: string;
  name: string;
  query: string;
  scope?: TrackerScope;
  notes?: string;
}

export const TRACKER_SCOPES = ["both", "manuscript", "library"] as const;
export type TrackerScope = (typeof TRACKER_SCOPES)[number];

export interface CustomFont {
  id: string;
  name: string;
  dataUrl: string;
}

export const EVENT_KINDS = [
  "age",
  "celestial",
  "empire",
  "apocalypse",
  "battle",
  "fight",
  "birthday",
  "other",
] as const;
export type EventKind = (typeof EVENT_KINDS)[number];
export const EVENT_KIND_LABEL: Record<EventKind, string> = {
  age: "Age",
  celestial: "Celestial",
  empire: "Empire",
  apocalypse: "Apocalypse",
  battle: "Battle",
  fight: "Fight",
  birthday: "Birthday",
  other: "Event",
};

export interface EraDate {
  age: string;
  year: string;
  month: string;
  day: string;
}

export interface WorldEvent {
  id: string;
  title: string;
  kind: EventKind;
  date: EraDate;
  notes: string;
  characterId?: string;
}

export interface ChapterSpan {
  chapterId: string;
  start: EraDate;
  end: EraDate;
}

export interface ProtagonistSpan {
  characterId: string;
  birth: EraDate;
}

export interface ProjectTimeline {
  world: WorldEvent[];
  chapters: ChapterSpan[];
  protagonists: ProtagonistSpan[];
}

export interface Spark {
  id: string;
  title: string;
  body: string;
}

export interface TimelineBullet {
  id: string;
  date: EraDate;
  title: string;
  body: string;
}

export interface ProjectSchematic {
  brief: string;
  events: string;
  sparks: Spark[];
  world: TimelineBullet[];
  preStory: TimelineBullet[];
  afterStory: TimelineBullet[];
}

export const COVER_PAPERS = ["white", "cream", "standard-color", "premium-color"] as const;
export type CoverPaper = (typeof COVER_PAPERS)[number];
export const COVER_USES = ["ebook", "paperback"] as const;
export type CoverUse = (typeof COVER_USES)[number];
export const BARCODE_MODES = ["kdp", "custom", "none"] as const;
export type BarcodeMode = (typeof BARCODE_MODES)[number];

export interface CoverArt {
  image: string;
  scale: number;
  x: number;
  y: number;
}

export interface CoverStudio {
  paper: CoverPaper;
  pageCountMode: "auto" | "manual";
  pageCount: number;
  coverColor: string;
  spineColor: string;
  spineColorOn: boolean;
  series: string;
  title: string;
  author: string;
  spineVolume: string;
  backSynopsis: string;
  publisher: string;
  isbn: string;
  barcodeMode: BarcodeMode;
  barcodeImage: string;
  backImage: string;
  seriesIcons: string[];
  art: CoverArt;
  showGuides: boolean;
}

export function emptyEra(): EraDate {
  return { age: "", year: "", month: "", day: "" };
}

export function emptyTimeline(): ProjectTimeline {
  return { world: [], chapters: [], protagonists: [] };
}

export function emptySchematic(): ProjectSchematic {
  return { brief: "", events: "", sparks: [], world: [], preStory: [], afterStory: [] };
}

export function schematicOf(project?: Doc | null): ProjectSchematic {
  const existing = project?.schematic;
  const next: ProjectSchematic = {
    brief: existing?.brief ?? "",
    events: existing?.events ?? "",
    sparks: existing?.sparks ?? [],
    world: existing?.world ?? [],
    preStory: existing?.preStory ?? [],
    afterStory: existing?.afterStory ?? [],
  };
  if (!existing?.world) {
    next.world = (project?.timeline?.world ?? []).map((ev) => ({
      id: ev.id,
      date: ev.date,
      title: ev.title,
      body: ev.notes ?? "",
    }));
  }
  return next;
}

export function emptyCoverArt(): CoverArt {
  return { image: "", scale: 1, x: 0.5, y: 0.5 };
}

export const COVER_PLACEHOLDER = {
  series: "The Series",
  title: "The Title",
  author: "The Author",
  synopsis: "A few sentences on the back of the book — the promise of the story.",
  publisher: "Publisher",
  isbn: "978-0-000000-00-0",
  volume: "Vol. I",
} as const;

export function emptyCoverStudio(): CoverStudio {
  return {
    paper: "cream",
    pageCountMode: "auto",
    pageCount: 24,
    coverColor: "#2c2118",
    spineColor: "#3a2a24",
    spineColorOn: false,
    series: COVER_PLACEHOLDER.series,
    title: COVER_PLACEHOLDER.title,
    author: COVER_PLACEHOLDER.author,
    spineVolume: COVER_PLACEHOLDER.volume,
    backSynopsis: COVER_PLACEHOLDER.synopsis,
    publisher: COVER_PLACEHOLDER.publisher,
    isbn: COVER_PLACEHOLDER.isbn,
    barcodeMode: "kdp",
    barcodeImage: "",
    backImage: "",
    seriesIcons: [],
    art: emptyCoverArt(),
    showGuides: true,
  };
}

export function coverStudioOf(project?: Doc | null): CoverStudio {
  const existing = project?.coverStudio as (CoverStudio & {
    subtitle?: string;
    spineLocked?: boolean;
    spineTitle?: string;
    logoImage?: string;
    extraImage?: string;
  }) | undefined;
  const base = emptyCoverStudio();
  return {
    ...base,
    ...(existing ?? {}),
    series: existing?.series || existing?.subtitle || base.series,
    coverColor: existing?.coverColor || base.coverColor,
    spineColorOn: existing?.spineColorOn ?? false,
    seriesIcons: existing?.seriesIcons ?? [],
    spineVolume: existing?.spineVolume ?? "",
    art: { ...emptyCoverArt(), ...(existing?.art ?? {}) },
  };
}

export function emptySpell(): MagicSpell {
  return {
    id: "",
    kind: "spell",
    name: "",
    description: "",
    cost: "",
    duration: "",
    castTime: "",
    cooldown: "",
  };
}

export function emptyEntitySheet(name = "", kind?: DocKind): EntitySheet {
  return {
    name,
    summary: "",
    aliases: "",
    age: "",
    sex: "",
    appearance: "",
    birthplace: "",
    locations: [],
    worldType: kind === "world" ? "landmass" : "",
    climate: "",
    region: "",
    citySize: "",
    population: "",
    groupType: kind === "faction" ? "faction" : kind === "political" ? "kingdom" : "",
    allegiance: "",
    seat: "",
    pantheon: "",
    tenets: "",
    speakers: "",
    script: "",
    nature: "",
    powerTier: "",
    powerOrder: 0,
    alignment: "",
    settlementId: "",
    attributes: "",
    weaknesses: "",
    strengths: "",
    vocation: "",
    habitat: "",
    behavior: "",
    exports: "",
    imports: "",
    tradeWith: [],
    warWith: [],
    alliedWith: [],
    polityType: kind === "city" ? "kingdom" : "",
    ruler: "",
    landmarks: "",
    notablePeople: "",
    shops: "",
    populationBreakdown: {},
    origin: "",
    spells: [],
  };
}

export function emptyCharacterSheet(name = ""): CharacterSheet {
  return emptyEntitySheet(name, "character");
}

export function emptyTitlePage(bookTitle = ""): TitlePage {
  return { seriesName: "", bookTitle, authorName: "" };
}

export interface Doc {
  id: string;
  kind: DocKind;
  title: string;
  parentId: string | null;
  order: number;
  content: string;
  updatedAt: number;
  sheet?: EntitySheet;
  titlePage?: TitlePage;
  coverImage?: string;
  novelStyle?: "trade" | "modern" | "folio" | "garamond" | "baskerville";
  sceneTemplate?: SceneTemplate;
  povCharacterId?: string;
  sceneDate?: EraDate;
  showSceneDate?: boolean;
  autoReplace?: AutoReplaceRule[];
  trackers?: Tracker[];
  headerMode?: HeaderMode;
  footerMode?: FooterMode;
  headerCustom?: string;
  footerCustom?: string;
  autocomplete?: string[];
  projectFolder?: string;
  colorScheme?: string;
  trimSize?: string;
  speechRate?: SpeechRate;
  sidebarOpen?: {
    find?: boolean;
    manuscript?: boolean;
    library?: boolean;
    timeline?: boolean;
    schematic?: boolean;
    lookups?: boolean;
    trash?: boolean;
  };
  sidebarHeights?: {
    library?: number;
    timeline?: number;
    schematic?: number;
    lookups?: number;
    trash?: number;
  };
  timeline?: ProjectTimeline;
  schematic?: ProjectSchematic;
  compareProjectId?: string;
  coverStudio?: CoverStudio;
  coverUse?: CoverUse;
  authorName?: string;
  lastOpened?: number;
}

export const KIND_LABEL: Record<DocKind, string> = {
  project: "Project",
  book: "Volume",
  chapter: "Chapter",
  scene: "Scene",
  world: "World",
  wonder: "Wonder",
  city: "Settlement",
  character: "Character",
  faction: "Faction",
  political: "Polity",
  religion: "Faith",
  language: "Language",
  lore: "Lore",
  magic: "Magic system",
  import: "Imported",
  species: "Species",
  monster: "Monster",
  cover: "Cover",
  "title-page": "Title Page",
  acknowledgments: "Acknowledgments",
  copyright: "Copyright",
  foreword: "Foreword",
  afterword: "Afterword",
  cast: "Cast",
  "other-series": "Other Books in this Series",
  "other-author": "Other Books by the Author",
  "front-page": "Page",
  "back-page": "Page",
};

export const BIBLE_SECTION: Record<BibleKind, string> = {
  world: "World",
  wonder: "Wonders",
  city: "Settlements",
  character: "Characters",
  faction: "Factions",
  political: "Polities",
  religion: "Faiths",
  language: "Languages",
  lore: "Lore",
  magic: "Magic System",
  import: "Imported",
  species: "Species",
  monster: "Monsterpedia",
};

export const BIBLE_HINT: Record<BibleKind, string> = {
  world: "Landmasses, oceans, and other realms.",
  wonder: "Geographic marvels — impassable spires, scars in the land, places the maps refuse.",
  city: "Settlements: cities, towns, kingdoms, and the rest.",
  character: "People. Names in the manuscript tint and open their sheet.",
  faction: "Factions, guilds, orders, parties, crews.",
  political: "Empires, kingdoms, republics, and other large systems.",
  religion: "Faiths, cults, pantheons, and their tenets.",
  language: "Tongues, scripts, and who speaks them.",
  lore: "History, treaties, and what the world remembers.",
  magic: "Named systems of magic, and the spells that belong to them.",
  import: "Brought in from Scrivener, Word, and the rest. Sort into the right library.",
  species: "Intelligent races. Appearance, traits, and what they are best at.",
  monster: "Beasts and monsters of the world.",
};

export const CITY_SIZE_LABEL: Record<CitySize, string> = {
  metropolis: "Metropolis",
  city: "City",
  town: "Town",
  village: "Village",
  hamlet: "Hamlet",
  outpost: "Outpost",
};

export const SETTLEMENT_TYPE_LABEL: Record<SettlementType, string> = {
  empire: "Empire",
  principality: "Principality",
  kingdom: "Kingdom",
  duchy: "Duchy",
  republic: "Republic",
  "city-state": "City-state",
  "free-city": "Free city",
  colony: "Colony",
  town: "Town",
  village: "Village",
  other: "Other",
};

export const MAGIC_ENTRY_LABEL: Record<MagicEntryKind, string> = {
  spell: "Spell",
  technique: "Technique",
  skill: "Skill",
  rune: "Rune",
  other: "Other",
};

export const TEMPLATE_LABEL: Record<SceneTemplate, string> = {
  blank: "Blank scene",
  "character-summary": "Character summary",
  "character-quote": "Character quote",
  location: "Location description",
};

export const HEADER_LABEL: Record<HeaderMode, string> = {
  none: "None",
  author: "Author name",
  book: "Book name",
  volume: "Volume name",
  pov: "Character name (POV)",
  series: "Series name",
  custom: "Custom text",
};

export const FOOTER_LABEL: Record<FooterMode, string> = {
  none: "None",
  page: "Page number",
  author: "Author name",
  book: "Book name",
  custom: "Custom text",
};

export const COVER_PAPER_LABEL: Record<CoverPaper, string> = {
  white: "White paper (black & white)",
  cream: "Cream paper (novels)",
  "standard-color": "Standard colour",
  "premium-color": "Premium colour",
};

export function isManuscriptKind(kind: DocKind): kind is ManuscriptKind {
  return (MANUSCRIPT_KINDS as readonly string[]).includes(kind);
}

export function isBibleKind(kind: DocKind): kind is BibleKind {
  return (BIBLE_KINDS as readonly string[]).includes(kind);
}

export function isFrontKind(kind: DocKind): kind is FrontKind {
  return (FRONT_KINDS as readonly string[]).includes(kind) || kind === CUSTOM_FRONT_KIND;
}

export function isBackKind(kind: DocKind): kind is BackKind {
  return (BACK_KINDS as readonly string[]).includes(kind) || kind === CUSTOM_BACK_KIND;
}

export function isMatterKind(kind: DocKind): kind is MatterKind {
  return isFrontKind(kind) || isBackKind(kind);
}

export function isUniqueMatterKind(kind: DocKind): kind is Exclude<MatterKind, typeof CUSTOM_FRONT_KIND | typeof CUSTOM_BACK_KIND> {
  return (FRONT_KINDS as readonly string[]).includes(kind) || (BACK_KINDS as readonly string[]).includes(kind);
}

export function isCustomMatterKind(kind: DocKind): kind is typeof CUSTOM_FRONT_KIND | typeof CUSTOM_BACK_KIND {
  return kind === CUSTOM_FRONT_KIND || kind === CUSTOM_BACK_KIND;
}

export interface TrashEntry {
  id: string;
  deletedAt: number;
  projectId: string;
  parentId: string | null;
  title: string;
  kind: DocKind | "tracker";
  docs: Record<string, Doc>;
  order: number;
  tracker?: Tracker;
}

export type HistoryOp =
  | { type: "trash"; entries: TrashEntry[] }
  | { type: "restore"; entries: TrashEntry[] }
  | {
      type: "orders";
      before: Array<{ id: string; parentId: string | null; order: number }>;
      after: Array<{ id: string; parentId: string | null; order: number }>;
    }
  | { type: "trackers"; projectId: string; before: Tracker[]; after: Tracker[] };

export interface ProjectBackup {
  version: 1 | 2;
  docs: Record<string, Doc>;
  currentProjectId: string;
  mainId: string;
  splitId: string | null;
  splitOpen: boolean;
  collapsed?: Record<string, boolean>;
}

export function isProjectBackup(data: unknown): data is ProjectBackup {
  if (!data || typeof data !== "object") return false;
  const v = data as Record<string, unknown>;
  if (v.version !== 1 && v.version !== 2) return false;
  return Boolean(v.docs && typeof v.docs === "object");
}

export function isAutoReplaceFile(data: unknown): data is AutoReplaceFile {
  return Boolean(
    data &&
      typeof data === "object" &&
      (data as Record<string, unknown>).version === 1 &&
      Array.isArray((data as Record<string, unknown>).rules),
  );
}
