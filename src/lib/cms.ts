export interface HeroCMSData {
  badge: string;
  titlePrimary: string;
  titleHighlight: string;
  description: string;
  bannerImage: string;
  imageQuote: string;
  statKarma: string;
  statCO2: string;
  statRecycle: string;
}

export interface FooterCMSData {
  badge: string;
  headline: string;
  description: string;
  copyright: string;
  legalNote: string;
}

export interface SubpagesCMSData {
  createWishNotice: string;
  handshakeRules: string;
}

export interface FullSiteCMS {
  hero: HeroCMSData;
  footer: FooterCMSData;
  subpages: SubpagesCMSData;
}

export const DEFAULT_FULL_CMS: FullSiteCMS = {
  hero: {
    badge: "Kinh Tế Tuần Hoàn 0-VND • Trao Cơ Hội, Giữ Danh Dự",
    titlePrimary: "Đừng để đồ tốt ngủ quên trong góc tối.",
    titleHighlight: "Hãy biến chúng thành tương lai của ai đó.",
    description: "Bao nhiêu chiếc laptop cũ, xe đạp, máy may vẫn còn chạy rất tốt nhưng đang nằm phủ bụi trong kho? Tại SOVA GIVE 100, vật phẩm của bạn tìm thấy cuộc đời thứ hai qua Hộ Chiếu Số và cái Bắt Tay Tử Tế 0 Đồng.",
    bannerImage: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80",
    imageQuote: "Mỗi chiếc xe đạp trao đi là con đường đến trường của các em bớt gập ghềnh.",
    statKarma: "100,000+ ⭐",
    statCO2: "1,450.5 kg",
    statRecycle: "100% 0-VND"
  },
  footer: {
    badge: "Lan Tỏa Tinh Thần 0-VND Đến Cộng Đồng",
    headline: "Một Lần Chia Sẻ • Một Tương Lai Được Thắp Sáng",
    description: "Hãy gửi đường link SOVA GIVE 100 tới bạn bè hoặc các hội đồng hương để những chiếc xe đạp, máy tính cũ tìm đúng người cần nhất.",
    copyright: "© 2026 SOVA GIVE 100 • Hệ Thống Tuần Hoàn Sinh Kế Phi Thương Mại",
    legalNote: "Bảo mật danh dự công dân theo Nghị định 13/2023/NĐ-CP"
  },
  subpages: {
    createWishNotice: "Hồ sơ của bạn được bảo vệ danh dự theo Nghị định 13/2023/NĐ-CP. Tuyệt đối không giao dịch tiền mặt.",
    handshakeRules: "Quy tắc trạm an toàn: Giao dịch 100% bằng hiện vật 0 đồng tại Safe Hub. Nghiêm cấm nhận tiền bồi dưỡng."
  }
};

export function getFullSiteCMS(): FullSiteCMS {
  if (typeof window === 'undefined') return DEFAULT_FULL_CMS;
  try {
    const stored = localStorage.getItem('SOVA_FULL_SITE_CMS');
    if (stored) return { ...DEFAULT_FULL_CMS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_FULL_CMS;
}

export function saveFullSiteCMS(data: FullSiteCMS): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('SOVA_FULL_SITE_CMS', JSON.stringify(data));
  localStorage.setItem('SOVA_LIVE_CMS_HERO', JSON.stringify(data.hero));
  
  // Phát tín hiệu đồng bộ đa Tab
  try {
    const channel = new BroadcastChannel('sova_cms_channel');
    channel.postMessage({ type: 'CMS_UPDATED', data });
  } catch {}
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('sova_cms_updated'));
}

// Giữ tương thích ngược với các trang cũ nếu còn gọi getHeroCMS / saveHeroCMS
export function getHeroCMS(): HeroCMSData {
  return getFullSiteCMS().hero;
}

export function saveHeroCMS(data: HeroCMSData): void {
  const current = getFullSiteCMS();
  saveFullSiteCMS({ ...current, hero: data });
}

// Bộ nén Canvas Client-side chuẩn tốc độ cao
export async function compressImageToWebP(file: File): Promise<{ dataUrl: string; originalSize: string; compressedSize: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;

        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: e.target?.result as string,
            originalSize: (file.size / (1024 * 1024)).toFixed(2) + " MB",
            compressedSize: (file.size / 1024).toFixed(1) + " KB"
          });
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);

        const stringLength = compressed.length - 'data:image/jpeg;base64,'.length;
        const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383687;
        const compKb = (sizeInBytes / 1024).toFixed(1) + " KB";
        const origMb = (file.size / (1024 * 1024)).toFixed(2) + " MB";

        resolve({ dataUrl: compressed, originalSize: origMb, compressedSize: compKb });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
