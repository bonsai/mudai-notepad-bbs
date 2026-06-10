"use client";
import { CSSProperties, useState } from "react";
import { Thread, downloadJson, maxPage } from "@/lib/threads";
import { THEMES } from "@/lib/theme";
import { useTheme } from "@/components/ThemeProvider";

type Props = {
  page: number;
  total: number;
  threads: Thread[];
  onNavigate: (p: number) => void;
  onEditFocus: () => void;
  lastUpdated: Date | null;
};

type DropKey = "open" | "save" | "settings" | "info" | null;

const dropStyle: CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  zIndex: 100,
  minWidth: "180px",
  background: "var(--drop-bg)",
  border: "1px solid var(--glass-border)",
  borderTop: "1px solid var(--glass-border-top)",
  borderRadius: "0 4px 4px 4px",
  backdropFilter: "blur(20px)",
  boxShadow: "var(--shadow)",
  overflow: "hidden",
};

function DropItem({ label, onClick, disabled = false }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => { if (!disabled) onClick(); }}
      style={{
        display: "block",
        width: "100%",
        padding: "7px 14px",
        textAlign: "left",
        background: "none",
        border: "none",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        color: disabled ? "var(--text-faint)" : "var(--text)",
        fontSize: "13px",
        fontFamily: "var(--font)",
        cursor: disabled ? "default" : "pointer",
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = "rgba(91,163,245,0.2)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
    >
      {label}
    </button>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
      <span style={{ color: "var(--text-faint)" }}>{k}</span>
      <span style={{ color: "var(--text-dim)" }}>{v}</span>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "10px 14px", fontFamily: "var(--mono)", fontSize: "12px", lineHeight: "2", color: "var(--text-dim)" }}>
      {children}
    </div>
  );
}

export default function Menu({ page, total, threads, onNavigate, onEditFocus, lastUpdated }: Props) {
  const [open, setOpen] = useState<DropKey>(null);
  const last = maxPage(total);
  const { theme, setTheme } = useTheme();

  const toggle = (key: DropKey) => setOpen(prev => prev === key ? null : key);
  const close = () => setOpen(null);

  const tabStyle = (key: DropKey | "edit"): CSSProperties => ({
    padding: "4px 10px",
    fontSize: "13px",
    color: open === key ? "#fff" : "rgba(255,255,255,0.82)",
    background: open === key
      ? "linear-gradient(180deg,rgba(91,163,245,0.55)0%,rgba(60,120,220,0.42)100%)"
      : "transparent",
    border: "none",
    borderRadius: "3px 3px 0 0",
    cursor: "pointer",
    fontFamily: "var(--font)",
    userSelect: "none",
    outline: "none",
  });

  return (
    <div
      style={{
        padding: "2px 4px 0",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.2)",
        display: "flex",
        gap: "2px",
        position: "relative",
      }}
      onMouseLeave={close}
    >
      {/* 開く */}
      <div style={{ position: "relative" }}>
        <button style={tabStyle("open")} onClick={() => toggle("open")}>開く</button>
        {open === "open" && (
          <div style={dropStyle}>
            <DropItem label="最新を開く" onClick={() => { onNavigate(0); close(); }} disabled={page === 0} />
            <DropItem label="← 前のページ（古い）" onClick={() => { onNavigate(page + 1); close(); }} disabled={page >= last} />
            <DropItem label="次のページ（新しい）→" onClick={() => { onNavigate(page - 1); close(); }} disabled={page === 0} />
          </div>
        )}
      </div>

      {/* 編集 — アクションのみ、ドロップなし */}
      <div style={{ position: "relative" }}>
        <button style={tabStyle("edit")} onClick={() => { onEditFocus(); close(); }}>編集</button>
      </div>

      {/* 保存 */}
      <div style={{ position: "relative" }}>
        <button style={tabStyle("save")} onClick={() => toggle("save")}>保存</button>
        {open === "save" && (
          <div style={dropStyle}>
            <DropItem label="1.json でダウンロード" onClick={() => { downloadJson(threads); close(); }} />
          </div>
        )}
      </div>

      {/* 設定 */}
      <div style={{ position: "relative" }}>
        <button style={tabStyle("settings")} onClick={() => toggle("settings")}>設定</button>
        {open === "settings" && (
          <div style={{ ...dropStyle, minWidth: "200px" }}>
            <Panel>
              <Row k="自動更新" v="10秒" />
              <Row k="文字数上限" v="20文字" />
              <Row k="スレ上限" v="1000件" />
              <Row k="クールダウン" v="10秒" />
              <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", margin: "8px 0" }} />
              <div style={{ marginBottom: "6px", color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>スキン</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {THEMES.map(t => (
                  <button
                    key={t.name}
                    onClick={() => setTheme(t.name)}
                    style={{
                      padding: "3px 10px",
                      borderRadius: "3px",
                      border: theme === t.name
                        ? "1px solid var(--accent)"
                        : "1px solid rgba(255,255,255,0.18)",
                      background: theme === t.name
                        ? "rgba(91,163,245,0.2)"
                        : "transparent",
                      color: theme === t.name
                        ? "var(--accent)"
                        : "rgba(255,255,255,0.6)",
                      fontSize: "12px",
                      fontFamily: "var(--font)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Panel>
          </div>
        )}
      </div>

      {/* 情報 */}
      <div style={{ position: "relative" }}>
        <button style={tabStyle("info")} onClick={() => toggle("info")}>情報</button>
        {open === "info" && (
          <div style={{ ...dropStyle, minWidth: "230px" }}>
            <Panel>
              <Row k="ページ" v={`${page} / ${last}`} />
              <Row k="スレ数" v={`${total} / 1000`} />
              <Row k="残り" v={`${1000 - total} スレ`} />
              {lastUpdated && <Row k="更新" v={lastUpdated.toLocaleTimeString("ja-JP")} />}

              <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", margin: "6px 0" }} />

              <div style={{ color: "rgba(255,255,255,0.65)", fontWeight: 600, marginBottom: "2px" }}>無題メモ帳BBS</div>
              <div style={{ fontSize: "11px", lineHeight: "1.9", color: "rgba(255,255,255,0.28)" }}>
                みんなが平等に操作できる。<br />
                データは自由に活用できる。<br />
                匿名 / 20文字 / add+download のみ
              </div>

              <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", margin: "6px 0" }} />

              <div style={{ fontSize: "11px", lineHeight: "1.9", color: "rgba(255,255,255,0.28)" }}>
                License: MIT<br />
                <a href="https://github.com/bonsai" target="_blank" rel="noreferrer"
                  style={{ color: "var(--accent)", textDecoration: "none" }}>github.com/bonsai</a><br />
                <a href="https://github.com/sponsors/bonsai" target="_blank" rel="noreferrer"
                  style={{ color: "var(--accent)", textDecoration: "none" }}>GitHub Sponsors</a>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}
