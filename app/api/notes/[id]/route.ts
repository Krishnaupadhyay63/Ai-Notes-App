import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// GET /api/notes/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const note = await prisma.note.findFirst({
    where: { id, userId: user.userId },
    include: { shareLink: true },
  });

  if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
  return NextResponse.json({ note });
}

// DELETE /api/notes/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const note = await prisma.note.findFirst({ where: { id, userId: user.userId } });
  if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ message: "Note deleted" });
}
