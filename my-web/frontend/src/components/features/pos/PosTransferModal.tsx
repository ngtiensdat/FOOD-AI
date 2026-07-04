'use client';

import React from 'react';
import { Move } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { DiningTable } from '@/services/table.service';
import { LABELS } from '@/constants/labels';

interface PosTransferModalProps {
  tables: DiningTable[];
  selectedTableId: number | null;
  handleTransferTable: (targetTableId: number) => Promise<void>;
  onClose: () => void;
}

export const PosTransferModal = ({
  tables,
  selectedTableId,
  handleTransferTable,
  onClose,
}: PosTransferModalProps) => {
  const freeTables = tables.filter(t => t.status === 'FREE' && t.id !== selectedTableId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full relative z-10 space-y-4 animate-in scale-in duration-200">
        <div>
          <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Move size={18} className="text-primary" />
            {LABELS.POS.TRANSFER_MODAL_TITLE}
          </h3>
          <p className="text-[11px] text-gray-400 font-bold mt-1">
            {LABELS.POS.TRANSFER_MODAL_DESC}
          </p>
        </div>

        <div className="max-h-60 overflow-y-auto pr-1 grid grid-cols-2 gap-3 custom-scrollbar">
          {freeTables.length === 0 ? (
            <div className="col-span-2 text-center py-6 text-xs text-gray-400 font-bold">
              {LABELS.POS.TRANSFER_MODAL_EMPTY}
            </div>
          ) : (
            freeTables.map(t => (
              <div
                key={t.id}
                onClick={async () => {
                  await handleTransferTable(t.id);
                  onClose();
                }}
                className="border border-gray-150 dark:border-slate-800/80 hover:border-primary/50 bg-gray-50/50 dark:bg-slate-950/30 p-3 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] active:scale-95 text-center"
              >
                <span className="font-extrabold text-xs text-gray-800 dark:text-white block">
                  {t.name}
                </span>
                <span className="text-[9px] text-gray-400 font-semibold block mt-1">
                  {LABELS.POS.TABLE_CAPACITY_LABEL(t.capacity || 4)}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            fullWidth
            onClick={onClose}
            className="py-2.5 rounded-xl font-bold"
          >
            {LABELS.COMMON.CANCEL}
          </Button>
        </div>
      </div>
    </div>
  );
};
