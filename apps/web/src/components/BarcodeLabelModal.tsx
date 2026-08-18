import React from 'react';
import { Printer, X, QrCode, Barcode, CheckCircle, Package } from 'lucide-react';
import { useWarehouse } from '../services/warehouseStore';

export const BarcodeLabelModal: React.FC = () => {
  const { activeBarcodePrint, setActiveBarcodePrint } = useWarehouse();

  if (!activeBarcodePrint) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print-bg">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-lg">In Tem Nhãn Mã Vạch & QR Code</h3>
          </div>
          <button
            onClick={() => setActiveBarcodePrint(null)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Label Area */}
        <div className="p-6 bg-slate-50 flex justify-center">
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
                  <span className="text-slate-500">Mã PO:</span>{' '}
                  <span className="font-mono font-semibold">{activeBarcodePrint.poNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Hạn dùng (EXP):</span>{' '}
                  <span className="font-mono font-bold text-rose-700">{activeBarcodePrint.expiryDate || 'N/A'}</span>
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
                  *{activeBarcodePrint.batchNumber}*
                </div>
              </div>

              {/* QR Code mock box */}
              <div className="w-16 h-16 border border-slate-800 rounded p-1 bg-white flex flex-col items-center justify-center shadow-2xs">
                <QrCode className="w-12 h-12 text-slate-900" />
                <span className="text-[7px] font-mono font-bold">SCAN ME</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between no-print">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> Kích thước chuẩn 80x50mm
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveBarcodePrint(null)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" /> In Tem Ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
