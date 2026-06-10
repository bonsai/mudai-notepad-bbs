import { db } from "./firebase";
import { ref, push, get, remove, query, orderByChild, limitToFirst } from "firebase/database";

export type Thread = {
  id: string;
  body: string;
  createdAt: number;
};

export const MAX_THREADS = 1000;
export const PAGE_SIZE = 50;

export async function fetchAllThreads(): Promise<Thread[]> {
  const snap = await get(query(ref(db, "threads"), orderByChild("createdAt")));
  if (!snap.exists()) return [];
  const threads: Thread[] = [];
  snap.forEach((child) => {
    threads.push({ id: child.key!, ...child.val() });
  });
  return threads; // ascending by createdAt
}

export async function postThread(body: string): Promise<number> {
  if ([...body].length < 1 || [...body].length > 20) {
    throw new Error("1〜20文字で入力してください");
  }

  await push(ref(db, "threads"), { body, createdAt: Date.now() });

  const all = await fetchAllThreads();
  const total = all.length;

  if (total > MAX_THREADS) {
    const oldest = await get(
      query(ref(db, "threads"), orderByChild("createdAt"), limitToFirst(total - MAX_THREADS))
    );
    const removes: Promise<void>[] = [];
    oldest.forEach((child) => {
      removes.push(remove(ref(db, `threads/${child.key}`)));
    });
    await Promise.all(removes);
    return MAX_THREADS;
  }

  return total;
}

export function downloadJson(threads: Thread[], filename = "1.json") {
  const data = threads.map(t => ({
    body: t.body,
    at: new Date(t.createdAt).toISOString(),
  }));
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// page 0 = most recent PAGE_SIZE threads (ascending within page)
export function getPage(threads: Thread[], page: number): Thread[] {
  const total = threads.length;
  const end = total - page * PAGE_SIZE;
  const start = Math.max(0, end - PAGE_SIZE);
  return threads.slice(start, end);
}

export function maxPage(total: number): number {
  if (total === 0) return 0;
  return Math.floor((total - 1) / PAGE_SIZE);
}
