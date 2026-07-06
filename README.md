# BuaCom.AI — Thực đơn gia đình Việt

Website gợi ý thực đơn 7 ngày theo chuẩn dinh dưỡng **RDA Việt Nam 2016** (Bộ Y tế / Viện Dinh dưỡng), cá nhân hoá cho từng thành viên gia đình.

## Tính năng

| Tính năng | Mô tả |
|---|---|
| Đăng nhập bằng mã | Không cần username/password — mã `FAM-XXXXXXXX` là chìa khoá |
| Hồ sơ gia đình | Thêm/sửa/xoá thành viên, cài PAL, khai báo dị ứng, thai sản |
| Tính toán dinh dưỡng | BMR × PAL theo bảng RDA 2016 — kcal, macro, 16 vi chất |
| Sinh thực đơn 7 ngày | 100 món Việt, greedy algorithm, đa dạng nguồn protein, tránh lặp tuần trước |
| Đổi món / Khoá bữa | Swap dish theo cùng nhóm, lock slot khi tạo lại |
| Danh sách đi chợ | Group by category, tích đã mua, export `.txt` |
| Báo cáo dinh dưỡng | Actual vs target bars, NutritionWarnings |
| Lịch sử | Thực đơn các tuần + lịch sử chat AI |
| Dark mode | Auto-detect hệ thống, toggle trong Settings |
| Trợ lý AI | Tích hợp Gemini Flash (cần config API key — xem bên dưới) |

## Tech stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS v3
- **Database**: SQLite (`better-sqlite3`) — file `data/buacom.db`
- **AI** (optional): Google Gemini Flash (miễn phí 1500 req/ngày)
- **Auth**: Code-based login (no password)

## Chạy ngay (dev)

```bash
# 1. Clone / copy project vào máy

# 2. Cài dependencies
npm install

# 3. Copy env file
cp .env.local.example .env.local
# Bỏ trống nếu chưa cần AI, hoặc điền GEMINI_API_KEY

# 4. Chạy dev server
npm run dev

# 5. Mở http://localhost:3000
```

> SQLite DB tự tạo lúc chạy lần đầu. Không cần cấu hình gì thêm.

## Cấu hình AI (tuỳ chọn)

Tính năng chat trợ lý AI dùng **Google Gemini Flash** — miễn phí:

1. Lấy API key: https://aistudio.google.com/app/apikey
2. Thêm vào `.env.local`:
   ```
   GEMINI_API_KEY=AIzaSy...
   ```
3. Restart dev server

## Build production

```bash
npm run build
npm start
```

## Deploy Vercel

```bash
# Cài Vercel CLI
npm i -g vercel

# Deploy
vercel deploy

# Sau khi deploy: thêm GEMINI_API_KEY vào Vercel Environment Variables
```

> **Lưu ý Vercel**: SQLite lưu file local — không persist trên serverless. Với Vercel, nên dùng Neon/PlanetScale/Supabase. Xem `src/lib/store/supabaseAdapter.ts`.

## Scripts hữu ích

```bash
npm run dev          # Dev server http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint check
npm run db:reset     # Xoá toàn bộ dữ liệu (reset DB)
```

## Cấu trúc thư mục chính

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/family/         # CRUD family, members, settings
│   ├── api/menu/           # Generate, swap, lock, undo
│   ├── api/nutrition/      # RDA calculation
│   ├── api/chat/           # Gemini AI chat
│   ├── onboarding/         # 3-step wizard cho family mới
│   ├── dashboard/          # Tổng quan
│   ├── family/             # Quản lý thành viên
│   ├── menu/               # Thực đơn 7 ngày
│   ├── nutrition/          # Báo cáo dinh dưỡng
│   ├── shopping/           # Danh sách đi chợ
│   ├── history/            # Lịch sử
│   └── settings/           # Cài đặt
├── components/
│   ├── chat/ChatWidget     # Floating AI chat (disabled khi chưa có key)
│   ├── menu/               # SwapDishModal, DishDetailModal
│   └── ui/                 # Nav, NutritionWarnings, ThemeToggle, ...
├── lib/
│   ├── db/client.ts        # SQLite connection + schema init
│   ├── store/sqliteStore   # Persistence layer (SQLite)
│   ├── data/dishes.ts      # 100 món Việt (in-memory)
│   ├── nutrition/          # RDA 2016 tables + BMR/PAL calculator
│   └── menu/generator.ts   # Thuật toán sinh thực đơn
└── ai/                     # Gemini intent parser + response composer
```

## Nguồn tham khảo khoa học

- Bộ Y tế / Viện Dinh dưỡng (2016) — *Nhu cầu dinh dưỡng khuyến nghị cho người Việt Nam*
- Bảng thành phần thực phẩm Việt Nam — Viện Dinh dưỡng Quốc gia

---

*Đây là công cụ gợi ý tham khảo, không thay thế tư vấn y khoa chuyên nghiệp.*
