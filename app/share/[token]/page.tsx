"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type LinkMeta = {
  valid: boolean;
  accessType: "PUBLIC" | "PASSWORD";
  shareType: "ONE_TIME" | "TIME_BASED";
  noteTitle: string;
  expiresAt: string | null;
  viewCount: number;
};

type Note = { title: string; content: string; createdAt: string; };
type ErrorState = { code: string; message: string; };

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [meta, setMeta] = useState<LinkMeta | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => { checkLink(); }, [token]);

  async function checkLink() {
    try {
      const res = await fetch(`/api/share/${token}`);
      const data = await res.json();
      if (!res.ok) { setError({ code: data.error, message: data.message }); return; }
      setMeta(data);
      if (data.accessType === "PUBLIC") await unlock("");
    } catch {
      setError({ code: "SERVER_ERROR", message: "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  async function unlock(pw: string) {
    setUnlocking(true);
    setPwError("");
    try {
      const res = await fetch(`/api/share/${token}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "WRONG_PASSWORD") setPwError("Incorrect access key. Please try again.");
        else setError({ code: data.error, message: data.message });
        return;
      }
      setNote(data.note);
    } catch {
      setPwError("Something went wrong");
    } finally {
      setUnlocking(false);
    }
  }

  const errorIcons: Record<string, string> = {
    INVALID_LINK: "🔍", REVOKED: "🚫", EXPIRED: "⏰", ALREADY_USED: "♻️", DEFAULT: "❌"
  };

  if (loading) return (
    <div style={centerStyle}>
      <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⏳</div>
      <p style={{ color: "var(--muted-foreground)", fontWeight: 600 }}>Validating link...</p>
    </div>
  );

  if (error) return (
    <div style={centerStyle}>
      <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: "20px", padding: "2.5rem 2rem", maxWidth: "420px", width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>{errorIcons[error.code] || errorIcons.DEFAULT}</div>
        <h1 style={{ fontWeight: 800, fontSize: "1.3rem", marginBottom: "0.5rem" }}>{error.code.replace(/_/g, " ")}</h1>
        <p style={{ color: "var(--muted-foreground)", marginBottom: "1.75rem", lineHeight: 1.6 }}>{error.message}</p>
        <a href="/" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 700 }}>Go to NoteVault →</a>
      </div>
    </div>
  );

  if (note) return (
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "clamp(1rem, 4vw, 2rem)" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <span style={{ fontWeight: 800, fontSize: "1rem" }}>🔐 NoteVault</span>
          <span style={{ color: "var(--muted-foreground)", fontSize: "0.85rem" }}>/ Shared Note</span>
        </div>

        <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: "20px", padding: "clamp(1.25rem, 4vw, 2rem)" }}>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            <span style={{ background: "#4ade8015", color: "#4ade80", borderRadius: "6px", padding: "0.2rem 0.7rem", fontSize: "0.75rem", fontWeight: 700 }}>
              {meta?.shareType === "ONE_TIME" ? "One-Time View" : "Shared Note"}
            </span>
            <span style={{ background: "var(--muted)", color: "var(--muted-foreground)", borderRadius: "6px", padding: "0.2rem 0.7rem", fontSize: "0.75rem", fontWeight: 600 }}>
              {meta?.accessType === "PUBLIC" ? "🌐 Public" : "🔑 Password Protected"}
            </span>
          </div>

          <h1 style={{ fontSize: "clamp(1.4rem, 5vw, 1.9rem)", fontWeight: 800, marginBottom: "1.5rem", lineHeight: 1.2 }}>{note.title}</h1>

          <div style={{ background: "var(--input-bg)", borderRadius: "12px", padding: "clamp(1rem, 3vw, 1.5rem)", lineHeight: 1.85, whiteSpace: "pre-wrap", fontSize: "clamp(0.9rem, 2.5vw, 1rem)", color: "var(--foreground)" }}>
            {note.content}
          </div>

          <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", marginTop: "1.25rem" }}>
            Created {new Date(note.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>

        {meta?.shareType === "ONE_TIME" && (
          <div style={{ background: "#ef444415", border: "1px solid #ef444440", borderRadius: "10px", padding: "1rem", marginTop: "1rem", fontSize: "0.85rem", color: "#ef4444", fontWeight: 600, lineHeight: 1.5 }}>
            ⚠️ This was a one-time link. It has now been permanently invalidated.
          </div>
        )}
      </div>
    </div>
  );

  if (meta?.accessType === "PASSWORD") return (
    <div style={centerStyle}>
      <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: "20px", padding: "clamp(1.5rem, 5vw, 2.5rem) clamp(1.25rem, 4vw, 2rem)", maxWidth: "440px", width: "100%" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔑</div>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(1.25rem, 4vw, 1.5rem)", marginBottom: "0.35rem", lineHeight: 1.2 }}>{meta.noteTitle}</h1>
        <p style={{ color: "var(--muted-foreground)", marginBottom: "2rem", fontSize: "0.9rem", lineHeight: 1.6 }}>
          This note is password protected. Enter the access key to view it.
        </p>

        {pwError && (
          <div style={{ background: "#ef444420", border: "1px solid #ef4444", color: "#ef4444", padding: "0.7rem 0.9rem", borderRadius: "10px", marginBottom: "1rem", fontSize: "0.87rem", fontWeight: 600 }}>
            ⚠️ {pwError}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input
            type="text"
            placeholder="xxxx-xxxx-xxxx"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && unlock(password)}
            style={{ background: "var(--input-bg)", border: "1.5px solid var(--input-border)", borderRadius: "10px", padding: "0.85rem 1rem", color: "var(--foreground)", fontSize: "clamp(0.95rem, 3vw, 1.1rem)", fontFamily: "monospace", letterSpacing: "0.12em", outline: "none", width: "100%", transition: "border-color 0.15s" }}
          />
          <button
            onClick={() => unlock(password)}
            disabled={unlocking || !password}
            style={{ background: "var(--primary)", color: "white", border: "none", borderRadius: "10px", padding: "0.85rem", fontWeight: 800, cursor: "pointer", fontSize: "1rem", opacity: (!password || unlocking) ? 0.6 : 1, transition: "background 0.15s" }}
          >
            {unlocking ? "Unlocking..." : "Unlock Note →"}
          </button>
        </div>

        {meta.shareType === "TIME_BASED" && meta.expiresAt && (
          <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "1.25rem", textAlign: "center" }}>
            Expires: {new Date(meta.expiresAt).toLocaleString("en-IN")}
          </p>
        )}
      </div>
    </div>
  );

  return null;
}

const centerStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
  background: "var(--background)",
};