'use client';

import React from 'react';
import { useVoterStore } from '@/lib/store/use-voter-store';
import { getTranslation } from '@/lib/i18n/translations';
import { Voter } from '@/lib/types';
import { Home, Users, MapPin, Eye, Hash, Phone } from 'lucide-react';

export const FamilyCardsView: React.FC = () => {
  const { language, getFilteredVoters, setSelectedVoter } = useVoterStore();
  const t = getTranslation(language);
  const voters = getFilteredVoters();

  // Group voters by family_id
  const groups = voters.reduce<Record<number, Voter[]>>((acc, v) => {
    if (!acc[v.family_id]) acc[v.family_id] = [];
    acc[v.family_id].push(v);
    return acc;
  }, {});

  const sortedFamilyIds = Object.keys(groups)
    .map(Number)
    .sort((a, b) => a - b);

  if (sortedFamilyIds.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-12 text-center text-slate-500">
        <Home className="w-8 h-8 mx-auto text-orange-300 mb-2" />
        <p className="text-sm font-medium">{t.noResults}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-orange-950 uppercase tracking-wider">
          {sortedFamilyIds.length} {t.totalFamilies} ({voters.length} {t.votersFound})
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedFamilyIds.map((famId) => {
          const members = groups[famId];
          const primaryAddress =
            (language === 'mr' ? members[0]?.address_mr : members[0]?.address_en) ||
            members[0]?.house_no ||
            '—';

          return (
            <div
              key={famId}
              className="bg-white rounded-2xl border border-orange-100 shadow-xs hover:shadow-md transition-shadow p-4 sm:p-5"
            >
              {/* Family Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-100 pb-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#d94e00] to-[#f77324] text-white flex items-center justify-center font-black text-xs shadow-xs">
                    #{famId}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {t.familyCardTitle}
                      {famId}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span>{primaryAddress}</span>
                    </div>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200">
                  <Users className="w-3 h-3" />
                  {members.length} {t.members}
                </span>
              </div>

              {/* Family Members Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {members.map((m) => {
                  const role = language === 'mr' ? m.family_role_mr : m.family_role_en;
                  const isFemale = m.gender_en === 'Female' || m.gender_mr === 'महिला';
                  const voterName = language === 'mr' ? m.voter_name_mr : m.voter_name_en;

                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedVoter(m)}
                      className="bg-orange-50/20 hover:bg-orange-50/60 border border-orange-100 rounded-xl p-3 cursor-pointer transition-all hover:border-orange-300 relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-bold text-slate-900 group-hover:text-orange-700 transition-colors">
                            {voterName}
                          </div>
                          {language === 'bilingual' && m.voter_name_mr !== m.voter_name_en && (
                            <div className="text-xs text-orange-950/70 font-medium">
                              {m.voter_name_mr}
                            </div>
                          )}
                        </div>

                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-orange-200 text-orange-800 shrink-0">
                          {role}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 border-t border-orange-100/60 pt-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold ${
                              isFemale ? 'text-rose-600' : 'text-amber-800'
                            }`}
                          >
                            {language === 'mr' ? m.gender_mr : m.gender_en}
                          </span>
                          <span>•</span>
                          <span>{m.age} Yrs</span>
                        </div>

                        <span className="font-mono text-[11px] font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {m.epic_no || '—'}
                        </span>
                      </div>

                      {/* Mobile Number Badge if present */}
                      {m.mobile_no && (
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-mono text-emerald-700 font-semibold">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{m.mobile_no}</span>
                        </div>
                      )}

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-0.5">
                          <Hash className="w-3 h-3" />
                          <span>भाग #{m.part_no} (क्र. {m.serial_no})</span>
                        </span>
                        <span className="text-orange-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                          <Eye className="w-3 h-3" />
                          {t.viewDetails}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
