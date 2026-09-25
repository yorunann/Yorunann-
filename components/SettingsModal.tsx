import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings as SettingsIcon, Sliders, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'en' | 'zh' | 'ja';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, language = 'zh' }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center px-5 py-4 border-b bg-slate-50">
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
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-900 flex items-start gap-3">
              <Sliders className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-blue-800">
                  {language === 'en' ? 'Configuration & Preferences' : language === 'zh' ? '設定面板準備就緒' : '設定パネルの準備完了'}
                </h4>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  {language === 'en' 
                    ? 'Settings module is initialized and ready for customization.' 
                    : language === 'zh' 
                    ? '設定功能已就緒，您可以隨時指定要放置的自訂項目或偏好設定。' 
                    : '設定機能が準備できました。いつでも追加のカスタマイズ項目を指定できます。'}
                </p>
              </div>
            </div>

            <div className="border border-dashed border-slate-300 rounded-lg p-8 text-center flex flex-col items-center justify-center text-slate-400">
              <Sparkles className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">
                {language === 'en' ? 'Ready for new options' : language === 'zh' ? '等待設定項目中' : '設定項目待機中'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'en' 
                  ? 'Tell us what features or toggles you would like here.' 
                  : language === 'zh' 
                  ? '請隨時告訴我們要在這裡加入什麼功能或開關。' 
                  : 'ここに追加したい機能や設定項目をお知らせください。'}
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3 border-t bg-slate-50 flex justify-end items-center">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
              {language === 'en' ? 'Close' : language === 'zh' ? '關閉' : '閉じる'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
