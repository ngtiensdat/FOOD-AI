'use client';

import React from 'react';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';

interface ExpandableTextProps {
  text?: string;
  className?: string;
  textClassName?: string;
  collapsedLines?: 1 | 2 | 3;
  threshold?: number;
}

export const ExpandableText = ({
  text,
  className = '',
  textClassName = '',
  collapsedLines = 2,
  threshold = 90,
}: ExpandableTextProps) => {
  const [expanded, setExpanded] = React.useState(false);
  const value = text?.trim() || '';
  const shouldToggle = value.length > threshold || value.includes('\n');

  const clampClass = collapsedLines === 1 ? 'line-clamp-1' : collapsedLines === 3 ? 'line-clamp-3' : 'line-clamp-2';

  if (!value) return null;

  return (
    <div className={className}>
      <p className={`${textClassName} ${!expanded && shouldToggle ? clampClass : ''}`}>
        {value}
      </p>
      {shouldToggle && (
        <Button
          type="button"
          variant="none"
          size="none"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((current) => !current);
          }}
          className="mt-1 text-xs font-bold text-primary hover:underline"
          aria-expanded={expanded}
        >
          {expanded ? LABELS.COMMON.SEE_LESS : LABELS.COMMON.SEE_MORE}
        </Button>
      )}
    </div>
  );
};
