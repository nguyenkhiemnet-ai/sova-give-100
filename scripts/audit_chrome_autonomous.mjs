import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9444; // Dedicated port for autonomous auditor
const TARGET_URL = process.argv[2] || process.env.TARGET_URL || 'https://sovahub.org';
const TIMEOUT_MS = 30000;

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

async function runAutonomousAudit() {
  console.log('================================================================');
  console.log(`🤖 [AUTONOMOUS CHROME AUDITOR] BẮT ĐẦU KIỂM TOÁN: ${TARGET_URL}`);
  console.log('================================================================');

  if (!fs.existsSync(CHROME_PATH)) {
    throw new Error(`Google Chrome không tìm thấy tại đường dẫn: ${CHROME_PATH}`);
  }

  const tempUserDataDir = path.resolve('/tmp', `chrome_audit_auto_${Date.now()}`);
  fs.mkdirSync(tempUserDataDir, { recursive: true });

  let chromeProc = null;
  let timeoutTimer = null;
  let isCleanedUp = false;

  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    if (timeoutTimer) clearTimeout(timeoutTimer);
    if (chromeProc) {
      try {
        console.log('🧹 Đang dọn dẹp và đóng tiến trình Chrome (SIGKILL)...');
        chromeProc.kill('SIGKILL');
      } catch (err) {
        // ignore error if already killed
      }
    }
    try {
      if (fs.existsSync(tempUserDataDir)) {
        fs.rmSync(tempUserDataDir, { recursive: true, force: true });
      }
    } catch (e) {
      // ignore tmp cleanup error
    }
  };

  // Safe timeout abort handler
  const timeoutPromise = new Promise((_, reject) => {
    timeoutTimer = setTimeout(() => {
      cleanup();
      reject(new Error(`⏱️ Timeout quá ${TIMEOUT_MS / 1000} giây khi kiểm toán bằng Google Chrome!`));
    }, TIMEOUT_MS);
  });

  const auditWork = async () => {
    // 1. Khởi chạy Google Chrome native chạy ngầm
    chromeProc = spawn(CHROME_PATH, [
      '--headless=new',
      '--incognito',
      `--remote-debugging-port=${PORT}`,
      '--disable-gpu',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--no-first-run',
      `--user-data-dir=${tempUserDataDir}`,
      '--window-size=1440,900'
    ], { stdio: 'ignore' });

    // 2. Chờ kết nối DevTools Protocol
    let version = null;
    for (let i = 0; i < 25; i++) {
      try {
        version = await getJson(`http://127.0.0.1:${PORT}/json/version`);
        if (version && version.webSocketDebuggerUrl) break;
      } catch {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    if (!version) {
      throw new Error('Cổng gỡ lỗi Chrome DevTools không phản hồi sau 5 giây!');
    }

    console.log(`✅ [Chrome Engine] Đã kích hoạt: ${version['Browser']}`);

    const tabs = await getJson(`http://127.0.0.1:${PORT}/json/list`);
    let tab = tabs.find(t => t.type === 'page') || tabs[0];
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
      if (data.method === 'Console.messageAdded') {
        consoleLogs.push(data.params.message);
      }
      if (data.method === 'Runtime.consoleAPICalled') {
        consoleLogs.push({
          level: data.params.type,
          text: data.params.args?.map(a => a.value || JSON.stringify(a)).join(' ')
        });
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

    console.log(`🌐 Đang điều hướng đến: ${TARGET_URL}`);
    await sendCommand('Page.navigate', { url: TARGET_URL });

    // Chờ 3.5 giây để trang tải xong tài nguyên và render hoàn tất
    await new Promise(r => setTimeout(r, 3500));

    // 3. Kiểm tra thẻ Hero Bicycle
    const evalResult = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const heroImg = document.querySelector('img[src*="hero-bicycle"], img[alt*="xe đạp"], .lg\\\\:col-span-5 img');
        if (!heroImg) {
          return { found: false, allImages: Array.from(document.querySelectorAll('img')).map(i => i.src) };
        }
        return {
          found: true,
          src: heroImg.getAttribute('src'),
          currentSrc: heroImg.currentSrc,
          naturalWidth: heroImg.naturalWidth,
          naturalHeight: heroImg.naturalHeight,
          complete: heroImg.complete,
          displayedWidth: heroImg.offsetWidth,
          displayedHeight: heroImg.offsetHeight
        };
      })()`,
      returnByValue: true
    });

    const info = evalResult?.result?.result?.value;
    console.log('\n📊 THỰC NGHIỆM ĐỒ HỌA THẺ HERO BANNER:');
    console.log(JSON.stringify(info, null, 2));

    let heroPassed = false;
    if (info && info.found && info.naturalWidth > 0 && info.naturalHeight > 0) {
      console.log(`  ✅ [PASS] Thẻ ảnh Hero xe đạp tải thành công (Kích thước gốc: ${info.naturalWidth}x${info.naturalHeight}px)`);
      heroPassed = true;
    } else {
      console.error(`  ❌ [FAIL] Không tìm thấy hoặc ảnh Hero chưa nạp thành công!`);
    }

    // Kiểm tra network request cho hero-bicycle
    const heroReq = networkResponses.find(r => r.response?.url?.includes('hero-bicycle'));
    if (heroReq) {
      console.log(`  ✅ [PASS] Network request /hero-bicycle.webp trả về HTTP ${heroReq.response.status} (${heroReq.response.mimeType})`);
    } else {
      console.warn(`  ⚠️ [WARN] Không bắt được network request /hero-bicycle (có thể nạp từ disk cache hoặc preload)`);
    }

    // 4. Kiểm tra Console Errors
    const errors = consoleLogs.filter(log => {
      const level = (log.level || '').toLowerCase();
      const text = (log.text || '').toLowerCase();
      return level === 'error' && !text.includes('favicon.ico');
    });

    console.log('\n🔍 KIỂM TOÁN NHẬT KÝ BẢNG ĐIỀU KHIỂN (CONSOLE):');
    if (errors.length === 0) {
      console.log('  ✅ [PASS] 0 lỗi Console (Console hoàn toàn sạch sẽ)');
    } else {
      console.error(`  ❌ [FAIL] Phát hiện ${errors.length} lỗi Console:`);
      errors.forEach(e => console.error(`    - [${e.level}] ${e.text}`));
    }

    // 5. Kiểm tra Network Failures
    console.log('\n🌐 KIỂM TOÁN TÍN HIỆU MẠNG LƯỚI (NETWORK):');
    const filteredFailedReqs = failedRequests.filter(req => !req.errorText?.includes('net::ERR_ABORTED'));
    if (filteredFailedReqs.length === 0) {
      console.log('  ✅ [PASS] 0 lỗi mạng giao thức (ERR_QUIC hoặc HTTP Failures)');
    } else {
      console.error(`  ❌ [FAIL] Phát hiện ${filteredFailedReqs.length} yêu cầu mạng thất bại:`);
      filteredFailedReqs.forEach(r => console.error(`    - URL: ${r.requestId}, Error: ${r.errorText}`));
    }

    // 6. Chụp ảnh màn hình bằng Chrome DevTools Protocol
    console.log('\n📸 ĐANG CHỤP ẢNH MÀN HÌNH NGHIỆM THU...');
    const screenshotData = await sendCommand('Page.captureScreenshot', { format: 'png' });
    if (screenshotData?.result?.data) {
      const backupsDir = path.resolve(process.cwd(), 'backups');
      if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
      const screenshotPath = path.resolve(backupsDir, 'autonomous_audit.png');
      fs.writeFileSync(screenshotPath, Buffer.from(screenshotData.result.data, 'base64'));
      const sizeKb = (fs.statSync(screenshotPath).size / 1024).toFixed(1);
      console.log(`  ✅ [PASS] Đã lưu ảnh chụp màn hình kiểm toán tại: backups/autonomous_audit.png (${sizeKb} KB)`);
    }

    ws.close();

    const isAllPass = heroPassed && errors.length === 0 && filteredFailedReqs.length === 0;
    console.log('\n================================================================');
    console.log(`🎯 KẾT QUẢ KIỂM TOÁN TỰ HÀNH: ${isAllPass ? '10/10 HOÀN HẢO (PASSED) ✅' : 'CHƯA ĐẠT CHUẨN ❌'}`);
    console.log('================================================================');

    return isAllPass;
  };

  try {
    const success = await Promise.race([auditWork(), timeoutPromise]);
    return success;
  } finally {
    cleanup();
  }
}

runAutonomousAudit()
  .then((passed) => {
    if (!passed) process.exit(1);
  })
  .catch((err) => {
    console.error('❌ LỖI TRONG QUÁ TRÌNH KIỂM TOÁN CHROME:', err.message);
    process.exit(1);
  });
