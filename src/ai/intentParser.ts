/**
 * intentParser.ts
 * Lớp 1 (chiều vào): gọi Claude API với "tool use" để ép model trả về
 * đúng JSON schema (IntentParserOutput) thay vì text tự do.
 *
 * Dùng tool-use thay vì chỉ prompt "hãy trả JSON" vì:
 *  - Model bị ép theo input_schema của tool -> giảm mạnh rủi ro sai định dạng
 *  - Vẫn validate lại bằng zod trước khi tin tưởng dữ liệu (phòng model
 *    trả tool input không khớp schema, hoặc không gọi tool nào cả)
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  IntentParserOutputSchema,
  type IntentParserOutput,
} from "../types/schemas";

const anthropic = new Anthropic(); // đọc ANTHROPIC_API_KEY từ biến môi trường

const INTENT_PARSER_SYSTEM_PROMPT = `
Bạn là bộ phân tích ý định (intent parser) cho một hệ thống lên thực đơn gia đình
theo chuẩn dinh dưỡng Việt Nam. Nhiệm vụ DUY NHẤT của bạn là đọc tin nhắn của
người dùng và gọi tool "record_intent" với đúng tham số theo schema đã định nghĩa.
Bạn KHÔNG tự tính toán số liệu dinh dưỡng, KHÔNG tự đề xuất món ăn cụ thể, KHÔNG
tự quyết định các con số calo/vi chất — những việc đó do hệ thống backend xử lý.

Quy tắc bắt buộc:
1. Nếu người dùng đề cập dị ứng/bệnh lý có khả năng nghiêm trọng (dị ứng nặng có
   nguy cơ sốc phản vệ, tiểu đường, suy thận, bệnh tim mạch, phụ nữ mang thai có
   biến chứng) -> LUÔN đặt severity_flag = "needs_professional_advice".
2. Nếu confidence < 0.7, PHẢI điền clarification_question, không được đoán bừa.
3. Nếu 1 tin nhắn chứa nhiều ý định, chỉ xử lý ý định RÕ RÀNG NHẤT.
4. Không tự điền số liệu dinh dưỡng cụ thể trừ khi người dùng nêu rõ con số đó.
`.trim();

// Định nghĩa tool theo đúng cấu trúc Phụ lục B.1 (JSON Schema draft-07 rút gọn
// thành input_schema mà Claude API yêu cầu — dùng chung 1 nguồn schema để tránh
// lệch giữa "cái ta ép model trả" và "cái ta validate lại bằng zod").
const RECORD_INTENT_TOOL: Anthropic.Tool = {
  name: "record_intent",
  description:
    "Ghi lại ý định đã phân tích được từ tin nhắn người dùng, theo đúng schema chuẩn.",
  input_schema: {
    type: "object",
    properties: {
      intent: {
        type: "string",
        enum: [
          "add_restriction",
          "remove_restriction",
          "adjust_energy_goal",
          "add_temporary_guest",
          "mark_member_absent",
          "change_cuisine_style",
          "swap_specific_dish",
          "budget_constraint",
          "time_constraint",
          "health_condition_update",
          "general_question",
          "unclear",
        ],
      },
      confidence: { type: "number", minimum: 0, maximum: 1 },
      target_member: { type: ["string", "null"] },
      params: {
        type: "object",
        description:
          "Tham số riêng theo từng intent, ví dụ: { restriction_type, ingredient_or_dish, reason } cho add_restriction",
      },
      severity_flag: {
        type: "string",
        enum: ["none", "needs_confirmation", "needs_professional_advice"],
      },
      clarification_question: { type: ["string", "null"] },
    },
    required: ["intent", "confidence", "severity_flag"],
  },
};

export interface FamilyContext {
  familyId: string;
  members: Array<{
    id: string;
    name: string;
    age: number;
    restrictions: string[];
  }>;
  currentWeekMenuSummary: string; // tóm tắt ngắn gọn, không nhét cả JSON thực đơn đầy đủ vào prompt
}

/**
 * Gọi Claude API để phân tích ý định người dùng, trả về object đã validate.
 * Ném lỗi nếu model không gọi tool hoặc dữ liệu không khớp schema — caller
 * (route API) nên bắt lỗi này và trả về "xin lỗi, mình chưa hiểu ý bạn, thử lại nhé".
 */
export async function parseUserIntent(
  userMessage: string,
  context: FamilyContext
): Promise<IntentParserOutput> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    temperature: 0.2, // thấp vì đây là tác vụ trích xuất có cấu trúc, không cần sáng tạo
    system: INTENT_PARSER_SYSTEM_PROMPT,
    tools: [RECORD_INTENT_TOOL],
    tool_choice: { type: "tool", name: "record_intent" }, // ép model luôn gọi đúng tool này
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Ngữ cảnh gia đình hiện tại:\n${JSON.stringify(context, null, 2)}\n\nTin nhắn người dùng: "${userMessage}"`,
          },
        ],
      },
    ],
  });

  const toolUseBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (!toolUseBlock) {
    throw new Error(
      "Model không trả về tool_use block — không thể phân tích ý định người dùng."
    );
  }

  // Validate nghiêm ngặt bằng zod trước khi tin tưởng dữ liệu từ model
  const parsed = IntentParserOutputSchema.safeParse(toolUseBlock.input);
  if (!parsed.success) {
    throw new Error(
      `Output của intent parser không khớp schema: ${parsed.error.message}`
    );
  }

  return parsed.data;
}
