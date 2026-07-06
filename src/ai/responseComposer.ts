/**
 * responseComposer.ts
 * Lớp 1 (chiều ra): dùng Gemini Flash để diễn giải EngineDiffOutput
 * thành câu trả lời tiếng Việt tự nhiên, thân thiện.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { EngineDiffOutput } from "../types/schemas";

const SYSTEM_PROMPT = `Bạn là trợ lý dinh dưỡng gia đình, giọng văn thân thiện, gần gũi. Nhận JSON mô tả thay đổi do hệ thống thực hiện, tường thuật lại rõ ràng bằng tiếng Việt — không thêm thắt, không bịa số liệu.

Yêu cầu:
1. Mở đầu xác nhận đã hiểu yêu cầu
2. Liệt kê ngắn gọn các thay đổi (món cũ → món mới), chỉ phần THỰC SỰ thay đổi
3. Nếu có cảnh báo dinh dưỡng, nêu bằng ngôn ngữ đơn giản kèm gợi ý
4. Nếu severity_flag = "needs_professional_advice", nhắc tham khảo bác sĩ/chuyên gia
5. KHÔNG bịa thêm số liệu, món ăn, thay đổi không có trong dữ liệu`;

export async function composeResponse(
  userOriginalMessage: string,
  diffResult: EngineDiffOutput
): Promise<string> {
  // Fast path: rejected without AI call
  if (diffResult.status === "rejected") {
    return `Mình chưa thể áp dụng thay đổi này: ${
      diffResult.reject_reason ?? "có xung đột với ràng buộc hiện tại."
    } Bạn có muốn mình thử theo cách khác không?`;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Fallback: generate response from diff without AI
    return buildFallbackResponse(diffResult);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
  });

  const prompt = `${SYSTEM_PROMPT}

Yêu cầu gốc của người dùng: "${userOriginalMessage}"

Kết quả kỹ thuật từ hệ thống:
${JSON.stringify(diffResult, null, 2)}

Hãy tường thuật lại bằng tiếng Việt thân thiện:`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim() || buildFallbackResponse(diffResult);
}

function buildFallbackResponse(diff: EngineDiffOutput): string {
  if (!diff.changes.length) {
    return "Mình đã xem xét yêu cầu nhưng không cần thay đổi thực đơn.";
  }
  const lines = diff.changes.map((c) => {
    if (c.change_type === "replaced" && c.old_dish && c.new_dish)
      return `• Đổi "${c.old_dish}" → "${c.new_dish}" (${c.date} bữa ${c.meal_slot})`;
    if (c.change_type === "removed" && c.old_dish)
      return `• Loại bỏ "${c.old_dish}" (${c.date} bữa ${c.meal_slot})`;
    return `• Cập nhật ${c.meal_slot} ngày ${c.date}`;
  });
  let response = `Mình đã cập nhật thực đơn:\n${lines.join("\n")}`;
  if (diff.nutrition_impact.warnings.length > 0) {
    response += `\n\n⚠️ Lưu ý dinh dưỡng: ${diff.nutrition_impact.warnings[0].suggestion}`;
  }
  if (diff.severity_flag === "needs_professional_advice") {
    response += "\n\nBạn nên tham khảo ý kiến bác sĩ/chuyên gia dinh dưỡng trước khi áp dụng lâu dài.";
  }
  return response;
}
