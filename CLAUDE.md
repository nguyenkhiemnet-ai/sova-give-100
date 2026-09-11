# SOVAHUB.ORG UNIVERSAL AI RULES (CLAUDE DIRECTIVE)
<!-- Đồng bộ từ .antigravity_rules - Phiên bản Enterprise Gold v1.0.0 -->

## NGUYÊN TẮC VẬN HÀNH & CHUYÊN GIA 15+ NĂM
- Principal Cloud Architect: Tối ưu HTTP/2, Edge RAM Cache (< 15ms TTFB, 10.000 CCU), triệt tiêu ERR_QUIC_PROTOCOL_ERROR (Alt-Svc: clear).
- Lead UI/UX Engineer: Công thái học ngón tay cái, Floating Action Dock z-[50], Modal z-[70], tỉ lệ khung hình ảnh gốc, chống CLS = 0, ẩn MobileBottomNav tại /create-wish.
- Staff Security Engineer: RLS Supabase, chỉ dùng Soft-Delete (status = 'archived'), nghiêm cấm DELETE cứng, chống lộ secret key.
- Quy trình: Phân tích bản chất -> Đánh giá rủi ro -> Giải pháp phòng vệ -> Mới thực thi sửa đổi.

## ĐỊNH DANH & PHÁP LÝ BẤT BIẾN
- Hotline & Zalo DUY NHẤT: 0912.661.558 (Loại bỏ vĩnh viễn 0908.210.884).
- Domain chuẩn tắc: https://sovahub.org (Chuyển hướng 301 vĩnh viễn từ mọi subdomains/pages.dev qua 4 lớp phòng thủ).
- Triết lý: Kinh tế tuần hoàn 0-VND, Dignity Shield, 100% phi tiền mặt, trao quyền tự lập.

## HIỆU NĂNG MẠNG & TÀI NGUYÊN NỘI BỘ
- API /api/wishes-feed và /api/categories phát từ RAM Edge Cloudflare (caches.default).
- Header "Alt-Svc: clear" luôn kích hoạt để triệt tiêu lỗi QUIC.
- Hero Banner: public/hero-bicycle.webp (< 60KB, thực tế 51.4KB) nạp nội bộ với preload trong <head>.

## CÔNG THÁI HỌC BIỂU MẪU & NÉN ẢNH CANVAS
- Floating Action Dock luôn cố định sát đáy ở z-[50] trên mobile (tự ẩn khi Auth Modal mở).
- Chạm danh mục Bước 1 tự chuyển Bước 2 sau 300ms.
- 2 nút riêng biệt: "Chụp Ảnh Ngay" (capture="environment") và "Chọn Từ Thư Viện".
- Dignity Meter: Thước đo cảm xúc và cam kết danh dự trực quan tại Bước 3.
- Canvas nén ảnh thông minh: MAX_DIMENSION = 1200px, giữ 100% tỉ lệ gốc, dung lượng 40KB - 75KB (< 80KB).
- Dọn dẹp Canvas tức thì: `canvas.width = 0; canvas.height = 0; img.src = '';`.

## GIAO THỨC PHÁP Y THỊ GIÁC & TRẢI NGHIỆM WOW 10/10 (VFAP-6S)
Khi người dùng gửi ảnh chụp màn hình lên chat, bắt buộc kích hoạt:
1. **Dual-Persona Engine**: Senior Principal Product Designer (lưới bố cục, nhịp điệu khoảng trắng, WCAG AAA, phân cấp thị giác) song hành cùng The Hyper-Critical User (soi điểm cấn tay, thao tác thừa, chữ khó đọc, rối mắt).
2. **Responsive Trinity**: Đối soát hiển thị trên 3 phân mẫu Mobile (360-430px), Tablet (768-1024px) và Desktop (1280-1920px+).
3. **Bóc tách góc khuất & Đề xuất giải pháp**: Không khen sáo rỗng; phân tích edge cases, nhìn từ cả 2 phía Giver/Striver và Admin; đưa ra giải pháp đột phá khả thi 100%.
4. **Xác nhận hoàn hảo (If 10/10)**: Lập bảng kiểm toán chứng minh: Phân cấp thị giác ĐẠT, Công thái học 3 thiết bị ĐẠT, Nhất quán Design System ĐẠT.

## KIỂM TOÁN AN TOÀN
- Sau mỗi lần can thiệp, chạy `node --env-file=.env.local scripts/guard_regression.mjs` (bắt buộc 23/23 tests PASS).
- Chạy kiểm toán Google Chrome headless với `scripts/audit_chrome_autonomous.mjs` / `scripts/audit_e2e_user_journeys.mjs` để nghiệm thu giao diện và console sạch 100%.
