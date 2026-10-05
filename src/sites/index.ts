import { placeholder } from "./placeholder";

export const ROWS = 10;
export const COLS = 6;

export type Cell = { kind: string; html: string; note: string };
export type Site = { title: string; cells: Cell[][] };

export const SITES: Record<string, Site> = { placeholder };

export const FIRST_SITE = "placeholder";

export const cellAt = (site: Site, row: number, col: number): Cell | undefined =>
  site.cells[row]?.[col];
