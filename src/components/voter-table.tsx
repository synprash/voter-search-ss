'use client';

import React, { useState } from 'react';
import { useVoterStore } from '@/lib/store/use-voter-store';
import { getTranslation } from '@/lib/i18n/translations';
import { Voter } from '@/lib/types';
import {
  Copy,
  Check,
  Eye,
  ChevronLeft,
  ChevronRight,
  Phone,
  Edit2,
  X,
  Loader2,
  UserCheck
} from 'lucide-react';

export const VoterTable: React.FC = () => {
  const {
    language,
    getFilteredVoters,
    setSelectedVoter,
    updateVoterMobile,
  } = useVoterStore();
  const t = getTranslation(language);
  const voters = getFilteredVoters();

  const [copiedEpic, setCopiedEpic] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Inline editing state for mobile numbers
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMobileVal, setEditMobileVal] = useState<string>('');
  const [isSavingMobile, setIsSavingMobile] = useState<boolean>(false);

  const totalPages = Math.max(1, Math.ceil(voters.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pageVoters = voters.slice(startIndex, startIndex + pageSize);

  const handleCopyEpic = (e: React.MouseEvent, epic: string) => {
    e.stopPropagation();
    if (!epic) return;
    navigator.clipboard.writeText(epic);
    setCopiedEpic(epic);
    setTimeout(() => setCopiedEpic(null), 2000);
  };

  const handleStartEditMobile = (e: React.MouseEvent, v: Voter) => {
    e.stopPropagation();
    setEditingId(v.id);
    setEditMobileVal(v.mobile_no || '');
  };

  const handleCancelEditMobile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditMobileVal('');
  };

  const handleSaveMobile = async (e: React.MouseEvent, voterId: string) => {
    e.stopPropagation();
    setIsSavingMobile(true);
    await updateVoterMobile(voterId, editMobileVal);
    setIsSavingMobile(false);
    setEditingId(null);
  };

  const renderName = (v: Voter) => {
    if (language === 'mr') {
      return (
        <span className="font-bold text-slate-900">
          {v.voter_name_mr || v.voter_name_en}
        </span>
      );
    }
    if (language === 'bilingual') {
      return (
        <div>
          <div className="font-bold text-slate-900">{v.voter_name_en}</div>
          {v.voter_name_mr && v.voter_name_mr !== v.voter_name_en && (
            <div className="text-xs font-medium text-orange-950/80">{v.voter_name_mr}</div>
          )}
        </div>
      );
    }
    return (
      <span className="font-bold text-slate-900">{v.voter_name_en}</span>
    );
  };

  const renderRelative = (v: Voter) => {
    const relType = language === 'mr' ? v.relation_type_mr : v.relation_type_en;
    const relName = language === 'mr' ? v.relative_name_mr : v.relative_name_en;

    if (language === 'bilingual') {
      return (
        <div>
          <span className="text-xs font-semibold text-slate-400 block">
            {v.relation_type_en}:
          </span>
          <span className="text-sm font-medium text-slate-800">{v.relative_name_en}</span>
          {v.relative_name_mr && v.relative_name_mr !== v.relative_name_en && (
            <div className="text-xs text-slate-500">{v.relative_name_mr}</div>
          )}
        </div>
      );
    }

    return (
      <div>
        <span className="text-xs font-semibold text-slate-400 block">{relType}:</span>
        <span className="text-sm font-medium text-slate-800">{relName || '—'}</span>
      </div>
    );
  };

  const renderGender = (v: Voter) => {
    const g = language === 'mr' ? v.gender_mr : v.gender_en;
    const isFemale = v.gender_en === 'Female' || v.gender_mr === 'महिला';
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
          isFemale
            ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
            : 'bg-amber-50 text-amber-800 border border-amber-200/80'
        }`}
      >
        {g}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
      {/* Table Header Bar */}
      <div className="px-4 sm:px-6 py-4 border-b border-orange-100 flex items-center justify-between bg-orange-50/20">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900">
            {t.showingResults}
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
            {voters.length.toLocaleString()} {t.votersFound}
          </span>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1050px]">
          <thead>
            <tr className="bg-orange-50/60 border-b border-orange-200 text-xs font-bold text-orange-950 uppercase tracking-wider">
              <th className="py-3 px-3 w-16 text-center">{t.householdNumber}</th>
              <th className="py-3 px-3 w-14 text-center">{t.serialNo}</th>
              <th className="py-3 px-4">{t.voterName}</th>
              <th className="py-3 px-4">{t.epicNo}</th>
              <th className="py-3 px-4 w-44">{language === 'mr' ? 'मोबाईल क्र.' : 'Mobile No.'}</th>
              <th className="py-3 px-3 w-16">{t.age}</th>
              <th className="py-3 px-3 w-20">{t.gender}</th>
              <th className="py-3 px-4">{t.relativeName}</th>
              <th className="py-3 px-4">{t.address}</th>
              <th className="py-3 px-3 text-center w-24">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {pageVoters.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-500">
                  <UserCheck className="w-8 h-8 mx-auto text-orange-300 mb-2" />
                  <p className="text-sm font-medium">{t.noResults}</p>
                </td>
              </tr>
            ) : (
              pageVoters.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => setSelectedVoter(v)}
                  className="hover:bg-orange-50/40 cursor-pointer transition-colors group"
                >
                  {/* Household ID */}
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                      #{v.family_id}
                    </span>
                  </td>

                  {/* Serial No */}
                  <td className="py-3 px-3 text-center font-mono text-xs font-semibold text-slate-700">
                    {v.serial_no}
                  </td>

                  {/* Voter Name */}
                  <td className="py-3 px-4">{renderName(v)}</td>

                  {/* EPIC No */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-orange-950 bg-orange-50/60 px-2 py-1 rounded-md border border-orange-200/80 w-fit">
                      <span>{v.epic_no || '—'}</span>
                      {v.epic_no && (
                        <button
                          type="button"
                          onClick={(e) => handleCopyEpic(e, v.epic_no)}
                          className="text-orange-400 hover:text-orange-700 p-0.5 rounded"
                          title={t.copyEpic}
                        >
                          {copiedEpic === v.epic_no ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Mobile No & Inline Edit */}
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    {editingId === v.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          maxLength={15}
                          value={editMobileVal}
                          onChange={(e) => setEditMobileVal(e.target.value)}
                          placeholder="98XXXXXXXX"
                          className="w-28 px-2 py-1 bg-white border border-orange-400 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                          autoFocus
                        />
                        <button
                          type="button"
                          disabled={isSavingMobile}
                          onClick={(e) => handleSaveMobile(e, v.id)}
                          className="p-1 rounded bg-[#f77324] hover:bg-[#d94e00] text-white disabled:opacity-50 cursor-pointer"
                          title="Save Mobile"
                        >
                          {isSavingMobile ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditMobile}
                          className="p-1 rounded bg-stone-200 hover:bg-stone-300 text-stone-700 cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={(e) => handleStartEditMobile(e, v)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono hover:bg-orange-50 text-slate-800 border border-transparent hover:border-orange-200 cursor-pointer transition-colors"
                        title="Click to edit mobile number"
                      >
                        <Phone className="w-3 h-3 text-orange-500" />
                        <span>{v.mobile_no || <span className="text-orange-400 italic font-sans text-[11px]">+ Add Mobile</span>}</span>
                        <Edit2 className="w-3 h-3 text-slate-300 group-hover:text-orange-600 ml-1" />
                      </div>
                    )}
                  </td>

                  {/* Age */}
                  <td className="py-3 px-3 text-slate-700 font-semibold">{v.age}</td>

                  {/* Gender */}
                  <td className="py-3 px-3">{renderGender(v)}</td>

                  {/* Relation */}
                  <td className="py-3 px-4">{renderRelative(v)}</td>

                  {/* Address */}
                  <td className="py-3 px-4 text-xs text-slate-600 max-w-[180px] truncate">
                    {language === 'mr' ? v.address_mr : v.address_en}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVoter(v);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-orange-50 text-orange-800 hover:bg-gradient-to-r hover:from-[#d94e00] hover:to-[#f77324] hover:text-white transition-all shadow-xs border border-orange-200 hover:border-transparent cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {t.viewDetails}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="px-4 sm:px-6 py-3.5 border-t border-orange-100 flex items-center justify-between bg-orange-50/20">
          <div className="text-xs text-slate-500 font-medium">
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, voters.length)} of{' '}
            {voters.length} electors
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-orange-200 text-slate-700 hover:bg-orange-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-orange-950 px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-orange-200 text-slate-700 hover:bg-orange-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
