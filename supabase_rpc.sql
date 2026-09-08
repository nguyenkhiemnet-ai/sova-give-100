-- ==============================================================================
-- SOVA GIVE 100: ENTERPRISE ACID HANDSHAKE CLAIM RPC (10.000 CCU CONCURRENCY)
-- Authority: Trọng tài Nguyễn Khiêm (21/08/1984)
-- ==============================================================================

-- 1. Bổ sung các cột an toàn vào bảng wishes nếu chưa có
ALTER TABLE public.wishes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'OPEN';
ALTER TABLE public.wishes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.wishes ADD COLUMN IF NOT EXISTS passport_code TEXT;

-- 2. Hàm RPC execute_handshake_claim (Chuẩn ACID - FOR UPDATE SKIP LOCKED)
CREATE OR REPLACE FUNCTION public.execute_handshake_claim(p_wish_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_passport_code TEXT;
    v_current_status TEXT;
BEGIN
    -- Khóa hàng thông minh: Sử dụng FOR UPDATE SKIP LOCKED để triệt tiêu xếp hàng chờ & deadlock
    SELECT COALESCE(status, 'OPEN') INTO v_current_status
    FROM public.wishes
    WHERE id = p_wish_id
    FOR UPDATE SKIP LOCKED;

    -- Nếu v_current_status IS NULL, có thể điều ước không tồn tại hoặc ĐANG BỊ KHÓA bởi 1 Angel khác
    IF v_current_status IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Điều ước này đang được một Angel khác thao tác hoặc không tồn tại. Vui lòng chọn điều ước khác.'
        );
    END IF;

    -- Kiểm tra nếu điều ước đã được claim trước đó
    IF v_current_status = 'claimed' OR v_current_status = 'fulfilled' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Điều ước này đã được tiếp nhận bởi một Người Trao khác.'
        );
    END IF;

    -- Sinh mã Hộ Chiếu Số ngẫu nhiên
    v_passport_code := 'SOVA-PASS-' || floor(1000 + random() * 9000)::text || '-VN';

    -- Cập nhật trạng thái sang claimed và gán passport_code
    UPDATE public.wishes
    SET 
        status = 'claimed',
        passport_code = v_passport_code,
        updated_at = NOW()
    WHERE id = p_wish_id;

    RETURN jsonb_build_object(
        'success', true,
        'passport_code', v_passport_code,
        'message', 'Khớp nối thành công! Đã cấp Hộ Chiếu Số và khóa giao dịch an toàn.'
    );
END;
$$;

-- 3. Phân quyền thực thi cho client (Anon, Authenticated, Service Role)
GRANT EXECUTE ON FUNCTION public.execute_handshake_claim(UUID) TO anon, authenticated, service_role;
