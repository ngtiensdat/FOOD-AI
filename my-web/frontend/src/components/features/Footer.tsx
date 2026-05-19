'use client';

import React from 'react';
import Image from 'next/image';
import { LABELS } from '@/constants/labels';

export const Footer = () => {
  return (
    <footer className="bg-white py-12 px-6 border-t border-gray-100">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <Image src="/favicon.ico" alt={LABELS.COMMON.BRAND_LOGO_ALT} fill sizes="32px" className="object-contain" />
          </div>
          <span className="text-xl font-bold gradient-text">{LABELS.COMMON.BRAND_NAME}</span>
        </div>
        <div className="flex gap-8 text-gray-500 text-sm font-bold">
          <a href="#" className="hover:text-primary transition-colors">{LABELS.FOOTER.TERMS}</a>
          <a href="#" className="hover:text-primary transition-colors">{LABELS.FOOTER.POLICY}</a>
          <a href="#" className="hover:text-primary transition-colors">{LABELS.FOOTER.CONTACT}</a>
        </div>
        <p className="text-gray-400 text-sm">{LABELS.FOOTER.RIGHTS}</p>
      </div>
    </footer>
  );
};
