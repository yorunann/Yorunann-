import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings as SettingsIcon, Smartphone, Check, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'en' | 'zh' | 'ja';
  useBetaControls?: boolean;
  onToggleBetaControls?: (value: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  language = 'zh',
  useBetaControls = false,
  onToggleBetaControls
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center px-5 py-4 border-b bg-slate-50 shrink-0">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <SettingsIcon className="w-5 h-5 text-blue-600" />
              <span>{language === 'en' ? 'Settings' : language === 'zh' ? '系統設定' : '設定'}</span>
            </h2>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-colors"
              title={language === 'en' ? 'Close' : language === 'zh' ? '關閉' : '閉じる'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
            {/* Beta UI Switch Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 transition-all hover:border-blue-300">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        {language === 'en' 
                          ? 'Touch-Friendly Console' 
                          : language === 'zh' 
                          ? '新版行動友善控制台' 
                          : 'モバイル最適化コンソール'}
                      </h4>
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Beta
                      </span>
                    </div>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={() => onToggleBetaControls && onToggleBetaControls(!useBetaControls)}
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                    useBetaControls ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                  role="switch"
                  aria-checked={useBetaControls}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      useBetaControls ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Status Note */}
              <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  {language === 'en' ? 'Console Style: ' : language === 'zh' ? '控制台樣式：' : 'コンソールスタイル：'}
                  <strong className={useBetaControls ? 'text-blue-600 ml-1' : 'text-slate-700 ml-1'}>
                    {useBetaControls 
                      ? (language === 'en' ? 'Touch Console' : language === 'zh' ? '新版觸控控制台' : '新版コンソール')
                      : (language === 'en' ? 'Classic Controls' : language === 'zh' ? '經典版控制台' : 'クラシック版')}
                  </strong>
                </span>
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {language === 'en' ? 'Reversible anytime' : language === 'zh' ? '隨時可一鍵切回舊版' : 'いつでも復帰可能'}
                </span>
              </div>
            </div>

            {/* Information card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 text-xs flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-slate-800 mb-1">
                  {language === 'en' ? 'Safe Beta Experience' : language === 'zh' ? '安心測試保證' : '安心テスト保証'}
                </h5>
                <p className="text-slate-600 leading-relaxed">
                  {language === 'en'
                    ? 'The classic controls remain 100% intact. Your settings are remembered in this browser, so you can freely switch back and forth.'
                    : language === 'zh'
                    ? '經典版的所有功能完全被完整保留。您的開關選擇會自動儲存在此瀏覽器中，您可以隨時切換比較，不用擔心任何功能消失。'
                    : '従来のクラシック機能は100%保持されています。ブラウザに設定が記憶されるため、いつでも自由に戻せます。'}
                </p>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3 border-t bg-slate-50 flex justify-end items-center shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
            >
              {language === 'en' ? 'Done' : language === 'zh' ? '完成' : '完了'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
