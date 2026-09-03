'use client';

import React from 'react';
import { useVoterStore } from '@/lib/store/use-voter-store';
import { getTranslation } from '@/lib/i18n/translations';
import { Users, User, UserCheck, Home, MapPin } from 'lucide-react';

export const StatsCards: React.FC = () => {
  const { language, getStats, filters } = useVoterStore();
  const t = getTranslation(language);
  const stats = getStats();

  const malePercent = stats.total > 0 ? Math.round((stats.male / stats.total) * 100) : 0;
  const femalePercent = stats.total > 0 ? Math.round((stats.female / stats.total) * 100) : 0;

  return (
    <section aria-label="Electoral Statistics" className="mb-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Electors */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-orange-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-slate-500">
              {t.totalElectors}
            </span>
            <div className="p-2.5 rounded-xl bg-orange-100/80 text-orange-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {stats.total.toLocaleString()}
            </span>
            <span className="text-xs text-orange-700 font-semibold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
              {filters.partNo === 'all' ? (language === 'mr' ? '२ मतदान केंद्र' : '2 Booths') : `भाग #${filters.partNo}`}
            </span>
          </div>
        </div>

        {/* Male Electors */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-slate-500">
              {t.maleElectors}
            </span>
            <div className="p-2.5 rounded-xl bg-amber-100/80 text-amber-700">
              <User className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {stats.male.toLocaleString()}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              {malePercent}%
            </span>
          </div>
        </div>

        {/* Female Electors */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-slate-500">
              {t.femaleElectors}
            </span>
            <div className="p-2.5 rounded-xl bg-rose-100/80 text-rose-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {stats.female.toLocaleString()}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
              {femalePercent}%
            </span>
          </div>
        </div>

        {/* Households / Families */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-orange-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-slate-500">
              {t.totalFamilies}
            </span>
            <div className="p-2.5 rounded-xl bg-orange-100/80 text-orange-600">
              <Home className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {stats.families.toLocaleString()}
            </span>
            <span className="text-xs text-orange-700 font-semibold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
              {language === 'mr' ? 'कुटुंबे' : 'Units'}
            </span>
          </div>
        </div>
      </div>

      {/* Active Booth Notice */}
      <div className="mt-3.5 flex items-center justify-between bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/80 px-4 py-2.5 rounded-2xl text-xs text-orange-950 font-semibold shadow-xs">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
          <span>
            {filters.partNo === 'all'
              ? (language === 'mr'
                  ? 'सध्या सर्व मतदान केंद्र (भाग क्र. १५७ आणि १५८) मधील मतदार दाखवले जात आहेत.'
                  : 'Showing electors across all configured parts (Booth No. 157 & 158).')
              : (language === 'mr'
                  ? `फिल्टर लागू: भाग क्रमांक ${filters.partNo} (चांदवड)`
                  : `Filtered by: Booth / Part #${filters.partNo} (Chandwad)`)}
          </span>
        </div>
        <span className="font-bold text-orange-700 bg-white/80 px-2.5 py-1 rounded-lg border border-orange-200">
          {stats.total} {t.votersFound}
        </span>
      </div>
    </section>
  );
};
