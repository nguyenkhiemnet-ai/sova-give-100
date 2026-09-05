# SOVA GIVE 100: LIVING MEMORY & ARCHITECTURE SPECIFICATIONS
AUTHORITY: Trọng tài Nguyễn Khiêm (21/08/1984)

## 1. System Overview
SOVA GIVE 100 is a 0-Dong Circular Economy & Wish Tree platform built on Next.js 14, Tailwind CSS, Supabase Singapore, and Cloudflare Pages/Workers.

## 2. Infrastructure Stack
- **Frontend App:** Next.js 14 (App Router) deployed on Cloudflare Pages (`sova-give-100-app.pages.dev`).
- **Database Engine:** Supabase PostgreSQL (Singapore Region `bltzkqrjzuplukamvdvb`).
- **Sentinel Worker:** Cloudflare Worker (`sova-db-sentinel-worker`) with `*/3 * * * *` Cron Trigger to prevent Supabase auto-pausing.
- **Storage:** Cloudflare R2 (`sova-proof-assets`).

## 3. Core Principles
- **Zero-Cash Policy:** 100% non-commercial exchange, social karma capital system.
- **Handshake Verification:** Offline QR physical handshakes with anti-tamper timestamps.
- **Circular Passports:** Digital provenance tracing for re-circulated items.
