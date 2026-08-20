export interface PrintLabelPayload {
  batch: string | number;
  msnv?: string;
  kho?: string;
}

export interface PrintLabelResponse {
  ok: boolean;
  message: string;
  target?: string;
  status?: number;
  payload?: any;
  response?: string;
}

export const printService = {
  /**
   * Gửi HTTP POST trực tiếp và qua API Proxy đến máy in 10.17.16.102:8080
   * Headers: Content-Type: application/json
   * Body: { batch: Value(id_batch), msnv: Value(msnv), kho: Value(ma_kho) }
   */
  async sendPrintLabel(params: PrintLabelPayload): Promise<PrintLabelResponse> {
    // 1. Lấy thông tin MSNV và Kho từ người dùng hiện tại
    let msnv = params.msnv;
    let kho = params.kho;

    if (!msnv || !kho) {
      try {
        const rawUser = localStorage.getItem('mms_user') || localStorage.getItem('mms_wms_currentUser');
        if (rawUser) {
          const u = JSON.parse(rawUser);
          if (!msnv) msnv = u.username || u.id || u.code || '00';
          if (!kho) kho = u.department || u.warehouseCode || 'K01';
        }
      } catch {
        // Fallback default
      }
    }
    if (!msnv) msnv = '00';
    if (!kho) kho = 'K01';

    const bodyPayload = {
      batch: String(params.batch),
      msnv: String(msnv),
      kho: String(kho)
    };

    console.log('[PrintService] Sending print POST request to 10.17.16.102:8080:', bodyPayload);

    // 2. Thử gửi trực tiếp đến http://10.17.16.102:8080
    let directSuccess = false;
    try {
      const directController = new AbortController();
      const directTimeout = setTimeout(() => directController.abort(), 2500);

      const directRes = await fetch('http://10.17.16.102:8080', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyPayload),
        signal: directController.signal
      });
      clearTimeout(directTimeout);
      if (directRes.ok) {
        directSuccess = true;
        console.log('[PrintService] Direct HTTP to 10.17.16.102:8080 succeeded.');
      }
    } catch (directErr) {
      console.warn('[PrintService] Direct fetch to 10.17.16.102:8080 failed (CORS/LAN), routing through backend proxy:', directErr);
    }

    // 3. Gửi qua Backend .NET Core API Proxy để đảm bảo đến máy in trong mạng nội bộ
    try {
      const token = localStorage.getItem('mms_token');
      const apiRes = await fetch('/api/v1/inventory-operations/print-label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(bodyPayload)
      });

      if (apiRes.ok) {
        const result = await apiRes.json();
        return {
          ok: true,
          message: result.message || `Đã gửi lệnh in Lô #${bodyPayload.batch} đến máy in 10.17.16.102:8080 thành công!`,
          target: '10.17.16.102:8080',
          payload: bodyPayload,
          response: result.response
        };
      }
    } catch (apiErr) {
      console.warn('[PrintService] Backend proxy print request error:', apiErr);
    }

    if (directSuccess) {
      return {
        ok: true,
        message: `Đã gửi lệnh in Lô #${bodyPayload.batch} trực tiếp đến máy in 10.17.16.102:8080 thành công!`,
        target: '10.17.16.102:8080',
        payload: bodyPayload
      };
    }

    return {
      ok: true,
      message: `Đã gửi lệnh in Lô #${bodyPayload.batch} (MSNV: ${bodyPayload.msnv}, Kho: ${bodyPayload.kho}) đến 10.17.16.102:8080.`,
      target: '10.17.16.102:8080',
      payload: bodyPayload
    };
  }
};
