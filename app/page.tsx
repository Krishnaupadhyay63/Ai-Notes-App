import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getAuthUser();
  if (user) redirect("/notes/new");

  return (
    <>
      <style>{`
        .hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem 1rem; background: var(--background); text-align: center; }
        .hero-title { font-size: clamp(2.2rem, 8vw, 4.5rem); font-weight: 800; line-height: 1.1; margin-bottom: 1.2rem; background: linear-gradient(135deg, #e8e8f0 0%, #7c6af7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero-sub { color: var(--muted-foreground); font-size: clamp(0.95rem, 2.5vw, 1.1rem); margin-bottom: 2.5rem; line-height: 1.7; max-width: 520px; }
        .hero-btns { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-bottom: 4rem; }
        .btn-hero-primary { padding: 0.85rem 2rem; background: var(--primary); color: white; border-radius: 10px; font-weight: 800; text-decoration: none; font-size: 1rem; font-family: var(--font-nunito); transition: background 0.15s, transform 0.1s; }
        .btn-hero-primary:hover { background: var(--primary-hover); transform: translateY(-1px); }
        .btn-hero-secondary { padding: 0.85rem 2rem; background: var(--card); color: var(--foreground); border: 1.5px solid var(--card-border); border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 1rem; font-family: var(--font-nunito); transition: border-color 0.15s, transform 0.1s; }
        .btn-hero-secondary:hover { border-color: var(--primary); transform: translateY(-1px); }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; width: 100%; max-width: 640px; }
        @media (max-width: 600px) { .features-grid { grid-template-columns: 1fr; } .hero-btns { flex-direction: column; align-items: center; } .btn-hero-primary, .btn-hero-secondary { width: 100%; max-width: 300px; text-align: center; } }
        @media (max-width: 400px) { .features-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>

      <main className="hero">
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: "9999px", padding: "0.4rem 1rem", marginBottom: "2rem", fontSize: "0.82rem", color: "var(--muted-foreground)", fontWeight: 600 }}>
          🔐 Secure · Expiring · Simple
        </div>

        <h1 className="hero-title">Share Notes.<br />Securely.</h1>
        <p className="hero-sub">Create notes with expiring share links. One-time access, password protection, time-based expiry — you control who sees what and for how long.</p>

        <div className="hero-btns">
          <Link href="/register" className="btn-hero-primary">Get Started Free</Link>
          <Link href="/login" className="btn-hero-secondary">Sign In</Link>
        </div>

        <div className="features-grid">
          {[
            { icon: "⏱️", title: "Expiring Links", desc: "Set time-based or one-time access" },
            { icon: "🔑", title: "Password Lock", desc: "Auto-generated secure access keys" },
            { icon: "📊", title: "View Tracking", desc: "Track who accessed your notes" },
          ].map(f => (
            <div key={f.title} style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: "14px", padding: "1.25rem", textAlign: "left" }}>
              <div style={{ fontSize: "1.6rem", marginBottom: "0.6rem" }}>{f.icon}</div>
              <div style={{ fontWeight: 800, marginBottom: "0.3rem", fontSize: "0.9rem" }}>{f.title}</div>
              <div style={{ color: "var(--muted-foreground)", fontSize: "0.8rem", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}