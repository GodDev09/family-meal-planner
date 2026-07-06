import { NextRequest, NextResponse } from "next/server";
import { getFamily, addChatLog } from "@/lib/store/sqliteStore";
import { isValidFamilyCode } from "@/lib/auth/familyCode";
import { pushUndo } from "@/lib/store/undoStack";

// Lazy import AI modules (require ANTHROPIC_API_KEY)
async function getOrchestrator() {
  const mod = await import("@/ai/chatOrchestrator");
  return mod;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { family_id, message } = body as { family_id: string; message: string };

  if (!family_id || !isValidFamilyCode(family_id)) {
    return NextResponse.json({ error: "Invalid family_id" }, { status: 400 });
  }
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const family = getFamily(family_id);
  if (!family) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY chưa được cấu hình. Lấy key miễn phí tại https://aistudio.google.com/app/apikey rồi thêm vào .env.local" },
      { status: 503 }
    );
  }

  try {
    // Snapshot current menu for undo before AI may modify it
    const latestMenu = family.weekly_menus[family.weekly_menus.length - 1];
    if (latestMenu) pushUndo(family_id, latestMenu.menu_data);

    const { processChatMessage } = await getOrchestrator();
    const result = await processChatMessage(family_id, message, family);
    addChatLog(family_id, {
      user_message: message,
      ai_response: result.response,
      changes_applied: result.changes ?? null,
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error("Chat error:", e);
    return NextResponse.json({ error: "AI xử lý thất bại. Thử lại sau." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id || !isValidFamilyCode(id)) {
    return NextResponse.json({ error: "Invalid family_id" }, { status: 400 });
  }
  const family = getFamily(id);
  if (!family) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(family.ai_chat_logs.slice(-50));
}
