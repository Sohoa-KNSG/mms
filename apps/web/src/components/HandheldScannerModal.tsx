import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  X,
  Zap,
  Volume2,
  VolumeX,
  Keyboard,
  Barcode,
  AlertCircle,
  RefreshCw
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
  title = 'Quét Mã Vạch / Barcode QR',
  sampleCodes = []
}) => {
  const [manualCode, setManualCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(soundManager.isSoundEnabled());
  const [torchOn, setTorchOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    } else {
      stopCamera();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === inputRef.current) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleConfirm(manualCode);
        }
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 100) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.trim().length >= 2) {
          e.preventDefault();
          handleConfirm(buffer.trim());
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, manualCode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ Camera API.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setCameraError(err?.message || 'Không thể mở Camera. Vui lòng cho phép quyền truy cập.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setTorchOn(false);
  };

  const handleConfirm = (code: string) => {
    if (!code.trim()) return;
    soundManager.playSuccessBeep();
    onScan(code.trim());
    setManualCode('');
    onClose();
  };

  const toggleSound = () => {
    const s = soundManager.toggleSound();
    setSoundOn(s);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    try {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : {};
      if (capabilities.torch) {
        await (track as any).applyConstraints({
          advanced: [{ torch: !torchOn }]
        });
        setTorchOn(!torchOn);
      } else {
        setTorchOn(!torchOn);
      }
    } catch (e) {
      setTorchOn(!torchOn);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-300 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] text-slate-800">
        
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">Hỗ trợ Máy quét Laser PDA & Camera</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                soundOn
                  ? 'bg-white border-slate-300 text-slate-800'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
              title={soundOn ? 'Âm thanh máy quét: BẬT' : 'Âm thanh: TẮT'}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder / Laser Target Area */}
        <div className="relative bg-slate-950 flex-1 min-h-[200px] max-h-[260px] flex items-center justify-center overflow-hidden">
          {isCameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-6 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 mb-2.5">
                <Barcode className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-white">Sẵn sàng nhận tín hiệu Laser Barcode</p>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Bấm cò súng quét trên PDA hoặc bật Camera để quét mã vạch trên kiện hàng / kệ.
              </p>
              <button
                onClick={startCamera}
                className="mt-3 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-600"
              >
                <Camera className="w-4 h-4" />
                Mở Camera Quét Trực Tiếp
              </button>
            </div>
          )}

          {/* Animated Target Beam */}
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-36 border-2 border-dashed border-slate-400/60 rounded-xl pointer-events-none flex items-center justify-center">
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_8px_#f43f5e] animate-bounce" />
            <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-200 bg-black/60 px-1.5 py-0.5 rounded">
              PDA SCANNER READY
            </div>
          </div>

          {/* Camera controls overlay */}
          {isCameraActive && (
            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-2 z-10">
              <button
                onClick={toggleTorch}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border backdrop-blur-md cursor-pointer ${
                  torchOn ? 'bg-white text-slate-900 border-white' : 'bg-black/60 text-white border-white/20'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                {torchOn ? 'Đèn Flash: BẬT' : 'Bật Flash'}
              </button>
              <button
                onClick={stopCamera}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-black/60 text-slate-200 hover:text-white border border-white/20 backdrop-blur-md cursor-pointer"
              >
                Tắt Camera
              </button>
            </div>
          )}
        </div>

        {/* Camera Error Message */}
        {cameraError && (
          <div className="p-2.5 bg-amber-50 border-y border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Manual Keyboard Input Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleConfirm(manualCode);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Keyboard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Nhập mã hoặc bấm quét súng Laser..."
                className="w-full bg-white border border-slate-300 text-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs font-mono focus:outline-hidden focus:border-slate-500 focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              OK (Enter)
            </button>
          </form>

          {/* Quick Click Simulation Chips */}
          {sampleCodes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Mã mẫu quét nhanh:
                </span>
                <span className="text-[10px] text-slate-500">Bấm để quét giả lập</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {sampleCodes.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleConfirm(item.code)}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="font-mono text-xs font-bold text-slate-800">
                      {item.code}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                      {item.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-white border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Chuẩn 1D/2D Zebra, Honeywell, PDA Android</span>
          <button
            onClick={() => soundManager.playSuccessBeep()}
            className="text-slate-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Test Beep
          </button>
        </div>

      </div>
    </div>
  );
};
