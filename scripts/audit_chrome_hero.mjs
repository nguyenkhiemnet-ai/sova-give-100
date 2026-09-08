import { spawn } from 'child_process';
import http from 'http';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;

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

async function runChromeAudit(targetUrl) {
  console.log(`\n================================================================`);
  console.log(`🌐 KIỂM TOÁN CHROME HEADLESS: ${targetUrl}`);
  console.log(`================================================================`);

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--user-data-dir=/tmp/chrome_audit_hero_' + Date.now()
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
      throw new Error('Chrome remote debugging port not available');
    }

    console.log(`[Chrome] Phiên bản: ${version['Browser']}`);

    const tabs = await getJson(`http://127.0.0.1:${PORT}/json/list`);
    let tab = tabs.find(t => t.type === 'page');
    if (!tab) {
      tab = tabs[0];
    }
    const wsUrl = tab.webSocketDebuggerUrl;

    const ws = new WebSocket(wsUrl);

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const pending = new Map();
    const networkResponses = [];
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

    await sendCommand('Page.navigate', { url: targetUrl });

    // Wait for page to finish rendering
    await new Promise(r => setTimeout(r, 3500));

    // Evaluate hero image element
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
    console.log('\n📸 KẾT QUẢ THỰC NGHIỆM THẺ <img> HERO BICYCLE:');
    console.log(JSON.stringify(info, null, 2));

    let heroPassed = false;
    if (info && info.found) {
      if (info.naturalWidth > 0 && info.naturalHeight > 0) {
        console.log(`✅ [PASS] Ảnh xe đạp hiển thị hoàn hảo! Kích thước gốc: ${info.naturalWidth}x${info.naturalHeight}px, Kích thước render: ${info.displayedWidth}x${info.displayedHeight}px`);
        heroPassed = true;
      } else {
        console.error(`❌ [FAIL] Ảnh xe đạp chưa load được (naturalWidth: ${info.naturalWidth})!`);
      }
    } else {
      console.error('❌ [FAIL] Không tìm thấy thẻ img xe đạp trong DOM!');
    }

    const heroReq = networkResponses.find(r => r.response?.url?.includes('hero-bicycle'));
    if (heroReq) {
      console.log(`✅ [PASS] Network request /hero-bicycle.webp: Status ${heroReq.response.status}, MIME: ${heroReq.response.mimeType}`);
    }

    ws.close();
    return heroPassed;
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

async function main() {
  const localPassed = await runChromeAudit('http://localhost:3000/');
  console.log(`\nLocal Dev Audit Result: ${localPassed ? 'PASSED ✅' : 'FAILED ❌'}`);

  if (!localPassed) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Lỗi kiểm toán Chrome:', err);
  process.exit(1);
});
