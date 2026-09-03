'use client';

import React, { useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { StatsCards } from '@/components/stats-cards';
import { SearchFilters } from '@/components/search-filters';
import { VoterTable } from '@/components/voter-table';
import { FamilyCardsView } from '@/components/family-cards-view';
import { VoterSlipModal } from '@/components/voter-slip-modal';
import { AdminLogin } from '@/components/admin-login';
import { useVoterStore } from '@/lib/store/use-voter-store';
import { getTranslation } from '@/lib/i18n/translations';
import { ShieldCheck, Info, Loader2 } from 'lucide-react';

export default function Home() {
  const {
    isAuthenticated,
    isCheckingAuth,
    checkAuth,
    viewMode,
    language,
  } = useVoterStore();

  const t = getTranslation(language);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-xs text-blue-200/80 font-medium">
          Verifying security session...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col antialiased">
      {/* Navigation & Header */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Electoral Stats Ribbon */}
        <StatsCards />

        {/* Search & Filter Toolbar */}
        <SearchFilters />

        {/* Dynamic View: Table or Family Cards */}
        {viewMode === 'table' ? <VoterTable /> : <FamilyCardsView />}

        {/* Voter Slip Printable Modal */}
        <VoterSlipModal />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-orange-100 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-orange-950 font-semibold">
            <ShieldCheck className="w-4 h-4 text-orange-600" />
            <span>शिवसेना शहर चांदवड जनसंपर्क कक्ष • Admin Session Active • Powered by Supabase PostgreSQL</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Info className="w-3.5 h-3.5" />
            <span>{t.disclaimer}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
