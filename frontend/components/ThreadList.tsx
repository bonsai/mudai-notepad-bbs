"use client";
import { Thread } from "@/lib/threads";
import { rainbowColor } from "@/lib/theme";
import { useTheme } from "@/components/ThemeProvider";

type Props = { threads: Thread[] };

export default function ThreadList({ threads }: Props) {
  const { theme } = useTheme();
  const isRainbow = theme === "rainbow";

  const lineStyle = (i: number): React.CSSProperties => ({
    padding: "1px 16px",
    fontFamily: "var(--mono)",
    fontSize: "14px",
    color: isRainbow ? rainbowColor(i) : "var(--pad-text)",
    lineHeight: "1.75",
    wordBreak: "break-all",
    userSelect: "text",
  });

  if (threads.length === 0) {
    return (
      <div style={{ ...lineStyle(0), color: "var(--text-faint)", padding: "24px 16px" }}>
        まだ投稿がありません
      </div>
    );
  }

  return (
    <ol style={{ listStyle: "none" }}>
      {threads.map((t, i) => (
        <li key={t.id} style={lineStyle(i)}>
          {t.body}
        </li>
      ))}
    </ol>
  );
}
