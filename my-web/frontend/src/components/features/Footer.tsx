'use client';

import React from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/base/SafeImage';
import { LABELS } from '@/constants/labels';

export const Footer = () => {
  return (
    <footer className="bg-white py-12 px-6 border-t border-gray-100">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-8">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity justify-center md:justify-start">
          <div className="relative w-8 h-8">
            <SafeImage src="/logo.png" alt={LABELS.COMMON.BRAND_LOGO_ALT} fill sizes="32px" className="object-contain" />
          </div>
          <span className="text-xl font-bold gradient-text">{LABELS.COMMON.BRAND_NAME}</span>
        </Link>
        <div className="flex gap-8 text-gray-500 text-sm font-bold justify-center">
          <Link href="/terms" className="hover:text-primary transition-colors">{LABELS.FOOTER.TERMS}</Link>
          <Link href="/policy" className="hover:text-primary transition-colors">{LABELS.FOOTER.POLICY}</Link>
          <Link href="/contact" className="hover:text-primary transition-colors">{LABELS.FOOTER.CONTACT}</Link>
        </div>
        <p className="text-gray-400 text-sm text-center md:text-right">{LABELS.FOOTER.RIGHTS}</p>
      </div>
    </footer>
  );
};
