import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Barcode,
  RefreshCw,
  CornerDownLeft,
  ScanLine
} from 'lucide-react';
import { soundManager } from '../utils/audioFeedback';

interface HandheldScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
  expectedType?: 'ANY' | 'BATCH' | 'LOCATION' | 'PO' | 'MATERIAL';
  sampleCodes?: { code: string; label: string }[];
}

export const HandheldScannerModal: React.FC<HandheldScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Quét Mã Vạch / Barcode Scanner',
  sampleCodes = []
}) => {
  const [scannedInput, setScannedInput] = useState('');
  const [soundOn, setSoundOn] = useState(soundManager.isSoundEnabled());
  const [isLaserTriggered, setIsLaserTriggered] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 1. Luôn tự động Focus vào ô Input khi mở modal
  useEffect(() => {
    if (isOpen) {
      setScannedInput('');
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 2. Duy trì con trỏ luôn luôn Focus khi modal đang mở (Kể cả khi chạm ra ngoài)
  const ensureFocus = () => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  };

  // 3. Xử lý quét Laser tốc độ cao (Global Keystroke / Scanner Hook)
  useEffect(() => {
    if (!isOpen) return;

    let scanBuffer = '';
    let lastKeyTimestamp = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Đảm bảo input luôn được focus
      if (document.activeElement !== inputRef.current) {
        inputRef.current?.focus();
      }

      const now = Date.now();
      const timeDiff = now - lastKeyTimestamp;
      lastKeyTimestamp = now;

      // Nếu khoảng cách giữa 2 phím quá 150ms thì reset buffer (nhập bằng tay bình thường)
      if (timeDiff > 150) {
        scanBuffer = '';
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const codeToProcess = inputRef.current?.value || scanBuffer || scannedInput;
        if (codeToProcess && codeToProcess.trim().length > 0) {
          handleConfirmScan(codeToProcess.trim());
          scanBuffer = '';
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        scanBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isOpen, scannedInput]);

  const handleConfirmScan = (code: string) => {
    if (!code || !code.trim()) return;
    const cleanCode = code.trim();
    
    // Hiệu ứng nháy Laser xanh khi nhận diện thành công
    setIsLaserTriggered(true);
    soundManager.playSuccessBeep();
    
    setTimeout(() => {
      setIsLaserTriggered(false);
      onScan(cleanCode);
      setScannedInput('');
      onClose();
    }, 120);
  };

  const toggleSound = () => {
    const s = soundManager.toggleSound();
    setSoundOn(s);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={ensureFocus}
    >
      <div 
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-800 transition-all duration-150 ${
          isLaserTriggered ? 'ring-4 ring-[#007D3C] border-[#007D3C] scale-[1.01]' : 'border-slate-300'
        }`}
      >
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
              isLaserTriggered 
                ? 'bg-emerald-500 text-white border-emerald-600' 
                : 'bg-emerald-50 text-[#007D3C] border-emerald-200'
            }`}>
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                {title}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-[#007D3C]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#007D3C] animate-ping" />
                  SCANNER READY
                </span>
              </h3>
              <p className="text-xs text-slate-500">Đã kích hoạt chế độ nhận diện Súng quét Laser PDA</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSound}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                soundOn
                  ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
              title={soundOn ? 'Âm thanh: BẬT' : 'Âm thanh: TẮT'}
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-[#007D3C]" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dedicated Laser Target Visual Area (Không dùng Camera) */}
        <div 
          onClick={ensureFocus}
          className="relative bg-slate-950 px-6 py-8 flex flex-col items-center justify-center text-center cursor-pointer select-none overflow-hidden"
        >
          {/* Laser Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#007D3C_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

          {/* Animated Scanner Beam */}
          <div className="relative w-full max-w-sm h-28 border-2 border-dashed border-emerald-500/50 rounded-2xl flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#00ff88] to-transparent shadow-[0_0_12px_#00ff88] animate-pulse" />
            
            <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-[#00ff88] mb-2 shadow-inner">
              <ScanLine className="w-6 h-6 animate-pulse" />
            </div>

            <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider uppercase">
              BẤM CÒ SÚNG QUÉT LASER ĐỂ BẮN MÃ
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Con trỏ đang được giữ tự động trong ô nhận diện
            </span>
          </div>
        </div>

        {/* Primary Laser Scanner Input Field */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleConfirmScan(scannedInput);
            }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <label 
                htmlFor="pda-laser-input"
                className="text-xs font-extrabold uppercase text-slate-700 tracking-wider flex items-center gap-1.5"
              >
                <Barcode className="w-4 h-4 text-[#007D3C]" />
                Ô Nhận Dữ Liệu Máy Quét:
              </label>
              <span className="text-[11px] text-[#007D3C] font-semibold">
                ● Đang Focus (Sẵn sàng)
              </span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="pda-laser-input"
                  ref={inputRef}
                  type="text"
                  autoFocus
                  value={scannedInput}
                  onChange={(e) => setScannedInput(e.target.value)}
                  onBlur={() => {
                    // Tự động focus lại ngay lập tức nếu người dùng vô tình click ra ngoài
                    setTimeout(() => {
                      if (isOpen) inputRef.current?.focus();
                    }, 50);
                  }}
                  placeholder="Bấm súng quét hoặc gõ mã tại đây..."
                  className="w-full bg-white border-2 border-emerald-600/60 focus:border-[#007D3C] text-slate-900 px-3.5 py-3 rounded-xl text-base font-mono font-extrabold shadow-inner focus:outline-hidden focus:ring-4 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400 placeholder:font-normal placeholder:text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={!scannedInput.trim()}
                className="px-5 py-3 bg-[#007D3C] hover:bg-[#009647] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5 shrink-0"
              >
                <CornerDownLeft className="w-4 h-4" />
                <span>Xác Nhận</span>
              </button>
            </div>
          </form>

          {/* Quick-Click Sample Chips */}
          {sampleCodes.length > 0 && (
            <div className="pt-2 border-t border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Chọn Nhanh Trên Màn Hình:
                </span>
                <span className="text-[10px] text-slate-400">Chạm để chọn mã</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                {sampleCodes.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleConfirmScan(item.code)}
                    className="px-3 py-1.5 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl text-left transition-all cursor-pointer shadow-2xs group"
                  >
                    <div className="font-mono text-xs font-extrabold text-slate-900 group-hover:text-[#007D3C]">
                      {item.code}
                    </div>
                    {item.label && (
                      <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                        {item.label}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#007D3C]" />
            <span>Tương thích súng quét Zebra, Honeywell, Datalogic, Newland</span>
          </div>
          <button
            type="button"
            onClick={() => soundManager.playSuccessBeep()}
            className="text-slate-700 hover:text-[#007D3C] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Test Beep
          </button>
        </div>

      </div>
    </div>
  );
};
