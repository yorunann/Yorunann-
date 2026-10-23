import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Smartphone, Copy, Check, ExternalLink, RefreshCw, Wifi, WifiOff, Zap } from 'lucide-react';
import { ConnectionStatus } from '../hooks/usePeerSync';

interface RemoteSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  onRegenerateRoomCode: () => void;
  connectionStatus: ConnectionStatus;
  connectedClientsCount: number;
  language: 'en' | 'zh' | 'ja';
}

export const RemoteSyncModal: React.FC<RemoteSyncModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  onRegenerateRoomCode,
  connectionStatus,
  connectedClientsCount,
  language,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Generate mobile remote URL
  const mobileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?mode=remote&room=${encodeURIComponent(roomCode.toLowerCase())}`
    : `?mode=remote&room=${roomCode}`;

  useEffect(() => {
    if (!isOpen || !mobileUrl) return;
    QRCode.toDataURL(mobileUrl, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [isOpen, mobileUrl]);

  if (!isOpen) return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(mobileUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Smartphone size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  {language === 'zh' ? '手機遠端遙控' : language === 'ja' ? 'スマホ遠隔操作' : 'Mobile Remote Control'}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-full">
                  {language === 'zh' ? '即時同步' : language === 'ja' ? 'リアルタイム同期' : 'Live Sync'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'zh'
                  ? '手機或第二台裝置即時控制記分板'
                  : 'スマホ等でリアルタイム遠隔操作'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Status Badge */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
            connectedClientsCount > 0
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : connectionStatus === 'connected'
              ? 'bg-blue-950/30 border-blue-500/30 text-blue-200'
              : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                {connectedClientsCount > 0 ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </>
                ) : (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </>
                )}
              </span>
              <span className="text-sm font-bold">
                {connectedClientsCount > 0
                  ? `已連接 ${connectedClientsCount} 台遙控裝置！`
                  : '等待手機或外部裝置掃描連線中...'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-black/40 text-slate-300">
              <Zap size={14} className="text-yellow-400" />
              <span>{language === 'zh' ? '即時連線' : 'Live'}</span>
            </div>
          </div>

          {/* QR Code & Code Section */}
          <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            {/* QR Code */}
            <div className="p-2 bg-white rounded-xl shadow-lg shrink-0 flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Remote Control QR Code"
                  className="w-44 h-44 sm:w-48 sm:h-48 rounded-lg object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                  載入 QR Code 中...
                </div>
              )}
            </div>

            {/* Instruction & Room Code */}
            <div className="flex-1 flex flex-col justify-between space-y-3 w-full">
              <div>
                <span className="text-xs text-slate-400 font-medium block mb-1">
                  步驟 1：使用手機相機掃描左側 QR Code，或輸入房間代碼
                </span>
                <div className="flex items-center gap-2 mt-2">
                  <div className="bg-slate-900 border border-slate-700 px-3.5 py-2 rounded-lg font-mono text-xl font-black text-yellow-400 tracking-widest select-all">
                    {roomCode}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors flex items-center gap-1 text-xs font-semibold"
                    title="複製代碼"
                  >
                    {copiedCode ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    <span>{copiedCode ? '已複製' : '代碼'}</span>
                  </button>
                  <button
                    onClick={onRegenerateRoomCode}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-colors"
                    title="重新生成新房間代碼"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium block mb-1">
                  步驟 2：也可以直接複製手機連結發送到 LINE 或通訊軟體
                </span>
                <button
                  onClick={handleCopyUrl}
                  className="w-full py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/40 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  {copiedUrl ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                  <span>{copiedUrl ? '已成功複製遙控連結！' : '一鍵複製手機遙控網址'}</span>
                </button>
              </div>

              <div>
                <a
                  href={mobileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <ExternalLink size={14} />
                  <span>在此電腦另開新分頁測試遙控器</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
