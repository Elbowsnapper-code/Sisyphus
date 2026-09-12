import type { Doc } from "@/lib/types";
import { htmlToPlain } from "@/lib/text";
import { books, childrenOf, descendantIds } from "@/lib/tree";
import { charactersInProject, sheetOf } from "@/lib/entities";
import { misspellingCounts, projectDictionary } from "@/lib/spell";
import { matterOfKind } from "@/lib/matter";

export type StatsScopeKind = "series" | "volume" | "chapter" | "scene";

export interface StatsScope {
  kind: StatsScopeKind;
  id: string;
}

export interface Counted {
  word: string;
  count: number;
}

export interface CastEntry {
  id: string;
  name: string;
  aliases: string;
  summary: string;
  powerTier: string;
  alignment: string;
  mentioned: boolean;
}

export interface VolumeStats {
  id: string;
  title: string;
  words: number;
  chapters: number;
  avgChapter: number;
  medianChapter: number;
  characters: number;
}

export interface SeriesReport {
  projectId: string;
  projectTitle: string;
  seriesName: string;
  scopeLabel: string;
  totalWords: number;
  avgChapter: number;
  volumes: VolumeStats[];
  cast: CastEntry[];
  totalCharacters: number;
  mentionedCharacters: number;
  relatedCharacters: number;
  gods: number;
  heroes: number;
  villains: number;
  citizens: number;
  nouns: Counted[];
  adjectives: Counted[];
  verbs: Counted[];
  misspellings: Counted[];
  phrases: Counted[];
}

const STOP = new Set(
  `
the be to of and a in that have i it for not on with he as you do at this but his by from they we
say her she or an will my one all would there their what so up out if about who get which go me when
make can like time no just him know take people into year your good some could them see other than
then now look only come its over think also back after use two how our work first well way even new
want because any these give day most us is was are were been being am had has having did does doing
nor never none nothing nobody neither myself yourself himself herself itself ourselves themselves
this that these those here there where when why how what which who whom whose a an the some any each
every either both few many much more most another such and or but if then else than as until while
although though because since so yet still of in to for with on at from by about into through during
before after above below between under again further once can could may might must shall should will
would do does did have has had go get make take come see know think look use find give tell work
very really quite rather almost always often sometimes already too into onto upon within without
toward towards across along around among against yes perhaps maybe probably certainly indeed however
therefore said says asked replied
`.split(/\s+/).filter(Boolean),
);

const ADJ = new Set(
  `
able aching ancient black blue bright brittle calm careful clean clear cold common dark deep dry
empty even faint far fast few final flat full gentle glass gold good grand great green grey hard
harsh heavy high hollow honest huge inland last late legal lesser light little long loud low old
open pale particular private quiet red ringing salt sharp short small soft southern still stubborn
sweet thin true warm white wide young official obedient precise dry startling inland northern
forbidden visible stubborn precise
`.split(/\s+/).filter(Boolean),
);

const VERB = new Set(
  `
arrive ask begin believe bring build buy call carry catch change come continue create cross cut
decide die draw expect fall feel find follow freeze get give go grow happen hear help hold keep
kill know lead leave learn let live look lose make mean meet move need offer open pass pay play
pull put raise reach read refuse remain remember report require run see sell send serve set shine
show sit speak spend stand stay stop suggest take tell think travel try turn wait walk want watch
win write unrolled wandered knelt pretended admitted harvested
`.split(/\s+/).filter(Boolean),
);

const ADJ_SUF = /(ful|ous|ible|able|less|ish|ive|ical|tic|ent|ant|ary|ory)$/;
const VERB_SUF = /(ing|ized|ises|ized|ates|ated|ened|ified|ify)$/;
const NOUN_SUF = /(tion|sion|ness|ment|ity|ance|ence|ship|hood|ism|ist|age|ure|dom|er|or)$/;

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function sceneDocs(docs: Record<string, Doc>, rootId: string): Doc[] {
  const root = docs[rootId];
  if (!root) return [];
  if (root.kind === "scene") return [root];
  return descendantIds(docs, rootId)
    .map((id) => docs[id])
    .filter((d): d is Doc => Boolean(d && d.kind === "scene"));
}

function storyPlain(docs: Record<string, Doc>, ids: string[]): string {
  return ids
    .map((id) => docs[id])
    .filter((d): d is Doc => Boolean(d && d.kind === "scene"))
    .map((d) => htmlToPlain(d.content))
    .filter(Boolean)
    .join("\n");
}

function chapterWords(docs: Record<string, Doc>, chapterId: string): number {
  return sceneDocs(docs, chapterId).reduce((sum, s) => sum + wordCountPlain(htmlToPlain(s.content)), 0);
}

function wordCountPlain(text: string): number {
  if (!text.trim()) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z'-]*/g) ?? []).map((w) => w.replace(/['']/g, "'"));
}

function classify(word: string): "noun" | "adj" | "verb" | null {
  if (word.length < 3) return null;
  if (STOP.has(word)) return null;
  if (ADJ.has(word) || ADJ_SUF.test(word)) return "adj";
  if (VERB.has(word) || VERB_SUF.test(word) || /ed$/.test(word)) return "verb";
  if (NOUN_SUF.test(word) || word.length >= 4) return "noun";
  return "noun";
}

function topCounts(map: Map<string, number>, limit: number): Counted[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

function posAndPhrases(text: string): {
  nouns: Counted[];
  adjectives: Counted[];
  verbs: Counted[];
  phrases: Counted[];
} {
  const tokens = tokenize(text);
  const nouns = new Map<string, number>();
  const adjectives = new Map<string, number>();
  const verbs = new Map<string, number>();
  for (const word of tokens) {
    const kind = classify(word);
    if (kind === "noun") nouns.set(word, (nouns.get(word) ?? 0) + 1);
    else if (kind === "adj") adjectives.set(word, (adjectives.get(word) ?? 0) + 1);
    else if (kind === "verb") verbs.set(word, (verbs.get(word) ?? 0) + 1);
  }
  const phrases = new Map<string, number>();
  for (let n = 2; n <= 4; n++) {
    for (let i = 0; i <= tokens.length - n; i++) {
      const slice = tokens.slice(i, i + n);
      if (slice.every((w) => STOP.has(w))) continue;
      if (!slice.some((w) => !STOP.has(w) && w.length >= 4)) continue;
      const phrase = slice.join(" ");
      phrases.set(phrase, (phrases.get(phrase) ?? 0) + 1);
    }
  }
  const phraseList = [...phrases.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 16)
    .map(([word, count]) => ({ word, count }));
  return {
    nouns: topCounts(nouns, 12),
    adjectives: topCounts(adjectives, 12),
    verbs: topCounts(verbs, 12),
    phrases: phraseList,
  };
}

function mentionedIn(text: string, name: string, aliases: string): boolean {
  const hay = text.toLowerCase();
  const labels = [name, ...aliases.split(",")]
    .map((s) => s.trim())
    .filter((s) => s.length >= 2)
    .sort((a, b) => b.length - a.length);
  return labels.some((label) => hay.includes(label.toLowerCase()));
}

function familyKey(name: string, aliases = ""): string {
  const tokens = [name, ...aliases.split(",")]
    .map((s) => s.trim())
    .filter(Boolean);
  for (const label of tokens) {
    const parts = label.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return parts[parts.length - 1]!.toLowerCase();
  }
  return "";
}

function relatedCount(cast: Array<{ name: string; aliases: string }>): number {
  const keys = new Map<string, number>();
  for (const person of cast) {
    const key = familyKey(person.name, person.aliases);
    if (!key) continue;
    keys.set(key, (keys.get(key) ?? 0) + 1);
  }
  let n = 0;
  for (const person of cast) {
    const key = familyKey(person.name, person.aliases);
    if (key && (keys.get(key) ?? 0) >= 2) n += 1;
  }
  return n;
}

function scopeRoot(docs: Record<string, Doc>, projectId: string, scope?: StatsScope): { id: string; label: string } {
  if (!scope || scope.kind === "series") {
    return { id: projectId, label: "Series" };
  }
  const doc = docs[scope.id];
  if (!doc) return { id: projectId, label: "Series" };
  return { id: doc.id, label: doc.title };
}

export function buildSeriesReport(
  docs: Record<string, Doc>,
  projectId: string,
  ignoreWords: string[] = [],
  scope?: StatsScope,
): SeriesReport {
  const project = docs[projectId];
  const titlePage = matterOfKind(docs, projectId, "title-page")?.titlePage;
  const seriesName = titlePage?.seriesName || project?.title || "Untitled";
  const projectTitle = project?.title || "Untitled";
  const root = scopeRoot(docs, projectId, scope);
  const extras = projectDictionary(docs, projectId, ignoreWords);

  const volumeList = books(docs, projectId);
  const volumes: VolumeStats[] = volumeList.map((book) => {
    const chapters = childrenOf(docs, book.id).filter((d) => d.kind === "chapter");
    const lengths = chapters.map((ch) => chapterWords(docs, ch.id));
    const scenes = sceneDocs(docs, book.id);
    const text = scenes.map((s) => htmlToPlain(s.content)).join("\n");
    const chars = charactersInProject(docs, projectId).filter((c) => {
      const sheet = sheetOf(c);
      return mentionedIn(text, sheet.name || c.title, sheet.aliases);
    });
    return {
      id: book.id,
      title: book.title,
      words: scenes.reduce((sum, s) => sum + wordCountPlain(htmlToPlain(s.content)), 0),
      chapters: chapters.length,
      avgChapter: Math.round(average(lengths)),
      medianChapter: Math.round(median(lengths)),
      characters: chars.length,
    };
  });

  const sceneIds =
    !scope || scope.kind === "series"
      ? volumeList.flatMap((book) => sceneDocs(docs, book.id).map((s) => s.id))
      : sceneDocs(docs, root.id).map((s) => s.id);
  const text = storyPlain(docs, sceneIds);
  const pos = posAndPhrases(text);
  const miss = misspellingCounts(text, extras);
  const cast = charactersInProject(docs, projectId).map((c) => {
    const sheet = sheetOf(c);
    return {
      id: c.id,
      name: sheet.name || c.title,
      aliases: sheet.aliases,
      summary: sheet.summary,
      powerTier: sheet.powerTier || "",
      alignment: sheet.alignment || "",
      mentioned: mentionedIn(text, sheet.name || c.title, sheet.aliases),
    };
  });

  const chapterLengths = volumes.flatMap((v) => {
    const book = docs[v.id];
    if (!book) return [];
    return childrenOf(docs, book.id)
      .filter((d) => d.kind === "chapter")
      .map((ch) => chapterWords(docs, ch.id));
  });

  return {
    projectId,
    projectTitle,
    seriesName,
    scopeLabel: root.label,
    totalWords: wordCountPlain(text),
    avgChapter: Math.round(average(chapterLengths)),
    volumes:
      scope?.kind === "volume" ? volumes.filter((v) => v.id === scope.id) : volumes,
    cast,
    totalCharacters: cast.length,
    mentionedCharacters: cast.filter((c) => c.mentioned).length,
    relatedCharacters: relatedCount(cast),
    gods: cast.filter((c) => c.alignment === "god").length,
    heroes: cast.filter((c) => c.alignment === "hero").length,
    villains: cast.filter((c) => c.alignment === "villain").length,
    citizens: cast.filter((c) => c.alignment === "citizen").length,
    nouns: pos.nouns,
    adjectives: pos.adjectives,
    verbs: pos.verbs,
    misspellings: topCounts(miss, 12),
    phrases: pos.phrases,
  };
}
