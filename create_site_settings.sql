-- ==============================================================================
-- BẢNG SITE_SETTINGS CHO SOVA GIVE 100
-- Đồng bộ CMS & Danh mục động (Categories) tức thì
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kích hoạt Row Level Security
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Cho phép mọi người (anon & authenticated) đọc cấu hình công khai
DROP POLICY IF EXISTS "Allow public read site_settings" ON public.site_settings;
CREATE POLICY "Allow public read site_settings"
    ON public.site_settings FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

-- Cho phép Ban Quản Trị (service_role) toàn quyền ghi/sửa/xóa
DROP POLICY IF EXISTS "Allow service role full site_settings" ON public.site_settings;
CREATE POLICY "Allow service role full site_settings"
    ON public.site_settings FOR ALL
    TO service_role
    USING (true);

-- Khởi tạo danh mục mặc định
INSERT INTO public.site_settings (key, value)
VALUES (
  'site_categories',
  '[
    {"id":"bicycle","label":"Xe đạp đến trường","shortLabel":"Xe đạp","iconName":"Bike","desc":"Phương tiện đi lại cho học sinh nghèo"},
    {"id":"laptop","label":"Máy tính học tập","shortLabel":"Máy tính","iconName":"Laptop","desc":"Laptop, PC cho học sinh - sinh viên"},
    {"id":"sewing_machine","label":"Máy may sinh kế","shortLabel":"Máy may","iconName":"Scissors","desc":"Dụng cụ may vá cho mẹ đơn thân"},
    {"id":"study_tools","label":"Dụng cụ tri thức","shortLabel":"Sách & Dụng cụ","iconName":"BookOpen","desc":"Sách vở, bàn học, máy tính cầm tay"},
    {"id":"livelihood_tools","label":"Công cụ mưu sinh","shortLabel":"Nghề mưu sinh","iconName":"Wrench","desc":"Đồ nghề sửa xe, làm mộc, làm nông"}
  ]'::jsonb
)
ON CONFLICT (key) DO NOTHING;
