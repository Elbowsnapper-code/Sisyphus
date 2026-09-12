import {
  BACK_KINDS,
  CUSTOM_BACK_KIND,
  CUSTOM_FRONT_KIND,
  FRONT_KINDS,
  emptyTitlePage,
  type Doc,
  type MatterKind,
} from "@/lib/types";
import { KIND_LABEL } from "@/lib/types";
import { createId } from "@/lib/utils";

function p(...paragraphs: string[]): string {
  return paragraphs.map((text) => `<p>${text}</p>`).join("");
}

export const MATTER_ORDER: Record<MatterKind, number> = {
  cover: -1,
  "title-page": 0,
  copyright: 1,
  acknowledgments: 2,
  foreword: 3,
  "front-page": 8,
  afterword: 0,
  cast: 1,
  "other-series": 2,
  "other-author": 3,
  "back-page": 8,
};

export function templateFor(kind: MatterKind, bookTitle: string, author: string): string {
  switch (kind) {
    case "cover":
      return "";
    case "title-page":
      return "";
    case "copyright":
      return p(
        `Copyright © ${new Date().getFullYear()} ${author || "the author"}`,
        "All rights reserved. No part of this book may be reproduced or used in any manner without written permission of the copyright owner, except for the use of brief quotations in a book review.",
        `First edition.`,
        `${bookTitle || "This book"} is a work of fiction. Names, characters, places, and incidents are the product of the author’s imagination or are used fictitiously.`,
      );
    case "acknowledgments":
      return p(
        "With thanks — to the readers who waited, the friends who read the ugly drafts, and the people who kept the lamp lit.",
      );
    case "foreword":
      return p("A few words before the story begins.");
    case "afterword":
      return p("A few words after the last page.");
    case "cast":
      return "";
    case "other-series":
      return p("Also in this series:");
    case "other-author":
      return p("Also by the author:");
    case "front-page":
    case "back-page":
      return "";
  }
}

export function createMatterDocs(
  projectId: string,
  bookTitle: string,
  authorName: string,
  seriesName: string,
  now = Date.now(),
): Record<string, Doc> {
  const docs: Record<string, Doc> = {};
  for (const kind of [...FRONT_KINDS, ...BACK_KINDS]) {
    const id = createId(kind);
    docs[id] = {
      id,
      kind,
      title: KIND_LABEL[kind],
      parentId: projectId,
      order: MATTER_ORDER[kind],
      content: templateFor(kind, bookTitle, authorName),
      updatedAt: now,
      titlePage:
        kind === "title-page"
          ? { ...emptyTitlePage(bookTitle), seriesName, authorName, bookTitle }
          : undefined,
    };
  }
  return docs;
}

export function matterOfKind(docs: Record<string, Doc>, projectId: string, kind: MatterKind): Doc | undefined {
  return Object.values(docs).find((d) => d.parentId === projectId && d.kind === kind);
}

export function customMatterOf(
  docs: Record<string, Doc>,
  projectId: string,
  which: "front" | "back",
): Doc[] {
  const kind = which === "front" ? CUSTOM_FRONT_KIND : CUSTOM_BACK_KIND;
  return Object.values(docs)
    .filter((d) => d.parentId === projectId && d.kind === kind)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}
