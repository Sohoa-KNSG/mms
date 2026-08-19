import React, { useState } from 'react';
import { Printer, X, QrCode, Barcode, CheckCircle, Loader2, Check } from 'lucide-react';
import { useWarehouse } from '../services/warehouseStore';
import { printService } from '../services/printService';

export const BarcodeLabelModal: React.FC = () => {
  const { activeBarcodePrint, setActiveBarcodePrint, currentUser } = useWarehouse();
  const [isSendingPrint, setIsSendingPrint] = useState(false);
  const [printStatusMsg, setPrintStatusMsg] = useState<string | null>(null);

  if (!activeBarcodePrint) return null;

  const rawBatch = activeBarcodePrint.batchNumber || (activeBarcodePrint as any).batchId || (activeBarcodePrint as any).poNumber || '';
  const cleanBatchId = String(rawBatch).replace(/\D/g, '') || String(rawBatch);

  const handlePrint = async () => {
    setIsSendingPrint(true);
    setPrintStatusMsg('Đang gửi HTTP POST đến 10.17.16.102...');
    try {
      const res = await printService.sendPrintLabel({
        batch: cleanBatchId,
        msnv: currentUser?.username || currentUser?.id || '00',
        kho: currentUser?.department || 'K01'
      });
      setPrintStatusMsg(res.message);
    } catch (err: any) {
      setPrintStatusMsg('Lỗi gửi lệnh in: ' + (err.message || err));
    } finally {
      setIsSendingPrint(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print-bg">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-semibold text-base">In Tem Nhãn Mã Vạch (10.17.16.102)</h3>
              <p className="text-[11px] text-slate-400">Gửi lệnh HTTP POST trực tiếp đến máy in nội bộ</p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveBarcodePrint(null);
              setPrintStatusMsg(null);
            }}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Label Area */}
        <div className="p-6 bg-slate-50 flex flex-col items-center justify-center space-y-3">
          <div
            id="printable-label"
            className="bg-white border-2 border-slate-800 rounded-lg p-5 w-[380px] shadow-sm text-slate-900 print:shadow-none print:border-black"
          >
            {/* Factory Header */}
            <div className="border-b border-slate-300 pb-2 mb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-700 block">
                  MMS MANUFACTURING FACTORY
                </span>
                <span className="text-xs font-bold text-slate-800">TEM NHÃN VẬT TƯ & LÔ HÀNG</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[10px] font-bold">
                QC PASSED
              </span>
            </div>

            {/* Main Info */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                <span className="text-slate-500 font-medium">Mã vật tư (SKU):</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {activeBarcodePrint.materialCode}
                </span>
              </div>
              <div className="border-b border-dashed border-slate-200 pb-1.5">
                <span className="text-slate-500 font-medium block">Tên vật tư:</span>
                <span className="font-semibold text-slate-900 line-clamp-2">
                  {activeBarcodePrint.materialName}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-dashed border-slate-200 pb-1.5">
                <div>
                  <span className="text-slate-500 font-medium block">Số lượng:</span>
                  <span className="font-bold text-blue-700 text-sm">
                    {activeBarcodePrint.quantity} {activeBarcodePrint.unit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Vị trí Kệ/Tầng:</span>
                  <span className="font-mono font-bold text-slate-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block">
                    {activeBarcodePrint.locationCode || 'Chưa gán'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-dashed border-slate-200 pb-1.5 text-[11px]">
                <div>
                  <span className="text-slate-500">Mã Lô Batch:</span>{' '}
                  <span className="font-mono font-bold text-blue-700">#{cleanBatchId}</span>
                </div>
                <div>
                  <span className="text-slate-500">Người in / Kho:</span>{' '}
                  <span className="font-mono font-semibold">{currentUser?.username || '00'} / {currentUser?.department || 'K01'}</span>
                </div>
              </div>
            </div>

            {/* Barcode & QR code graphics */}
            <div className="mt-4 pt-3 border-t-2 border-slate-800 flex items-center justify-between gap-3">
              {/* Pseudo Barcode Lines */}
              <div className="flex-1">
                <div className="h-10 flex items-stretch gap-[2px] bg-slate-900 p-1 rounded-xs">
                  {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 4, 2].map((w, i) => (
                    <div
                      key={i}
                      className={i % 2 === 0 ? 'bg-white' : 'bg-transparent'}
                      style={{ width: `${w * 1.5}px` }}
                    />
                  ))}
                </div>
                <div className="text-center font-mono font-bold text-[11px] mt-1 tracking-wider text-slate-800">
                  *BATCH-{cleanBatchId}*
                </div>
              </div>

              {/* QR Code mock box */}
              <div className="w-16 h-16 border border-slate-800 rounded p-1 bg-white flex flex-col items-center justify-center shadow-2xs">
                <QrCode className="w-12 h-12 text-slate-900" />
                <span className="text-[7px] font-mono font-bold">SCAN ME</span>
              </div>
            </div>
          </div>

          {/* Trạng thái gửi máy in */}
          {printStatusMsg && (
            <div className="w-[380px] p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{printStatusMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between no-print">
          <span className="text-xs text-slate-500 flex items-center gap-1.5 font-mono">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> Máy in: 10.17.16.102
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveBarcodePrint(null);
                setPrintStatusMsg(null);
              }}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={handlePrint}
              disabled={isSendingPrint}
              className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm hover:shadow flex items-center gap-2 transition-all cursor-pointer uppercase tracking-wider"
            >
              {isSendingPrint ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>In Tem Ngay (10.17.16.102)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
