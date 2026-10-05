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
    const res = await fetch(new URL("/api/dig", this.baseUrl), {
      method: "POST",
      redirect: "manual",
      headers: {
        origin: new URL(this.baseUrl).origin,
        "content-type": "application/x-www-form-urlencoded",
        ...(this.cookie ? { cookie: this.cookie } : {}),
      },
      body: new URLSearchParams({ cell }),
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

export const buriedCells = (doc: Document): string[] =>
  [...doc.querySelectorAll('[data-state="buried"]')].map((el) => el.getAttribute("data-cell")!);

export const stateOf = (doc: Document, cell: string): string | null | undefined =>
  doc.querySelector(`[data-cell="${cell}"]`)?.getAttribute("data-state");

export const NOTHING_LEFT =
  "no buried sections left to dig — locally, delete .data/app.db to reset the site";
