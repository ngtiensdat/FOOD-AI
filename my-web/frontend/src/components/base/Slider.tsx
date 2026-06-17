'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface SliderProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  bg?: 'white' | 'gray' | 'orange' | 'blue' | 'transparent';
}

export const Slider = ({ children, title, subtitle, icon, bg = 'white' }: SliderProps) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const { scrollLeft, clientWidth } = sliderRef.current;
      const scrollAmount = clientWidth * 0.8;
      const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      sliderRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const navActions = (
    <div className="hidden md:flex gap-3">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => scroll('left')}
        className="w-12 h-12 rounded-full p-0"
        aria-label="Cuộn sang trái"
      >
        <ChevronLeft size={24} />
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => scroll('right')}
        className="w-12 h-12 rounded-full p-0"
        aria-label="Cuộn sang phải"
      >
        <ChevronRight size={24} />
      </Button>
    </div>
  );

  return (
    <section className={`p-layout ${bg === 'white' ? 'bg-white' : bg === 'gray' ? 'bg-gray-50/50' : bg === 'orange' ? 'bg-orange-50/30' : 'bg-blue-50/30'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-h2 flex items-center gap-3">
              {icon} 
              <span className="flex flex-wrap gap-2">
                {title.split(' ').map((word, i) => (
                  <span key={i} className={i >= title.split(' ').length - 2 ? 'gradient-text' : ''}>
                    {word}
                  </span>
                ))}
              </span>
            </h2>
            {subtitle && <p className="text-body text-gray-500 mt-2">{subtitle}</p>}
          </div>
          {navActions}
        </div>
        
        <div
          ref={sliderRef}
          className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide snap-x"
        >
          {React.Children.map(children, (child) => (
            <div className="min-w-[280px] md:min-w-[320px] snap-start">
              {child}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
