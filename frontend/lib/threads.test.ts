import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Firebase before importing threads
vi.mock("./firebase", () => ({ db: {} }));
vi.mock("firebase/database", () => ({
  ref: vi.fn(),
  push: vi.fn(),
  get: vi.fn(),
  remove: vi.fn(),
  query: vi.fn(),
  orderByChild: vi.fn(),
  limitToFirst: vi.fn(),
}));

import { getPage, maxPage, downloadJson, PAGE_SIZE, MAX_THREADS } from "./threads";
import type { Thread } from "./threads";

function makeThreads(n: number): Thread[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `id${i}`,
    body: `msg${i}`,
    createdAt: 1000 + i,
  }));
}

// --- getPage ---
describe("getPage", () => {
  it("page 0 returns the last PAGE_SIZE threads in ascending order", () => {
    const threads = makeThreads(PAGE_SIZE + 10);
    const page = getPage(threads, 0);
    expect(page).toHaveLength(PAGE_SIZE);
    expect(page[0].id).toBe("id10");
    expect(page[page.length - 1].id).toBe(`id${PAGE_SIZE + 9}`);
  });

  it("page 1 returns the previous PAGE_SIZE threads", () => {
    const threads = makeThreads(PAGE_SIZE * 2);
    const page = getPage(threads, 1);
    expect(page).toHaveLength(PAGE_SIZE);
    expect(page[0].id).toBe("id0");
    expect(page[page.length - 1].id).toBe(`id${PAGE_SIZE - 1}`);
  });

  it("returns fewer than PAGE_SIZE when threads < PAGE_SIZE", () => {
    const threads = makeThreads(5);
    expect(getPage(threads, 0)).toHaveLength(5);
  });

  it("returns empty array for out-of-range page", () => {
    const threads = makeThreads(PAGE_SIZE);
    expect(getPage(threads, 1)).toHaveLength(0);
  });

  it("preserves ascending (oldest→newest) order within a page", () => {
    const page = getPage(makeThreads(10), 0);
    for (let i = 0; i < page.length - 1; i++) {
      expect(page[i].createdAt).toBeLessThan(page[i + 1].createdAt);
    }
  });
});

// --- maxPage ---
describe("maxPage", () => {
  it("returns 0 for empty list", () => expect(maxPage(0)).toBe(0));
  it("returns 0 when total <= PAGE_SIZE", () => {
    expect(maxPage(1)).toBe(0);
    expect(maxPage(PAGE_SIZE)).toBe(0);
  });
  it("returns 1 when total is PAGE_SIZE + 1", () => expect(maxPage(PAGE_SIZE + 1)).toBe(1));
  it("MAX_THREADS / PAGE_SIZE gives correct last page", () => {
    expect(maxPage(MAX_THREADS)).toBe(Math.floor((MAX_THREADS - 1) / PAGE_SIZE));
  });
});

// --- downloadJson ---
describe("downloadJson", () => {
  let clickMock: ReturnType<typeof vi.fn>;
  let blobParts: string[];

  beforeEach(() => {
    blobParts = [];
    clickMock = vi.fn();

    vi.stubGlobal("Blob", class {
      type: string;
      constructor(parts: string[], opts?: { type: string }) {
        blobParts.push(...parts);
        this.type = opts?.type ?? "";
      }
    });
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:mock"),
      revokeObjectURL: vi.fn(),
    });

    const anchor = { href: "", download: "", click: clickMock };
    vi.spyOn(document, "createElement").mockReturnValue(anchor as unknown as HTMLElement);
  });

  it("output has body and at fields, no id or createdAt", () => {
    downloadJson(makeThreads(2));
    const parsed = JSON.parse(blobParts[0]);
    expect(parsed[0]).toHaveProperty("body");
    expect(parsed[0]).toHaveProperty("at");
    expect(parsed[0]).not.toHaveProperty("id");
    expect(parsed[0]).not.toHaveProperty("createdAt");
  });

  it("at field is a valid ISO 8601 string", () => {
    downloadJson(makeThreads(1));
    const parsed = JSON.parse(blobParts[0]);
    expect(new Date(parsed[0].at).toISOString()).toBe(parsed[0].at);
  });

  it("filename defaults to 1.json", () => {
    const anchor = { href: "", download: "", click: clickMock };
    vi.spyOn(document, "createElement").mockReturnValue(anchor as unknown as HTMLElement);
    downloadJson(makeThreads(1));
    expect(anchor.download).toBe("1.json");
  });

  it("custom filename is applied", () => {
    const anchor = { href: "", download: "", click: clickMock };
    vi.spyOn(document, "createElement").mockReturnValue(anchor as unknown as HTMLElement);
    downloadJson(makeThreads(1), "archive.json");
    expect(anchor.download).toBe("archive.json");
  });

  it("click is called once to trigger download", () => {
    downloadJson(makeThreads(1));
    expect(clickMock).toHaveBeenCalledOnce();
  });
});

// --- constants ---
describe("constants", () => {
  it("MAX_THREADS is 1000", () => expect(MAX_THREADS).toBe(1000));
  it("PAGE_SIZE is 50", () => expect(PAGE_SIZE).toBe(50));
});
