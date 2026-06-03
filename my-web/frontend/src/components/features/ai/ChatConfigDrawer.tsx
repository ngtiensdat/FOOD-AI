'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Thermometer, MapPin } from 'lucide-react';
import { LABELS } from '@/constants/labels';

interface ChatConfigDrawerProps {
  showConfig: boolean;
  setShowConfig: (val: boolean) => void;
  temperature: number;
  setTemperature: (val: number) => void;
  isRaining: boolean;
  setIsRaining: (val: boolean) => void;
  lat: number;
  setLat: (val: number) => void;
  lng: number;
  setLng: (val: number) => void;
  refreshGps: () => void;
}

export function ChatConfigDrawer({
  showConfig,
  temperature,
  setTemperature,
  isRaining,
  setIsRaining,
  lat,
  setLat,
  lng,
  setLng,
  refreshGps,
}: ChatConfigDrawerProps) {
  if (!showConfig) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden border-b border-orange-55 dark:border-slate-800 bg-orange-50/20 dark:bg-slate-900/10 px-6 py-4 shrink-0"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Giả lập Thời tiết */}
        <div className="space-y-2 bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-orange-50 dark:border-slate-850">
          <span className="font-extrabold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
            <Thermometer size={14} className="text-orange-500" />
            {LABELS.AI_CHAT.CONFIG.WEATHER_TITLE}
          </span>
          <div className="flex items-center justify-between gap-4 pt-1">
            <span className="text-gray-500">
              {LABELS.AI_CHAT.CONFIG.TEMPERATURE}:{' '}
              <strong className="text-primary">{temperature}°C</strong>
            </span>
            <input
              type="range"
              min={LABELS.AI_CHAT.CONFIG.WEATHER_TEMP_LIMITS.MIN}
              max={LABELS.AI_CHAT.CONFIG.WEATHER_TEMP_LIMITS.MAX}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-24 accent-primary cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-gray-500">{LABELS.AI_CHAT.CONFIG.STATUS}:</span>
            <button
              type="button"
              onClick={() => setIsRaining(!isRaining)}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                isRaining
                  ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                  : 'bg-orange-100 text-orange-600 border-orange-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-770'
              }`}
            >
              {isRaining ? LABELS.AI_CHAT.CONFIG.RAINY : LABELS.AI_CHAT.CONFIG.DRY}
            </button>
          </div>
        </div>

        {/* Giả lập Tọa độ GPS */}
        <div className="space-y-2 bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-orange-50 dark:border-slate-850">
          <span className="font-extrabold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
            <MapPin size={14} className="text-blue-500" />
            {LABELS.AI_CHAT.CONFIG.LOCATION_TITLE}
          </span>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500">Vĩ độ (Lat)</span>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(Number(e.target.value))}
                className="bg-gray-50 dark:bg-slate-800 border border-gray-150 dark:border-slate-750 px-2 py-1 rounded-lg font-mono text-xs text-gray-700 dark:text-slate-200 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500">Kinh độ (Lng)</span>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(Number(e.target.value))}
                className="bg-gray-50 dark:bg-slate-800 border border-gray-150 dark:border-slate-750 px-2 py-1 rounded-lg font-mono text-xs text-gray-700 dark:text-slate-200 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-gray-500">{LABELS.AI_CHAT.CONFIG.GPS_COORDS}:</span>
            <button
              type="button"
              title={LABELS.AI_CHAT.CONFIG.UPDATE_GPS}
              aria-label={LABELS.AI_CHAT.CONFIG.UPDATE_GPS}
              onClick={refreshGps}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-primary transition-colors font-bold text-[10px]"
            >
              <MapPin size={12} />
              Cập nhật
            </button>
          </div>
        </div>

        {/* Hướng dẫn kiểm thử */}
        <div className="bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-orange-50 dark:border-slate-850 flex flex-col justify-center text-[11px] leading-relaxed text-gray-500 dark:text-slate-400">
          <p className="font-bold text-gray-700 dark:text-slate-300 mb-1">
            {LABELS.AI_CHAT.CONFIG.TIPS_TITLE}
          </p>
          <p>{LABELS.AI_CHAT.CONFIG.TIP_1}</p>
          <p>{LABELS.AI_CHAT.CONFIG.TIP_2}</p>
        </div>
      </div>
    </motion.div>
  );
}
