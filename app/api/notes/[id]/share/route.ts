import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { generateShareToken, generateAccessKey, hashAccessKey } from "@/lib/utils";

// POST /api/notes/[id]/share - generate share link
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const { shareType, accessType, expiresAt } = await req.json();

    if (!shareType || !accessType) {
      return NextResponse.json({ error: "shareType and accessType are required" }, { status: 400 });
    }

    const note = await prisma.note.findFirst({ where: { id, userId: user.userId } });
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

    // Delete existing share link if any
    await prisma.shareLink.deleteMany({ where: { noteId: id } });

    const token = generateShareToken();
    let plainPassword: string | null = null;
    let hashedPassword: string | null = null;

    if (accessType === "PASSWORD") {
      plainPassword = generateAccessKey();
      hashedPassword = await hashAccessKey(plainPassword);
    }

    const shareLink = await prisma.shareLink.create({
      data: {
        token,
        noteId: id,
        shareType,
        accessType,
        password: hashedPassword,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isRevoked: false,
        isUsed: false,
        viewCount: 0,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const shareUrl = `${appUrl}/share/${token}`;

    return NextResponse.json({
      shareUrl,
      token,
      accessKey: plainPassword, // Only returned once — never stored in plain text
      shareLink: {
        ...shareLink,
        password: undefined, // Never expose hash
      },
    });
  } catch (error) {
    console.error("Share link error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
