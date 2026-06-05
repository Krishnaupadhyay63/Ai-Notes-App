import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// POST /api/notes/[id]/revoke
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const note = await prisma.note.findFirst({ where: { id, userId: user.userId } });
  if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  const shareLink = await prisma.shareLink.findFirst({ where: { noteId: id } });
  if (!shareLink) return NextResponse.json({ error: "No share link found" }, { status: 404 });

  await prisma.shareLink.update({
    where: { id: shareLink.id },
    data: { isRevoked: true },
  });

  return NextResponse.json({ message: "Share link revoked successfully" });
}
