'use client';

import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { LABELS } from '@/constants/labels';
import { LIMITS } from '@/constants/limits.constant';
import { AnalyticsData } from '@/hooks/useMerchantAnalytics';

interface DoubleBarChartProps {
  data: AnalyticsData[];
  maxVal: number;
}

// Chart layout configuration static constants
const CHART_HEIGHT = 220;
const CHART_WIDTH = 500;
const PADDING_LEFT = 40;
const PADDING_BOTTOM = 40;
const PADDING_TOP = 20;
const PADDING_RIGHT = 20;

const GRAPH_WIDTH = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
const GRAPH_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

// Tooltip configuration constants
const TOOLTIP_BOX_WIDTH = 110;
const TOOLTIP_BOX_HEIGHT = 26;
const TOOLTIP_X_OFFSET = TOOLTIP_BOX_WIDTH / 2;
const TOOLTIP_Y_OFFSET = 32;
const TOOLTIP_TEXT_Y_OFFSET = 15;
const BAR_TOP_OFFSET = 8;

export const DoubleBarChart = React.memo(({ data, maxVal }: DoubleBarChartProps) => {
  const [hoveredBar, setHoveredBar] = useState<{
    foodName: string;
    type: 'views' | 'ai';
    value: number;
    x: number;
    y: number;
  } | null>(null);

  const handleBarHover = React.useCallback((
    name: string,
    type: 'views' | 'ai',
    value: number,
    x: number,
    y: number,
    active: boolean
  ) => {
    if (active) {
      setHoveredBar({ foodName: name, type, value, x, y });
    } else {
      setHoveredBar(null);
    }
  }, []);

  if (data.length === 0) {
    return (
      <div className="lg:col-span-2 card-premium p-12 flex flex-col items-center justify-center min-h-[280px] text-center border-2 border-dashed border-gray-100 dark:border-slate-800">
        <BarChart3 size={40} className="text-gray-300 dark:text-slate-700 mb-3 stroke-[1.5]" aria-hidden="true" />
        <p className="text-xs text-gray-400 font-bold">
          {LABELS.ANALYTICS.CHART_EMPTY_COMPARE}
        </p>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 card-premium p-6 space-y-4">
      <h3 className="text-body font-black text-gray-800 dark:text-white flex items-center gap-2">
        {LABELS.ANALYTICS.CHART_TITLE}
      </h3>

      <div className="relative pt-4">
        <svg 
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} 
          className="w-full h-auto select-none overflow-visible"
          role="img"
          aria-label={LABELS.ANALYTICS.CHART_ARIA_LABEL}
        >
          <title>{LABELS.ANALYTICS.CHART_SVG_TITLE}</title>
          
          {/* Y Axis Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = PADDING_TOP + GRAPH_HEIGHT * (1 - pct);
            const value = Math.round(maxVal * pct);
            return (
              <g key={idx} className="opacity-40">
                <line 
                   x1={PADDING_LEFT} 
                  y1={y} 
                  x2={CHART_WIDTH - PADDING_RIGHT} 
                  y2={y} 
                  stroke="currentColor" 
                  strokeWidth={1} 
                  strokeDasharray="4,4" 
                  className="text-gray-200 dark:text-slate-700" 
                />
                <text 
                  x={PADDING_LEFT - 8} 
                  y={y + 4} 
                  textAnchor="end" 
                  className="fill-gray-400 font-mono text-[9px] font-bold dark:fill-slate-500"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* Data Bars */}
          {data.map((item, idx) => {
            const step = GRAPH_WIDTH / Math.max(data.length, 1);
            const groupX = PADDING_LEFT + step * idx + step * 0.1;
            const barWidth = step * 0.35;
            
            // Views Bar (Blue)
            const viewsHeight = (item.views / maxVal) * GRAPH_HEIGHT;
            const viewsX = groupX;
            const viewsY = CHART_HEIGHT - PADDING_BOTTOM - viewsHeight;
            
            // AI Suggestions Bar (Amber)
            const aiHeight = (item.aiSuggestions / maxVal) * GRAPH_HEIGHT;
            const aiX = groupX + barWidth + 4;
            const aiY = CHART_HEIGHT - PADDING_BOTTOM - aiHeight;

            return (
              <g key={item.id} role="group" aria-label={LABELS.ANALYTICS.CHART_GROUP_ARIA(item.name)}>
                {/* Views bar */}
                <rect
                  x={viewsX}
                  y={viewsY}
                  width={barWidth}
                  height={viewsHeight}
                  rx={3}
                  tabIndex={0}
                  role="graphics-symbol"
                  aria-label={LABELS.ANALYTICS.CHART_BAR_VIEWS_ARIA(item.name, item.views)}
                  className="fill-blue-500 hover:fill-blue-600 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400"
                  onMouseEnter={() => handleBarHover(item.name, 'views', item.views, viewsX + barWidth / 2, viewsY - BAR_TOP_OFFSET, true)}
                  onMouseLeave={() => handleBarHover('', 'views', 0, 0, 0, false)}
                  onFocus={() => handleBarHover(item.name, 'views', item.views, viewsX + barWidth / 2, viewsY - BAR_TOP_OFFSET, true)}
                  onBlur={() => handleBarHover('', 'views', 0, 0, 0, false)}
                />

                {/* AI bar */}
                <rect
                  x={aiX}
                  y={aiY}
                  width={barWidth}
                  height={aiHeight}
                  rx={3}
                  tabIndex={0}
                  role="graphics-symbol"
                  aria-label={LABELS.ANALYTICS.CHART_BAR_AI_ARIA(item.name, item.aiSuggestions)}
                  className="fill-amber-500 hover:fill-amber-600 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400"
                  onMouseEnter={() => handleBarHover(item.name, 'ai', item.aiSuggestions, aiX + barWidth / 2, aiY - BAR_TOP_OFFSET, true)}
                  onMouseLeave={() => handleBarHover('', 'ai', 0, 0, 0, false)}
                  onFocus={() => handleBarHover(item.name, 'ai', item.aiSuggestions, aiX + barWidth / 2, aiY - BAR_TOP_OFFSET, true)}
                  onBlur={() => handleBarHover('', 'ai', 0, 0, 0, false)}
                />

                {/* X Axis labels */}
                <text
                  x={groupX + barWidth + 2}
                  y={CHART_HEIGHT - PADDING_BOTTOM + 16}
                  textAnchor="middle"
                  className="fill-gray-500 text-[9px] font-bold dark:fill-slate-400"
                >
                  {item.name.length > LIMITS.CHART_X_LABEL_MAX_CHARS
                    ? `${item.name.substring(0, LIMITS.CHART_X_LABEL_MAX_CHARS - 2)}..`
                    : item.name}
                </text>
              </g>
            );
          })}

          {/* Tooltip Overlay inside SVG */}
          {hoveredBar && (
            <g className="fade-in pointer-events-none" aria-live="polite">
              <rect
                x={hoveredBar.x - TOOLTIP_X_OFFSET}
                y={hoveredBar.y - TOOLTIP_Y_OFFSET}
                width={TOOLTIP_BOX_WIDTH}
                height={TOOLTIP_BOX_HEIGHT}
                rx={6}
                className="fill-slate-900/95 dark:fill-white/95 shadow-lg"
              />
              <text
                x={hoveredBar.x}
                y={hoveredBar.y - TOOLTIP_TEXT_Y_OFFSET}
                textAnchor="middle"
                className="fill-white dark:fill-slate-950 font-bold text-[9px]"
              >
                {hoveredBar.type === 'views' ? LABELS.ANALYTICS.CHART_TOOLTIP_VIEWS : LABELS.ANALYTICS.CHART_TOOLTIP_AI}: {hoveredBar.value}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex gap-4 justify-center text-mini text-gray-500 font-bold pt-2 border-t border-gray-50 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-blue-500 rounded-sm" aria-hidden="true" />
          <span>{LABELS.ANALYTICS.VIEWS}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-amber-500 rounded-sm" aria-hidden="true" />
          <span>{LABELS.ANALYTICS.RECOMMENDATIONS}</span>
        </div>
      </div>
    </div>
  );
});

DoubleBarChart.displayName = 'DoubleBarChart';
