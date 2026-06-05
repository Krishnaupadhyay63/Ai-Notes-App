import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isLinkExpired } from "@/lib/utils";

// GET /api/share/[token] - check link validity and return meta (no note content)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: { note: { select: { title: true } } },
  });

  if (!shareLink) {
    return NextResponse.json({ error: "INVALID_LINK", message: "This link does not exist" }, { status: 404 });
  }

  if (shareLink.isRevoked) {
    return NextResponse.json({ error: "REVOKED", message: "This link has been revoked" }, { status: 410 });
  }

  if (shareLink.shareType === "ONE_TIME" && shareLink.isUsed) {
    return NextResponse.json({ error: "ALREADY_USED", message: "This one-time link has already been used" }, { status: 410 });
  }

  if (isLinkExpired(shareLink.expiresAt)) {
    return NextResponse.json({ error: "EXPIRED", message: "This link has expired" }, { status: 410 });
  }

  return NextResponse.json({
    valid: true,
    accessType: shareLink.accessType,
    shareType: shareLink.shareType,
    noteTitle: shareLink.note.title,
    expiresAt: shareLink.expiresAt,
    viewCount: shareLink.viewCount,
  });
}
