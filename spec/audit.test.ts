import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { audit, visitorRef } from "../src/lib/audit";

// The audit log is what crit 10 is narrated from, with the deployed UI
// never touched: a tutor reads stdout alone and has to be able to tell two
// visitors apart and see what each one did. This is a unit test on the
// formatter itself, not an HTTP check, since the shape of a log line isn't
// something `spec/*.test.ts`'s running-app visitors can observe.
let lines: string[] = [];

beforeEach(() => {
  lines = [];
  vi.spyOn(console, "log").mockImplementation((line: string) => {
    lines.push(line);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

it("logs a readable line with a timestamp, the action, visitor, target and outcome", () => {
  audit("dig", { id: "visitor-a", name: "Dusty Trowel 4" }, "2-3", "ok", { result: "ok" });

  expect(lines).toHaveLength(1);
  const [line] = lines;
  expect(line).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z /);
  expect(line).toContain("action=dig");
  expect(line).toContain('visitor="Dusty Trowel 4"');
  expect(line).toContain("target=2-3");
  expect(line).toContain("outcome=ok");
  expect(line).toContain("result=ok");
});

it("marks a conflict (someone else got there first) distinctly from a plain rejection", () => {
  audit("dig", { id: "visitor-a", name: "A" }, "0-0", "conflict", { result: "already-dug" });
  audit("dig", { id: "visitor-a", name: "A" }, "9-9", "rejected", { result: "out-of-digs" });

  expect(lines[0]).toContain("outcome=conflict");
  expect(lines[1]).toContain("outcome=rejected");
});

it("ties two visitors' actions to stable, distinct references without logging their raw cookie id", () => {
  audit("dig", { id: "visitor-a", name: "Ada" }, "0-0", "ok");
  audit("dig", { id: "visitor-b", name: "Bo" }, "0-1", "ok");
  audit("dig", { id: "visitor-a", name: "Ada" }, "0-2", "ok");

  const refs = lines.map((l) => l.match(/ref=(\S+)/)?.[1]);
  expect(refs[0]).toBe(refs[2]); // same visitor, same ref across requests
  expect(refs[0]).not.toBe(refs[1]); // different visitors, different refs
  for (const line of lines) {
    expect(line).not.toContain("visitor-a");
    expect(line).not.toContain("visitor-b");
  }
});

it("visitorRef is a short, stable, one-way reference to a visitor id", () => {
  expect(visitorRef("visitor-a")).toBe(visitorRef("visitor-a"));
  expect(visitorRef("visitor-a")).not.toBe(visitorRef("visitor-b"));
  expect(visitorRef("visitor-a")).not.toContain("visitor-a");
  expect(visitorRef("visitor-a").length).toBeLessThanOrEqual(12);
});
