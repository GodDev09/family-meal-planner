/**
 * chatOrchestrator.ts
 * Ví dụ 1 API route (Next.js) xử lý 1 tin nhắn chat từ người dùng, nối đúng
 * luồng đã mô tả ở Phụ lục B.3 trong docs/plan-website-goi-y-bua-an-gia-dinh.md:
 *
 *   User message
 *     -> parseUserIntent()   (AI - Lớp 1 chiều vào)
 *     -> processIntent()     (Engine - Lớp 2, rule-based)
 *     -> composeResponse()   (AI - Lớp 1 chiều ra)
 *     -> lưu log + trả kết quả cho frontend
 */

import { parseUserIntent, type FamilyContext } from "../ai/intentParser";
import { processIntent } from "../engine/nutritionEngine";
import { composeResponse } from "../ai/responseComposer";
import type { EngineDiffOutput } from "../types/schemas";

// Các hàm dưới đây chỉ là chữ ký ví dụ — thực tế nối vào lớp DB thật (Postgres/Supabase)
declare function getFamilyContext(familyId: string): Promise<FamilyContext>;
declare function saveChatLog(entry: {
  familyId: string;
  userMessage: string;
  aiReply: string;
  diff: EngineDiffOutput;
  timestamp: string;
}): Promise<void>;
declare const engineDeps: Parameters<typeof processIntent>[2];

export interface ChatHandlerResult {
  reply: string;
  needsUserConfirmation: boolean;
  diff: EngineDiffOutput;
}

export async function handleChatMessage(
  familyId: string,
  userMessage: string
): Promise<ChatHandlerResult> {
  // 1. Lấy ngữ cảnh gia đình hiện tại (tóm tắt, không nhét cả DB vào prompt)
  const context = await getFamilyContext(familyId);

  // 2. Lớp 1 chiều vào: AI hiểu ý định -> JSON có cấu trúc, đã validate bằng zod
  const intent = await parseUserIntent(userMessage, context);

  // 2b. Nếu model tự thấy không đủ thông tin, trả câu hỏi làm rõ ngay,
  // KHÔNG gọi Engine (tránh áp dụng thay đổi dựa trên phỏng đoán)
  if (intent.intent === "unclear" || intent.clarification_question) {
    const reply =
      intent.clarification_question ??
      "Mình chưa hiểu rõ ý bạn, bạn có thể nói cụ thể hơn không?";
    return {
      reply,
      needsUserConfirmation: false,
      diff: {
        status: "rejected",
        reject_reason: "Cần làm rõ thêm thông tin từ người dùng.",
        changes: [],
        nutrition_impact: { before: {}, after: {}, warnings: [] },
        severity_flag: intent.severity_flag,
        professional_advice_note: null,
      },
    };
  }

  // 3. Lớp 2: Engine rule-based áp dụng thay đổi + tính lại dinh dưỡng theo RDA
  const diff = await processIntent(familyId, intent, engineDeps);

  // 4. Lớp 1 chiều ra: AI diễn giải kết quả kỹ thuật thành câu trả lời tự nhiên
  const reply = await composeResponse(userMessage, diff);

  // 5. Ghi log để phục vụ "Hoàn tác" và tra cứu lịch sử (bảng ai_chat_logs)
  await saveChatLog({
    familyId,
    userMessage,
    aiReply: reply,
    diff,
    timestamp: new Date().toISOString(),
  });

  // 6. Nếu severity_flag yêu cầu xác nhận, để UI chặn lại chờ người dùng bấm
  // "Xác nhận áp dụng" thay vì tự động áp dụng ngay (mục B.3 trong plan)
  const needsUserConfirmation = diff.severity_flag !== "none";

  return { reply, needsUserConfirmation, diff };
}
