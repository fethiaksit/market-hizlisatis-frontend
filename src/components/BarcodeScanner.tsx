import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';
import { X, Flashlight, CameraOff, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PosAudio } from '../utils/format';

interface BarcodeScannerProps {
  isOpen?: boolean;
  onClose: () => void;
  onScan?: (barcode: string) => void;
  onDetected?: (barcode: string) => void;
  title?: string;
  description?: string;
  supportedFormats?: string;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  isOpen = true, 
  onClose, 
  onScan,
  onDetected,
  title = 'KAMERA BARKOD OKUYUCU',
  description = 'Barkodu çerçevenin ortasına hizalayın',
  supportedFormats = 'EAN-13 • EAN-8 • UPC-A • Code128'
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);

  // Stop camera tracks and reader
  const stopCamera = useCallback(() => {
    if (readerRef.current) {
      try {
        readerRef.current.reset();
      } catch {
        // Ignore reset errors
      }
      readerRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // Ignore track stop errors
        }
      });
      mediaStreamRef.current = null;
    }

    setTorchOn(false);
    setHasTorch(false);
  }, []);

  // Initialize camera and scanner
  const startCamera = useCallback(async () => {
    setErrorMsg(null);
    setScannedBarcode(null);
    isProcessingRef.current = false;

    // Check secure context / HTTPS requirement
    const isLocalhost = Boolean(
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '[::1]'
    );
    if (!window.isSecureContext && !isLocalhost) {
      setErrorMsg('Kamera erişimi için HTTPS veya güvenli yerel bağlantı (localhost) gereklidir.');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Tarayıcınız kamera erişimini desteklemiyor.');
      return;
    }

    try {
      // Configure ZXing reader hints for target barcode formats
      const hints = new Map();
      const formats = [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.CODE_128,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_39,
      ];
      hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const codeReader = new BrowserMultiFormatReader(hints);
      readerRef.current = codeReader;

      // Prefer rear camera (environment facing)
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        await videoRef.current.play();

        // Check torch capability
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && videoTrack.getCapabilities) {
          const capabilities = videoTrack.getCapabilities() as Record<string, any>;
          if (capabilities.torch) {
            setHasTorch(true);
          }
        }

        // Start continuous barcode decoding from stream
        codeReader.decodeFromStream(stream, videoRef.current, (result: any) => {
          if (result && !isProcessingRef.current) {
            const code = result.getText();
            if (code && code.trim()) {
              isProcessingRef.current = true;
              PosAudio.playScanBeep();
              setScannedBarcode(code.trim());

              // Immediate stop to prevent duplicate multi-scans
              setTimeout(() => {
                stopCamera();
                const notify = onDetected || onScan;
                if (notify) notify(code.trim());
                onClose();
              }, 150);
            }
          }
        });
      }
    } catch (err: any) {
      stopCamera();
      console.error('Kamera başlatma hatası:', err);

      const errName = err?.name || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setErrorMsg('Kamera erişim izni reddedildi. Lütfen tarayıcı ayarlarından kamera iznini verip tekrar deneyin.');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setErrorMsg('Kamera bulunamadı. Lütfen cihazınızda kullanılabilir bir kamera olduğundan emin olun.');
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setErrorMsg('Kamera şu anda başka bir uygulama tarafından kullanılıyor olabilir.');
      } else {
        setErrorMsg(err?.message || 'Kamera açılırken bir hata oluştu. Lütfen izinleri ve bağlantıyı kontrol edin.');
      }
    }
  }, [onScan, onClose, stopCamera]);

  // Flashlight toggle
  const toggleTorch = async () => {
    if (!mediaStreamRef.current) return;
    const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const nextState = !torchOn;
      await videoTrack.applyConstraints({
        advanced: [{ torch: nextState } as any],
      });
      setTorchOn(nextState);
    } catch (e) {
      console.warn('Flaş değiştirme hatası:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col h-[100dvh] w-screen overflow-hidden touch-none select-none animate-in fade-in duration-150">
      {/* Header bar */}
      <div className="relative z-20 bg-gray-900/90 backdrop-blur-md px-4 py-3 border-b border-gray-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 text-white">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-black text-sm tracking-wide">{title}</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Torch toggle button */}
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                torchOn
                  ? 'bg-amber-400 text-gray-950 shadow-lg shadow-amber-400/20'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
              }`}
              title={torchOn ? 'Flaş Kapat' : 'Flaş Aç'}
            >
              <Flashlight className="w-4 h-4" />
              <span className="hidden sm:inline">{torchOn ? 'Flaş Açık' : 'Flaş Kapalı'}</span>
            </button>
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white transition-colors cursor-pointer border border-gray-700"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main scanner container */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        {/* Video feed */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Error message view */}
        {errorMsg ? (
          <div className="relative z-30 max-w-sm mx-4 p-6 bg-gray-900/95 border border-red-500/30 rounded-3xl text-center space-y-4 shadow-2xl backdrop-blur-md">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
              <CameraOff className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">Kamera Erişim Hatası</h3>
              <p className="text-xs text-gray-300 leading-relaxed">{errorMsg}</p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2.5 bg-zeytin-600 hover:bg-zeytin-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tekrar Dene</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        ) : (
          /* Normal scanner overlay with reticle frame */
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-6 pointer-events-none">
            {/* Top instruction text */}
            <div className="mt-4 bg-gray-900/80 backdrop-blur-md border border-gray-700/60 rounded-full px-4 py-1.5 text-center shadow-lg">
              <p className="text-xs font-semibold text-gray-200">
                {description}
              </p>
            </div>

            {/* Reticle / Scanning Frame */}
            <div className="relative w-64 sm:w-80 h-44 sm:h-52 my-auto flex items-center justify-center">
              {/* Semi-transparent outer vignette layer around frame */}
              <div className="absolute -inset-96 border-[400px] border-black/50 rounded-lg pointer-events-none" />

              {/* Reticle Corner Highlights */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

              {/* Frame Box Border */}
              <div className="w-full h-full border border-emerald-500/30 rounded-xl overflow-hidden relative shadow-inner">
                {/* Animated Laser Scanning Line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-[scan_2s_infinite_ease-in-out]" />
              </div>

              {/* Scanned Badge Feedback */}
              {scannedBarcode && (
                <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center text-emerald-300 font-bold gap-1 animate-in zoom-in-95 duration-100">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  <span className="text-xs font-mono tracking-wider">{scannedBarcode}</span>
                </div>
              )}
            </div>

            {/* Bottom info formats badge */}
            <div className="mb-4 bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-2xl px-4 py-2 text-center flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px] font-mono text-gray-300">
                {supportedFormats}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Animation keyframes style for scanner laser */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(180px); opacity: 1; }
          100% { transform: translateY(0); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};
