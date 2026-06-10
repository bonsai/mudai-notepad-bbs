"use client";
import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchAllThreads, getPage, maxPage, Thread } from "@/lib/threads";
import Menu from "@/components/Menu";
import ThreadList from "@/components/ThreadList";
import PostForm from "@/components/PostForm";

function BBS() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(0, Number(searchParams.get("page") ?? 0));

  const [allThreads, setAllThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const threads = await fetchAllThreads();
    setAllThreads(threads);
    setLoading(false);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, 10000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refresh]);

  // scroll to bottom when new posts arrive on page 0
  useEffect(() => {
    if (page === 0) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allThreads.length, page]);

  const navigate = (p: number) => router.push(p === 0 ? "/" : `/?page=${p}`);
  const focusEdit = () => textareaRef.current?.focus();

  const total = allThreads.length;
  const last = maxPage(total);
  const safePage = Math.min(page, last);
  const displayed = getPage(allThreads, safePage);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "20px 12px 40px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "660px",
        borderRadius: "10px",
        border: "1px solid var(--glass-border)",
        borderTop: "1px solid var(--glass-border-top)",
        background: "var(--glass-bg)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        boxShadow: "var(--shadow), inset 0 1px 0 rgba(255,255,255,0.12)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* タイトルバー */}
        <div style={{
          padding: "8px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "linear-gradient(180deg,rgba(255,255,255,0.07)0%,transparent 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)", letterSpacing: "0.05em" }}>
            無題メモ帳BBS
          </span>
          {lastUpdated && (
            <span style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--mono)" }}>
              {lastUpdated.toLocaleTimeString("ja-JP")}
            </span>
          )}
        </div>

        {/* メニューバー */}
        <Menu
          page={safePage}
          total={total}
          threads={allThreads}
          onNavigate={navigate}
          onEditFocus={focusEdit}
          lastUpdated={lastUpdated}
        />

        {/* コンテンツ（スレ一覧 + 入力欄） */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "320px",
          maxHeight: "calc(100vh - 160px)",
          overflowY: "auto",
          padding: "6px 0",
        }}>
          {loading ? (
            <div style={{ padding: "32px 16px", color: "var(--text-faint)", fontSize: "13px", fontFamily: "var(--mono)" }}>
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
              <span style={{ animation: "pulse 1.4s infinite", display: "inline-block" }}>読み込み中…</span>
            </div>
          ) : (
            <ThreadList threads={displayed} />
          )}

          <div ref={bottomRef} />
          <PostForm allThreads={allThreads} onPosted={refresh} textareaRef={textareaRef} />
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense><BBS /></Suspense>;
}
