'use client';

import React from 'react';
import { useVoterStore } from '@/lib/store/use-voter-store';
import { getTranslation } from '@/lib/i18n/translations';
import { exportVotersToCsv } from '@/lib/utils';
import {
  Search,
  RotateCcw,
  Table as TableIcon,
  Users2,
  Download,
  X
} from 'lucide-react';

export const SearchFilters: React.FC = () => {
  const {
    language,
    filters,
    setFilter,
    resetFilters,
    viewMode,
    setViewMode,
    getFilteredVoters
  } = useVoterStore();

  const t = getTranslation(language);

  const handleExport = () => {
    const data = getFilteredVoters();
    const filename = `shivsena-chandwad-voters-part-${filters.partNo}-export.csv`;
    exportVotersToCsv(data, filename);
  };

  const hasActiveFilters =
    Boolean(filters.query) ||
    filters.partNo !== 'all' ||
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
        {/* Booth / Part Selector */}
        <div>
          <label htmlFor="booth-filter" className="block text-xs font-bold text-slate-700 mb-1">
            {t.part}
          </label>
          <select
            id="booth-filter"
            value={filters.partNo}
            onChange={(e) =>
              setFilter(
                'partNo',
                e.target.value === 'all' ? 'all' : Number(e.target.value)
              )
            }
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#f77324] focus:border-transparent font-medium"
          >
            <option value="all">{t.allParts}</option>
            <option value="158">
              {language === 'mr' ? 'भाग १५८ - चांदवड (नेमिनाथ शाळा खोली ५)' : 'Booth 158 - Chandwad'}
            </option>
            <option value="157">
              {language === 'mr' ? 'भाग १५७ - चांदवड (नेमिनाथ शाळा खोली ३)' : 'Booth 157 - Chandwad'}
            </option>
          </select>
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
