// Mục đích file này để làm gì: Component Drawer hiển thị cấu hình ngữ cảnh giả lập thời tiết và vị trí GPS của người dùng.
// Các file khác hay file này có ý nghĩa như nào: Được nhúng vào AiChatWindow để cung cấp các điều khiển giả lập thời tiết/GPS đầu vào cho chatbot AI.
// Các chức năng đặc biệt: Hiển thị nhiệt độ, độ ẩm, sức gió và lượng mưa thực tế/giả lập, cho phép điền tay vĩ độ và kinh độ.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: SOLID (Single Responsibility), Presentational Component Pattern.
// Các biến, hàm đặc biệt trong file: ChatConfigDrawer component.
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Thermometer, MapPin, Wind, Droplets, CloudRain, Sun, Loader2 } from 'lucide-react';
import { LABELS } from '@/constants/labels';
import { WeatherData } from '@/hooks/useAiChat';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';

interface ChatConfigDrawerProps {
  showConfig: boolean;
  setShowConfig: (val: boolean) => void;
  weather: WeatherData | null;
  isWeatherLoading: boolean;
  lat: number;
  setLat: (val: number) => void;
  lng: number;
  setLng: (val: number) => void;
  refreshGps: () => void;
}

export function ChatConfigDrawer({
  showConfig,
  weather,
  isWeatherLoading,
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
      className="overflow-hidden border-b border-orange-100 dark:border-slate-800 bg-orange-50/20 dark:bg-slate-900/10 px-6 py-4 shrink-0"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Thời tiết thực tế */}
        <div className="space-y-2 bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-orange-50 dark:border-slate-800">
          <span className="font-extrabold text-gray-700 dark:text-slate-300 flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-800 pb-1.5">
            <Thermometer size={14} className="text-orange-500 animate-pulse" />
            {LABELS.AI_CHAT.CONFIG.WEATHER_TITLE}
          </span>
          {isWeatherLoading ? (
            <div className="flex flex-col items-center justify-center py-4 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin text-primary mb-1" />
              <span>{LABELS.AI_CHAT.CONFIG.SYNCING_WEATHER}</span>
            </div>
          ) : weather ? (
            <div className="space-y-1.5 pt-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">{LABELS.AI_CHAT.CONFIG.TEMPERATURE}:</span>
                <span className="font-bold text-gray-800 dark:text-slate-200">
                  {weather.temperature}°C ({LABELS.AI_CHAT.CONFIG.FEELS_LIKE(weather.apparentTemperature)})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">{LABELS.AI_CHAT.CONFIG.HUMIDITY}:</span>
                <span className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1">
                  <Droplets size={12} className="text-blue-400" />
                  {weather.humidity}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">{LABELS.AI_CHAT.CONFIG.WIND_SPEED}:</span>
                <span className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1">
                  <Wind size={12} className="text-teal-400 dark:text-teal-400" />
                  {weather.windSpeedKmh} km/h
                </span>
              </div>
              <div className="flex items-center justify-between pt-0.5 border-t border-dashed border-gray-100 dark:border-slate-800">
                <span className="text-gray-500">{LABELS.AI_CHAT.CONFIG.STATUS}:</span>
                <span className="font-bold text-primary flex items-center gap-1">
                  {weather.isRaining ? (
                    <CloudRain size={12} className="text-blue-500 animate-bounce" />
                  ) : (
                    <Sun size={12} className="text-amber-500 animate-spin-slow" />
                  )}
                  {weather.description}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-5 text-gray-400 text-center">
              {LABELS.AI_CHAT.CONFIG.NO_WEATHER_DATA}
            </div>
          )}
        </div>

        {/* Tọa độ GPS */}
        <div className="space-y-2 bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-orange-50 dark:border-slate-800">
          <span className="font-extrabold text-gray-700 dark:text-slate-300 flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-800 pb-1.5">
            <MapPin size={14} className="text-blue-500" />
            {LABELS.AI_CHAT.CONFIG.LOCATION_TITLE}
          </span>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500">{LABELS.AI_CHAT.CONFIG.LATITUDE}</span>
              <Input
                variant="none"
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(Number((e.target as HTMLInputElement).value))}
                className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2 py-1 rounded-lg font-mono text-xs text-gray-700 dark:text-slate-200 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500">{LABELS.AI_CHAT.CONFIG.LONGITUDE}</span>
              <Input
                variant="none"
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(Number((e.target as HTMLInputElement).value))}
                className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2 py-1 rounded-lg font-mono text-xs text-gray-700 dark:text-slate-200 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-gray-500">{LABELS.AI_CHAT.CONFIG.GPS_COORDS}:</span>
            <Button
              type="button"
              title={LABELS.AI_CHAT.CONFIG.UPDATE_GPS}
              aria-label={LABELS.AI_CHAT.CONFIG.UPDATE_GPS}
              onClick={refreshGps}
              variant="none"
              size="none"
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-primary transition-colors font-bold text-[10px]"
            >
              <MapPin size={12} />
              {LABELS.AI_CHAT.CONFIG.UPDATE_BTN}
            </Button>
          </div>
        </div>

        {/* Hướng dẫn kiểm thử */}
        <div className="bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-orange-50 dark:border-slate-800 flex flex-col justify-center text-[11px] leading-relaxed text-gray-500 dark:text-slate-400">
          <p className="font-bold text-gray-700 dark:text-slate-300 mb-1">
            {LABELS.AI_CHAT.CONFIG.TIPS_TITLE}
          </p>
          <p>{LABELS.AI_CHAT.CONFIG.TIP_1}</p>
          <p className="mt-1">{LABELS.AI_CHAT.CONFIG.TIP_2}</p>
        </div>
      </div>
    </motion.div>
  );
}
