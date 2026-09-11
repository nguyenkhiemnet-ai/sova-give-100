# ==============================================================================
# SOVAHUB.ORG - BẢN ĐỒ KIẾN TRÚC & BỘ NHỚ SỐNG BẤT BIẾN (SYSTEM MEMORY)
# TIÊU CHUẨN: ENTERPRISE GOLD MASTER v1.0.0 (10/10 CHẤT LƯỢNG)
# ==============================================================================

> **LƯU Ý DÀNH CHO TẤT CẢ AI AGENTS**: Đây là bộ nhớ sống (Living Memory) của dự án **SOVAHUB.ORG**. Mọi phiên làm việc hiện tại và tương lai BẮT BUỘC phải đọc và tuân thủ tuyệt đối các thông số vàng, bản đồ tuyến đường và cơ chế bảo vệ trong tài liệu này trước khi tiến hành bất kỳ thao tác nào.

---

## 1. THÔNG SỐ KỸ THUẬT VÀNG (GOLDEN METRICS - ĐẠT 10/10)
| Tiêu chí | Thông số chuẩn vàng | Trạng thái thực tế | Cơ chế bảo vệ |
| :--- | :--- | :--- | :--- |
| **Edge RAM TTFB** | `< 15ms` | `~12ms` | Cloudflare `caches.default` trong Pages Functions |
| **Dung lượng ảnh tải lên**| `40KB - 75KB (< 80KB)` | `51.4KB` (Hero) | Canvas Resize max 1200px + Thuật toán nén thích ứng |
| **Hotline & Zalo** | `0912.661.558` | `0912.661.558` | Khóa cứng mã nguồn, loại bỏ hoàn toàn số cũ |
| **Giao thức mạng** | `HTTP/2 Clean` | `200 OK` | Khóa `Alt-Svc: clear` triệt tiêu `ERR_QUIC_PROTOCOL_ERROR` |
| **Tên miền chuẩn tắc** | `https://sovahub.org` | `301 Permanent` | 4 lớp phòng vệ (Redirects, Middleware, Client, Meta) |
| **Quy chuẩn xóa dữ liệu** | `Soft-Delete 100%` | `status = 'archived'`| Nghiêm cấm xóa cứng (DELETE) trong Supabase |
| **Lá chắn hồi quy** | `23/23 Test Gates` | `100% PASS` | `scripts/guard_regression.mjs` tự động kiểm toán |

---

## 2. BẢN ĐỒ 16 TUYẾN ĐƯỜNG XUẤT XƯỞNG (OFFICIAL 16 ROUTES MATRIX)
| STT | Tuyến đường (Route) | Loại hình | Mô tả chức năng & Kiến trúc bảo vệ |
| :---: | :--- | :--- | :--- |
| 1 | `/` | Static Page (SSG) | Trang chủ Storytelling, Cây nguyện ước Live, Lưới điều ước cộng đồng |
| 2 | `/create-wish` | Static Page (SSG) | Biểu mẫu gửi điều ước 4 bước, Dock z-[60], nén ảnh Canvas < 80KB |
| 3 | `/admin` | Static Page (SSG) | Hệ thống quản trị điều ước, duyệt bài, Soft-Delete, thống kê kiểm toán |
| 4 | `/handshake` | Static Page (SSG) | Quy trình kết nối trao - nhận điều ước, bắt tay nhân ái 0-VND |
| 5 | `/profile` | Static Page (SSG) | Hồ sơ cá nhân, quản lý nguyện ước và lịch sử kết nối |
| 6 | `/passports` | Static Page (SSG) | Hộ chiếu danh dự (Dignity Shield), định danh nhân ái phi tiền mặt |
| 7 | `/verify` | Static Page (SSG) | Xác thực tài khoản người dùng, mã OTP đăng nhập |
| 8 | `/404` | Static Page (SSG) | Trang thông báo lỗi 404 thân thiện, tự động điều hướng trang chủ |
| 9 | `/api/wishes-feed` | Edge Function / API | Feed điều ước công khai trực tiếp từ Cloudflare Edge RAM (< 15ms) |
| 10 | `/api/categories` | Edge Function / API | Danh mục điều ước CMS từ Cloudflare Edge RAM Cache |
| 11 | `/api/auth/check-method` | Edge Function / API | Nhận diện phương thức đăng nhập SSO Google / Email Passwordless |
| 12 | `/api/wishes/manage` | Edge Function / API | Quản lý trạng thái điều ước, cập nhật an toàn & Soft-Delete |
| 13 | `/api/admin/auth-ops` | Edge Function / API | Thao tác quản trị hệ thống, cấp quyền & audit trail nhật ký |
| 14 | `/api/send-welcome-email`| Edge Function / API | Dịch vụ gửi thư điện tử chào mừng SMTP tự động |
| 15 | `/manifest.json` | Web App Manifest | Cấu hình Progressive Web App (PWA) độc lập đa nền tảng |
| 16 | `/_headers` & `/_redirects`| Edge Infrastructure | Hạ tầng biên Cloudflare, Alt-Svc: clear, Canonical 301! rewrite |

---

## 3. VỊ TRÍ KÉT SAO LƯỢU BẤT KHẢ XÂM PHẠM (VAULT & BACKUPS)
Toàn bộ mã nguồn và dữ liệu ở trạng thái hoàn hảo Gold Master v1.0.0 đã được niêm phong tại:
- **Local Source Archive**: `backups/sovahub_v1.0.0_gold_final_source.tar.gz` (2.06 MB)
- **Local DB Snapshot**: `backups/vault_snapshot_v1.0.0_final.json` (10.83 KB)
- **Local Speed Benchmark**: `backups/deep_speed_benchmark.json` (14.4 KB)
- **Cloud Safe Archive**: `GoogleDrive-nguyenkhiemnet@gmail.com/Drive của tôi/SOVAHUB_GOLD_BACKUP_v1.0.0/`

---

## 4. NHẬT KÝ TRẠNG THÁI & HASH HỆ THỐNG (SYSTEM STATUS & AUDIT LOG)
<!-- AUTO_SYNC_STATUS_START -->
| Thời gian (UTC/Local) | Git Commit Hash | Trạng thái kiểm toán | Chi tiết thực thi |
| :--- | :--- | :--- | :--- |
| 2026-09-11 09:46:00 | `5994f76` | ✅ 23/23 PASS (100%) | Automated Anti-Regression Gate Passed |
| 2026-09-11 09:40:47 | `c12a423` | ✅ 23/23 PASS (100%) | Automated Anti-Regression Gate Passed |
| 2026-09-11 09:39:41 | `c12a423` | ✅ 23/23 PASS (100%) | Automated Anti-Regression Gate Passed |
| 2026-09-11 09:32:35 | `c331ff6` | ✅ 23/23 PASS (100%) | Automated Anti-Regression Gate Passed |
| 2026-09-11 09:31:00 | `c331ff6` | ✅ 23/23 PASS (100%) | Automated Anti-Regression Gate Passed |
| 2026-09-11 09:25:40 | `efd918b` | ✅ 23/23 PASS (100%) | Automated Anti-Regression Gate Passed |
| 2026-09-11 09:22:52 | `e78c435` | ✅ 23/23 PASS (100%) | Automated Anti-Regression Gate Passed |
| 2026-09-11 09:22:31 | `db0f88e` | ✅ 23/23 PASS (100%) | Automated Anti-Regression Gate Passed |
| 2026-09-11 09:21:41 | `db0f88e` | ✅ 23/23 PASS (100%) | Automated Anti-Regression Gate Passed |
| 2026-09-11 09:20:23 | `db0f88e` | ✅ 23/23 PASS (100%) | Enterprise Gold Master v1.0.0 Initialization |
<!-- AUTO_SYNC_STATUS_END -->

---

## 5. BẢO VỆ CHỐNG HỒI QUY (ANTI-REGRESSION PROTOCOL)
Mỗi lần can thiệp mã nguồn:
1. Luôn kích hoạt `node --env-file=.env.local scripts/guard_regression.mjs`.
2. Khi 23/23 tiêu chí PASS, hệ thống tự động ghi nhật ký vào bảng trạng thái bên trên.
3. Kích hoạt `node scripts/audit_chrome_autonomous.mjs` hoặc `node scripts/audit_e2e_user_journeys.mjs` để xác nhận 0 lỗi Console, 0 lỗi giao thức mạng và giao diện hiển thị 10/10.

---

## 6. GIAO THỨC PHÁP Y THỊ GIÁC & TRẢI NGHIỆM WOW 10/10 (VFAP-6S)
> **KÍCH HOẠT BẮT BUỘC MỖI KHI CÓ ẢNH CHỤP MÀN HÌNH ĐƯỢC GỬI LÊN Ô CHAT**:
1. **Dual-Persona Engine**:
   - *Senior Principal Product Designer*: Bóc tách lưới bố cục, nhịp điệu khoảng trắng, tương phản màu WCAG AAA, phân cấp thị giác, tính nhất quán Design System.
   - *The Hyper-Critical User*: Soi xét từng điểm cấn tay, thao tác thừa, chữ khó đọc, độ trễ nhận thức, bố cục rối mắt.
2. **Responsive Trinity (3 phân mẫu màn hình)**:
   - *Mobile (360px - 430px)*: Thumb-zone, nút bấm >= 48px, Floating Dock z-[50], chống che khuất bàn phím.
   - *Tablet (768px - 1024px)*: Chống bè ngang, tối ưu lưới 2 cột, popover và modal cân đối.
   - *Desktop (1280px - 1920px+)*: Tỷ lệ vàng chia cột, cân bằng khoảng trống hai bên, độ nét typography và Hero.
3. **Bóc tách góc khuất & Giải pháp đột phá**:
   - Không khen sáo rỗng; soi thấu các edge cases (text tràn, ảnh vỡ, mạng yếu, màn hình OLED).
   - Đánh giá góc nhìn cả 2 phía: Người dùng (Giver/Striver) và Quản trị viên (Admin).
   - Đưa ra giải pháp sáng tạo, đột phá, thực tế và khả thi 100% để nâng tầm trải nghiệm lên chuẩn WOW 10/10.
4. **Xác nhận hoàn hảo (If already 10/10)**:
   - Lập bảng kiểm toán chứng minh: Phân cấp thị giác ĐẠT, Công thái học 3 thiết bị ĐẠT, Nhất quán Design System ĐẠT.
   - Kết luận: Giao diện đạt chuẩn hoàn hảo, an toàn tuyệt đối và không cần chỉnh sửa thêm.

