'use client';

import React from 'react';
import { Store } from 'lucide-react';
import { DiningTable } from '@/services/table.service';
import { Restaurant } from '@/types/restaurant';
import { User } from '@/types/user';
import { LABELS } from '@/constants/labels';

interface PosTableSelectorProps {
  user: User | Partial<User>;
  tables: DiningTable[];
  branches: Restaurant[];
  selectedBranchId: number | null;
  setSelectedBranchId: (id: number) => void;
  handleSelectTable: (tableId: number) => void;
  handleReleaseTable: (tableId: number) => void;
}

export const PosTableSelector = ({
  user,
  tables,
  branches,
  selectedBranchId,
  setSelectedBranchId,
  handleSelectTable,
  handleReleaseTable,
}: PosTableSelectorProps) => {
  return (
    <div className="flex-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Store size={22} className="text-primary" />
            {LABELS.POS.SELECT_TABLE_TITLE}
          </h1>
          <p className="text-xs text-gray-400 font-bold mt-1">
            {LABELS.POS.SELECT_TABLE_DESC}
          </p>
        </div>

        {/* Chi nhánh selection (Chỉ dành cho RESTAURANT/Merchant) */}
        {user.role === 'RESTAURANT' && branches.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-gray-400">{LABELS.POS.BRANCH_LABEL}</span>
            <select
              value={selectedBranchId || ''}
              onChange={(e) => setSelectedBranchId(Number(e.target.value))}
              className="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-855 px-3 py-2 rounded-xl text-xs font-bold outline-none text-slate-700 dark:text-slate-300 focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {user.role === 'STAFF' && (
          <div className="px-3 py-2 bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase rounded-lg">
            {LABELS.POS.STAFF_ROLE}
          </div>
        )}
      </div>

      {tables.length === 0 ? (
        <div className="text-center py-20 text-gray-400 space-y-3">
          <p className="text-sm font-bold">{LABELS.POS.NO_TABLES_CREATED}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {tables.map((table) => {
            const isFree = table.status === 'FREE';
            return (
              <div
                key={table.id}
                onClick={() => handleSelectTable(table.id)}
                className={`border rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 cursor-pointer relative overflow-hidden group hover:scale-[1.01] ${
                  isFree 
                    ? 'bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-950/20' 
                    : 'bg-orange-50/10 dark:bg-amber-950/5 border-amber-100 dark:border-amber-950/20'
                }`}
              >
                <div className={`absolute top-0 left-0 w-1.5 h-full ${isFree ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <div className="pl-2">
                  <h3 className="font-extrabold text-base text-gray-800 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">
                    {table.name}
                  </h3>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg mt-2 ${
                    isFree 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                  }`}>
                    {isFree ? LABELS.POS.STATUS_FREE : LABELS.POS.STATUS_OCCUPIED}
                  </span>
                </div>
                
                {!isFree && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReleaseTable(table.id);
                    }}
                    className="mt-2 text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 border border-rose-100 dark:border-rose-950/30 px-2 py-1 rounded-xl w-full text-center hover:bg-rose-50/50 cursor-pointer"
                  >
                    {LABELS.POS.RELEASE_TABLE_BTN}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
