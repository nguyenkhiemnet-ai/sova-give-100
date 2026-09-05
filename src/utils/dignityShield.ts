/**
 * SOVA GIVE 100: DIGNITY SHIELD SYSTEM
 * Enforces Zero-Cash compliance, anti-spam, and dignity-first narrative validation
 */

export interface WishValidationResult {
  isValid: boolean;
  errors: string[];
  dignityScore: number;
}

const CASH_FORBIDDEN_KEYWORDS = [
  'tiền mặt', 'chuyển khoản', 'tiền nong', 'vay', 'mượn tiền',
  'lãi suất', 'thẻ cào', 'atm', 'vnd', 'vnđ', 'usd', 'tài trợ tiền', 'bắn tiền'
];

export function validateWishDignity(data: {
  title: string;
  reason: string;
  pledge: string;
}): WishValidationResult {
  const errors: string[] = [];
  let dignityScore = 100;

  const fullText = `${data.title} ${data.reason} ${data.pledge}`.toLowerCase();

  // 1. Zero-Cash Policy Check
  for (const keyword of CASH_FORBIDDEN_KEYWORDS) {
    if (fullText.includes(keyword)) {
      errors.push(`Phát hiện từ khóa vi phạm nguyên tắc Không Nhận Tiền Mặt: "${keyword}". Nền tảng chỉ trao tặng hiện vật trực tiếp.`);
      dignityScore -= 40;
    }
  }

  // 2. Meaningful Length Check (Dignity-first narrative)
  if (data.reason.trim().length < 20) {
    errors.push('Câu chuyện hoàn cảnh cần ít nhất 20 ký tự để cộng đồng thấu hiểu.');
    dignityScore -= 20;
  }

  // 3. Commitment Pledge Check
  if (data.pledge.trim().length < 15) {
    errors.push('Cam kết hoàn nguyên và trách nhiệm cần cụ thể hơn (tối thiểu 15 ký tự).');
    dignityScore -= 20;
  }

  return {
    isValid: errors.length === 0,
    errors,
    dignityScore: Math.max(0, dignityScore)
  };
}
