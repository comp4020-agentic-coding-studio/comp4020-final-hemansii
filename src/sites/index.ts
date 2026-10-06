import { placeholder } from "./placeholder";

export const ROWS = 10;
export const COLS = 6;

export type Cell = { kind: string; html: string; note: string };
export type Site = { title: string; cells: Cell[][] };

export const SITES: Record<string, Site> = { placeholder };

export const FIRST_SITE = "placeholder";

export const cellAt = (site: Site, row: number, col: number): Cell | undefined =>
  site.cells[row]?.[col];

// Archaeological-style grid references for flavour (e.g. "B3"), purely
// decorative labels alongside the plain row/col used everywhere functional.
export const colLabel = (col: number): string => String.fromCharCode(65 + col);
export const gridRef = (row: number, col: number): string => `${colLabel(col)}${row + 1}`;
