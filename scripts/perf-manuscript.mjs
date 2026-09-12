#!/usr/bin/env node
/**
 * Size / stringify cost of a Sisyphus-shaped project at 300k, 500k, and 1M words.
 * IndexedDB (not localStorage) is required past ~5 MB.
 */
const WORDS = [300_000, 500_000, 1_000_000];

function paragraph(n) {
  const sentence =
    "The glass remembered the keel and gave it back as a line that would not sit still on any honest chart. ";
  const words = sentence.trim().split(/\s+/).length;
  const need = Math.ceil(n / words);
  return `<p>${sentence.repeat(need)}</p>`;
}

function project(wordCount) {
  const scenes = 12;
  const per = Math.floor(wordCount / scenes);
  const docs = {
    proj: { id: "proj", kind: "project", title: "Load Test", parentId: null, order: 0, content: "" },
    book: { id: "book", kind: "book", title: "Untitled Volume", parentId: "proj", order: 0, content: "" },
  };
  for (let i = 0; i < scenes; i++) {
    const ch = `ch-${i}`;
    const sc = `sc-${i}`;
    docs[ch] = { id: ch, kind: "chapter", title: `Untitled Chapter`, parentId: "book", order: i, content: "" };
    docs[sc] = { id: sc, kind: "scene", title: `Untitled Scene`, parentId: ch, order: 0, content: paragraph(per) };
  }
  return { version: 2, docs, currentProjectId: "proj", mainId: "sc-0", splitId: null, splitOpen: false, collapsed: {} };
}

function fmt(n) {
  return n.toLocaleString("en-US");
}

console.log("Sisyphus manuscript size test (JSON snapshot)\n");
for (const n of WORDS) {
  const payload = project(n);
  const t0 = performance.now();
  const json = JSON.stringify(payload);
  const t1 = performance.now();
  const t2 = performance.now();
  JSON.parse(json);
  const t3 = performance.now();
  const bytes = Buffer.byteLength(json);
  const mb = bytes / (1024 * 1024);
  console.log(
    `${fmt(n)} words  ${mb.toFixed(1)} MB JSON  stringify ${ (t1 - t0).toFixed(0) } ms  parse ${ (t3 - t2).toFixed(0) } ms  ${mb > 5 ? "needs IndexedDB" : "fits localStorage"}`,
  );
}
console.log(`
Mitigations already in 1.5.0:
- Persist in IndexedDB (sisyphus-v4), 400 ms write throttle
- Do not persist undo / seek / open trackers
- Entity linking runs on idle, not every keystroke
- Book preview paginates ~320 words per page

Slowdown typically starts when the open scene is huge (decorate + layout),
not when other volumes sit closed in the tree. Split long volumes into scenes
and chapters. Multiple 300k volumes are fine if you edit one scene at a time.
`);
