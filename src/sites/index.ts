import { FAMOUS } from "./famous";

export const ROWS = 10;
export const COLS = 6;

export type Cell = { kind: string; html: string; note: string };
export type Site = { title: string; year: string; answers: string[]; cells: Cell[][] };

export const SITES: Record<string, Site> = FAMOUS;

// The order sites are buried in; after the last, it comes round again.
export const ORDER = Object.keys(SITES);

export const FIRST_SITE = ORDER[0];

// A sites row's id is its content key, plus "~2", "~3"... each time the
// rotation comes back round to the same content.
export const contentKey = (siteId: string): string => siteId.split("~")[0];

export const siteFor = (siteId: string): Site | undefined => SITES[contentKey(siteId)];

// Does this guess name the site? Letters and digits only, so "Club
// Penguin!", "clubpenguin" and "I reckon it's club penguin" all count.
export const names = (site: Site, guess: string): boolean => {
  const plain = guess.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return site.answers.some((a) => plain.includes(a));
};

export const cellAt = (site: Site, row: number, col: number): Cell | undefined =>
  site.cells[row]?.[col];

// Archaeological-style grid references for flavour (e.g. "B3"), purely
// decorative labels alongside the plain row/col used everywhere functional.
export const colLabel = (col: number): string => String.fromCharCode(65 + col);
export const gridRef = (row: number, col: number): string => `${colLabel(col)}${row + 1}`;
