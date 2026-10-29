import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import { X } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  initialNoBorder?: boolean;
  onClose: () => void;
  onCropComplete: (croppedImage: string, noBorder: boolean) => void;
  language?: 'en' | 'zh' | 'ja';
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  initialNoBorder = false,
  onClose,
  onCropComplete,
  language = 'zh'
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [noBorder, setNoBorder] = useState(initialNoBorder);

  useEffect(() => {
    setNoBorder(Boolean(initialNoBorder));
  }, [initialNoBorder, isOpen]);

  const onCropCompleteCallback = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    try {
      if (croppedAreaPixels) {
        const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
        onCropComplete(croppedImage, noBorder);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">
            {language === 'en' ? 'Crop Logo' : language === 'zh' ? '裁切隊徽' : 'ロゴを切り抜き'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="relative w-full h-64 bg-slate-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape={noBorder ? 'rect' : 'round'}
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteCallback}
            onZoomChange={setZoom}
          />
        </div>
        
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 cursor-pointer accent-blue-600"
            />
          </div>

          {/* No border & transparent background toggle */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={noBorder}
                onChange={(e) => setNoBorder(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-800">
                  {language === 'en' ? 'No Border / Background (Transparent PNG Mode)' : language === 'ja' ? '枠線・背景なし (透明PNGモード)' : '不要邊框與背景 (透明PNG模式)'}
                </span>
                <span className="text-[11px] text-gray-500 leading-tight mt-0.5">
                  {language === 'en'
                    ? 'Displays the logo directly without circular gray border or background'
                    : language === 'ja'
                    ? '丸い枠線やグレー背景を表示せず、画像をそのまま貼り付けます'
                    : '勾選後將直接貼上隊徽圖片，不會有圓形灰色外框與底色，適合透明隊徽'}
                </span>
              </div>
            </label>
          </div>
          
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded font-bold text-gray-600 hover:bg-gray-100 transition-colors text-sm"
            >
              {language === 'en' ? 'Cancel' : language === 'zh' ? '取消' : 'キャンセル'}
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 rounded font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm text-sm"
            >
              {language === 'en' ? 'Confirm' : language === 'zh' ? '確認' : '確認'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
