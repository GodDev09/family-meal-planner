# Website Gợi ý Bữa ăn Gia đình — Tài liệu & Code mẫu

## Cấu trúc thư mục

```
project/
├── docs/
│   └── plan-website-goi-y-bua-an-gia-dinh.md   # Bản kế hoạch đầy đủ (tính năng, kiến trúc, roadmap)
└── src/
    ├── types/
    │   └── schemas.ts             # Zod schema dùng chung, khớp Phụ lục B trong plan
    ├── ai/
    │   ├── intentParser.ts        # Lớp 1 chiều vào: Claude API + tool-use (Phụ lục A.1)
    │   ├── responseComposer.ts    # Lớp 1 chiều ra: diễn giải kết quả (Phụ lục A.2)
    │   └── chatOrchestrator.ts    # Nối luồng: Intent Parser -> Engine -> Response Composer
    └── engine/
        └── nutritionEngine.ts     # Lớp 2: engine rule-based, tính lại dinh dưỡng + sinh diff
```

## Cài đặt để chạy thử (khi tích hợp vào dự án Next.js/Node.js thật)

```bash
npm install @anthropic-ai/sdk zod
```

Thiết lập biến môi trường:
```
ANTHROPIC_API_KEY=sk-ant-...
```

## Lưu ý khi triển khai thật

1. **`intentParser.ts` và `responseComposer.ts`** hiện dùng model `claude-sonnet-4-6` —
   kiểm tra lại tên model mới nhất trong tài liệu Claude API (`docs.claude.com`) tại
   thời điểm triển khai, vì danh sách model có thể thay đổi.
2. **`nutritionEngine.ts`** mới là bản khung (skeleton) minh hoạ cho intent
   `add_restriction`. Cần viết thêm các handler cho `adjust_energy_goal`,
   `add_temporary_guest`, `swap_specific_dish`,... theo cùng khuôn mẫu.
3. Các hàm có `declare function ...` trong `chatOrchestrator.ts` là **placeholder**
   cần nối vào lớp DB thật (Postgres/Supabase) theo schema đã mô tả ở mục 5.1
   trong file plan (`families`, `family_members`, `weekly_menus`, `ai_chat_logs`).
4. Luôn validate output của AI bằng zod trước khi tin tưởng (đã làm trong
   `intentParser.ts`) — không bỏ qua bước này dù đã dùng tool-use.
5. Với `severity_flag !== "none"`, chặn ở tầng UI (nút "Xác nhận áp dụng"/"Huỷ")
   trước khi ghi thay đổi xuống DB thật, tránh áp dụng ngầm các thay đổi liên
   quan sức khỏe.
