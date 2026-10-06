import { JSDOM } from "jsdom";

// A browser-shaped visitor: keeps its cookie, and sends Origin on POSTs as a
// browser does (Astro rejects cross-site form posts without it).
export class TestVisitor {
  private cookie = "";

  constructor(private readonly baseUrl: string) {}

  async page(path = "/"): Promise<{ status: number; html: string; doc: Document }> {
    const res = await fetch(new URL(path, this.baseUrl), {
      headers: this.cookie ? { cookie: this.cookie } : {},
    });
    this.keep(res);
    const html = await res.text();
    return { status: res.status, html, doc: new JSDOM(html).window.document };
  }

  // Returns the outcome the server redirected with (?r=...).
  async dig(cell: string): Promise<string | null> {
    return this.post("/api/dig", { cell });
  }

  // Brushing is a separate, uncapped action from digging: anyone can brush a
  // dusty cell clean, not just whoever dug it.
  async brush(cell: string): Promise<string | null> {
    return this.post("/api/brush", { cell });
  }

  private async post(path: string, body: Record<string, string>): Promise<string | null> {
    const res = await fetch(new URL(path, this.baseUrl), {
      method: "POST",
      redirect: "manual",
      headers: {
        origin: new URL(this.baseUrl).origin,
        "content-type": "application/x-www-form-urlencoded",
        ...(this.cookie ? { cookie: this.cookie } : {}),
      },
      body: new URLSearchParams(body),
    });
    this.keep(res);
    const location = res.headers.get("location");
    return location ? new URL(location, this.baseUrl).searchParams.get("r") : null;
  }

  private keep(res: Response): void {
    const set = res.headers.getSetCookie().map((c) => c.split(";")[0]);
    if (set.length > 0) this.cookie = set.join("; ");
  }
}

export const cellsInState = (doc: Document, state: string): string[] =>
  [...doc.querySelectorAll(`[data-state="${state}"]`)].map((el) => el.getAttribute("data-cell")!);

export const buriedCells = (doc: Document): string[] => cellsInState(doc, "buried");

export const stateOf = (doc: Document, cell: string): string | null | undefined =>
  doc.querySelector(`[data-cell="${cell}"]`)?.getAttribute("data-state");

export const NOTHING_LEFT =
  "no buried sections left to dig, locally delete .data/app.db to reset the site";
