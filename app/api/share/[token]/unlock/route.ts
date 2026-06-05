import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isLinkExpired, verifyAccessKey } from "@/lib/utils";

// POST /api/share/[token]/unlock - unlock and get note content
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json().catch(() => ({}));
  const { password } = body;

  // First validate link without modifying anything
  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: { note: true },
  });

  if (!shareLink) {
    return NextResponse.json({ error: "INVALID_LINK", message: "This link does not exist" }, { status: 404 });
  }

  if (shareLink.isRevoked) {
    return NextResponse.json({ error: "REVOKED", message: "This link has been revoked" }, { status: 410 });
  }

  if (isLinkExpired(shareLink.expiresAt)) {
    return NextResponse.json({ error: "EXPIRED", message: "This link has expired" }, { status: 410 });
  }

  if (shareLink.shareType === "ONE_TIME" && shareLink.isUsed) {
    return NextResponse.json({ error: "ALREADY_USED", message: "This one-time link has already been used" }, { status: 410 });
  }

  // Password check (does NOT increment count on wrong password)
  if (shareLink.accessType === "PASSWORD") {
    if (!password) {
      return NextResponse.json({ error: "PASSWORD_REQUIRED", message: "Password is required" }, { status: 401 });
    }
    if (!shareLink.password) {
      return NextResponse.json({ error: "SERVER_ERROR", message: "Invalid link configuration" }, { status: 500 });
    }
    const valid = await verifyAccessKey(password, shareLink.password);
    if (!valid) {
      // No count increment on wrong password
      return NextResponse.json({ error: "WRONG_PASSWORD", message: "Incorrect access key" }, { status: 401 });
    }
  }

  // ✅ ATOMIC update for ONE_TIME links — handles race conditions
  // Uses updateMany with WHERE is_used = false — only one request wins
  if (shareLink.shareType === "ONE_TIME") {
    const result = await prisma.shareLink.updateMany({
      where: {
        token,
        isUsed: false,     // Atomic check: only succeeds if not already used
        isRevoked: false,
      },
      data: {
        isUsed: true,
        viewCount: { increment: 1 },
      },
    });

    if (result.count === 0) {
      // Another request beat us to it
      return NextResponse.json({ error: "ALREADY_USED", message: "This one-time link has already been used" }, { status: 410 });
    }
  } else {
    // TIME_BASED: just increment view count atomically
    await prisma.shareLink.update({
      where: { token },
      data: { viewCount: { increment: 1 } },
    });
  }

  return NextResponse.json({
    note: {
      title: shareLink.note.title,
      content: shareLink.note.content,
      createdAt: shareLink.note.createdAt,
    },
  });
}
