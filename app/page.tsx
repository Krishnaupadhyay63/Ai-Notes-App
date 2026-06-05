import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getAuthUser();
  if (user) redirect("/notes/new");

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", background: "var(--background)" }}>
      <div style={{ textAlign: "center", maxWidth: "560px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: "9999px", padding: "0.4rem 1rem", marginBottom: "2rem", fontSize: "0.85rem", color: "var(--muted-foreground)" }}>
          🔐 Secure · Expiring · Simple
        </div>

        <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 800, lineHeight: 1.1, marginBottom: "1.2rem", background: "linear-gradient(135deg, #e8e8f0 0%, #7c6af7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Share Notes.<br />Securely.
        </h1>

        <p style={{ color: "var(--muted-foreground)", fontSize: "1.1rem", marginBottom: "2.5rem", lineHeight: 1.7 }}>
          Create notes with expiring share links. One-time access, password protection, time-based expiry — you control who sees what and for how long.
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register" style={{ padding: "0.8rem 2rem", background: "var(--primary)", color: "white", borderRadius: "8px", fontWeight: 600, textDecoration: "none", fontSize: "1rem" }}>
            Get Started
          </Link>
          <Link href="/login" style={{ padding: "0.8rem 2rem", background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--card-border)", borderRadius: "8px", fontWeight: 600, textDecoration: "none", fontSize: "1rem" }}>
            Sign In
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginTop: "4rem" }}>
          {[
            { icon: "⏱️", title: "Expiring Links", desc: "Set time-based or one-time access" },
            { icon: "🔑", title: "Password Lock", desc: "Auto-generated secure access keys" },
            { icon: "📊", title: "View Tracking", desc: "Track who accessed your notes" },
          ].map((f) => (
            <div key={f.title} style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: "12px", padding: "1.2rem", textAlign: "left" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{f.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: "0.25rem", fontSize: "0.9rem" }}>{f.title}</div>
              <div style={{ color: "var(--muted-foreground)", fontSize: "0.8rem" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
