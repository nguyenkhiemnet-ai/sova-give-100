#!/usr/bin/env bash
set -e
echo "🚨 KÍCH HOẠT QUY TRÌNH KHÔI PHỤC KHẨN CẤP AN TOÀN VỀ V1.0.0 GOLD MASTER..."
git fetch origin --tags || true
git reset --hard v1.0.0-enterprise-gold
# BẢO VỆ BẤT KHẢ XÂM PHẠM: Loại trừ .env.local và thư mục backups khỏi lệnh dọn dẹp
git clean -fd -e .env.local -e backups/
node --env-file=.env.local scripts/guard_regression.mjs
echo "✅ HỆ THỐNG ĐÃ TRỞ VỀ NGUYÊN TRẠNG V1.0.0 HOÀN HẢO (BẢO TOÀN .ENV VÀ BACKUPS)!"
