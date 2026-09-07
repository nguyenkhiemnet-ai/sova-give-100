-- 1. Tạo hàm RPC execute_handshake_claim xử lý khóa giao dịch ACID
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
    -- Kiểm tra trạng thái hiện tại của điều ước
    SELECT status INTO v_current_status
    FROM public.wishlist_items
    WHERE id = p_wish_id
    FOR UPDATE;

    IF v_current_status IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Không tìm thấy hồ sơ điều ước yêu cầu.'
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
    UPDATE public.wishlist_items
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

-- 2. Phân quyền thực thi cho cả khách vãng lai (anon) và người đã đăng nhập (authenticated)
GRANT EXECUTE ON FUNCTION public.execute_handshake_claim(UUID) TO anon, authenticated, service_role;
