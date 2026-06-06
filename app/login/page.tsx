"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push("/notes/new");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; background: var(--background); }
        .auth-card { width: 100%; max-width: 440px; background: var(--card); border: 1px solid var(--card-border); border-radius: 20px; padding: 2.5rem; }
        @media (max-width: 480px) { .auth-card { padding: 1.75rem 1.25rem; border-radius: 16px; } }
        .auth-input { background: var(--input-bg); border: 1.5px solid var(--input-border); border-radius: 10px; padding: 0.8rem 1rem; color: var(--foreground); font-size: 0.95rem; width: 100%; font-family: var(--font-inter); transition: border-color 0.15s, box-shadow 0.15s; }
        .auth-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px #7c6af720; outline: none; }
        .auth-btn { background: var(--primary); color: white; border: none; border-radius: 10px; padding: 0.85rem; font-weight: 800; font-size: 1rem; cursor: pointer; width: 100%; font-family: var(--font-nunito); transition: background 0.15s, transform 0.1s; }
        .auth-btn:hover { background: var(--primary-hover); }
        .auth-btn:active { transform: scale(0.98); }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div className="auth-container">
        <div className="auth-card">
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔐</div>
          <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 1.9rem)", fontWeight: 800, marginBottom: "0.35rem" }}>Welcome back</h1>
          <p style={{ color: "var(--muted-foreground)", marginBottom: "2rem", fontSize: "0.95rem" }}>Sign in to your NoteVault account</p>

          {error && (
            <div style={{ background: "#ef444420", border: "1px solid #ef4444", color: "#ef4444", padding: "0.75rem 1rem", borderRadius: "10px", marginBottom: "1.25rem", fontSize: "0.9rem", fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Email</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="auth-input" required />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Password</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="auth-input" required />
            </div>
            <button type="submit" disabled={loading} className="auth-btn" style={{ marginTop: "0.5rem" }}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--muted-foreground)", fontSize: "0.9rem" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 700 }}>Create one</Link>
          </p>
        </div>
      </div>
    </>
  );
}