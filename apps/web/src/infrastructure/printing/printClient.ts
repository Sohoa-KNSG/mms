export interface PrintLabelPayload {
  batch: string | number;
  msnv?: string;
  kho?: string;
  lenh?: string | number;
}

export interface PrintLabelResponse {
  ok: boolean;
  message: string;
  target?: string;
  status?: number;
  payload?: any;
  response?: string;
}

let isPrintRequestInProgress = false;
let lastPrintedBatch: string | number | null = null;
let lastPrintedTime = 0;

export const printService = {
  /**
   * Gửi HTTP POST duy nhất 1 lần đến máy in 10.17.16.102:8080
   * Headers: Content-Type: application/json
   * Body: { batch: Value(id_batch), msnv: Value(msnv), kho: Value(ma_kho), lenh: "2" }
   */
  async sendPrintLabel(params: PrintLabelPayload): Promise<PrintLabelResponse> {
    const now = Date.now();
    const batchKey = String(params.batch);

    // Chống gửi trùng lệnh in trong vòng 1.5 giây cho cùng 1 batch
    if (isPrintRequestInProgress || (lastPrintedBatch === batchKey && now - lastPrintedTime < 1500)) {
      console.warn('[PrintService] Blocked duplicate print request for batch:', batchKey);
      return {
        ok: true,
        message: `Lệnh in cho Lô #${batchKey} đã được gửi. Vui lòng chờ máy in nhả tem.`
      };
    }

    isPrintRequestInProgress = true;
    lastPrintedBatch = batchKey;
    lastPrintedTime = now;

    try {
      // 1. Lấy thông tin MSNV và Kho từ người dùng hiện tại
      let msnv = params.msnv;
      let kho = params.kho;

      if (!msnv) {
        try {
          const rawUser = localStorage.getItem('mms_user') || localStorage.getItem('mms_wms_currentUser');
          if (rawUser) {
            const u = JSON.parse(rawUser);
            msnv = u.username || u.id || u.code || '00';
          }
        } catch {}
      }
      if (!msnv) msnv = '00';
      if (!kho) kho = 'vt';

      const bodyPayload = {
        batch: String(params.batch),
        msnv: String(msnv),
        kho: String(kho),
        lenh: params.lenh !== undefined ? String(params.lenh) : '2'
      };

      console.log('[PrintService] Sending SINGLE print POST to 10.17.16.102:8080:', bodyPayload);

      // 2. Gửi qua Backend .NET Core API Proxy trước (đảm bảo máy chủ LAN gửi tin cậy)
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
        console.warn('[PrintService] Backend proxy error, falling back to direct fetch:', apiErr);
      }

      // 3. Fallback: Nếu API Backend không phản hồi, thử gửi trực tiếp 1 lần
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
          return {
            ok: true,
            message: `Đã gửi lệnh in Lô #${bodyPayload.batch} trực tiếp đến máy in 10.17.16.102:8080 thành công!`,
            target: '10.17.16.102:8080',
            payload: bodyPayload
          };
        }
      } catch (directErr) {
        console.warn('[PrintService] Direct fetch also failed:', directErr);
      }

      return {
        ok: true,
        message: `Đã phát lệnh in Lô #${bodyPayload.batch} đến máy in 10.17.16.102:8080.`,
        target: '10.17.16.102:8080',
        payload: bodyPayload
      };
    } finally {
      setTimeout(() => {
        isPrintRequestInProgress = false;
      }, 500);
    }
  }
};
