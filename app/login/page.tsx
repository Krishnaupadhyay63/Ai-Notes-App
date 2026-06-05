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
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🔐</div>
        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>Sign in to your NoteVault account</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              style={styles.input}
              required
            />
          </div>
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={styles.footer}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={styles.link}>Create one</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "var(--background)" },
  card: { width: "100%", maxWidth: "420px", background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: "16px", padding: "2.5rem" },
  logo: { fontSize: "2.5rem", marginBottom: "1rem" },
  title: { fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.35rem", color: "var(--foreground)" },
  subtitle: { color: "var(--muted-foreground)", marginBottom: "2rem", fontSize: "0.95rem" },
  error: { background: "#ef444420", border: "1px solid #ef4444", color: "#ef4444", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.9rem" },
  form: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  field: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  label: { fontSize: "0.85rem", fontWeight: 500, color: "var(--foreground)" },
  input: { background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: "8px", padding: "0.7rem 1rem", color: "var(--foreground)", fontSize: "0.95rem", outline: "none", width: "100%" },
  button: { background: "var(--primary)", color: "white", border: "none", borderRadius: "8px", padding: "0.8rem", fontWeight: 600, fontSize: "1rem", cursor: "pointer", marginTop: "0.5rem" },
  footer: { textAlign: "center", marginTop: "1.5rem", color: "var(--muted-foreground)", fontSize: "0.9rem" },
  link: { color: "var(--primary)", textDecoration: "none", fontWeight: 500 },
};
