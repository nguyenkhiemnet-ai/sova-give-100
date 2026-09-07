import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, fullName } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, error: 'Email không hợp lệ' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const displayName = fullName && fullName.trim() ? fullName.trim() : cleanEmail.split('@')[0];
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sovahub.org';
    const loginLink = `${siteUrl}/profile/`;
    const resetLink = `${siteUrl}/profile/`;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER || 'Nguyenkhiemnet@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD || 'niweuwjupivnylxx'
      }
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Chào mừng bạn gia nhập SOVA GIVE 100</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f7f5; margin: 0; padding: 20px; color: #1c261e; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e7ebe8; }
        .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; }
        .header p { margin: 8px 0 0 0; font-size: 13px; opacity: 0.92; font-weight: 500; }
        .body { padding: 32px 30px; }
        .salute { font-size: 18px; font-weight: 800; color: #064e3b; margin-bottom: 16px; }
        .content-text { font-size: 14px; line-height: 1.7; color: #374151; margin-bottom: 24px; }
        .highlight-box { background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 16px; padding: 18px 20px; margin-bottom: 28px; }
        .highlight-box p { margin: 0; font-size: 13px; color: #065f46; line-height: 1.6; font-weight: 600; }
        .btn-wrapper { text-align: center; margin: 30px 0; }
        .btn-primary { display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; padding: 15px 36px; border-radius: 14px; font-size: 14px; font-weight: 800; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4); text-transform: uppercase; letter-spacing: 0.5px; }
        .secondary-links { background-color: #f9fafb; border-radius: 16px; padding: 18px 20px; border: 1px dashed #d1d5db; margin-top: 25px; }
        .secondary-links h4 { margin: 0 0 10px 0; font-size: 13px; color: #1f2937; font-weight: 800; }
        .secondary-links p { margin: 0 0 8px 0; font-size: 12px; color: #4b5563; line-height: 1.5; }
        .secondary-links a { color: #059669; font-weight: 700; text-decoration: underline; word-break: break-all; }
        .footer { background-color: #f8faf9; padding: 24px 30px; text-align: center; border-top: 1px solid #e7ebe8; font-size: 11px; color: #6b7280; line-height: 1.6; }
        .footer strong { color: #111827; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SOVA GIVE 100</h1>
          <p>Cây Nguyện Ước Tuần Hoàn Sinh Kế • 100% 0-VND</p>
        </div>

        <div class="body">
          <div class="salute">Chào mừng bạn ${displayName},</div>
          
          <div class="content-text">
            Chúc mừng bạn đã tạo tài khoản thành công tại nền tảng <strong>SOVAHUB.org</strong>! Bạn đã chính thức trở thành một công dân danh dự của cộng đồng Kinh Tế Tuần Hoàn 0 Đồng – nơi mọi đồ dùng học tập, sinh kế (xe đạp, máy tính, máy may...) tìm thấy cuộc đời thứ hai qua Hộ Chiếu Số và cái Bắt Tay Tử Tế.
          </div>

          <div class="highlight-box">
            <p>
              🎁 <strong>Quà tặng khởi đầu:</strong> Hệ thống đã kích hoạt tặng bạn <strong>100 ⭐ Vốn Karma Danh Dự</strong> để sẵn sàng gieo ước nguyện hoặc kết nối nhận thiết bị sinh kế 0 đồng.
            </p>
          </div>

          <!-- NỘI DUNG 1: NÚT BẤM ĐĂNG NHẬP VÀO TÀI KHOẢN -->
          <div class="btn-wrapper">
            <a href="${loginLink}" class="btn-primary" target="_blank">
              👉 ĐĂNG NHẬP VÀO TÀI KHOẢN NGAY
            </a>
          </div>

          <!-- NỘI DUNG 2: ĐƯỜNG LINK QUẢN LÝ TÀI KHOẢN & ĐẶT LẠI MẬT KHẨU -->
          <div class="secondary-links">
            <h4>🔐 Hai Đường Link Quan Trọng Dành Cho Bạn:</h4>
            <p>
              <strong>1. Đường link đăng nhập trực tiếp:</strong><br>
              <a href="${loginLink}" target="_blank">${loginLink}</a>
            </p>
            <p style="margin-top: 12px;">
              <strong>2. Đường link quản lý hồ sơ & đặt lại mật khẩu:</strong><br>
              <a href="${resetLink}" target="_blank">${resetLink}</a><br>
              <span style="font-size: 11px; color: #6b7280;">(Tại đây bạn có thể cập nhật thông tin cá nhân, xem sổ hộ chiếu sinh kế hoặc bấm "Quên mật khẩu" bất cứ khi nào cần đặt lại).</span>
            </p>
          </div>
        </div>

        <div class="footer">
          <p>
            Thư này được gửi tự động từ <strong>Bàn Quản Trị Tối Cao SOVA GIVE 100</strong>.<br>
            Người vận hành: <strong>Nguyễn Khiêm</strong> (<a href="mailto:Nguyenkhiemnet@gmail.com" style="color: #059669; text-decoration: none;">Nguyenkhiemnet@gmail.com</a>)<br>
            Trang web chính thức: <a href="https://sovahub.org" style="color: #059669; text-decoration: none;">https://sovahub.org</a>
          </p>
          <p style="margin-top: 8px; font-size: 10px; color: #9ca3af;">
            © 2026 SOVA GIVE 100 • Trao Cơ Hội, Giữ Danh Dự • Mô hình kinh tế tuần hoàn vị nhân sinh.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: `"SOVA GIVE 100 - Bàn Quản Trị Tối Cao" <${process.env.GMAIL_USER || 'Nguyenkhiemnet@gmail.com'}>`,
      to: cleanEmail,
      subject: `[SOVA GIVE 100] Chúc mừng ${displayName} đã đăng ký tài khoản thành công!`,
      html: htmlContent
    });

    console.log(`✅ Đã gửi email chào mừng thành công từ Nguyenkhiemnet@gmail.com đến ${cleanEmail}`);
    return NextResponse.json({ success: true, message: 'Đã gửi email chào mừng thành công!' });
  } catch (error: any) {
    console.error('Lỗi khi gửi email chào mừng:', error);
    return NextResponse.json({ success: false, error: error.message || 'Lỗi gửi email' }, { status: 500 });
  }
}
