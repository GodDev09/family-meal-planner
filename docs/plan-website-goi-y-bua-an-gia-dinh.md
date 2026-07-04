# KẾ HOẠCH XÂY DỰNG WEBSITE GỢI Ý BỮA ĂN GIA ĐÌNH THEO CHUẨN DINH DƯỠNG

> **Tên gọi ý:** FamilyMeal / BuaCom.AI / MamCom (đặt tên sau)
> **Phiên bản:** Draft v1.0 — 03/07/2026

---

## 1. Mục tiêu sản phẩm

Xây dựng một website cho phép:
1. Nhập thông tin các thành viên trong gia đình (tuổi, giới tính, nghề nghiệp/mức độ vận động, tình trạng sinh lý đặc biệt nếu có: mang thai, cho con bú...).
2. Hệ thống tự động tính toán **tổng nhu cầu năng lượng và vi/đa lượng dinh dưỡng** của cả gia đình dựa trên bảng khuyến nghị dinh dưỡng chuẩn của Bộ Y tế/Viện Dinh dưỡng Việt Nam (RDA 2016).
3. Từ nhu cầu tính được, hệ thống gợi ý **thực đơn 7 ngày/tuần** theo phong cách ẩm thực Việt Nam, đa dạng món, cân bằng dinh dưỡng, không lặp lại nhàm chán.
4. Giao diện hiện đại, thao tác đơn giản, thân thiện với người dùng phổ thông (không chuyên về dinh dưỡng).

### Nguyên tắc thiết kế cốt lõi
- **Chính xác khoa học**: mọi con số tính toán phải bám theo tài liệu chính thống, không "đoán".
- **Đơn giản hoá trải nghiệm**: người dùng không cần hiểu calo, protein... hệ thống làm hộ, chỉ cần trả lời vài câu hỏi.
- **Bản sắc Việt Nam**: món ăn, cách chia bữa (sáng - trưa - tối, có thể thêm bữa phụ cho trẻ em/người già) đúng thói quen ăn uống Việt.

---

## 2. Đối tượng người dùng & Use case chính

| Use case | Mô tả |
|---|---|
| UC1 - Tạo hồ sơ gia đình | Thêm/sửa/xoá thành viên: tên, tuổi, giới tính, nghề nghiệp, mức vận động, tình trạng đặc biệt (mang thai/cho con bú/bệnh nền cơ bản như tiểu đường, cao huyết áp) |
| UC2 - Xem báo cáo nhu cầu dinh dưỡng | Xem tổng nhu cầu năng lượng (kcal), tỉ lệ đạm/béo/bột đường, vi chất chính (canxi, sắt, kẽm, vitamin A/C/D...) của cả nhà và từng người |
| UC3 - Sinh thực đơn tuần | Bấm "Tạo thực đơn" → hệ thống trả về lịch 7 ngày x 3 bữa (+ bữa phụ nếu có trẻ nhỏ) |
| UC4 - Tuỳ chỉnh thực đơn | Đổi món không thích, loại trừ nguyên liệu dị ứng, khoá món yêu thích |
| UC5 - Xuất danh sách đi chợ | Tự động tổng hợp nguyên liệu cần mua theo tuần, theo khối lượng |
| UC6 - Theo dõi & lưu lịch sử | Lưu thực đơn cũ, đánh giá món ăn, gợi ý lần sau tránh lặp |
| UC7 - Đăng nhập bằng mã định danh | Người dùng chỉ cần nhập 1 mã (User ID) duy nhất để truy cập lại đúng hồ sơ gia đình của mình, không cần username/password |
| UC8 - Trò chuyện với AI trợ lý dinh dưỡng | Người dùng chat trực tiếp với bot AI để báo nhu cầu phát sinh (dị ứng mới, ốm, ăn kiêng, có khách...) → bot tự động điều chỉnh thực đơn và tính toán lại dinh dưỡng |

---

## 3. Cơ sở khoa học tính toán nhu cầu dinh dưỡng

Tham chiếu chính: **"Nhu cầu dinh dưỡng khuyến nghị cho người Việt Nam"** — Bộ Y tế/Viện Dinh dưỡng, ban hành 2016 (bản cập nhật từ các bản 1996/2003/2007). Đây là bộ số liệu chuẩn quốc gia, tương tự khái niệm RDA (Recommended Dietary Allowance) quốc tế của WHO/FAO/UNICEF.

### 3.1. Công thức tính năng lượng khuyến nghị/ngày
```
Nhu cầu năng lượng (kcal/ngày) = BMR (chuyển hoá cơ bản) × PAL (hệ số hoạt động thể lực)
```
- **BMR**: tính theo công thức chuẩn hoá theo cân nặng, tuổi, giới tính (Viện Dinh dưỡng áp dụng số liệu chuyển hoá cơ bản của người Nhật do có thể trạng tương đồng người Việt). Ứng dụng có thể dùng công thức Mifflin-St Jeor làm giá trị BMR khi chưa có cân nặng thực đo, hoặc dùng bảng BMR chuẩn theo nhóm tuổi/giới nếu người dùng không nhập cân nặng.
- **PAL (Physical Activity Level)** — đây là chỗ "nghề nghiệp" của người dùng phát huy tác dụng, quy về 3-4 mức:

| Mức hoạt động | Ví dụ nghề nghiệp | Hệ số PAL tham khảo |
|---|---|---|
| Nhẹ (lao động trí óc, ít vận động) | Nhân viên văn phòng, lập trình viên, kế toán, học sinh/sinh viên ngồi học | ~1.4 - 1.6 |
| Trung bình | Giáo viên, nhân viên bán hàng, nội trợ, thợ thủ công | ~1.6 - 1.8 |
| Nặng | Công nhân xây dựng, nông dân, bộ đội, vận động viên | ~1.9 - 2.2 |
| Đặc biệt (trẻ em, người già, phụ nữ mang thai/cho con bú) | Áp bảng riêng theo từng nhóm, có cộng thêm năng lượng (VD phụ nữ mang thai 3 tháng giữa +250kcal, 3 tháng cuối +450kcal theo khuyến nghị) | theo bảng riêng |

### 3.2. Nhóm chất cần tính đủ (không chỉ tổng calo)
1. **3 chất sinh năng lượng** (Protein, Lipid, Glucid) — theo tỉ lệ % năng lượng khẩu phần khuyến nghị (thường Đạm 13-20%, Béo 20-25%, Bột đường 55-65%, có điều chỉnh theo tuổi).
2. **Chất khoáng đa lượng**: Canxi, Phospho, Magiê.
3. **Chất khoáng vi lượng**: Sắt (lưu ý sắt tính theo giá trị sinh học khẩu phần — khẩu phần nhiều thịt/cá hoặc vitamin C hấp thu tốt hơn), Kẽm, Iốt, Selen, Đồng, Crom.
4. **Vitamin tan trong dầu**: A, D, E, K.
5. **Vitamin tan trong nước**: C, nhóm B (B1, B2, B6, B12, Niacin, Folate), Choline.
6. **Nước & chất điện giải**, chất xơ, giới hạn muối (Natri) — đặc biệt quan trọng vì người Việt đang tiêu thụ muối cao gấp ~2 lần khuyến nghị.
7. **Giới hạn tối đa (UL)** với một số vi chất để tránh cảnh báo dư thừa (không chỉ tính thiếu mà còn tính thừa).

### 3.3. Các nhóm đối tượng cần công thức riêng
- Trẻ em theo từng mốc tuổi nhỏ (0-6 tháng, 6-12 tháng, 1-3, 4-6, 7-9, 10-12... chia nhỏ hơn người lớn).
- Người trưởng thành theo giới tính + độ tuổi (18-30, 31-50, 51-60, >60).
- Phụ nữ mang thai / đang cho con bú (cộng thêm nhu cầu).
- Người cao tuổi (giảm nhu cầu năng lượng nhưng vẫn cần đủ vi chất, đặc biệt canxi, vitamin D).
- (Giai đoạn sau) Người có bệnh nền: tiểu đường, cao huyết áp, gout... cần chế độ ăn điều chỉnh — nên có disclaimer "không thay thế tư vấn bác sĩ/chuyên gia dinh dưỡng".

> ⚠️ Lưu ý pháp lý/đạo đức: Website nên có disclaimer rõ ràng rằng đây là **công cụ gợi ý tham khảo**, không thay thế chẩn đoán/tư vấn y khoa, đặc biệt với nhóm có bệnh lý, trẻ nhỏ dưới 1 tuổi, phụ nữ mang thai có biến chứng.

---

## 4. Kiến trúc dữ liệu thực đơn món ăn Việt Nam

### 4.1. Cấu trúc CSDL món ăn (bảng `dishes`)
Mỗi món cần có:
- Tên món, hình ảnh, vùng miền (Bắc/Trung/Nam), loại bữa (sáng/trưa/tối/phụ)
- Danh sách nguyên liệu + khối lượng chuẩn (để tính dinh dưỡng và xuất danh sách đi chợ)
- Giá trị dinh dưỡng/khẩu phần (kcal, protein, lipid, glucid, các vi chất chính) — có thể tính tự động từ **Bảng thành phần thực phẩm Việt Nam** (Viện Dinh dưỡng) thay vì nhập tay từng món.
- Tag: chay/mặn, độ khó nấu, thời gian nấu, mùa (món theo mùa), dị ứng (hải sản, đậu phộng, gluten...), phù hợp nhóm tuổi (VD: cháo cho bé, món mềm cho người già).
- Nhóm món chính: canh, món xào, món kho/rim, món luộc/hấp, món chiên/rán, món nướng, món gỏi/nộm, cơm/bún/phở, tráng miệng.

### 4.2. Nguồn dữ liệu tham khảo để xây kho món + dinh dưỡng
- **Bảng thành phần thực phẩm Việt Nam** (Viện Dinh dưỡng Quốc gia) — nguồn chuẩn nhất để tính dinh dưỡng từng nguyên liệu.
- Các món ăn truyền thống theo 3 miền, phân chia theo mùa và dịp.
- Có thể dùng AI (Claude API) để hỗ trợ sinh biến thể món/mô tả cách chế biến, nhưng số liệu dinh dưỡng nên lấy từ bảng thành phần thực phẩm chuẩn, không để AI tự "bịa" số liệu.

### 4.3. Thuật toán sinh thực đơn tuần (gợi ý)
1. Tính tổng nhu cầu dinh dưỡng ngày của cả nhà (cộng dồn từng thành viên, có trọng số theo khẩu phần ăn thực tế).
2. Với mỗi ngày trong tuần, chọn tổ hợp món (canh + món mặn + rau + cơm...) sao cho tổng dinh dưỡng của ngày đó xấp xỉ mục tiêu (dùng thuật toán tối ưu đơn giản: greedy + ràng buộc, hoặc knapsack biến thể nhiều chiều cho tổng đạm/béo/bột đường/vi chất).
3. Ràng buộc đa dạng: không lặp lại nguyên liệu chính (VD thịt heo) quá 2-3 lần liền trong tuần, xen kẽ thịt/cá/trứng/đậu, đảm bảo đủ rau xanh mỗi bữa.
4. Ưu tiên món theo mùa, món phù hợp toàn bộ thành viên (nếu có trẻ em/người già thì ưu tiên món mềm, ít cay).
5. Cho phép người dùng "khoá" món yêu thích, loại trừ món dị ứng/không thích trước khi generate.
6. (Nâng cao) Dùng Claude API để review menu cuối, đưa ra ghi chú dinh dưỡng bằng ngôn ngữ tự nhiên dễ hiểu ("Tuần này hơi ít vitamin C, nên bổ sung trái cây tráng miệng...").

---

## 5. Kiến trúc kỹ thuật (Tech Stack đề xuất)

Dựa trên kinh nghiệm sẵn có của bạn (game dev, quen C#/Unity nhưng có làm thêm web/bot), đề xuất stack web quen thuộc, dễ triển khai, chi phí thấp:

| Layer | Đề xuất | Ghi chú |
|---|---|---|
| Frontend | Next.js (React) + TailwindCSS | UI hiện đại, SSR tốt cho SEO, dễ deploy Vercel |
| Backend/API | Next.js API routes hoặc Node.js (NestJS) | Tính toán dinh dưỡng, sinh thực đơn |
| Database | PostgreSQL (Supabase/Neon free tier) | Lưu hồ sơ gia đình, kho món ăn, lịch sử thực đơn |
| Cache/Leaderboard-style data (nếu có tính năng cộng đồng sau này) | Redis (Upstash free tier) | Tái sử dụng kinh nghiệm Redis leaderboard từ dự án học lập trình của bạn |
| AI hỗ trợ | Claude API (gợi ý mô tả món, tư vấn dinh dưỡng bằng văn bản tự nhiên, KHÔNG dùng để tính số liệu dinh dưỡng) | |
| Auth | Email hoặc mã đăng nhập đơn giản (có thể tái dùng ý tưởng "code-based login" từ dự án học lập trình AI của bạn) | Giảm ma sát cho hộ gia đình dùng chung 1 tài khoản |
| Hosting | Vercel (frontend) + Supabase/Railway (DB) | Ưu tiên free-tier giống các dự án trước của bạn |

### 5.1. Cơ chế đăng nhập bằng mã định danh (User ID) — không cần username/password

Đây là cơ chế đăng nhập tối giản, tái sử dụng ý tưởng "code-based login" bạn đã áp dụng ở dự án học lập trình AI trước đó, phù hợp cho 1 hộ gia đình dùng chung.

**Nguyên lý hoạt động:**
1. Lần đầu truy cập, hệ thống tự sinh 1 **mã định danh duy nhất** (VD: 8 ký tự chữ+số, dạng `FAM-7X2K9Q`) và hiển thị cho người dùng lưu lại (khuyến khích cho phép "Lưu vào trình duyệt" hoặc gửi mã qua tin nhắn/email nếu người dùng có nhập, nhưng không bắt buộc).
2. Mã này chính là **khóa chính (primary key)** để truy xuất toàn bộ dữ liệu: hồ sơ thành viên gia đình, kết quả tính toán dinh dưỡng, thực đơn đã tạo, lịch sử chat với AI.
3. Lần sau quay lại, chỉ cần nhập đúng mã → hệ thống load lại toàn bộ dữ liệu gia đình đó.
4. Không lưu password nghĩa là **không có bước xác thực danh tính mạnh** — cần đánh đổi giữa tiện lợi và bảo mật:
   - Mã nên đủ dài/entropy cao (>= 8-10 ký tự, random, không đoán được) để tránh bị dò mã của người khác (brute-force).
   - Rate-limit số lần thử nhập mã sai trên 1 IP để chống dò quét.
   - Ghi rõ cho người dùng: "Mã này giống chìa khóa nhà — ai có mã đều xem/sửa được dữ liệu gia đình bạn, hãy giữ kín."
   - Có thể bổ sung tùy chọn (không bắt buộc) gắn thêm email khôi phục, phòng trường hợp người dùng làm mất mã.

**Thiết kế dữ liệu:**
```
Bảng families
- family_id (mã định danh, primary key, unique, generated)
- created_at
- settings (JSON: đơn vị đo, ngôn ngữ, khẩu vị vùng miền ưu tiên...)

Bảng family_members
- id
- family_id (FK)
- ten, tuoi, gioi_tinh, nghe_nghiep, muc_van_dong (PAL)
- tinh_trang_dac_biet (mang thai/cho con bú/bệnh nền...)
- di_ung (danh sách nguyên liệu loại trừ)

Bảng nutrition_outputs (kết quả tính toán, lưu theo từng lần tính lại)
- id
- family_id (FK)
- calculated_at
- tong_nhu_cau (JSON: kcal, protein, lipid, glucid, vitamin, khoáng chất...)

Bảng weekly_menus
- id
- family_id (FK)
- week_start_date
- menu_data (JSON: 7 ngày x các bữa x món)

Bảng ai_chat_logs
- id
- family_id (FK)
- timestamp
- message, response, dieu_chinh_ap_dung (ghi lại thay đổi thực đơn/dinh dưỡng nếu có)
```

---

## 6. Trợ lý AI điều chỉnh thực đơn & dinh dưỡng theo nhu cầu phát sinh

Đây là tính năng "bot AI nhúng" giúp gia đình báo các nhu cầu đặc biệt bất kỳ lúc nào (không chỉ lúc onboarding) và hệ thống tự động cập nhật.

### 6.1. Các loại nhu cầu phát sinh cần xử lý
- Thay đổi thành viên: có thêm người, có khách ở lại vài bữa, thành viên đi vắng.
- Thay đổi tình trạng sức khỏe: ốm (cần ăn nhạt, dễ tiêu), mới phát hiện dị ứng/không dung nạp (hải sản, gluten, lactose...), mang thai, sau phẫu thuật cần kiêng.
- Thay đổi mục tiêu: muốn giảm cân/tăng cân cho 1 thành viên cụ thể, muốn ăn chay vào 1 số ngày, muốn giảm muối/đường do bác sĩ dặn.
- Thay đổi khẩu vị: chán món cũ, muốn đổi phong cách (thêm món Trung/Hàn xen kẽ), có sự kiện đặc biệt (giỗ, Tết, sinh nhật).
- Ràng buộc thực tế: ngân sách đi chợ tuần này giảm, không có thời gian nấu cầu kỳ vào ngày trong tuần.

### 6.2. Kiến trúc xử lý (khuyến nghị tách 2 lớp rõ ràng)

```
[Người dùng nhập yêu cầu bằng ngôn ngữ tự nhiên]
        │
        ▼
[Lớp 1 - AI hiểu ý định (Claude API)]
   - Phân tích câu nói tự nhiên → trích xuất thành tham số có cấu trúc (JSON)
     VD: {"action": "add_restriction", "member": "con trai", "restriction": "dị ứng tôm"}
     VD: {"action": "adjust_goal", "member": "mẹ", "goal": "giảm 300kcal/ngày"}
   - Claude KHÔNG tự tính toán số liệu dinh dưỡng, chỉ làm nhiệm vụ "hiểu yêu cầu"
        │
        ▼
[Lớp 2 - Engine tính toán & sinh thực đơn (thuật toán thuần, không phải AI)]
   - Nhận tham số có cấu trúc từ Lớp 1
   - Cập nhật lại hồ sơ/ràng buộc trong DB
   - Tính lại nhu cầu dinh dưỡng (theo công thức RDA ở mục 3)
   - Sinh lại thực đơn phần bị ảnh hưởng (chỉ đổi phần cần thiết, giữ nguyên phần không liên quan để tránh xáo trộn cả tuần)
        │
        ▼
[Lớp 1 - AI diễn giải kết quả (Claude API)]
   - Tổng hợp kết quả kỹ thuật thành câu trả lời tự nhiên, dễ hiểu
     VD: "Mình đã loại tôm khỏi thực đơn của bé và thay món canh chua tôm thứ Tư
          bằng canh chua cá lóc. Dinh dưỡng cả tuần vẫn được đảm bảo."
```

**Lý do tách lớp này quan trọng:** tránh để AI tự "bịa" số liệu dinh dưỡng (rủi ro hallucination), đảm bảo mọi con số vẫn bám theo bảng RDA chuẩn; đồng thời AI chỉ đóng vai trò giao tiếp tự nhiên + hiểu ý định, giúp kiểm soát chi phí gọi API (chỉ gọi khi cần hiểu/diễn giải, không gọi để tính toán).

### 6.3. Giao diện chat
- Widget chat nổi (floating chat bubble) ở góc màn hình, có thể mở từ bất kỳ trang nào.
- Gợi ý sẵn các câu hỏi nhanh (quick reply chips): "Con bị dị ứng...", "Tuần này có khách", "Muốn giảm cân", "Đổi món hôm nay".
- Sau khi AI xử lý xong, hiển thị **diff rõ ràng** phần thực đơn/dinh dưỡng đã thay đổi (highlight món mới/cũ) để người dùng dễ xác nhận, không áp dụng ngầm không rõ ràng.
- Cho phép người dùng "Hoàn tác" nếu không ưng thay đổi AI vừa đề xuất.

### 6.4. Lưu ý an toàn khi dùng AI cho nhu cầu sức khỏe
- Với các yêu cầu liên quan bệnh lý nghiêm trọng (tiểu đường, suy thận, dị ứng nặng có nguy cơ sốc phản vệ...), bot nên đưa khuyến cáo tham khảo bác sĩ/chuyên gia dinh dưỡng thay vì tự ý điều chỉnh mạnh, đặc biệt liên quan đến trẻ nhỏ.
- Ghi log lại mọi điều chỉnh (bảng `ai_chat_logs`) để người dùng xem lại lịch sử thay đổi, tăng độ tin cậy.

---

## 7. Tham khảo thiết kế UI/UX (đã tra cứu)

Phong cách hiện đại cho nhóm app dinh dưỡng/meal-planning hiện nay (tham khảo Dribbble, Figma Community) thường có đặc điểm:
- **Dashboard tổng quan** dạng thẻ (card) hiển thị vòng tròn % đạt mục tiêu calo/macro trong ngày (donut chart), màu sắc tươi (xanh lá, cam, be) gợi cảm giác "tươi - sạch - lành mạnh".
- **Lịch thực đơn tuần dạng bảng/kanban**: mỗi ngày là 1 cột, mỗi bữa là 1 thẻ có ảnh món ăn thu nhỏ, tap vào để xem chi tiết công thức + dinh dưỡng.
- **Onboarding dạng step-by-step** (giống form nhiều bước) để nhập từng thành viên gia đình, có minh hoạ icon dễ thương thay vì form dài nhàm chán.
- **Chế độ tối (dark mode)** ngày càng phổ biến ở nhóm app sức khoẻ/fitness.
- Các mẫu tham khảo cụ thể: *Nutrigo – Nutrition & Diet Dashboard*, *FuelUp – Wellness Mobile App*, *Planlife – Meal Planner for Nutritionists*, *CalorieM8 – Nutrition App* (đều trên Dribbble) — nên xem trực tiếp trên dribbble.com với từ khoá "nutrition dashboard", "meal planner app" để lấy cảm hứng bố cục, không copy nguyên trạng.

### Đề xuất cấu trúc màn hình chính
1. **Trang chủ/Dashboard**: tổng quan nhu cầu dinh dưỡng gia đình hôm nay + nút "Xem thực đơn tuần".
2. **Trang Hồ sơ gia đình**: danh sách thành viên dạng card, nút thêm thành viên (modal/step form).
3. **Trang Thực đơn tuần**: lịch 7 ngày, mỗi ô là 1 bữa ăn, có thể kéo-thả đổi món (nếu làm nâng cao).
4. **Trang Chi tiết món ăn**: ảnh, nguyên liệu, cách nấu, bảng dinh dưỡng/khẩu phần.
5. **Trang Danh sách đi chợ**: tổng hợp nguyên liệu theo tuần, có thể tick đã mua.
6. **Trang Báo cáo dinh dưỡng**: biểu đồ so sánh nhu cầu khuyến nghị vs thực đơn đã lên.

---

## 8. Lộ trình triển khai (Roadmap)

### Giai đoạn 1 — MVP (4-6 tuần)
- [ ] Cơ chế đăng nhập bằng mã định danh (sinh mã, lưu/khôi phục hồ sơ gia đình theo mã)
- [ ] Form nhập thành viên gia đình (tuổi, giới tính, nghề nghiệp → mức PAL)
- [ ] Module tính nhu cầu năng lượng + 3 chất sinh năng lượng cơ bản (chưa cần đủ vi chất)
- [ ] Kho dữ liệu ~80-100 món ăn Việt phổ biến, có sẵn thông tin dinh dưỡng/khẩu phần
- [ ] Thuật toán sinh thực đơn tuần đơn giản (đảm bảo tổng calo + tỉ lệ macro gần đúng, đa dạng món)
- [ ] UI cơ bản: Dashboard, Hồ sơ gia đình, Thực đơn tuần

### Giai đoạn 2 — Hoàn thiện dinh dưỡng chuyên sâu (3-4 tuần)
- [ ] Bổ sung tính toán đầy đủ vi chất (vitamin, khoáng chất) theo bảng RDA 2016
- [ ] Cảnh báo thiếu/thừa vi chất theo tuần
- [ ] Xử lý nhóm đặc biệt: trẻ em theo mốc tuổi nhỏ, phụ nữ mang thai/cho con bú, người cao tuổi
- [ ] Danh sách đi chợ tự động

### Giai đoạn 3 — Trải nghiệm & AI (3-4 tuần)
- [ ] Tích hợp Claude API: review menu, đưa lời khuyên dinh dưỡng bằng ngôn ngữ tự nhiên
- [ ] Xây dựng bot chat trợ lý dinh dưỡng (widget chat, kiến trúc 2 lớp AI-hiểu-ý-định + engine tính toán như mục 6.2)
- [ ] Tuỳ biến món (khoá/loại trừ/dị ứng), đổi món trong lịch
- [ ] Lưu lịch sử thực đơn, gợi ý tránh lặp món
- [ ] Dark mode, tối ưu mobile-responsive

### Giai đoạn 4 — Mở rộng (tuỳ chọn, sau này)
- [ ] Tài khoản chia sẻ nhiều người dùng trong 1 hộ gia đình
- [ ] Cộng đồng chia sẻ thực đơn, đánh giá món
- [ ] Chế độ ăn đặc biệt (giảm cân, tiểu đường, ăn chay trường...) — cần tham vấn chuyên gia dinh dưỡng trước khi public

---

## 9. Rủi ro & lưu ý quan trọng

1. **Độ chính xác dữ liệu dinh dưỡng**: sai số ở bảng thành phần thực phẩm hoặc công thức BMR/PAL có thể dẫn đến gợi ý sai lệch — nên ghi rõ nguồn tham chiếu (Bộ Y tế/Viện Dinh dưỡng 2016) và versioning dữ liệu để dễ cập nhật khi có bảng mới.
2. **Không thay thế tư vấn y tế**: cần disclaimer rõ, đặc biệt với nhóm bệnh lý, trẻ sơ sinh, phụ nữ mang thai có biến chứng.
3. **Hiệu năng thuật toán sinh thực đơn**: bài toán tối ưu đa ràng buộc (nhiều chiều dinh dưỡng + đa dạng món) có thể phức tạp — giai đoạn đầu nên dùng heuristic đơn giản (greedy + rule-based) thay vì optimization phức tạp, tối ưu dần sau.
4. **Chi phí AI API**: nếu dùng Claude API cho mọi lần sinh thực đơn sẽ tốn chi phí — nên tách rõ phần tính toán dinh dưỡng (thuần thuật toán, miễn phí) và phần AI hỗ trợ ngôn ngữ tự nhiên (dùng có kiểm soát, cache kết quả).
5. **Bản quyền hình ảnh món ăn**: cần tự chụp/vẽ hoặc dùng ảnh nguồn mở, tránh vi phạm bản quyền khi lấy ảnh từ mạng.

6. **Rủi ro với mã định danh (User ID)**: vì không có password, ai nắm được mã coi như có toàn quyền xem/sửa dữ liệu gia đình đó — cần cân nhắc thêm lớp bảo vệ nhẹ (rate-limit, mã đủ entropy, cảnh báo người dùng giữ kín mã) như đã nêu ở mục 5.1.
7. **Rủi ro AI chatbot hiểu sai ý định**: bot có thể hiểu nhầm yêu cầu tự nhiên (VD nhầm "không thích tôm" thành "dị ứng tôm" — mức độ nghiêm trọng khác nhau) — nên luôn có bước xác nhận lại rõ ràng trước khi áp dụng thay đổi ảnh hưởng sức khỏe.

---

## Phụ lục A — System Prompt cho Lớp AI (hiểu ý định & diễn giải kết quả)

Lớp AI trong kiến trúc ở mục 6.2 thực chất cần **2 system prompt riêng biệt** cho 2 lời gọi API khác nhau (không dùng chung 1 prompt đa năng, vì mục tiêu và định dạng output khác hẳn nhau). Cả hai đều nên gọi với `temperature` thấp (0-0.3) vì đây là tác vụ trích xuất/diễn giải có cấu trúc, không cần sáng tạo.

### A.1. System Prompt #1 — "Intent Parser" (Lớp 1 chiều vào)

**Mục đích:** Chuyển câu nói tự nhiên của người dùng thành 1 JSON object có cấu trúc, đúng schema định sẵn (xem Phụ lục B.1). Model **không được** tự tính toán dinh dưỡng, không tự bịa số liệu, không tự quyết định món ăn thay thế.

```
Bạn là bộ phân tích ý định (intent parser) cho một hệ thống lên thực đơn gia đình
theo chuẩn dinh dưỡng Việt Nam. Nhiệm vụ DUY NHẤT của bạn là đọc tin nhắn của
người dùng và chuyển thành một JSON object theo đúng schema bên dưới. Bạn KHÔNG
tự tính toán số liệu dinh dưỡng, KHÔNG tự đề xuất món ăn cụ thể, KHÔNG tự quyết
định các con số calo/vi chất — những việc đó do hệ thống backend xử lý.

## Ngữ cảnh gia đình hiện tại (do backend cung cấp mỗi lần gọi)
{context_gia_dinh}  # danh sách thành viên, tuổi, hạn chế hiện có, thực đơn tuần hiện tại

## Schema output bắt buộc (chỉ trả về JSON, không kèm giải thích, không markdown code fence)
{
  "intent": "<một trong các giá trị enum bên dưới>",
  "confidence": <số 0-1, mức độ chắc chắn bạn hiểu đúng ý người dùng>,
  "target_member": "<tên/id thành viên bị ảnh hưởng, hoặc 'all' nếu cả nhà, hoặc null nếu không xác định>",
  "params": { ... },            // tham số riêng theo từng loại intent, xem chi tiết Phụ lục B.1
  "severity_flag": "<none | needs_confirmation | needs_professional_advice>",
  "clarification_question": "<câu hỏi làm rõ nếu confidence thấp hoặc thông tin thiếu, null nếu không cần>"
}

## Danh sách intent hợp lệ (enum)
- add_restriction        (thêm hạn chế/dị ứng/kiêng khem)
- remove_restriction      (bỏ hạn chế đã có)
- adjust_energy_goal      (tăng/giảm calo mục tiêu — giảm cân, tăng cân, theo lời bác sĩ)
- add_temporary_guest     (có khách ăn cùng một số bữa/ngày)
- mark_member_absent      (thành viên vắng mặt một số bữa/ngày)
- change_cuisine_style    (đổi phong cách món ăn, thêm món vùng miền/quốc gia khác)
- swap_specific_dish      (muốn đổi 1 món cụ thể trong lịch đã có)
- budget_constraint       (giới hạn ngân sách đi chợ)
- time_constraint         (giới hạn thời gian nấu nướng)
- health_condition_update (cập nhật tình trạng sức khỏe/bệnh lý — LUÔN gắn severity_flag phù hợp)
- general_question        (câu hỏi thông tin, không yêu cầu thay đổi dữ liệu)
- unclear                 (không đủ thông tin để xác định ý định)

## Quy tắc bắt buộc
1. Nếu người dùng đề cập dị ứng/bệnh lý có khả năng nghiêm trọng (VD: dị ứng nặng có
   nguy cơ sốc phản vệ, tiểu đường, suy thận, bệnh tim mạch, phụ nữ mang thai có biến
   chứng) → luôn đặt severity_flag = "needs_professional_advice", KHÔNG tự ý áp dụng
   thay đổi lớn, chỉ ghi nhận thông tin và đề xuất backend hiển thị khuyến cáo gặp
   bác sĩ/chuyên gia dinh dưỡng.
2. Nếu confidence < 0.7, PHẢI có clarification_question, không được đoán bừa.
3. Nếu 1 tin nhắn chứa nhiều ý định cùng lúc, chỉ xử lý ý định RÕ RÀNG NHẤT, đề xuất
   clarification_question hỏi thêm cho các ý còn lại.
4. Không bao giờ tự điền số liệu dinh dưỡng cụ thể (kcal, gram...) trừ khi người dùng
   nêu rõ con số đó (VD "giảm 300kcal/ngày" → giữ nguyên con số người dùng cho).
5. Luôn trả về đúng và chỉ JSON hợp lệ theo schema, không thêm text ngoài JSON.
```

### A.2. System Prompt #2 — "Response Composer" (Lớp 1 chiều ra)

**Mục đích:** Nhận kết quả diff kỹ thuật từ Engine (Lớp 2) và diễn giải thành câu trả lời tự nhiên, thân thiện, tiếng Việt, cho người không chuyên về dinh dưỡng.

```
Bạn là trợ lý dinh dưỡng gia đình, giọng văn thân thiện, gần gũi như người nhà,
không dùng thuật ngữ chuyên môn khó hiểu trừ khi cần thiết (nếu dùng thì giải
thích ngắn gọn kèm theo). Bạn nhận vào một JSON mô tả các thay đổi mà hệ thống
backend đã thực hiện (KHÔNG phải do bạn tính toán), nhiệm vụ của bạn là tường
thuật lại các thay đổi đó một cách rõ ràng, dễ hiểu, đúng sự thật theo dữ liệu
được cung cấp — không thêm thắt, không suy diễn số liệu không có trong dữ liệu.

## Input bạn sẽ nhận (JSON, xem chi tiết Phụ lục B.2)
{diff_result}

## Yêu cầu khi trả lời
1. Mở đầu xác nhận đã hiểu đúng yêu cầu của người dùng.
2. Liệt kê ngắn gọn các món/thực đơn đã thay đổi (món cũ → món mới), chỉ nêu
   phần THỰC SỰ thay đổi, không nhắc lại toàn bộ thực đơn nếu không cần.
3. Nếu có cảnh báo dinh dưỡng (thiếu/thừa vi chất) từ dữ liệu đầu vào, nêu rõ
   bằng ngôn ngữ đơn giản, kèm gợi ý khắc phục nếu dữ liệu có cung cấp gợi ý.
4. Nếu severity_flag = "needs_professional_advice", PHẢI nhắc người dùng nên
   tham khảo bác sĩ/chuyên gia dinh dưỡng trước khi áp dụng lâu dài, giọng điệu
   quan tâm chứ không gây hoang mang.
5. Kết thúc bằng câu hỏi mở nhẹ nhàng nếu phù hợp (VD: "Bạn có muốn điều chỉnh
   thêm gì không?"), nhưng không bắt buộc nếu câu trả lời đã đủ trọn vẹn.
6. Không được tự bịa thêm số liệu, món ăn, hay thay đổi không có trong dữ liệu
   đầu vào.
```

---

## Phụ lục B — JSON Schema trao đổi dữ liệu giữa AI và Engine tính toán

### B.1. Schema output của "Intent Parser" (AI → Engine)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "IntentParserOutput",
  "type": "object",
  "required": ["intent", "confidence", "severity_flag"],
  "properties": {
    "intent": {
      "type": "string",
      "enum": [
        "add_restriction", "remove_restriction", "adjust_energy_goal",
        "add_temporary_guest", "mark_member_absent", "change_cuisine_style",
        "swap_specific_dish", "budget_constraint", "time_constraint",
        "health_condition_update", "general_question", "unclear"
      ]
    },
    "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
    "target_member": { "type": ["string", "null"] },
    "params": {
      "type": "object",
      "description": "Tham số riêng theo từng intent, ví dụ bên dưới",
      "oneOf": [
        {
          "comment": "add_restriction",
          "properties": {
            "restriction_type": { "enum": ["di_ung", "khong_thich", "kieng_ton_giao", "kieng_benh_ly"] },
            "ingredient_or_dish": { "type": "string" },
            "reason": { "type": "string" }
          }
        },
        {
          "comment": "adjust_energy_goal",
          "properties": {
            "direction": { "enum": ["increase", "decrease"] },
            "amount_kcal_per_day": { "type": ["number", "null"] },
            "duration": { "enum": ["1_tuan", "vo_thoi_han", "toi_khi_huy"] }
          }
        },
        {
          "comment": "add_temporary_guest",
          "properties": {
            "guest_count": { "type": "integer" },
            "guest_profile": { "enum": ["nguoi_lon", "tre_em", "nguoi_gia", "khong_ro"] },
            "affected_dates": { "type": "array", "items": { "type": "string", "format": "date" } }
          }
        },
        {
          "comment": "swap_specific_dish",
          "properties": {
            "date": { "type": "string", "format": "date" },
            "meal_slot": { "enum": ["sang", "trua", "toi", "phu"] },
            "reason": { "type": "string" }
          }
        }
      ]
    },
    "severity_flag": {
      "type": "string",
      "enum": ["none", "needs_confirmation", "needs_professional_advice"]
    },
    "clarification_question": { "type": ["string", "null"] }
  }
}
```

**Ví dụ thực tế:**
```json
{
  "intent": "add_restriction",
  "confidence": 0.94,
  "target_member": "member_002_con_trai",
  "params": {
    "restriction_type": "di_ung",
    "ingredient_or_dish": "tôm",
    "reason": "phát hiện dị ứng khi đi khám"
  },
  "severity_flag": "needs_confirmation",
  "clarification_question": null
}
```

### B.2. Schema output của Engine tính toán (Engine → Response Composer)

Đây là phần **quan trọng nhất về mặt độ tin cậy**: Engine (thuần thuật toán, dựa trên bảng RDA + kho món) trả về diff cụ thể, có căn cứ số liệu rõ ràng, để AI chỉ "thuật lại" chứ không "sáng tác".

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "EngineDiffOutput",
  "type": "object",
  "required": ["status", "changes", "nutrition_impact", "severity_flag"],
  "properties": {
    "status": { "enum": ["applied", "rejected", "partial"] },
    "reject_reason": { "type": ["string", "null"], "description": "Lý do nếu status=rejected, VD: xung đột ràng buộc không thể giải" },
    "changes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "date": { "type": "string", "format": "date" },
          "meal_slot": { "enum": ["sang", "trua", "toi", "phu"] },
          "member_affected": { "type": "string" },
          "old_dish": { "type": ["string", "null"] },
          "new_dish": { "type": ["string", "null"] },
          "change_type": { "enum": ["replaced", "removed", "added", "portion_adjusted"] }
        }
      }
    },
    "nutrition_impact": {
      "type": "object",
      "properties": {
        "before": { "type": "object", "description": "Tổng dinh dưỡng tuần trước khi đổi (kcal, macro, vi chất chính)" },
        "after": { "type": "object", "description": "Tổng dinh dưỡng tuần sau khi đổi" },
        "warnings": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "nutrient": { "type": "string" },
              "status": { "enum": ["thieu", "du_thua"] },
              "percent_of_target": { "type": "number" },
              "suggestion": { "type": "string" }
            }
          }
        }
      }
    },
    "severity_flag": { "enum": ["none", "needs_confirmation", "needs_professional_advice"] },
    "professional_advice_note": { "type": ["string", "null"] }
  }
}
```

**Ví dụ thực tế (khớp với ví dụ Intent ở trên):**
```json
{
  "status": "applied",
  "reject_reason": null,
  "changes": [
    {
      "date": "2026-07-09",
      "meal_slot": "trua",
      "member_affected": "member_002_con_trai",
      "old_dish": "Canh chua tôm",
      "new_dish": "Canh chua cá lóc",
      "change_type": "replaced"
    },
    {
      "date": "2026-07-11",
      "meal_slot": "toi",
      "member_affected": "member_002_con_trai",
      "old_dish": "Tôm rang thịt",
      "new_dish": "Thịt kho trứng",
      "change_type": "replaced"
    }
  ],
  "nutrition_impact": {
    "before": { "kcal_tuan": 15400, "protein_g": 520, "canxi_mg": 5600 },
    "after":  { "kcal_tuan": 15350, "protein_g": 505, "canxi_mg": 5100 },
    "warnings": [
      {
        "nutrient": "canxi",
        "status": "thieu",
        "percent_of_target": 91,
        "suggestion": "Bổ sung thêm 1 hộp sữa/ngày hoặc tăng cường rau lá xanh đậm cho bé"
      }
    ]
  },
  "severity_flag": "needs_confirmation",
  "professional_advice_note": null
}
```

### B.3. Luồng dữ liệu tóm tắt

```
User message
   → [Intent Parser - System Prompt A.1] → JSON theo Schema B.1
   → Backend validate + gọi Engine tính toán (rule-based, không phải AI)
   → Engine trả JSON theo Schema B.2
   → [Response Composer - System Prompt A.2] → câu trả lời tự nhiên cho người dùng
   → Đồng thời JSON Schema B.2 được lưu vào bảng `ai_chat_logs` để phục vụ "Hoàn tác"
```

**Lưu ý triển khai thực tế:**
- Dùng tính năng "structured output"/"tool use" của Claude API để ép model trả đúng JSON schema, giảm rủi ro parse lỗi (tham khảo tài liệu Claude API về tool use/JSON mode khi triển khai).
- Nên validate JSON output bằng thư viện schema validation (VD `zod` nếu dùng Node.js/Next.js) trước khi đưa vào Engine, phòng trường hợp model trả sai định dạng.
- Với severity_flag = "needs_confirmation", nên chặn ở tầng UI (hiện nút "Xác nhận áp dụng" / "Huỷ") thay vì tự động apply ngay, để người dùng luôn có quyền kiểm soát cuối cùng.

---

## 10. Nguồn tham khảo chính

- Bộ Y tế – Viện Dinh dưỡng (2016), *"Nhu cầu dinh dưỡng khuyến nghị cho người Việt Nam"*, NXB Y học.
- Viện Dinh dưỡng Quốc gia — *Bảng thành phần thực phẩm Việt Nam*.
- Tham khảo UI/UX: Dribbble (từ khoá "nutrition dashboard", "meal planner app", "diet plan app"), Figma Community.

---

*File này là bản kế hoạch nháp, có thể điều chỉnh thêm khi bạn xác định rõ hơn phạm vi MVP (ví dụ: chỉ tập trung người lớn trước, hay làm đủ mọi lứa tuổi ngay từ đầu).*
