/**
 * responseComposer.ts
 * Lớp 1 (chiều ra): nhận EngineDiffOutput (kết quả kỹ thuật từ Engine,
 * KHÔNG phải do AI tính toán) và diễn giải thành câu trả lời tự nhiên,
 * thân thiện, tiếng Việt cho người dùng.
 *
 * Ở đây KHÔNG dùng tool-use vì output mong muốn là văn bản tự nhiên (text),
 * không phải dữ liệu có cấu trúc — chỉ cần system prompt chặt để tránh model
 * bịa thêm thông tin ngoài dữ liệu được cấp.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { EngineDiffOutput } from "../types/schemas";

const anthropic = new Anthropic();

const RESPONSE_COMPOSER_SYSTEM_PROMPT = `
Bạn là trợ lý dinh dưỡng gia đình, giọng văn thân thiện, gần gũi như người nhà,
không dùng thuật ngữ chuyên môn khó hiểu trừ khi cần thiết (nếu dùng thì giải
thích ngắn gọn kèm theo). Bạn nhận vào một JSON mô tả các thay đổi mà hệ thống
backend đã thực hiện (KHÔNG phải do bạn tính toán). Nhiệm vụ của bạn là tường
thuật lại các thay đổi đó rõ ràng, dễ hiểu, đúng sự thật theo dữ liệu được cung
cấp — không thêm thắt, không suy diễn số liệu không có trong dữ liệu.

Yêu cầu khi trả lời:
1. Mở đầu xác nhận đã hiểu đúng yêu cầu của người dùng.
2. Liệt kê ngắn gọn các món/thực đơn đã thay đổi (món cũ -> món mới), chỉ nêu
   phần THỰC SỰ thay đổi.
3. Nếu có cảnh báo dinh dưỡng (thiếu/thừa vi chất), nêu rõ bằng ngôn ngữ đơn
   giản, kèm gợi ý khắc phục nếu dữ liệu có cung cấp.
4. Nếu severity_flag = "needs_professional_advice", PHẢI nhắc người dùng nên
   tham khảo bác sĩ/chuyên gia dinh dưỡng, giọng điệu quan tâm, không hoang mang.
5. Không tự bịa thêm số liệu, món ăn, hay thay đổi không có trong dữ liệu đầu vào.
`.trim();

export async function composeResponse(
  userOriginalMessage: string,
  diffResult: EngineDiffOutput
): Promise<string> {
  // Nếu Engine từ chối áp dụng (status = rejected), soạn câu trả lời ngắn gọn
  // trực tiếp bằng code, không cần gọi AI — tiết kiệm chi phí và tránh AI
  // "sáng tác" lý do khi không có gì để tường thuật.
  if (diffResult.status === "rejected") {
    return `Mình chưa thể áp dụng thay đổi này: ${
      diffResult.reject_reason ?? "có xung đột với ràng buộc hiện tại."
    } Bạn có muốn mình thử theo cách khác không?`;
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    temperature: 0.4,
    system: RESPONSE_COMPOSER_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              `Yêu cầu gốc của người dùng: "${userOriginalMessage}"\n\n` +
              `Kết quả kỹ thuật từ hệ thống (diff):\n${JSON.stringify(
                diffResult,
                null,
                2
              )}`,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );

  return textBlock?.text ?? "Xin lỗi, mình chưa soạn được câu trả lời phù hợp.";
}
