import { emptyEntitySheet, type Doc } from "@/lib/types";

const T = Date.UTC(2026, 7, 18, 14, 0, 0);

function doc(
  id: string,
  kind: Doc["kind"],
  title: string,
  parentId: string | null,
  order: number,
  content: string,
  extra?: Partial<Doc>,
): Doc {
  return { id, kind, title, parentId, order, content, updatedAt: T, ...extra };
}

function p(...paragraphs: string[]): string {
  return paragraphs.map((text) => `<p>${text}</p>`).join("");
}

export const SEED_SAVED_AT = T;
export const SEED_PROJECT_ID = "proj-glass-sea";
export const SEED_MAIN_ID = "sc-salt-paper";
export const SEED_SPLIT_ID = "char-mira";

export function createSeedDocs(): Record<string, Doc> {
  const docs: Doc[] = [
    doc(
      SEED_PROJECT_ID,
      "project",
      "The Glass Sea",
      null,
      0,
      p(
        "A novel project: maps, lanterns, and a sea that remembers. Rename this project from the footer Project menu, or start another from Save → New project.",
      ),
      {
        novelStyle: "trade",
        headerMode: "book",
        footerMode: "page",
        autoReplace: [
          { id: "ar-teh", from: "teh", to: "the" },
          { id: "ar-vale", from: "Mira vale", to: "Mira Vale" },
        ],
        trackers: [
          { id: "trk-mira", name: "Mira Vale", query: "Mira Vale", scope: "both" },
          {
            id: "trk-bound",
            name: "Bound-light",
            query: "bound-light",
            scope: "both",
            notes:
              "Usual cast: Mira threads it, she does not throw it. Kael has seen the tether; the order has not. Proficiency: a short thread without shaking, not a cage. First used as a warning at Crag’s Rest.",
          },
          { id: "trk-level", name: "Level", query: "LEVEL UP", scope: "manuscript" },
        ],
        schematic: {
          brief:
            "A cartographer is hired to draw a sea that freezes into glass. The ice remembers every ship it has kept.",
          events: "The Compact’s letter. The wandering meridian. Bound-light on the barge.",
          sparks: [
            {
              id: "spark-meridian",
              title: "The ice remembers",
              body: "Mira sets her survey beside the official line and watches the frost walk west of the ink.",
            },
          ],
          world: [
            {
              id: "ev-compact",
              date: { age: "Third Age", year: "1881", month: "Frost", day: "1" },
              title: "The Compact writes",
              body: "Nine harbors commission a new meridian.",
            },
          ],
          preStory: [],
          afterStory: [],
        },
      },
    ),
    doc("front-cover", "cover", "Cover", SEED_PROJECT_ID, -1, ""),
    doc(
      "front-title",
      "title-page",
      "Title Page",
      SEED_PROJECT_ID,
      0,
      "",
      {
        titlePage: {
          seriesName: "The Glass Sea",
          bookTitle: "The Glass Meridian",
          authorName: "M. Vale",
        },
      },
    ),
    doc(
      "front-copyright",
      "copyright",
      "Copyright",
      SEED_PROJECT_ID,
      1,
      p(
        "Copyright © 2026 M. Vale",
        "All rights reserved. No part of this book may be reproduced or used in any manner without written permission of the copyright owner, except for the use of brief quotations in a book review.",
        "First edition.",
        "The Glass Meridian is a work of fiction. Names, characters, places, and incidents are the product of the author’s imagination or are used fictitiously.",
      ),
    ),
    doc(
      "front-ack",
      "acknowledgments",
      "Acknowledgments",
      SEED_PROJECT_ID,
      2,
      p(
        "With thanks to the clerks who keep impossible charts, the skippers who still go out after freeze, and anyone who has ever argued with a map and been right.",
      ),
    ),
    doc(
      "front-foreword",
      "foreword",
      "Foreword",
      SEED_PROJECT_ID,
      3,
      p(
        "This is a story about a line that will not stay put. If you have ever trusted a chart more than the water under you, you already know how it ends. If you have not, begin here.",
      ),
    ),
    doc(
      "book-meridian",
      "book",
      "The Glass Meridian",
      SEED_PROJECT_ID,
      0,
      p(
        "A cartographer is hired to draw a sea that freezes into glass each winter — and finds that the ice remembers every ship it has ever kept.",
      ),
    ),
    doc(
      "ch-commission",
      "chapter",
      "The Commission",
      "book-meridian",
      0,
      p("Mira is summoned south. The Compact does not write unless the water has gone wrong."),
    ),
    doc(
      "sc-salt-paper",
      "scene",
      "Salt Paper",
      "ch-commission",
      0,
      p(
        "The letter arrived on salt paper, which meant it had crossed the Glass Sea in winter. Mira Vale turned it to the lamp before she broke the seal. Salt paper always shone a little, as if the ice it had traveled over still lived in the fibers.",
        "“Mira Vale, Cartographer of Inland Measures,” it began, in a hand too careful to be a clerk’s. “The Compact of Nine Harbors requires a meridian. You will draw the Glass Sea as it is, not as the old charts wish it to be. Passage and keep provided. Refuse, and we will find a lesser pen.”",
        "She had not been called a lesser pen in twelve years. She set the letter down on the only clean corner of her table, among compasses and a cup of tea gone to rust, and laughed once, quietly, because the Compact did not write to people like her unless something on the water had gone wrong.",
      ),
      { povCharacterId: "char-mira", sceneDate: { age: "Third Age", year: "1881", month: "Frost", day: "12" } },
    ),
    doc(
      "sc-last-light",
      "scene",
      "Last Light at the Pier",
      "ch-commission",
      1,
      p(
        "Hollow Key was a town that pretended not to be a port. Its streets turned their shoulders to the water. Only the pier admitted what the place was for: a long black finger of tarred wood, and at the end of it a barge the color of old pewter, lanterns already lit though the sun had not quite gone.",
        "Captain Rhos Fen did not offer a hand. She offered a look, which was worse. “You’re the inland one,” she said. “Try not to map the deck. It moves.”",
        "Mira stepped aboard with her case of instruments and the letter folded against her ribs. The barge smelled of salt, lamp oil, and a sweetness she could not place — like apples left too long in a cold room. Bound-light, she would learn later. The first lantern was already watching her.",
      ),
      { povCharacterId: "char-mira", sceneDate: { age: "Third Age", year: "1881", month: "Frost", day: "14" } },
    ),
    doc(
      "ch-harbors",
      "chapter",
      "Nine Harbors",
      "book-meridian",
      1,
      p("The Compact’s maps agree with each other. The sea does not."),
    ),
    doc(
      "sc-charts",
      "scene",
      "Charts That Lie",
      "ch-harbors",
      0,
      p(
        "Archivist Senn kept the charts in a room without windows, which Mira thought was either wisdom or a kind of joke. “Light fades ink,” Senn said, as if that explained the dark. Their hands were powdered with chalk. “And the sea fades certainty. We prefer the ink.”",
        "They unrolled the official meridian: a clean line, ruled in 1881, crossing nine harbors as if the water had ever been that obedient. Mira set her own survey beside it. Already, in two days of soundings, the ice-edge had wandered west of the old mark by three miles.",
        "“The Compact will not like a wandering line,” Senn said.",
        "“Then the Compact may write to the frost,” Mira said, and was surprised to hear the inland in her own voice, still stubborn after the letter.",
      ),
    ),
    doc(
      "sc-clerk",
      "scene",
      "The Compact’s Clerk",
      "ch-harbors",
      1,
      p(
        "The clerk arrived at dusk with a satchel full of stamps and the particular smile of a person who has never been cold. “Amendations are to be submitted in triplicate,” he said, before he had looked at the water.",
        "Rhos watched him from the rail, chewing a strip of dried lemon. “He’ll want the sea to initial them.”",
        "Mira took the forms because refusing paper never saved anyone. She filled the first line with the truth — <em>the meridian has moved</em> — and the clerk’s smile thinned, as if truth were a kind of smudge.",
      ),
    ),
    doc(
      "ch-ice",
      "chapter",
      "What the Ice Keeps",
      "book-meridian",
      2,
      p("Winter arrives early. The Glass Sea begins to remember."),
    ),
    doc(
      "sc-freeze",
      "scene",
      "First Freeze",
      "ch-ice",
      0,
      p(
        "It began at the bow: a skin of glass so thin it rang when the barge nosed it. Then the ringing became a sheet, and the sheet became a floor, and by morning the sea was a window laid flat to the sky.",
        "Mira went out onto it with the bound-light lantern in one hand and a stick of charcoal in the other. Under her boots the ice held shadows that were not her own — keels, oars, a drowned horse still mid-strike, a name painted on a hull she could almost read.",
        "She wrote LEVEL UP in the sounding log, a private mark for the moment the ice took a new room.",
        "“Don’t stare too long,” Rhos called from the rail. “It likes to be looked at.”",
        "Mira did not stop. A cartographer who looks away is only a passenger. She knelt, and the ice showed her a meridian that had never been drawn, running not toward Nine Harbors but toward a tenth place that was not on any chart Senn would admit to keeping.",
      ),
    ),
    doc(
      "world-glass-sea",
      "world",
      "The Glass Sea",
      SEED_PROJECT_ID,
      0,
      p(
        "A northern basin that freezes from the surface down each winter, turning from black water to a clear, ringing ice the sailors call glass. Trade stops. Memory does not. Old wrecks become visible underfoot, and some of them were never wrecks when they went down.",
        "Summer shipping follows nine legal harbors. Winter travel is forbidden by the Compact and practiced anyway by anyone with a bound-light lantern and a reason not to wait until thaw.",
      ),
      {
        sheet: {
          ...emptyEntitySheet("The Glass Sea", "world"),
          worldType: "ocean",
          climate: "Winter freeze; brief black-water summer",
          aliases: "Glass Sea, the glass",
          summary:
            "A northern basin that freezes into ringing glass each winter. The ice remembers every ship it has kept.",
        },
      },
    ),
    doc(
      "wonder-spires",
      "wonder",
      "Crag’s Rest",
      SEED_PROJECT_ID,
      0,
      p(
        "A reach of the Glass Sea where the ice heaves into black spires, some a hundred feet high, packed so close a barge cannot thread them. Soundings go wrong here. Bound-light tugs toward the gaps and then refuses to enter.",
      ),
      {
        sheet: {
          ...emptyEntitySheet("Crag’s Rest", "wonder"),
          region: "The Glass Sea, west of Hollow Key",
          nature: "Impassable field of ice-and-rock spires",
          aliases: "Crag's Rest, the Spires",
          summary:
            "A portion of the sea where massive spires of rock and glass make passage impossible. The lanterns will not go in.",
        },
      },
    ),
    doc(
      "wonder-scar",
      "wonder",
      "Moon Crater",
      SEED_PROJECT_ID,
      1,
      p(
        "Not a crater of stone. A wound in the ice-country inland of Hollow Key, a canyon so wide the far rim is a different weather. Clerks call it an old strike. The ice at the bottom still shows a meridian that is not on any Compact chart.",
      ),
      {
        sheet: {
          ...emptyEntitySheet("Moon Crater", "wonder"),
          region: "Inland of Hollow Key",
          nature: "A canyon-scar in the land, grand as a sea-bed emptied",
          aliases: "the Scar, the inland wound",
          summary:
            "A massive scar in the land, canyon-wide, where the ice keeps a meridian no harbor will admit.",
        },
      },
    ),
    doc(
      "city-hollow-key",
      "city",
      "Hollow Key",
      SEED_PROJECT_ID,
      0,
      p(
        "Southernmost of the Nine Harbors. A town that faces inland and pretends the water is an accident. The pier is the only honest architecture. Salt paper is pressed here in winter, using ice-melt and rag, and sold at a premium to anyone who needs a letter to prove it has been cold.",
      ),
      {
        sheet: {
          ...emptyEntitySheet("Hollow Key", "city"),
          citySize: "town",
          population: "A few thousand in summer; fewer who stay the freeze",
          region: "Southernmost of the Nine Harbors",
          aliases: "the Key",
          summary:
            "A town that faces inland and pretends the water is an accident. The pier is the only honest architecture.",
        },
      },
    ),
    doc(
      "char-mira",
      "character",
      "Mira Vale",
      SEED_PROJECT_ID,
      0,
      p(
        "Voice: precise, dry, occasionally startled into poetry when a coastline refuses to sit still.",
      ),
      {
        sheet: {
          ...emptyEntitySheet("Mira Vale", "character"),
          name: "Mira Vale",
          age: "38",
          sex: "Female",
          appearance:
            "Ink-stained fingers, instruments cleaner than her rooms. Carries a case of compasses and a look that argues with maps.",
          birthplace: "Inland Measures",
          locations: [
            { chapterId: "ch-commission", location: "Southern harbor — the pier and the barge Moth" },
            { chapterId: "ch-harbors", location: "Hollow Key archives" },
            { chapterId: "ch-ice", location: "On the glass" },
          ],
          summary:
            "Cartographer of Inland Measures. Hired to draw a sea that remembers; will not be called a lesser pen.",
          powerTier: "B",
          alignment: "hero",
        },
      },
    ),
    doc(
      "char-rhos",
      "character",
      "Captain Rhos Fen",
      SEED_PROJECT_ID,
      1,
      p("Will not swear an oath to the Compact. Will get a cartographer home alive if the cartographer does not do anything stupid on the glass."),
      {
        sheet: {
          ...emptyEntitySheet("Rhos Fen", "character"),
          name: "Rhos Fen",
          age: "40",
          sex: "Female",
          appearance:
            "Salt in the seams of her coat. Skipper of the salt-barge Moth; a look that is worse than a handshake.",
          birthplace: "Nine Harbors",
          aliases: "Captain Rhos Fen, Rhos",
          locations: [
            { chapterId: "ch-commission", location: "Aboard the Moth, at Hollow Key pier" },
            { chapterId: "ch-harbors", location: "The rail of the Moth" },
            { chapterId: "ch-ice", location: "On the freeze with Mira" },
          ],
          summary:
            "Skipper of the Moth. Knows the Glass Sea by sound. No patience for inland metaphors.",
          powerTier: "A",
          alignment: "hero",
        },
      },
    ),
    doc(
      "char-senn",
      "character",
      "Archivist Senn",
      SEED_PROJECT_ID,
      2,
      p("Believes a map is a promise the land (or sea) is obliged to keep."),
      {
        sheet: {
          ...emptyEntitySheet("Senn", "character"),
          name: "Senn",
          age: "Unknown",
          sex: "",
          appearance:
            "Ageless in the way of people who live under lamps. Hands powdered with chalk.",
          birthplace: "Hollow Key",
          aliases: "Archivist Senn",
          locations: [
            { chapterId: "ch-harbors", location: "The windowless chart room at Hollow Key" },
          ],
          summary:
            "Keeper of charts at Hollow Key. Prefers ink to certainty. Unsettled by a wandering meridian.",
          powerTier: "C",
          alignment: "citizen",
        },
      },
    ),
    doc(
      "lore-compact",
      "lore",
      "The Compact of Nine Harbors",
      SEED_PROJECT_ID,
      0,
      p(
        "A treaty older than any living clerk, binding the nine legal ports of the Glass Sea to a single official meridian and a single winter prohibition. Amendments require triplicate filings, two harbor seals, and a season of review — which is to say, the Compact is designed so that the sea may change faster than the law.",
        "Rumor holds there was a Tenth Harbor. The archives have no such chart. The ice disagrees.",
      ),
      {
        sheet: {
          ...emptyEntitySheet("The Compact of Nine Harbors", "lore"),
          aliases: "the Compact, Nine Harbors Compact",
          summary:
            "A treaty binding nine legal ports to one meridian and one winter prohibition. The sea changes faster than the law.",
        },
      },
    ),
    doc(
      "faction-runners",
      "faction",
      "Glass-runners",
      SEED_PROJECT_ID,
      0,
      p("Skippers who go out after freeze with a bound-light lantern and a reason not to wait until thaw."),
      {
        sheet: {
          ...emptyEntitySheet("Glass-runners", "faction"),
          groupType: "crew",
          allegiance: "None that a clerk would file",
          aliases: "glass-runners, winter skippers",
          summary: "Winter crews who travel the glass against Compact law. Rhos Fen is one of them.",
        },
      },
    ),
    doc(
      "pol-compact",
      "political",
      "The Compact",
      SEED_PROJECT_ID,
      0,
      p("Nine harbors, one official meridian, a winter prohibition, and a clerk for every stamp."),
      {
        sheet: {
          ...emptyEntitySheet("The Compact", "political"),
          groupType: "compact",
          seat: "Rotates; papers live at Hollow Key",
          aliases: "Compact of Nine Harbors",
          summary: "The political body of the nine legal ports. Slow by design. The frost does not wait.",
        },
      },
    ),
    doc(
      "rel-saints",
      "religion",
      "Harbor Saints",
      SEED_PROJECT_ID,
      0,
      p("A quiet practice of naming the drowned so the ice will not. No temple. A chalk mark on a pier post is enough."),
      {
        sheet: {
          ...emptyEntitySheet("Harbor Saints", "religion"),
          pantheon: "The drowned, kept by name",
          tenets: "Do not stare too long. Do not lie about where you are going. Name the lost.",
          aliases: "the Saints",
          summary: "A harbor faith of naming the drowned. A chalk mark on a pier post is enough.",
        },
      },
    ),
    doc(
      "lang-harbor",
      "language",
      "Harbor Speech",
      SEED_PROJECT_ID,
      0,
      p("The common tongue of the Nine Harbors. Inland Measures is close enough to pass. Salt-cant is not."),
      {
        sheet: {
          ...emptyEntitySheet("Harbor Speech", "language"),
          speakers: "Nine Harbors, and anyone who files a chart",
          script: "Clerk’s hand; salt-paper takes it well",
          aliases: "Harbor, clerk’s tongue",
          summary: "The common tongue of the nine ports. Precise about ice, vague about law.",
        },
      },
    ),
    doc(
      "magic-bound-light",
      "magic",
      "Bound-light",
      SEED_PROJECT_ID,
      0,
      p(
        "Lanterns filled not with oil but with a caught brightness, harvested on the last clear night before freeze. A bound-light lantern remembers the path it has already taken and will tug, gently, toward wrecks, old camps, and sometimes toward places that have not happened yet.",
        "Rules: it will not burn on water that is still moving. It goes out if the bearer lies about where they are going. It likes to be looked at, which is not the same as being safe.",
      ),
      {
        sheet: {
          ...emptyEntitySheet("Bound-light", "magic"),
          aliases: "bound-light, bound light",
          summary:
            "Caught brightness in a lantern. It remembers the path it has taken. It goes out if you lie about where you are going.",
        },
      },
    ),
    doc(
      "back-afterword",
      "afterword",
      "Afterword",
      SEED_PROJECT_ID,
      0,
      p(
        "The Glass Sea does not keep a single meridian. Neither, in the end, does this book. If you found a tenth harbor between the lines, you were reading it correctly.",
      ),
    ),
    doc("back-cast", "cast", "Cast", SEED_PROJECT_ID, 1, ""),
    doc(
      "back-series",
      "other-series",
      "Other Books in this Series",
      SEED_PROJECT_ID,
      2,
      p("The Glass Meridian — Book One", "A second volume is not yet on any legal chart."),
    ),
    doc(
      "back-author",
      "other-author",
      "Other Books by the Author",
      SEED_PROJECT_ID,
      3,
      p("Inland Measures (surveys, selected)", "Nine Harbors: A Clerk’s Companion (nonfiction, forthcoming)"),
    ),
  ];

  return Object.fromEntries(docs.map((d) => [d.id, d]));
}
