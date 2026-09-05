# SOVA GIVE 100: ARCHITECTURE SPECIFICATIONS

## 1. Database Schema Specifications
- **`wishlist_items`**: `id`, `title`, `category`, `urgency_level`, `reason_description`, `commitment_pledge`, `province_code`, `verification_status`, `created_at`
- **`circular_items`**: `id`, `name`, `passport_code`, `condition_grade`, `donor_id`, `recipient_id`, `co2_saved_kg`, `created_at`
- **`handshakes`**: `id`, `wish_id`, `item_id`, `giver_id`, `receiver_id`, `qr_token`, `status`, `completed_at`

## 2. API & RPC Endpoints
- **Keep-Alive Ping:** `POST /rest/v1/rpc/keep_alive_ping` -> `{"status":"alive","region":"Singapore","platform":"SOVA GIVE 100"}`
- **Handshake Claim:** `POST /rest/v1/rpc/execute_handshake_claim`
- **Complete Handshake QR:** `POST /rest/v1/rpc/complete_handshake_qr`

## 3. Deployment Parameters
- **Cloudflare Pages:** Project Name `sova-give-100-app`
- **Cloudflare Worker:** Worker `sova-db-sentinel-worker`
