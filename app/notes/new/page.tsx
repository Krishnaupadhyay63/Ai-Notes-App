"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type ShareResult = {
  shareUrl: string;
  accessKey: string | null;
  shareType: string;
  accessType: string;
};

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  shareLink?: {
    token: string;
    isRevoked: boolean;
    isUsed: boolean;
    viewCount: number;
    shareType: string;
    accessType: string;
    expiresAt: string | null;
  } | null;
};

export default function NewNotePage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "share" | "done">("form");
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [createdNoteId, setCreatedNoteId] = useState("");

  const [shareType, setShareType] = useState<"ONE_TIME" | "TIME_BASED">("TIME_BASED");
  const [accessType, setAccessType] = useState<"PUBLIC" | "PASSWORD">("PUBLIC");
  const [expiresAt, setExpiresAt] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);

  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  // Inline regenerate share link from sidebar
  const [regenNoteId, setRegenNoteId] = useState<string | null>(null);
  const [regenShareType, setRegenShareType] = useState<"ONE_TIME" | "TIME_BASED">("TIME_BASED");
  const [regenAccessType, setRegenAccessType] = useState<"PUBLIC" | "PASSWORD">("PUBLIC");
  const [regenExpiresAt, setRegenExpiresAt] = useState("");
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenResult, setRegenResult] = useState<{ shareUrl: string; accessKey: string | null; noteId: string } | null>(null);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => { fetchNotes(); }, []);

  async function fetchNotes() {
    try {
      const res = await fetch("/api/notes");
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      setNotes(data.notes || []);
    } catch {}
  }

  async function handleCreateNote(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNoteLoading(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setCreatedNoteId(data.note.id);
      setStep("share");
    } catch {
      setError("Failed to create note");
    } finally {
      setNoteLoading(false);
    }
  }

  async function handleGenerateShareLink() {
    setError("");
    setShareLoading(true);
    try {
      const res = await fetch(`/api/notes/${createdNoteId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareType, accessType, expiresAt: expiresAt || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setShareResult({ shareUrl: data.shareUrl, accessKey: data.accessKey, shareType, accessType });
      setStep("done");
      await fetchNotes();
    } catch {
      setError("Failed to generate share link");
    } finally {
      setShareLoading(false);
    }
  }

  async function handleRevoke(noteId: string) {
    setRevoking(noteId);
    try {
      await fetch(`/api/notes/${noteId}/revoke`, { method: "POST" });
      await fetchNotes();
      // refresh selected note
      if (selectedNote?.id === noteId) {
        const res = await fetch("/api/notes");
        const data = await res.json();
        const updated = (data.notes || []).find((n: Note) => n.id === noteId);
        if (updated) setSelectedNote(updated);
      }
    } finally {
      setRevoking(null);
    }
  }

  async function handleRegenerate(noteId: string) {
    setRegenLoading(true);
    setRegenResult(null);
    try {
      const res = await fetch(`/api/notes/${noteId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareType: regenShareType, accessType: regenAccessType, expiresAt: regenExpiresAt || null }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setRegenResult({ shareUrl: data.shareUrl, accessKey: data.accessKey, noteId });
      setRegenNoteId(null);
      await fetchNotes();
    } finally {
      setRegenLoading(false);
    }
  }


  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function resetForm() {
    setStep("form");
    setTitle("");
    setContent("");
    setShareType("TIME_BASED");
    setAccessType("PUBLIC");
    setExpiresAt("");
    setShareResult(null);
    setCreatedNoteId("");
    setError("");
    setSelectedNote(null);
  }

  function handleNoteClick(note: Note) {
    if (expandedNoteId === note.id) {
      setExpandedNoteId(null);
      setSelectedNote(null);
    } else {
      setExpandedNoteId(note.id);
      setSelectedNote(note);
    }
  }

  function getLinkStatus(note: Note) {
    if (!note.shareLink) return null;
    const sl = note.shareLink;
    if (sl.isRevoked) return { label: "Revoked", color: "#ef4444", bg: "#ef444415" };
    if (sl.shareType === "ONE_TIME" && sl.isUsed) return { label: "Used", color: "#f59e0b", bg: "#f59e0b15" };
    if (sl.expiresAt && new Date() > new Date(sl.expiresAt)) return { label: "Expired", color: "#f59e0b", bg: "#f59e0b15" };
    return { label: "Active", color: "#4ade80", bg: "#4ade8015" };
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", display: "flex" }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: "300px", minWidth: "300px", background: "var(--card)", borderRight: "1px solid var(--card-border)", display: "flex", flexDirection: "column", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ padding: "1.25rem 1.25rem 1rem", borderBottom: "1px solid var(--card-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: "1.05rem" }}>🔐 NoteVault</span>
          <button onClick={handleLogout} style={{ background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer", fontSize: "0.8rem" }}>Logout</button>
        </div>

        {/* New Note button */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--card-border)" }}>
          <button onClick={resetForm} style={{ width: "100%", background: "var(--primary)", color: "white", border: "none", borderRadius: "8px", padding: "0.65rem", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>
            + New Note
          </button>
        </div>

        {/* Notes list */}
        <div style={{ flex: 1, padding: "1rem 1.25rem", overflowY: "auto" }}>
          <p style={{ fontSize: "0.7rem", color: "var(--muted-foreground)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            Your Notes ({notes.length})
          </p>

          {notes.length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--muted-foreground)", fontSize: "0.85rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📝</div>
              No notes yet. Create one!
            </div>
          )}

          {notes.map(note => {
            const status = getLinkStatus(note);
            const isExpanded = expandedNoteId === note.id;
            const shareUrl = note.shareLink ? `${appUrl}/share/${note.shareLink.token}` : null;

            return (
              <div key={note.id} style={{ marginBottom: "0.5rem", borderRadius: "10px", border: `1px solid ${isExpanded ? "var(--primary)" : "var(--card-border)"}`, overflow: "hidden", transition: "border-color 0.2s" }}>

                {/* Note header — clickable */}
                <div
                  onClick={() => handleNoteClick(note)}
                  style={{ padding: "0.75rem 0.9rem", cursor: "pointer", background: isExpanded ? "#7c6af710" : "var(--secondary)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}
                >
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <p style={{ fontWeight: 600, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "0.2rem" }}>
                      {note.title}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      {status && (
                        <span style={{ fontSize: "0.65rem", color: status.color, background: status.bg, borderRadius: "4px", padding: "0.1rem 0.4rem", fontWeight: 600 }}>
                          {status.label}
                        </span>
                      )}
                      {note.shareLink && (
                        <span style={{ fontSize: "0.65rem", color: "var(--muted-foreground)" }}>
                          👁 {note.shareLink.viewCount} views
                        </span>
                      )}
                      {!note.shareLink && (
                        <span style={{ fontSize: "0.65rem", color: "var(--muted-foreground)" }}>No share link</span>
                      )}
                    </div>
                  </div>
                  <span style={{ color: "var(--muted-foreground)", fontSize: "0.7rem", flexShrink: 0 }}>
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div style={{ padding: "0.9rem", borderTop: "1px solid var(--card-border)", background: "var(--background)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>

                    {/* Note content preview */}
                    <div>
                      <p style={{ fontSize: "0.7rem", color: "var(--muted-foreground)", marginBottom: "0.3rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Content</p>
                      <p style={{ fontSize: "0.8rem", color: "var(--foreground)", background: "var(--input-bg)", borderRadius: "6px", padding: "0.6rem", lineHeight: 1.5, maxHeight: "80px", overflowY: "auto", whiteSpace: "pre-wrap" }}>
                        {note.content}
                      </p>
                    </div>

                    {/* Share link section */}
                    {note.shareLink && !note.shareLink.isRevoked ? (
                      <>
                        <div>
                          <p style={{ fontSize: "0.7rem", color: "var(--muted-foreground)", marginBottom: "0.3rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Share URL</p>
                          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                            <code style={{ flex: 1, fontSize: "0.7rem", background: "var(--input-bg)", padding: "0.4rem 0.6rem", borderRadius: "5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--primary)" }}>
                              {shareUrl}
                            </code>
                            <button onClick={() => shareUrl && copyText(shareUrl, `url-${note.id}`)} style={{ flexShrink: 0, padding: "0.35rem 0.6rem", background: copiedKey === `url-${note.id}` ? "#4ade8020" : "var(--muted)", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "0.7rem", color: copiedKey === `url-${note.id}` ? "#4ade80" : "var(--foreground)", fontWeight: 600 }}>
                              {copiedKey === `url-${note.id}` ? "✓" : "Copy"}
                            </button>
                          </div>
                        </div>

                        {note.shareLink.accessType === "PASSWORD" && (
                          <div style={{ background: "#7c6af715", border: "1px solid #7c6af740", borderRadius: "6px", padding: "0.5rem 0.7rem", fontSize: "0.72rem", color: "var(--primary)" }}>
                            🔑 Password protected. To reset the access key — revoke this link and generate a new one.
                          </div>
                        )}

                        {regenResult && regenResult.noteId === note.id && regenResult.accessKey && (
                          <div style={{ background: "#4ade8015", border: "1px solid #4ade8040", borderRadius: "6px", padding: "0.65rem 0.75rem" }}>
                            <p style={{ fontSize: "0.7rem", color: "#4ade80", fontWeight: 700, marginBottom: "0.4rem" }}>✅ New access key:</p>
                            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                              <code style={{ flex: 1, background: "var(--input-bg)", padding: "0.4rem 0.6rem", borderRadius: "5px", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.1em" }}>{regenResult.accessKey}</code>
                              <button onClick={() => copyText(regenResult.accessKey!, `regen-key-${note.id}`)} style={{ padding: "0.35rem 0.5rem", background: "var(--muted)", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600, color: copiedKey === `regen-key-${note.id}` ? "#4ade80" : "var(--foreground)" }}>
                                {copiedKey === `regen-key-${note.id}` ? "✓" : "Copy"}
                              </button>
                            </div>
                          </div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                          {[
                            { label: "Type", value: note.shareLink.shareType === "ONE_TIME" ? "One-Time" : "Time-Based" },
                            { label: "Access", value: note.shareLink.accessType === "PUBLIC" ? "🌐 Public" : "🔑 Password" },
                            { label: "Views", value: String(note.shareLink.viewCount) },
                            { label: "Expires", value: note.shareLink.expiresAt ? new Date(note.shareLink.expiresAt).toLocaleDateString("en-IN") : "No expiry" },
                          ].map(item => (
                            <div key={item.label} style={{ background: "var(--input-bg)", borderRadius: "6px", padding: "0.4rem 0.6rem" }}>
                              <p style={{ fontSize: "0.6rem", color: "var(--muted-foreground)", marginBottom: "0.1rem" }}>{item.label}</p>
                              <p style={{ fontSize: "0.75rem", fontWeight: 600 }}>{item.value}</p>
                            </div>
                          ))}
                        </div>

                        <button onClick={() => handleRevoke(note.id)} disabled={revoking === note.id} style={{ width: "100%", padding: "0.5rem", background: "#ef444415", border: "1px solid #ef444440", color: "#ef4444", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
                          {revoking === note.id ? "Revoking..." : "🚫 Revoke Link"}
                        </button>
                      </>
                    ) : (
                      <div>
                        {note.shareLink?.isRevoked && (
                          <div style={{ textAlign: "center", fontSize: "0.75rem", color: "#ef4444", padding: "0.4rem 0.6rem", background: "#ef444415", borderRadius: "6px", marginBottom: "0.75rem" }}>
                            🚫 Link revoked — generate a new one below
                          </div>
                        )}

                        {regenResult && regenResult.noteId === note.id && (
                          <div style={{ background: "#4ade8015", border: "1px solid #4ade8040", borderRadius: "6px", padding: "0.65rem 0.75rem", marginBottom: "0.75rem" }}>
                            <p style={{ fontSize: "0.7rem", color: "#4ade80", fontWeight: 700, marginBottom: "0.25rem" }}>✅ New link generated!</p>
                            <p style={{ fontSize: "0.68rem", color: "var(--muted-foreground)", marginBottom: "0.3rem" }}>Share URL:</p>
                            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginBottom: regenResult.accessKey ? "0.5rem" : 0 }}>
                              <code style={{ flex: 1, background: "var(--input-bg)", padding: "0.35rem 0.5rem", borderRadius: "5px", fontSize: "0.68rem", color: "var(--primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{regenResult.shareUrl}</code>
                              <button onClick={() => copyText(regenResult.shareUrl, `regen-url-${note.id}`)} style={{ padding: "0.3rem 0.5rem", background: "var(--muted)", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "0.68rem", fontWeight: 600, color: copiedKey === `regen-url-${note.id}` ? "#4ade80" : "var(--foreground)" }}>
                                {copiedKey === `regen-url-${note.id}` ? "✓" : "Copy"}
                              </button>
                            </div>
                            {regenResult.accessKey && (
                              <>
                                <p style={{ fontSize: "0.68rem", color: "var(--muted-foreground)", marginBottom: "0.3rem" }}>🔑 Access Key (save now — shown once!):</p>
                                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                                  <code style={{ flex: 1, background: "var(--input-bg)", padding: "0.4rem 0.6rem", borderRadius: "5px", fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--foreground)" }}>{regenResult.accessKey}</code>
                                  <button onClick={() => copyText(regenResult.accessKey!, `regen-key-${note.id}`)} style={{ padding: "0.35rem 0.5rem", background: "var(--muted)", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600, color: copiedKey === `regen-key-${note.id}` ? "#4ade80" : "var(--foreground)" }}>
                                    {copiedKey === `regen-key-${note.id}` ? "✓" : "Copy"}
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {regenNoteId === note.id ? (
                          <div style={{ background: "var(--input-bg)", borderRadius: "8px", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--foreground)" }}>🔗 New Share Link Settings</p>
                            <div>
                              <p style={{ fontSize: "0.65rem", color: "var(--muted-foreground)", marginBottom: "0.3rem" }}>Share Type</p>
                              <div style={{ display: "flex", gap: "0.4rem" }}>
                                {(["TIME_BASED", "ONE_TIME"] as const).map(t => (
                                  <button key={t} onClick={() => setRegenShareType(t)} style={{ flex: 1, padding: "0.35rem", borderRadius: "5px", border: `1px solid ${regenShareType === t ? "var(--primary)" : "var(--input-border)"}`, background: regenShareType === t ? "#7c6af720" : "var(--card)", color: regenShareType === t ? "var(--primary)" : "var(--foreground)", cursor: "pointer", fontSize: "0.68rem", fontWeight: regenShareType === t ? 700 : 400 }}>
                                    {t === "TIME_BASED" ? "⏱ Time" : "1️⃣ One-Time"}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p style={{ fontSize: "0.65rem", color: "var(--muted-foreground)", marginBottom: "0.3rem" }}>Access Type</p>
                              <div style={{ display: "flex", gap: "0.4rem" }}>
                                {(["PUBLIC", "PASSWORD"] as const).map(t => (
                                  <button key={t} onClick={() => setRegenAccessType(t)} style={{ flex: 1, padding: "0.35rem", borderRadius: "5px", border: `1px solid ${regenAccessType === t ? "var(--primary)" : "var(--input-border)"}`, background: regenAccessType === t ? "#7c6af720" : "var(--card)", color: regenAccessType === t ? "var(--primary)" : "var(--foreground)", cursor: "pointer", fontSize: "0.68rem", fontWeight: regenAccessType === t ? 700 : 400 }}>
                                    {t === "PUBLIC" ? "🌐 Public" : "🔑 Password"}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {regenShareType === "TIME_BASED" && (
                              <div>
                                <p style={{ fontSize: "0.65rem", color: "var(--muted-foreground)", marginBottom: "0.3rem" }}>Expiry (optional)</p>
                                <input type="datetime-local" value={regenExpiresAt} onChange={e => setRegenExpiresAt(e.target.value)} style={{ width: "100%", background: "var(--card)", border: "1px solid var(--input-border)", borderRadius: "5px", padding: "0.35rem 0.5rem", color: "var(--foreground)", fontSize: "0.7rem", outline: "none" }} />
                              </div>
                            )}
                            <div style={{ display: "flex", gap: "0.4rem" }}>
                              <button onClick={() => handleRegenerate(note.id)} disabled={regenLoading} style={{ flex: 1, padding: "0.45rem", background: "var(--primary)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.72rem", fontWeight: 700 }}>
                                {regenLoading ? "Generating..." : "✅ Generate"}
                              </button>
                              <button onClick={() => setRegenNoteId(null)} style={{ padding: "0.45rem 0.7rem", background: "var(--muted)", color: "var(--foreground)", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.72rem" }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => { setRegenNoteId(note.id); setRegenResult(null); }} style={{ width: "100%", padding: "0.55rem", background: "#7c6af715", border: "1px solid #7c6af740", color: "var(--primary)", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 }}>
                            🔗 Generate New Share Link
                          </button>
                        )}
                      </div>
                    )}

                    {/* Created date */}
                    <p style={{ fontSize: "0.65rem", color: "var(--muted-foreground)", textAlign: "right" }}>
                      Created {new Date(note.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>

          {error && (
            <div style={{ background: "#ef444420", border: "1px solid #ef4444", color: "#ef4444", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.9rem" }}>
              {error}
            </div>
          )}

          {/* Step 1: Create Note */}
          {step === "form" && (
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.4rem" }}>Create a New Note</h2>
              <p style={{ color: "var(--muted-foreground)", marginBottom: "1.75rem", fontSize: "0.9rem" }}>Fill in the details below. You'll configure the share link next.</p>
              <form onSubmit={handleCreateNote} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Title *</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title..." required style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Content *</label>
                  <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your note here..." required rows={10} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
                </div>
                <button type="submit" disabled={noteLoading} style={btnStyle}>
                  {noteLoading ? "Creating..." : "Create Note →"}
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Configure Share */}
          {step === "share" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#4ade8020", border: "1px solid #4ade80", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem" }}>✓</div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Configure Share Link</h2>
              </div>
              <p style={{ color: "var(--muted-foreground)", marginBottom: "2rem", fontSize: "0.9rem" }}>Note created! Now choose how you want to share it.</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Share Type</label>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    {(["TIME_BASED", "ONE_TIME"] as const).map(t => (
                      <button key={t} type="button" onClick={() => setShareType(t)}
                        style={{ flex: 1, padding: "0.85rem", borderRadius: "8px", border: `2px solid ${shareType === t ? "var(--primary)" : "var(--input-border)"}`, background: shareType === t ? "#7c6af720" : "var(--input-bg)", color: shareType === t ? "var(--primary)" : "var(--foreground)", cursor: "pointer", fontWeight: shareType === t ? 700 : 400, fontSize: "0.9rem", transition: "all 0.15s" }}>
                        {t === "TIME_BASED" ? "⏱ Time-Based" : "1️⃣ One-Time"}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", padding: "0.5rem 0.75rem", background: "var(--input-bg)", borderRadius: "6px" }}>
                    {shareType === "ONE_TIME" ? "🔒 Link will be permanently invalidated after first successful view." : "🕐 Link remains accessible until the expiry date/time you set."}
                  </p>
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Access Type</label>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    {(["PUBLIC", "PASSWORD"] as const).map(t => (
                      <button key={t} type="button" onClick={() => setAccessType(t)}
                        style={{ flex: 1, padding: "0.85rem", borderRadius: "8px", border: `2px solid ${accessType === t ? "var(--primary)" : "var(--input-border)"}`, background: accessType === t ? "#7c6af720" : "var(--input-bg)", color: accessType === t ? "var(--primary)" : "var(--foreground)", cursor: "pointer", fontWeight: accessType === t ? 700 : 400, fontSize: "0.9rem", transition: "all 0.15s" }}>
                        {t === "PUBLIC" ? "🌐 Public" : "🔑 Password Protected"}
                      </button>
                    ))}
                  </div>
                  {accessType === "PASSWORD" && (
                    <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", padding: "0.5rem 0.75rem", background: "var(--input-bg)", borderRadius: "6px" }}>
                      🔑 A unique access key will be auto-generated. You'll see it once after creating the link.
                    </p>
                  )}
                </div>

                {shareType === "TIME_BASED" && (
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Expiry Date & Time</label>
                    <input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} style={inputStyle} />
                    <p style={{ fontSize: "0.78rem", color: "var(--muted-foreground)" }}>Leave empty for no expiry.</p>
                  </div>
                )}

                <button onClick={handleGenerateShareLink} disabled={shareLoading} style={btnStyle}>
                  {shareLoading ? "Generating..." : "🔗 Generate Share Link →"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === "done" && shareResult && (
            <div>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.4rem" }}>Share Link Ready!</h2>
              <p style={{ color: "var(--muted-foreground)", marginBottom: "2rem", fontSize: "0.9rem" }}>Your note is live. Share the link below with anyone.</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Share URL */}
                <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: "12px", padding: "1.25rem" }}>
                  <p style={{ fontSize: "0.78rem", color: "var(--muted-foreground)", marginBottom: "0.6rem", fontWeight: 600 }}>🔗 SHARE URL</p>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <code style={{ flex: 1, background: "var(--input-bg)", padding: "0.65rem 0.8rem", borderRadius: "6px", fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--primary)" }}>
                      {shareResult.shareUrl}
                    </code>
                    <button onClick={() => copyText(shareResult.shareUrl, "share-url")} style={{ ...btnStyle, padding: "0.6rem 1rem", fontSize: "0.85rem", whiteSpace: "nowrap", background: copiedKey === "share-url" ? "#4ade80" : "var(--primary)" }}>
                      {copiedKey === "share-url" ? "✓ Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* Access Key */}
                {shareResult.accessKey && (
                  <div style={{ background: "#7c6af715", border: "2px solid var(--primary)", borderRadius: "12px", padding: "1.25rem" }}>
                    <p style={{ fontSize: "0.78rem", color: "var(--primary)", marginBottom: "0.3rem", fontWeight: 700 }}>🔑 ACCESS KEY — SAVE THIS NOW!</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginBottom: "0.75rem" }}>
                      This key will <strong>NOT</strong> be shown again. Share it with the recipient separately via a different channel.
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <code style={{ flex: 1, background: "var(--input-bg)", padding: "0.65rem 0.8rem", borderRadius: "6px", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.15em", color: "var(--foreground)" }}>
                        {shareResult.accessKey}
                      </code>
                      <button onClick={() => copyText(shareResult.accessKey!, "access-key")} style={{ ...btnStyle, padding: "0.6rem 1rem", fontSize: "0.85rem", background: copiedKey === "access-key" ? "#4ade80" : "var(--primary)" }}>
                        {copiedKey === "access-key" ? "✓ Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Info grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  {[
                    { label: "Share Type", value: shareResult.shareType === "ONE_TIME" ? "1️⃣ One-Time" : "⏱ Time-Based" },
                    { label: "Access Type", value: shareResult.accessType === "PUBLIC" ? "🌐 Public" : "🔑 Password" },
                  ].map(item => (
                    <div key={item.label} style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: "8px", padding: "1rem" }}>
                      <p style={{ fontSize: "0.72rem", color: "var(--muted-foreground)", marginBottom: "0.25rem" }}>{item.label}</p>
                      <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div style={{ padding: "0.85rem 1rem", background: "#4ade8010", border: "1px solid #4ade8030", borderRadius: "8px", fontSize: "0.82rem", color: "#4ade80" }}>
                  💡 The note also appears in the sidebar on the left — click it to view the share link anytime.
                </div>

                <button onClick={resetForm} style={{ ...btnStyle, background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--card-border)" }}>
                  + Create Another Note
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const fieldStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.5rem" };
const labelStyle: React.CSSProperties = { fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)" };
const inputStyle: React.CSSProperties = { background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: "8px", padding: "0.7rem 1rem", color: "var(--foreground)", fontSize: "0.95rem", outline: "none", width: "100%" };
const btnStyle: React.CSSProperties = { background: "var(--primary)", color: "white", border: "none", borderRadius: "8px", padding: "0.8rem 1.5rem", fontWeight: 600, cursor: "pointer", fontSize: "0.95rem" };