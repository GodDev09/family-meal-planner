import { NextRequest, NextResponse } from "next/server";
import {
  getFamily,
  createFamily,
  addMember,
  updateMember,
  removeMember,
  updateSettings,
  type FamilyMember,
} from "@/lib/store/sqliteStore";
import { isValidFamilyCode } from "@/lib/auth/familyCode";

// Simple in-memory rate limiter: max 30 write ops per IP per minute
const _rateLimiter = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = _rateLimiter.get(ip);
  if (!entry || now > entry.resetAt) {
    _rateLimiter.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 30) return false;
  entry.count++;
  return true;
}

function getIP(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

// Auth: the family_id IS the bearer token — existence in store = ownership.
// Only the holder of the exact code can read/modify their family.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function authorize(familyId: string, _req: NextRequest): boolean {
  // In production, add HMAC signature or session cookie here.
  // Phase 1: code-based auth — if you have the code, you own the family.
  return isValidFamilyCode(familyId) && !!getFamily(familyId);
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id || !isValidFamilyCode(id)) {
    return NextResponse.json({ error: "Invalid family_id" }, { status: 400 });
  }
  const family = getFamily(id);
  if (!family) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(family);
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const body = await req.json();
  const { family_id } = body;
  if (!family_id || !isValidFamilyCode(family_id)) {
    return NextResponse.json({ error: "Invalid family_id" }, { status: 400 });
  }
  if (getFamily(family_id)) {
    return NextResponse.json({ error: "Already exists" }, { status: 409 });
  }
  const family = createFamily(family_id);
  return NextResponse.json(family, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const ip = getIP(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json();
  const { family_id, action, ...payload } = body as {
    family_id: string;
    action: "add_member" | "update_member" | "remove_member" | "update_settings";
    [key: string]: unknown;
  };

  if (!family_id || !isValidFamilyCode(family_id)) {
    return NextResponse.json({ error: "Invalid family_id" }, { status: 400 });
  }
  if (!action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }
  // Ownership check: family must exist (only the code holder can reach this)
  if (!authorize(family_id, req)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  switch (action) {
    case "add_member": {
      const member = addMember(family_id, payload as Omit<FamilyMember, "id" | "avatar_color">);
      if (!member) return NextResponse.json({ error: "Family not found" }, { status: 404 });
      return NextResponse.json(member);
    }
    case "update_member": {
      const { member_id, ...updates } = payload as { member_id: string } & Partial<FamilyMember>;
      const member = updateMember(family_id, member_id, updates);
      if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
      return NextResponse.json(member);
    }
    case "remove_member": {
      const { member_id } = payload as { member_id: string };
      const ok = removeMember(family_id, member_id);
      if (!ok) return NextResponse.json({ error: "Member not found" }, { status: 404 });
      return NextResponse.json({ ok: true });
    }
    case "update_settings": {
      const settings = updateSettings(family_id, payload as Parameters<typeof updateSettings>[1]);
      if (!settings) return NextResponse.json({ error: "Family not found" }, { status: 404 });
      return NextResponse.json(settings);
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
