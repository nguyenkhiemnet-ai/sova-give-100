#!/bin/bash
# SOVA GIVE 100 - Auto Push Script
# Usage: ./push_sova.sh <GITHUB_PAT_TOKEN>
# Nhận PAT token làm tham số, cấu hình remote và push toàn bộ codebase

set -e

PAT_TOKEN="$1"

if [ -z "$PAT_TOKEN" ]; then
  echo "❌ Thiếu PAT Token. Usage: ./push_sova.sh ghp_xxxx..."
  exit 1
fi

REPO_DIR="/Users/admin/Downloads/SOVA NEW/WEBAPP"

echo "🚀 [SOVA] Bắt đầu push codebase lên GitHub..."

# Set remote URL với PAT token
git -C "$REPO_DIR" remote set-url origin "https://nguyenkhiemnet-ai:${PAT_TOKEN}@github.com/nguyenkhiemnet-ai/sova-give-100.git"

# Kiểm tra trạng thái git
echo "📋 [SOVA] Git status:"
git -C "$REPO_DIR" status

# Push lên main
echo "📤 [SOVA] Đang push lên origin main..."
git -C "$REPO_DIR" push origin main --force

echo ""
echo "✅ [SOVA] Push hoàn tất! Kiểm tra SYSTEM_STATE.md trên GitHub..."
curl -s "https://raw.githubusercontent.com/nguyenkhiemnet-ai/sova-give-100/main/SYSTEM_STATE.md" | head -3

echo ""
echo "✅ [SOVA] Kiểm tra src/app/page.tsx đã cập nhật..."
curl -s "https://raw.githubusercontent.com/nguyenkhiemnet-ai/sova-give-100/main/src/app/page.tsx" | head -5

echo ""
echo "🏁 [SOVA] HOÀN TẤT - Cloudflare Pages sẽ tự động build lại trong ~60s"
