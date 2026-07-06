/**
 * intentParser.ts
 * Lớp 1 (chiều vào): gọi Gemini API để phân tích ý định người dùng.
 * Dùng JSON mode (responseMimeType: "application/json") để ép model
 * trả đúng schema, sau đó validate lại bằng Zod.
 *
 * Free tier Gemini Flash: 1500 req/ngày, 15 RPM — đủ cho ứng dụng gia đình.
 * Đăng ký API key miễn phí: https://aistudio.google.com/app/apikey
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  IntentParserOutputSchema,
  type IntentParserOutput,
} from "../types/schemas";

export interface FamilyContext {
  familyId: string;
  members: Array<{
    id: string;
    name: string;
    age: number;
    restrictions: string[];
  }>;
  currentWeekMenuSummary: string;
}

const SYSTEM_PROMPT = `Bạn là bộ phân tích ý định (intent parser) cho hệ thống lên thực đơn gia đình theo chuẩn dinh dưỡng Việt Nam. Nhiệm vụ DUY NHẤT là đọc tin nhắn người dùng và trả về JSON theo schema.

Quy tắc:
1. Dị ứng/bệnh lý nghiêm trọng → severity_flag = "needs_professional_advice"
2. confidence < 0.7 → điền clarification_question
3. Nhiều ý định → xử lý ý định RÕ NHẤT
4. KHÔNG tự điền số liệu dinh dưỡng

Schema output (trả về JSON hợp lệ, KHÔNG có markdown code fence):
{
  "intent": "<add_restriction|remove_restriction|adjust_energy_goal|add_temporary_guest|mark_member_absent|change_cuisine_style|swap_specific_dish|budget_constraint|time_constraint|health_condition_update|general_question|unclear>",
  "confidence": <0-1>,
  "target_member": "<member id hoặc null>",
  "params": {},
  "severity_flag": "<none|needs_confirmation|needs_professional_advice>",
  "clarification_question": "<câu hỏi làm rõ hoặc null>"
}`;

export async function parseUserIntent(
  userMessage: string,
  context: FamilyContext
): Promise<IntentParserOutput> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY chưa được cấu hình");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 512,
    },
  });

  const prompt = `${SYSTEM_PROMPT}

Ngữ cảnh gia đình:
${JSON.stringify(context, null, 2)}

Tin nhắn người dùng: "${userMessage}"

Trả về JSON:`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Gemini trả về JSON không hợp lệ: ${text.slice(0, 100)}`);
  }

  const validated = IntentParserOutputSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Output không khớp schema: ${validated.error.message}`);
  }

  return validated.data;
}
