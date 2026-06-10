"use client";
import { Thread } from "@/lib/threads";

type Props = { threads: Thread[] };

const LINE: React.CSSProperties = {
  padding: "1px 16px",
  fontFamily: "var(--mono)",
  fontSize: "14px",
  color: "var(--pad-text)",
  lineHeight: "1.75",
  wordBreak: "break-all",
  userSelect: "text",
};

export default function ThreadList({ threads }: Props) {
  if (threads.length === 0) {
    return (
      <div style={{ ...LINE, color: "var(--text-faint)", padding: "24px 16px" }}>
        まだ投稿がありません
      </div>
    );
  }

  return (
    <ol style={{ listStyle: "none" }}>
      {threads.map((t) => (
        <li key={t.id} style={LINE}>
          {t.body}
        </li>
      ))}
    </ol>
  );
}
