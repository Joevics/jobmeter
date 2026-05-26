"use client";

import React, { useState, useEffect, useRef } from 'react';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const whatsappChannels = [
  { label: 'Global Jobs', href: 'https://whatsapp.com/channel/0029VbCmGF10Qeanq3dje41Z' },
  { label: 'Gulf Jobs', href: 'https://whatsapp.com/channel/0029VbCym2i7DAWx9oGcIV11' },
  { label: 'Nigerian Jobs', href: 'https://whatsapp.com/channel/0029VbC3NrUKLaHp8JAt7v3y' },
  { label: 'Indian Jobs', href: 'https://whatsapp.com/channel/0029Vb8ARN82f3ENIUrBEB3u' },
];

const telegramChannels = [
  { label: 'Global Jobs', href: 'https://t.me/+nK6OHg9ksAthOTc0' },
  { label: 'Gulf Jobs', href: 'https://t.me/+dxmM9_THQnY3Y2M0' },
  { label: 'Nigerian Jobs', href: 'https://t.me/+1YYoQJdLzzkwNDI0' },
];

export default function WhatsAppFloatButton() {
  const [showFloatingButtons, setShowFloatingButtons] = useState(true);
  const [openPopover, setOpenPopover] = useState<'whatsapp' | 'telegram' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closed = localStorage.getItem('floating-buttons-closed');
    if (closed) {
      const closedTime = parseInt(closed);
      if (Date.now() - closedTime < THIRTY_DAYS_MS) {
        setShowFloatingButtons(false);
      }
    }
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenPopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCloseButtons = () => {
    localStorage.setItem('floating-buttons-closed', Date.now().toString());
    setShowFloatingButtons(false);
  };

  const togglePopover = (platform: 'whatsapp' | 'telegram') => {
    setOpenPopover(prev => prev === platform ? null : platform);
  };

  if (!showFloatingButtons) return null;

  return (
    <div ref={containerRef} className="fixed bottom-20 right-6 z-30 lg:bottom-20">
      <button
        onClick={handleCloseButtons}
        className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center justify-center w-6 h-6 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors shadow-lg z-10"
        aria-label="Close floating buttons"
      >
        <span className="text-lg font-medium">×</span>
      </button>

      <div className="space-y-2">
        {/* WhatsApp */}
        <div className="flex justify-end items-center gap-2">
          {/* Popover */}
          {openPopover === 'whatsapp' && (
            <div className="flex flex-col gap-1.5 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-44 animate-in fade-in slide-in-from-right-2 duration-150">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1 mb-0.5">WhatsApp Channels</p>
              {whatsappChannels.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-500 hover:text-white hover:border-green-500 transition-all"
                >
                  {label}
                </a>
              ))}
            </div>
          )}

          <button
            onClick={() => togglePopover('whatsapp')}
            className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-full shadow-lg hover:bg-green-600 transition-all hover:scale-110"
            aria-label="WhatsApp Channels"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </button>
        </div>

        {/* Telegram */}
        <div className="flex justify-end items-center gap-2">
          {/* Popover */}
          {openPopover === 'telegram' && (
            <div className="flex flex-col gap-1.5 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-44 animate-in fade-in slide-in-from-right-2 duration-150">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1 mb-0.5">Telegram Groups</p>
              {telegramChannels.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-sky-50 text-[#0088cc] border border-sky-200 rounded-lg text-xs font-medium hover:bg-[#0088cc] hover:text-white hover:border-[#0088cc] transition-all"
                >
                  {label}
                </a>
              ))}
            </div>
          )}

          <button
            onClick={() => togglePopover('telegram')}
            className="flex items-center justify-center w-12 h-12 bg-[#0088cc] rounded-full shadow-lg hover:bg-[#0077b3] transition-all hover:scale-110"
            aria-label="Telegram Groups"
          >
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}