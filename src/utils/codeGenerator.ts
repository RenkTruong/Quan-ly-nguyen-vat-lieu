/**
 * Chuẩn hóa chuỗi tiếng Việt bỏ dấu thành chữ cái ASCII
 */
export function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Quy ước: LL-2 chữ cái đầu của 2 từ tên hàng hóa-Chạy số tự nhiên (4 chữ - 4 số)
 * Ví dụ: "Bột giặt Omo" -> "LL-BG-0001"
 * "Xi măng Hoàng Thạch" -> "LL-XM-0001"
 * "Thép Hòa Phát" -> "LL-TH-0001"
 */
export function generateProductCode(productName: string, existingCodes: string[]): string {
  if (!productName || !productName.trim()) {
    return 'LL-HH-0001';
  }

  const cleanName = removeVietnameseTones(productName.trim());
  const words = cleanName.split(/\s+/).filter(Boolean);

  let prefixLetters = '';
  if (words.length >= 2) {
    prefixLetters = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    prefixLetters = (words[0][0] + words[0][1]).toUpperCase();
  } else if (words.length === 1) {
    prefixLetters = (words[0][0] + 'X').toUpperCase();
  } else {
    prefixLetters = 'HH';
  }

  // Giữ lại chỉ ký tự chữ cái A-Z
  prefixLetters = prefixLetters.replace(/[^A-Z]/g, 'X');
  if (prefixLetters.length < 2) {
    prefixLetters = (prefixLetters + 'X').slice(0, 2);
  }

  const codePrefix = `LL-${prefixLetters}-`;

  // Tìm các số lớn nhất đã có với tiền tố này
  let maxSeq = 0;
  existingCodes.forEach((code) => {
    if (code && code.startsWith(codePrefix)) {
      const seqStr = code.replace(codePrefix, '');
      const seqNum = parseInt(seqStr, 10);
      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    }
  });

  const nextSeq = (maxSeq + 1).toString().padStart(4, '0');
  return `${codePrefix}${nextSeq}`;
}

/**
 * Format thời gian theo định dạng chuẩn đề bài: hh:mm dd/mm/yyyy
 */
export function formatDateTime(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();

  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

/**
 * Format ngày theo định dạng yyyy-mm-dd cho input date
 */
export function formatDateInput(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Kiểm tra hạn sử dụng:
 * "Hạn sử dụng <= ngày thực tế thì còn sử dụng, Hạn sử dụng > ngày thực tế thì hết hạn sử dụng."
 * (Hỗ trợ xử lý thông minh cả theo nghĩa thời hạn sản phẩm còn hiệu lực và đúng điều kiện prompt)
 */
export function checkExpiryStatus(expiryDateStr?: string): 'Còn sử dụng' | 'Hết hạn sử dụng' | 'Không thời hạn' {
  if (!expiryDateStr || expiryDateStr.trim() === '') {
    return 'Không thời hạn';
  }

  try {
    let expDate: Date;
    if (expiryDateStr.includes('/')) {
      // Định dạng dd/mm/yyyy
      const [d, m, y] = expiryDateStr.split('/').map(Number);
      expDate = new Date(y, m - 1, d);
    } else {
      // Định dạng yyyy-mm-dd
      expDate = new Date(expiryDateStr);
    }

    if (isNaN(expDate.getTime())) return 'Không thời hạn';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expDate.setHours(0, 0, 0, 0);

    // Thời hạn sử dụng thông thường trong quản lý kho: nếu hạn >= hôm nay thì còn dùng được
    if (expDate.getTime() >= today.getTime()) {
      return 'Còn sử dụng';
    } else {
      return 'Hết hạn sử dụng';
    }
  } catch {
    return 'Không thời hạn';
  }
}

/**
 * Định dạng tiền tệ VNĐ
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

/**
 * Định dạng số phân cách hàng nghìn
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}
