import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9444;
const BACKUP_DIR = path.resolve(process.cwd(), 'backups');
const SCREENSHOT_PATH = path.join(BACKUP_DIR, 'live_hero_verified.png');

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function verifyLive() {
  console.log('================================================================');
  console.log('🔍 [SOVA LIVE AUDIT] BẮT ĐẦU KIỂM THỬ THỰC TẾ TRÊN HTTPS://SOVAHUB.ORG');
  console.log('================================================================');

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // 1. KIỂM TRA CURL TÀI SẢN ẢNH HERO NỘI BỘ
  console.log('\n--- 1. ĐỐI SOÁT TÀI SẢN /hero-bicycle.webp QUA CURL ---');
  const imgRes = await fetch('https://sovahub.org/hero-bicycle.webp', { method: 'HEAD' });
  const imgStatus = imgRes.status;
  const imgMime = imgRes.headers.get('content-type');
  const imgLength = imgRes.headers.get('content-length');
  const imgCache = imgRes.headers.get('cf-cache-status');

  console.log(`HTTP Status: ${imgStatus}`);
  console.log(`Content-Type: ${imgMime}`);
  console.log(`Content-Length: ${imgLength} bytes (${(parseInt(imgLength) / 1024).toFixed(1)} KB)`);
  console.log(`Cloudflare Cache: ${imgCache}`);

  const imgOk = imgStatus === 200 && imgMime?.includes('image/webp');
  if (imgOk) {
    console.log('✅ [PASS] Ảnh /hero-bicycle.webp trả về HTTP 200 image/webp chuẩn xác!');
  } else {
    console.error('❌ [FAIL] Ảnh /hero-bicycle.webp phản hồi không hợp lệ!');
  }

  // 2. KIỂM TRA HEADER VÀ GIAO THỨC TRUYỀN TẢI
  console.log('\n--- 2. KIỂM TRA HEADER & GIAO THỨC TRUYỀN TẢI ---');
  const pageRes = await fetch('https://sovahub.org/', { method: 'HEAD' });
  const altSvc = pageRes.headers.get('alt-svc');
  const earlyHints = pageRes.headers.get('link');
  console.log(`Trang chủ HTTP Status: ${pageRes.status}`);
  console.log(`Header link (Preload): ${earlyHints}`);
  console.log(`Header alt-svc nhận được: ${altSvc || '(Không có / Đã loại bỏ)'}`);

  // 3. KHỞI CHẠY GOOGLE CHROME VỚI CỜ INCOGNITO ĐỘC LẬP
  console.log('\n--- 3. KHỞI CHẠY CHROME INCOGNITO TRUY CẬP HTTPS://SOVAHUB.ORG ---');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--incognito',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--window-size=1280,900',
    `--user-data-dir=/tmp/chrome_incognito_audit_${Date.now()}`
  ], { stdio: 'ignore' });

  try {
    let version = null;
    for (let i = 0; i < 20; i++) {
      try {
        version = await getJson(`http://127.0.0.1:${PORT}/json/version`);
        if (version && version.webSocketDebuggerUrl) break;
      } catch {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    if (!version) {
      throw new Error('Không thể kết nối Chrome DevTools Protocol');
    }

    console.log(`[Chrome] Khởi động trình duyệt: ${version['Browser']}`);

    const tabs = await getJson(`http://127.0.0.1:${PORT}/json/list`);
    const tab = tabs.find(t => t.type === 'page') || tabs[0];
    const wsUrl = tab.webSocketDebuggerUrl;

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const pending = new Map();
    const networkResponses = [];
    const failedRequests = [];
    const consoleLogs = [];

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        pending.get(data.id)(data);
        pending.delete(data.id);
      }
      if (data.method === 'Network.responseReceived') {
        networkResponses.push(data.params);
      }
      if (data.method === 'Network.loadingFailed') {
        failedRequests.push(data.params);
      }
      if (data.method === 'Console.messageAdded' || data.method === 'Runtime.consoleAPICalled') {
        consoleLogs.push(data.params);
      }
    };

    function sendCommand(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendCommand('Network.enable');
    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');

    console.log('⚡ Đang điều hướng Chrome Incognito đến https://sovahub.org/ ...');
    const startTime = Date.now();
    await sendCommand('Page.navigate', { url: 'https://sovahub.org/' });

    // Đợi trang tải và hydrate hoàn tất
    await new Promise(r => setTimeout(r, 4500));
    const loadDuration = Date.now() - startTime;
    console.log(`⏱️ Thời gian tải trang hoàn tất: ${loadDuration}ms`);

    // Kiểm tra lỗi mạng có liên quan đến QUIC hoặc không
    const quicFailures = failedRequests.filter(f => 
      f.errorText?.includes('ERR_QUIC') || 
      f.errorText?.includes('PROTOCOL_ERROR')
    );

    console.log(`\n🔍 KIỂM TRA LỖI KẾT NỐI MẠNG TRONG INCOGNITO:`);
    console.log(`- Tổng số network requests hoàn tất: ${networkResponses.length}`);
    console.log(`- Lỗi request thất bại: ${failedRequests.length}`);
    console.log(`- Lỗi ERR_QUIC_PROTOCOL_ERROR: ${quicFailures.length}`);

    if (quicFailures.length === 0) {
      console.log('✅ [PASS] Hoàn toàn KHÔNG có lỗi ERR_QUIC_PROTOCOL_ERROR trong chế độ ẩn danh!');
    } else {
      console.error('❌ [FAIL] Phát hiện lỗi QUIC:', quicFailures);
    }

    // ĐỐI SOÁT THẺ IMG VÀ KHỐI HERO BANNER
    console.log('\n--- 4. ĐỐI SOÁT THẺ IMG HERO TRÊN LIVE DOM ---');
    const heroInfoResult = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const heroImg = document.querySelector('img[src*="hero-bicycle"], img[alt*="xe đạp"], .lg\\\\:col-span-5 img');
        if (!heroImg) {
          return { found: false, allImages: Array.from(document.querySelectorAll('img')).map(i => i.src) };
        }
        const rect = heroImg.getBoundingClientRect();
        return {
          found: true,
          src: heroImg.getAttribute('src'),
          currentSrc: heroImg.currentSrc,
          naturalWidth: heroImg.naturalWidth,
          naturalHeight: heroImg.naturalHeight,
          complete: heroImg.complete,
          displayedWidth: Math.round(rect.width),
          displayedHeight: Math.round(rect.height),
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          }
        };
      })()`,
      returnByValue: true
    });

    const hero = heroInfoResult?.result?.result?.value;
    console.log('Dữ liệu thẻ <img> thực tế:', JSON.stringify(hero, null, 2));

    let heroPassed = false;
    if (hero && hero.found) {
      if (hero.naturalWidth > 0 && hero.naturalHeight > 0) {
        console.log(`✅ [PASS] ẢNH HERO HIỂN THỊ HOÀN HẢO:`);
        console.log(`   - Kích thước gốc (Natural): ${hero.naturalWidth} x ${hero.naturalHeight} px`);
        console.log(`   - Kích thước render: ${hero.displayedWidth} x ${hero.displayedHeight} px`);
        console.log(`   - Thuộc tính src: ${hero.src}`);
        console.log(`   - Trạng thái complete: ${hero.complete}`);
        heroPassed = true;
      } else {
        console.error('❌ [FAIL] Thẻ img tìm thấy nhưng naturalWidth = 0 (ảnh bị lỗi/đen)!');
      }
    } else {
      console.error('❌ [FAIL] Không tìm thấy ảnh Hero trên DOM Live!');
    }

    // CHỤP ẢNH MÀN HÌNH MINH CHỨNG
    console.log('\n--- 5. CHỤP ẢNH MÀN HÌNH KHỐI HERO BANNER KIỂM CHỨNG ---');
    let clip = undefined;
    if (hero && hero.rect && hero.rect.width > 0 && hero.rect.height > 0) {
      // Chụp mở rộng một chút quanh khối hero banner
      const margin = 20;
      clip = {
        x: Math.max(0, hero.rect.x - margin),
        y: Math.max(0, hero.rect.y - margin),
        width: hero.rect.width + margin * 2,
        height: hero.rect.height + margin * 2,
        scale: 1
      };
    }

    const screenshotRes = await sendCommand('Page.captureScreenshot', {
      format: 'png',
      quality: 100,
      clip: clip
    });

    if (screenshotRes?.result?.data) {
      const buffer = Buffer.from(screenshotRes.result.data, 'base64');
      fs.writeFileSync(SCREENSHOT_PATH, buffer);
      console.log(`📸 [THÀNH CÔNG] Đã lưu ảnh chụp minh chứng vào: ${SCREENSHOT_PATH}`);
      console.log(`   Kích thước file ảnh chụp: ${(buffer.length / 1024).toFixed(1)} KB`);
    } else {
      console.error('❌ Không thể chụp ảnh màn hình qua CDP');
    }

    ws.close();

    return {
      imgOk,
      heroPassed,
      quicClean: quicFailures.length === 0,
      hero
    };
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

verifyLive().then(res => {
  console.log('\n================================================================');
  console.log('🏁 TỔNG KẾT KIỂM THỬ LIVE HTTPS://SOVAHUB.ORG:');
  console.log(`- Ảnh Hero HTTP 200 image/webp: ${res.imgOk ? 'ĐẠT ✅' : 'HỎNG ❌'}`);
  console.log(`- Hiển thị DOM (naturalWidth > 0): ${res.heroPassed ? 'ĐẠT ✅' : 'HỎNG ❌'}`);
  console.log(`- Chế độ Incognito (Không lỗi QUIC): ${res.quicClean ? 'ĐẠT ✅' : 'HỎNG ❌'}`);
  console.log('================================================================\n');

  if (!res.imgOk || !res.heroPassed || !res.quicClean) {
    process.exit(1);
  }
}).catch(err => {
  console.error('Lỗi quy trình kiểm thử:', err);
  process.exit(1);
});
