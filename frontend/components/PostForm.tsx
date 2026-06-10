"use client";
import { useState, useCallback } from "react";
import { postThread, downloadJson, Thread } from "@/lib/threads";

const COOLDOWN_MS = 10000;
const COOLDOWN_KEY = "mudai_last_post";
const TRIGGER_COUNT = 999;

type Props = {
  allThreads: Thread[];
  onPosted: () => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
};

export default function PostForm({ allThreads, onPosted, textareaRef }: Props) {
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);

  const charCount = [...body].length;
  const over = charCount > 20;

  const cooldownRemaining = useCallback(() => {
    const last = Number(localStorage.getItem(COOLDOWN_KEY) ?? 0);
    return Math.max(0, COOLDOWN_MS - (Date.now() - last));
  }, []);

  const submit = async () => {
    setError("");
    const remaining = cooldownRemaining();
    if (remaining > 0) {
      setError(`あと ${Math.ceil(remaining / 1000)} 秒待ってください`);
      return;
    }
    if (charCount < 1 || over) {
      setError("1〜20文字で入力してください");
      return;
    }

    setPosting(true);
    try {
      const total = await postThread(body.trim());
      localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
      setBody("");
      if (total === TRIGGER_COUNT) downloadJson(allThreads);
      onPosted();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "投稿に失敗しました");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="ここに入力… (Enter で送信)"
        rows={1}
        style={{
          display: "block",
          width: "100%",
          background: "transparent",
          color: over ? "#ff7070" : "var(--pad-text)",
          border: "none",
          outline: "none",
          resize: "none",
          fontFamily: "var(--mono)",
          fontSize: "14px",
          lineHeight: "1.75",
          padding: "1px 16px",
          caretColor: "var(--accent)",
          opacity: posting ? 0.5 : 1,
        }}
        disabled={posting}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />
      {error && (
        <p style={{
          padding: "0 16px 4px",
          color: "#ff7070",
          fontSize: "11px",
          fontFamily: "var(--mono)",
        }}>
          {error}
        </p>
      )}
    </div>
  );
}
