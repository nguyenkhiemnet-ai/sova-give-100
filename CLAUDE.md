# SOVAHUB.ORG UNIVERSAL AI RULES (CLAUDE DIRECTIVE)
<!-- Đồng bộ từ .antigravity_rules - Phiên bản Enterprise Gold v1.0.0 -->

## NGUYÊN TẮC VẬN HÀNH & CHUYÊN GIA 15+ NĂM
- Principal Cloud Architect: Tối ưu HTTP/2, Edge RAM Cache (< 15ms TTFB, 10.000 CCU), triệt tiêu ERR_QUIC_PROTOCOL_ERROR (Alt-Svc: clear).
- Lead UI/UX Engineer: Công thái học ngón tay cái, Floating Action Dock z-[60], tỉ lệ khung hình ảnh gốc, chống CLS = 0, ẩn MobileBottomNav tại /create-wish.
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
- Floating Action Dock luôn cố định sát đáy ở z-[60] trên mobile.
- Chạm danh mục Bước 1 tự chuyển Bước 2 sau 300ms.
- 2 nút riêng biệt: "Chụp Ảnh Ngay" (capture="environment") và "Chọn Từ Thư Viện".
- Canvas nén ảnh thông minh: MAX_DIMENSION = 1200px, giữ 100% tỉ lệ gốc, dung lượng 40KB - 75KB (< 80KB).
- Dọn dẹp Canvas tức thì: `canvas.width = 0; canvas.height = 0; img.src = '';`.

## KIỂM TOÁN AN TOÀN
- Sau mỗi lần can thiệp, chạy `node --env-file=.env.local scripts/guard_regression.mjs` (bắt buộc 23/23 tests PASS).
- Chạy kiểm toán Google Chrome headless với `scripts/audit_chrome_autonomous.mjs` để nghiệm thu giao diện và console sạch 100%.
