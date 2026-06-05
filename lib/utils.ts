import crypto from "crypto";
import bcrypt from "bcryptjs";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateShareToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateAccessKey(): string {
  // Generates a readable 12-char key: e.g. "a3f9-b2c1-d4e5"
  const raw = crypto.randomBytes(6).toString("hex");
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

export async function hashAccessKey(key: string): Promise<string> {
  return bcrypt.hash(key, 10);
}

export async function verifyAccessKey(key: string, hash: string): Promise<boolean> {
  return bcrypt.compare(key, hash);
}

export function isLinkExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return new Date() > new Date(expiresAt);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
