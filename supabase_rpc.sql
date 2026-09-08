-- 1. Đảm bảo bảng wishes có đầy đủ các trường trạng thái vòng đời
ALTER TABLE public.wishes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'OPEN';
ALTER TABLE public.wishes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Tạo hàm RPC execute_handshake_claim xử lý khóa giao dịch ACID
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
            'message', 'Điều ước này đang được một Người Trao khác thao tác hoặc không tồn tại. Vui lòng chọn điều ước khác.'
        );
    END IF;

    IF v_current_status = 'claimed' OR v_current_status = 'fulfilled' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Điều ước này đã được tiếp nhận bởi một người trao khác.'
        );
    END IF;

    -- Sinh mã Hộ Chiếu Số ngẫu nhiên
    v_passport_code := 'SOVA-PASS-' || floor(1000 + random() * 9000)::text || '-VN';

    -- Cập nhật trạng thái sang claimed
    UPDATE public.wishes
    SET 
        status = 'claimed',
        updated_at = NOW()
    WHERE id = p_wish_id;

    RETURN jsonb_build_object(
        'success', true,
        'passport_code', v_passport_code,
        'message', 'Khớp nối thành công! Đã chuyển giao dịch sang trạng thái claimed.'
    );
END;
$$;

-- 3. Phân quyền thực thi cho client
GRANT EXECUTE ON FUNCTION public.execute_handshake_claim(UUID) TO anon, authenticated, service_role;
