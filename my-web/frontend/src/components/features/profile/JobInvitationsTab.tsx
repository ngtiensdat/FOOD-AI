'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Check, X, Store, Briefcase } from 'lucide-react';
import { restaurantService } from '@/services/restaurant.service';
import { toast } from '@/store/useToastStore';
import { Button } from '@/components/base/Button';
import { LABELS } from '@/constants/labels';

interface JobInvitation {
  id: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantId: number;
  createdAt: string;
}

export const JobInvitationsTab = () => {
  const [invitations, setInvitations] = useState<JobInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const data = await restaurantService.getUserJobInvitations();
      setInvitations(data);
    } catch (err) {
      console.error(err);
      toast.error(LABELS.JOB_INVITATIONS.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleRespond = async (invitationId: string, accept: boolean, name: string) => {
    const actionText = accept ? LABELS.JOB_INVITATIONS.ACTION_ACCEPT : LABELS.JOB_INVITATIONS.ACTION_REJECT;
    const confirm = window.confirm(LABELS.JOB_INVITATIONS.CONFIRM_PROMPT(actionText, name));
    if (!confirm) return;

    try {
      await restaurantService.respondToJobInvitation(invitationId, accept);
      toast.success(LABELS.JOB_INVITATIONS.SUCCESS_MSG(actionText));
      if (accept) {
        toast.info(LABELS.JOB_INVITATIONS.RELOAD_INFO);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        fetchInvitations();
      }
    } catch (err) {
      console.error(err);
      toast.error(LABELS.JOB_INVITATIONS.RESPONSE_ERROR);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="card-container p-6 space-y-4">
        <h3 className="font-bold text-lg text-gray-800 dark:text-slate-100 flex items-center gap-2">
          <Briefcase className="text-primary" size={20} /> {LABELS.JOB_INVITATIONS.TITLE}
        </h3>
        <p className="text-xs text-gray-400 dark:text-slate-400 -mt-2">
          {LABELS.JOB_INVITATIONS.DESC}
        </p>

        {loading ? (
          <div className="text-center py-8 text-gray-400">{LABELS.JOB_INVITATIONS.LOADING}</div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-150 dark:border-slate-800 rounded-2xl text-gray-400">
            <Mail className="mx-auto text-gray-300 dark:text-slate-700 mb-2" size={40} />
            <span className="text-sm font-bold block">{LABELS.JOB_INVITATIONS.EMPTY}</span>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-gray-100 dark:border-slate-800/80 gap-4 hover:shadow-sm transition-all"
              >
                <div className="space-y-1">
                  <span className="font-extrabold text-base text-gray-850 dark:text-slate-100 flex items-center gap-1.5">
                    <Store size={18} className="text-primary shrink-0" />
                    {inv.restaurantName}
                  </span>
                  <span className="text-xs font-semibold text-gray-450 dark:text-slate-400 block">
                    {LABELS.JOB_INVITATIONS.ADDRESS_LABEL} {inv.restaurantAddress || LABELS.JOB_INVITATIONS.NOT_UPDATED}
                  </span>
                  <span className="text-[10px] font-medium text-gray-400 dark:text-slate-550 block">
                    {LABELS.JOB_INVITATIONS.INVITED_DATE} {inv.createdAt}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    onClick={() => handleRespond(inv.id, false, inv.restaurantName)}
                    variant="outline"
                    size="sm"
                    className="text-red-505 hover:text-red-600 dark:text-rose-400 dark:hover:text-rose-500 rounded-xl"
                  >
                    <X size={16} className="mr-1" /> {LABELS.JOB_INVITATIONS.REJECT}
                  </Button>
                  <Button
                    onClick={() => handleRespond(inv.id, true, inv.restaurantName)}
                    className="bg-primary hover:bg-primary-light text-white font-bold rounded-xl"
                    size="sm"
                  >
                    <Check size={16} className="mr-1" /> {LABELS.JOB_INVITATIONS.ACCEPT}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
