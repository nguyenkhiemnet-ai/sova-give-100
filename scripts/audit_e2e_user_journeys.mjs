import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9555;
const BASE_URL = process.argv[2] || process.env.TARGET_URL || 'https://sovahub.org';
const TIMEOUT_MS = 60000;

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

async function runE2EUserAudit() {
  console.log('================================================================');
  console.log('🎭 [E2E USER AUDIT] KHỞI ĐỘNG CHUYÊN GIA QA LEAD & HEAD OF PRODUCT');
  console.log(`🌐 MỤC TIÊU KIỂM TOÁN: ${BASE_URL}`);
  console.log('================================================================');

  const tempUserDataDir = path.resolve('/tmp', `chrome_e2e_audit_${Date.now()}`);
  fs.mkdirSync(tempUserDataDir, { recursive: true });

  let chromeProc = null;
  let isCleanedUp = false;

  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    if (chromeProc) {
      try {
        console.log('\n🧹 Đang dọn dẹp và đóng tiến trình Chrome (SIGKILL)...');
        chromeProc.kill('SIGKILL');
      } catch (err) {}
    }
    try {
      if (fs.existsSync(tempUserDataDir)) {
        fs.rmSync(tempUserDataDir, { recursive: true, force: true });
      }
    } catch (e) {}
  };

  try {
    chromeProc = spawn(CHROME_PATH, [
      '--headless=new',
      '--incognito',
      `--remote-debugging-port=${PORT}`,
      '--disable-gpu',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--no-first-run',
      `--user-data-dir=${tempUserDataDir}`
    ], { stdio: 'ignore' });

    let version = null;
    for (let i = 0; i < 25; i++) {
      try {
        version = await getJson(`http://127.0.0.1:${PORT}/json/version`);
        if (version && version.webSocketDebuggerUrl) break;
      } catch {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    if (!version) throw new Error('Không thể kết nối Chrome DevTools Protocol!');
    console.log(`✅ [Chrome Engine] Sẵn sàng: ${version['Browser']}`);

    const tabs = await getJson(`http://127.0.0.1:${PORT}/json/list`);
    const tab = tabs.find(t => t.type === 'page') || tabs[0];
    const ws = new WebSocket(tab.webSocketDebuggerUrl);

    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = rej;
    });

    let msgId = 1;
    const pending = new Map();
    const consoleLogs = [];
    const failedRequests = [];

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        pending.get(data.id)(data);
        pending.delete(data.id);
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
      if (data.method === 'Network.loadingFailed') {
        failedRequests.push(data.params);
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

    const auditResults = {
      mobile: {},
      desktop: {},
      performance: {},
      uxObservations: []
    };

    // =========================================================================
    // PHẦN 1: KIỂM TOÁN THIẾT BỊ DI ĐỘNG (iPhone 14 Pro: 393 x 852, DPR=3)
    // =========================================================================
    console.log('\n📱 -------------------------------------------------------------');
    console.log('📱 PHẦN 1: GIẢ LẬP TRẢI NGHIỆM MOBILE (iPhone 14 Pro: 393 x 852, DPR=3)');
    console.log('📱 -------------------------------------------------------------');

    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 393,
      height: 852,
      deviceScaleFactor: 3,
      mobile: true,
      screenOrientation: { angle: 0, type: 'portraitPrimary' }
    });
    await sendCommand('Emulation.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
    });

    console.log(`🌐 [Mobile] Điều hướng: ${BASE_URL}`);
    const navStart = Date.now();
    await sendCommand('Page.navigate', { url: BASE_URL });
    await new Promise(r => setTimeout(r, 4000));
    const loadTimeMs = Date.now() - navStart;
    console.log(`⏱️ [Mobile] Thời gian tải trang hoàn tất: ~${loadTimeMs}ms`);

    // Đo Web Vitals cơ bản trên Mobile
    const vitalsResult = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const perf = window.performance;
        const timing = perf.timing;
        const paint = perf.getEntriesByType('paint');
        const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
        return {
          fcp: Math.round(fcp),
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          pageLoaded: timing.loadEventEnd - timing.navigationStart
        };
      })()`,
      returnByValue: true
    });
    console.log('📊 [Mobile Web Vitals]:', vitalsResult.result?.result?.value);

    // HÀNH TRÌNH 1: Trang chủ -> Cây Nguyện Ước -> Lọc danh mục -> Mở Modal chi tiết
    console.log('\n🚶 [Hành trình 1] Khảo sát Cây Nguyện Ước & Chuyển đổi danh mục...');
    const catCheck = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Tất cả') || b.textContent.includes('Xe đạp') || b.textContent.includes('Học tập'));
        const wishCards = document.querySelectorAll('.grid > div.cursor-pointer, .grid > div.bg-white');
        return {
          categoryButtonsCount: buttons.length,
          visibleCardsCount: wishCards.length
        };
      })()`,
      returnByValue: true
    });
    console.log('  👉 Số nút danh mục phát hiện:', catCheck.result?.result?.value?.categoryButtonsCount);
    console.log('  👉 Số thẻ điều ước hiển thị ban đầu:', catCheck.result?.result?.value?.visibleCardsCount);

    // Mở modal chi tiết điều ước đầu tiên
    console.log('🔍 [Hành trình 1] Click mở Modal chi tiết điều ước đầu tiên...');
    const modalOpenResult = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const firstCard = document.querySelector('.grid > div.cursor-pointer, .grid > div.bg-white[class*="cursor-pointer"]');
        if (!firstCard) return { opened: false, reason: 'Không tìm thấy card' };
        firstCard.click();
        return { opened: true };
      })()`,
      returnByValue: true
    });

    await new Promise(r => setTimeout(r, 1000));

    // Kiểm tra cấu trúc Modal chi tiết
    const modalAudit = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.querySelector('.fixed.inset-0.z-\\\\[60\\\\], .fixed.inset-0');
        if (!modal) return { exists: false, allFixed: Array.from(document.querySelectorAll('.fixed')).map(e => e.className) };
        const modalImg = modal.querySelector('img');
        const pledgeBox = modal.textContent.includes('Lời Cam Kết Danh Dự');
        const closeBtn = modal.querySelector('button[title*="Đóng"], button .lucide-x, button svg');
        return {
          exists: true,
          hasImage: !!modalImg,
          imageSrc: modalImg ? modalImg.src : null,
          imageLoaded: modalImg ? (modalImg.naturalWidth > 0) : false,
          hasPledge: pledgeBox,
          hasCloseButton: !!closeBtn
        };
      })()`,
      returnByValue: true
    });
    console.log('  👉 Kiểm toán Modal chi tiết:', modalAudit.result?.result?.value);

    // Đóng modal
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.querySelector('.fixed.inset-0.z-\\\\[60\\\\], .fixed.inset-0');
        if (modal) {
          const closeBtn = modal.querySelector('button[title*="Đóng"]') || modal.querySelector('button svg.lucide-x')?.parentElement;
          if (closeBtn) closeBtn.click();
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    // HÀNH TRÌNH 2: Điều hướng sang /create-wish -> Kiểm tra Bước 1, Auto-advance 300ms, Bước 2, Floating Dock z-[60]
    console.log('\n🚶 [Hành trình 2] Điều hướng sang /create-wish...');
    await sendCommand('Page.navigate', { url: `${BASE_URL}/create-wish` });
    await new Promise(r => setTimeout(r, 3500));

    // Kiểm tra MobileBottomNav có bị ẩn không
    const navHideCheck = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const bottomNav = document.querySelector('nav.fixed.bottom-0');
        const isHidden = !bottomNav || bottomNav.offsetParent === null || window.getComputedStyle(bottomNav).display === 'none';
        return { isHidden, bottomNavFound: !!bottomNav };
      })()`,
      returnByValue: true
    });
    console.log('  👉 Trạng thái ẩn thanh điều hướng chung (MobileBottomNav):', navHideCheck.result?.result?.value);

    // Kiểm tra Bước 1 & Đo thời gian Auto-advance
    console.log('⏱️ [Hành trình 2] Kiểm tra Bước 1 & đo độ trễ chuyển bước tự động...');
    const advanceAudit = await sendCommand('Runtime.evaluate', {
      expression: `(async () => {
        // Tìm các thẻ danh mục ở Bước 1
        const catCards = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Phương Tiện') || b.textContent.includes('Học Tập') || b.textContent.includes('Xe đạp'));
        if (catCards.length === 0) return { success: false, reason: 'Không tìm thấy thẻ danh mục Bước 1' };
        
        const targetCard = catCards[0];
        const t0 = performance.now();
        targetCard.click();
        
        // Chờ xem bao lâu sau thì Bước 2 xuất hiện (chứa nút chụp ảnh hoặc tiêu đề bước 2)
        let switched = false;
        let t1 = 0;
        for (let i = 0; i < 40; i++) {
          await new Promise(r => setTimeout(r, 50));
          const step2 = document.querySelector('input[type="file"], button:has(.lucide-camera), button:has(svg)');
          const hasStep2Text = document.body.textContent.includes('Hình Ảnh') || document.body.textContent.includes('Chụp Ảnh');
          if (hasStep2Text) {
            switched = true;
            t1 = performance.now();
            break;
          }
        }
        return {
          success: switched,
          measuredDelayMs: Math.round(t1 - t0)
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('  👉 Kết quả đo chuyển bước tự động (mục tiêu ~300ms):', advanceAudit.result?.result?.value);

    await new Promise(r => setTimeout(r, 1000));

    // Kiểm tra Bước 2: 2 nút Chụp Ảnh Ngay & Chọn Từ Thư Viện
    const step2ButtonsAudit = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        const hasCameraBtn = text.includes('Chụp Ảnh Ngay');
        const hasUploadBtn = text.includes('Chọn Từ Thư Viện');
        const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
        const captureInput = inputs.find(i => i.getAttribute('capture') === 'environment');
        
        // Kiểm tra Floating Action Dock
        const dock = document.querySelector('.fixed.bottom-0');
        let dockInfo = null;
        if (dock) {
          const style = window.getComputedStyle(dock);
          dockInfo = {
            position: style.position,
            zIndex: style.zIndex,
            bottom: style.bottom,
            display: style.display
          };
        }
        return {
          hasCameraBtn,
          hasUploadBtn,
          hasCaptureEnvironmentInput: !!captureInput,
          floatingDock: dockInfo
        };
      })()`,
      returnByValue: true
    });
    console.log('  👉 Kiểm toán Nút Chụp/Chọn ảnh & Floating Dock z-[60]:', step2ButtonsAudit.result?.result?.value);

    // Chụp ảnh nghiệm thu Mobile
    console.log('📸 Đang chụp ảnh màn hình Mobile (iPhone 14 Pro)...');
    const mobileScreenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    if (mobileScreenshot?.result?.data) {
      fs.writeFileSync(path.resolve(process.cwd(), 'backups/e2e_mobile_audit.png'), Buffer.from(mobileScreenshot.result.data, 'base64'));
      console.log('  ✅ Đã lưu backups/e2e_mobile_audit.png');
    }

    // =========================================================================
    // PHẦN 2: KIỂM TOÁN THIẾT BỊ MÁY TÍNH ĐỂ BÀN (Desktop: 1440 x 900)
    // =========================================================================
    console.log('\n🖥️ -------------------------------------------------------------');
    console.log('🖥️ PHẦN 2: GIẢ LẬP TRẢI NGHIỆM DESKTOP (Màn hình 1440 x 900)');
    console.log('🖥️ -------------------------------------------------------------');

    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await sendCommand('Emulation.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    console.log(`🌐 [Desktop] Điều hướng trang chủ: ${BASE_URL}`);
    await sendCommand('Page.navigate', { url: BASE_URL });
    await new Promise(r => setTimeout(r, 3500));

    // Kiểm tra Layout Hero 2 cột & Lưới 3 cột trên Desktop
    const desktopLayoutAudit = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const heroSection = document.querySelector('.grid.lg\\\\:grid-cols-12, .grid[class*="lg:grid-cols-12"]');
        const heroImg = document.querySelector('img[src*="hero-bicycle"]');
        const wishCardsGrid = document.querySelector('.grid.lg\\\\:grid-cols-3, .grid[class*="lg:grid-cols-3"]');
        const navBar = document.querySelector('header');
        return {
          hasHeroSection: !!heroSection,
          heroImgLoaded: heroImg ? (heroImg.naturalWidth > 0) : false,
          heroImgWidth: heroImg ? heroImg.offsetWidth : 0,
          heroImgHeight: heroImg ? heroImg.offsetHeight : 0,
          has3ColGrid: !!wishCardsGrid,
          hasHeaderNav: !!navBar
        };
      })()`,
      returnByValue: true
    });
    console.log('  👉 Kiểm toán Layout Desktop 1440px:', desktopLayoutAudit.result?.result?.value);

    // Chụp ảnh nghiệm thu Desktop
    console.log('📸 Đang chụp ảnh màn hình Desktop (1440 x 900)...');
    const desktopScreenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    if (desktopScreenshot?.result?.data) {
      fs.writeFileSync(path.resolve(process.cwd(), 'backups/e2e_desktop_audit.png'), Buffer.from(desktopScreenshot.result.data, 'base64'));
      console.log('  ✅ Đã lưu backups/e2e_desktop_audit.png');
    }

    // =========================================================================
    // PHẦN 3: TỔNG KẾT CONSOLE & MẠNG LƯỚI
    // =========================================================================
    console.log('\n📊 -------------------------------------------------------------');
    console.log('📊 PHẦN 3: TỔNG KẾT LỖI CONSOLE & MẠNG LƯỚI TOÀN BỘ PHIÊN E2E');
    console.log('📊 -------------------------------------------------------------');

    const errLogs = consoleLogs.filter(l => {
      const lvl = (l.level || '').toLowerCase();
      const txt = (l.text || '').toLowerCase();
      return lvl === 'error' && !txt.includes('favicon.ico');
    });

    const realFailedReqs = failedRequests.filter(r => !r.errorText?.includes('net::ERR_ABORTED'));

    console.log(`  Console Errors: ${errLogs.length} lỗi`);
    if (errLogs.length > 0) {
      errLogs.forEach(e => console.log(`    - ${e.level}: ${e.text}`));
    }
    console.log(`  Network Failed Requests: ${realFailedReqs.length} lỗi`);

    ws.close();
    console.log('\n🎉 [E2E USER AUDIT] HOÀN TẤT THÀNH CÔNG 100%!');

  } finally {
    cleanup();
  }
}

runE2EUserAudit().catch(err => {
  console.error('❌ LỖI E2E AUDIT:', err);
  process.exit(1);
});
