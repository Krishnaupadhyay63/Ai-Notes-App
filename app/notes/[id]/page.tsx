import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { formatDate, isLinkExpired } from "@/lib/utils";
import Link from "next/link";

export default async function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const note = await prisma.note.findFirst({
    where: { id, userId: user.userId },
    include: { shareLink: true },
  });

  if (!note) notFound();

  const sl = note.shareLink;
  const expired = sl ? isLinkExpired(sl.expiresAt) : false;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "2rem" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <Link href="/notes/new" style={{ color: "var(--muted-foreground)", textDecoration: "none", fontSize: "0.9rem" }}>← Back</Link>
        </div>

        <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: "16px", padding: "2rem", marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>{note.title}</h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Created {formatDate(note.createdAt)}</p>
          <div style={{ background: "var(--input-bg)", borderRadius: "8px", padding: "1.25rem", lineHeight: 1.7, whiteSpace: "pre-wrap", fontSize: "0.95rem" }}>
            {note.content}
          </div>
        </div>

        {sl && (
          <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: "16px", padding: "2rem" }}>
            <h2 style={{ fontWeight: 700, marginBottom: "1.25rem" }}>Share Link Info</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              {[
                { label: "Status", value: sl.isRevoked ? "Revoked" : expired ? "Expired" : sl.shareType === "ONE_TIME" && sl.isUsed ? "Used" : "Active", color: sl.isRevoked || expired || (sl.shareType === "ONE_TIME" && sl.isUsed) ? "#ef4444" : "#4ade80" },
                { label: "Share Type", value: sl.shareType === "ONE_TIME" ? "One-Time" : "Time-Based" },
                { label: "Access Type", value: sl.accessType === "PUBLIC" ? "Public" : "Password Protected" },
                { label: "View Count", value: sl.viewCount.toString() },
                { label: "Expires At", value: sl.expiresAt ? formatDate(sl.expiresAt) : "No expiry" },
                { label: "Created", value: formatDate(sl.createdAt) },
              ].map(item => (
                <div key={item.label} style={{ background: "var(--input-bg)", borderRadius: "8px", padding: "0.75rem" }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginBottom: "0.25rem" }}>{item.label}</p>
                  <p style={{ fontWeight: 600, fontSize: "0.9rem", color: item.color || "var(--foreground)" }}>{item.value}</p>
                </div>
              ))}
            </div>

            <div style={{ background: "var(--input-bg)", borderRadius: "8px", padding: "0.75rem", marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginBottom: "0.3rem" }}>Share URL</p>
              <code style={{ fontSize: "0.85rem", wordBreak: "break-all" }}>{appUrl}/share/{sl.token}</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
