'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useVoterStore } from '@/lib/store/use-voter-store';
import { getTranslation } from '@/lib/i18n/translations';
import { exportVotersToCsv } from '@/lib/utils';
import {
  Search,
  RotateCcw,
  Table as TableIcon,
  Users2,
  Download,
  X,
  ChevronDown,
  Check
} from 'lucide-react';

export const SearchFilters: React.FC = () => {
  const {
    language,
    filters,
    setFilter,
    selectAllBooths,
    resetFilters,
    viewMode,
    setViewMode,
    getFilteredVoters,
    booths
  } = useVoterStore();

  const [isBoothOpen, setIsBoothOpen] = useState(false);
  const boothRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (boothRef.current && !boothRef.current.contains(e.target as Node)) {
        setIsBoothOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsBoothOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const selectedPartNos = filters.partNos || [];

  const handleToggleBooth = (partNo: number) => {
    if (selectedPartNos.length === 0) {
      setFilter('partNos', [partNo]);
    } else if (selectedPartNos.includes(partNo)) {
      const next = selectedPartNos.filter((p) => p !== partNo);
      setFilter('partNos', next);
    } else {
      const next = [...selectedPartNos, partNo];
      if (next.length === booths.length) {
        setFilter('partNos', []);
      } else {
        setFilter('partNos', next);
      }
    }
  };

  const t = getTranslation(language);

  const handleExport = () => {
    const data = getFilteredVoters();
    const partsTag = selectedPartNos.length > 0 ? selectedPartNos.join('-') : 'all';
    const filename = `shivsena-chandwad-voters-part-${partsTag}-export.csv`;
    exportVotersToCsv(data, filename);
  };

  const hasActiveFilters =
    Boolean(filters.query) ||
    selectedPartNos.length > 0 ||
    Boolean(filters.gender) ||
    Boolean(filters.ageBracket) ||
    Boolean(filters.familyId);

  return (
    <section aria-label="Search and Filtering" className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4 sm:p-6 mb-6">
      {/* Primary Search Bar */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-orange-400">
          <Search className="h-5 w-5" />
        </div>
        <input
          id="voter-search-input"
          type="text"
          value={filters.query}
          onChange={(e) => setFilter('query', e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full pl-10 pr-10 py-3 bg-orange-50/30 border border-orange-200 rounded-xl text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f77324] focus:border-transparent transition-all shadow-inner"
        />
        {filters.query && (
          <button
            type="button"
            onClick={() => setFilter('query', '')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-orange-600"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Dynamic Multi-Select Booth / Part Selector */}
        <div className="relative" ref={boothRef}>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="booth-multi-select" className="block text-xs font-bold text-slate-700">
              {t.part}
            </label>
            {selectedPartNos.length > 0 && (
              <button
                type="button"
                onClick={selectAllBooths}
                className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
              >
                {language === 'mr' ? 'सर्व निवडा' : 'Select all'}
              </button>
            )}
          </div>

          {/* Trigger Button */}
          <button
            id="booth-multi-select"
            type="button"
            onClick={() => setIsBoothOpen((prev) => !prev)}
            className={`w-full px-3 py-2.5 bg-white border rounded-xl text-left text-sm flex items-center justify-between gap-2 transition-all cursor-pointer shadow-xs ${
              isBoothOpen
                ? 'border-orange-500 ring-2 ring-orange-500/20'
                : 'border-slate-300 hover:border-slate-400'
            }`}
            aria-expanded={isBoothOpen}
            aria-haspopup="listbox"
          >
            <div className="flex items-center gap-1.5 overflow-hidden flex-1">
              {selectedPartNos.length === 0 ? (
                <span className="font-semibold text-slate-800 truncate">
                  {t.allParts}
                </span>
              ) : selectedPartNos.length === 1 ? (
                <span className="font-semibold text-orange-950 truncate flex items-center gap-1.5">
                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-md font-bold">
                    #{selectedPartNos[0]}
                  </span>
                  <span className="truncate text-xs sm:text-sm">
                    {(() => {
                      const b = booths.find((x) => x.part_no === selectedPartNos[0]);
                      return language === 'mr'
                        ? (b?.station_name_mr || `भाग ${selectedPartNos[0]}`)
                        : (b?.station_name_en || `Booth ${selectedPartNos[0]}`);
                    })()}
                  </span>
                </span>
              ) : (
                <span className="font-semibold text-orange-950 flex items-center gap-1.5 truncate">
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {selectedPartNos.length}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-700">
                    {language === 'mr' ? 'केंद्र निवडले' : 'Booths selected'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                    ({selectedPartNos.sort((a, b) => a - b).join(', ')})
                  </span>
                </span>
              )}
            </div>

            <ChevronDown
              className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                isBoothOpen ? 'rotate-180 text-orange-600' : ''
              }`}
            />
          </button>

          {/* Multi-Select Dropdown Popover */}
          {isBoothOpen && (
            <div
              className="absolute z-50 mt-1.5 w-full sm:w-80 bg-white rounded-2xl shadow-xl border border-orange-200/90 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
              role="listbox"
              aria-multiselectable="true"
            >
              {/* Header: All Booths Option */}
              <div className="px-2 pb-1.5 border-b border-slate-100">
                <button
                  type="button"
                  onClick={selectAllBooths}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    selectedPartNos.length === 0
                      ? 'bg-orange-50 text-orange-900 font-black'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        selectedPartNos.length === 0
                          ? 'bg-orange-600 border-orange-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {selectedPartNos.length === 0 && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span>{t.allParts}</span>
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                    {booths.length} {language === 'mr' ? 'केंद्र' : 'Booths'}
                  </span>
                </button>
              </div>

              {/* Scrollable List of Individual Booths */}
              <div className="max-h-64 overflow-y-auto px-2 py-1 space-y-0.5 divide-y divide-slate-50">
                {booths.map((b) => {
                  const isChecked = selectedPartNos.includes(b.part_no);
                  const stationName =
                    language === 'mr'
                      ? (b.station_address_mr || b.station_name_mr || `भाग ${b.part_no}`)
                      : (b.station_address_en || b.station_name_en || `Booth ${b.part_no}`);

                  return (
                    <button
                      key={b.part_no}
                      type="button"
                      onClick={() => handleToggleBooth(b.part_no)}
                      className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-orange-50/70 text-orange-950 font-medium'
                          : 'hover:bg-slate-50 text-slate-750'
                      }`}
                      role="option"
                      aria-selected={isChecked}
                    >
                      <span
                        className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-orange-600 border-orange-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-bold text-slate-900">
                            {language === 'mr' ? `भाग ${b.part_no}` : `Booth ${b.part_no}`}
                          </span>
                          {b.total_electors ? (
                            <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                              {b.total_electors} {language === 'mr' ? 'मतदार' : 'electors'}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 leading-snug">
                          {stationName}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer status / actions */}
              <div className="px-3 pt-2 pb-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  {selectedPartNos.length === 0
                    ? (language === 'mr' ? 'सर्व केंद्र सक्रिय' : 'All booths active')
                    : `${selectedPartNos.length} / ${booths.length} ${language === 'mr' ? 'निवडले' : 'selected'}`}
                </span>
                <button
                  type="button"
                  onClick={() => setIsBoothOpen(false)}
                  className="font-bold text-orange-600 hover:text-orange-700 px-2 py-0.5 rounded hover:bg-orange-50 cursor-pointer"
                >
                  {language === 'mr' ? 'पूर्ण' : 'Done'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Family / Household Number */}
        <div>
          <label htmlFor="family-id-filter" className="block text-xs font-bold text-slate-700 mb-1">
            {t.householdNumber}
          </label>
          <input
            id="family-id-filter"
            type="number"
            min="1"
            value={filters.familyId}
            onChange={(e) => setFilter('familyId', e.target.value)}
            placeholder={language === 'mr' ? 'उदा. १६०' : 'e.g. 160'}
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#f77324] focus:border-transparent font-medium"
          />
        </div>

        {/* Gender Filter */}
        <div>
          <label htmlFor="gender-filter" className="block text-xs font-bold text-slate-700 mb-1">
            {t.gender}
          </label>
          <select
            id="gender-filter"
            value={filters.gender}
            onChange={(e) => setFilter('gender', e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#f77324] focus:border-transparent font-medium"
          >
            <option value="">{t.allGenders}</option>
            <option value="Male">{t.male}</option>
            <option value="Female">{t.female}</option>
            <option value="Third Gender">{t.thirdGender}</option>
          </select>
        </div>

        {/* Age Filter */}
        <div>
          <label htmlFor="age-filter" className="block text-xs font-bold text-slate-700 mb-1">
            {t.age}
          </label>
          <select
            id="age-filter"
            value={filters.ageBracket}
            onChange={(e) => setFilter('ageBracket', e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#f77324] focus:border-transparent font-medium"
          >
            <option value="">{t.allAges}</option>
            <option value="18-25">{t.age18_25}</option>
            <option value="26-40">{t.age26_40}</option>
            <option value="41-60">{t.age41_60}</option>
            <option value="61+">{t.age61Plus}</option>
          </select>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="mt-4 pt-4 border-t border-orange-100 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Reset and active indicator */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-orange-800 bg-orange-100/70 hover:bg-orange-200 border border-orange-300 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t.reset}
            </button>
          )}
        </div>

        {/* Right: View Toggles & Export CSV */}
        <div className="flex items-center gap-2.5">
          {/* Dual View Mode Toggle */}
          <div className="inline-flex bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-gradient-to-r from-[#d94e00] to-[#f77324] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              {t.tableView}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('family')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'family'
                  ? 'bg-gradient-to-r from-[#d94e00] to-[#f77324] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Users2 className="w-3.5 h-3.5" />
              {t.familyView}
            </button>
          </div>

          {/* Export to CSV */}
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#d94e00] via-[#f77324] to-[#ff7b25] hover:brightness-110 text-white shadow-md shadow-orange-600/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            {t.exportCsv}
          </button>
        </div>
      </div>
    </section>
  );
};
