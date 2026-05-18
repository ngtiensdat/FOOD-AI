'use client';

import React from 'react';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  bg?: 'white' | 'gray' | 'orange' | 'blue' | 'transparent';
  container?: boolean;
}

export const Section = ({
  children,
  className = '',
  id,
  bg = 'white',
  container = true,
}: SectionProps) => {
  const bgStyles = {
    white: 'bg-white dark:bg-slate-950',
    gray: 'bg-gray-50/50 dark:bg-gray-100/10',
    orange: 'bg-orange-50/30 dark:bg-primary/5',
    blue: 'bg-blue-50/30 dark:bg-blue-950/10',
    transparent: 'bg-transparent',
  };

  return (
    <section 
      id={id} 
      className={`p-layout transition-colors duration-300 ${bgStyles[bg]} ${className}`}
    >
      <div className={container ? 'max-w-7xl mx-auto' : ''}>
        {children}
      </div>
    </section>
  );
};

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader = ({
  title,
  subtitle,
  icon,
  actions,
  className = '',
}: SectionHeaderProps) => {
  return (
    <div className={`flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4 ${className}`}>
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
      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  );
};
