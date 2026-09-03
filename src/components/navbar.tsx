'use client';

import React from 'react';
import Image from 'next/image';
import { useVoterStore } from '@/lib/store/use-voter-store';
import { getTranslation } from '@/lib/i18n/translations';
import { Languages, CheckCircle2, Database, UserCheck, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    language,
    setLanguage,
    isUsingSupabase,
    isLoadingData,
    adminUser,
    logout,
  } = useVoterStore();
  const t = getTranslation(language);

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-[#d94e00] via-[#f77324] to-[#ff7b25] text-white shadow-md border-b border-amber-300/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Shiv Sena Official Logo & Branding */}
          <div className="flex items-center space-x-3.5">
            {/* Shiv Sena Logo from shivsenacentraloffice.com */}
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-lg shadow-orange-950/30 border-2 border-amber-300 shrink-0">
              <Image
                src="/images/shivsena-logo.svg"
                alt="Shiv Sena Official Logo"
                width={52}
                height={52}
                className="object-contain w-full h-full"
                priority
              />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Official Branding Heading */}
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm font-sans">
                  शिवसेना शहर चांदवड
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-white/20 text-white border border-white/40 shadow-xs backdrop-blur-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-amber-200" />
                  अधिकृत मतदार यादी २०२६
                </span>
                {/* Database Source Badge */}
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-black/25 text-amber-100 border border-white/20"
                  title={
                    isUsingSupabase
                      ? 'Connected to Supabase Cloud PostgreSQL'
                      : 'Running bundled local seed dataset'
                  }
                >
                  <Database className="w-3 h-3 mr-1 text-amber-300" />
                  {isLoadingData
                    ? 'Connecting...'
                    : isUsingSupabase
                    ? 'Supabase Live'
                    : 'Local Cache'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-amber-100 font-medium mt-0.5 drop-shadow-xs">
                {language === 'mr'
                  ? '११८ - चांदवड विधानसभा मतदारसंघ • २० - दिंडोरी लोकसभा मतदारसंघ • मतदार शोध व कुटुंब संपर्क प्रणाली'
                  : '118 - Chandwad Assembly Constituency • 20 - Dindori Lok Sabha • Voter Search & Family Registry'}
              </p>
            </div>
          </div>

          {/* Right Controls: Language Switcher & Admin Profile */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            {/* Language Switcher */}
            <div className="flex items-center bg-black/25 p-1 rounded-xl border border-white/20 shadow-inner">
              <div className="flex items-center px-2 text-xs font-semibold text-amber-100">
                <Languages className="w-3.5 h-3.5 mr-1 text-amber-200" />
                <span className="hidden md:inline">भाषा / Lang:</span>
              </div>

              <button
                type="button"
                onClick={() => setLanguage('mr')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-150 ${
                  language === 'mr'
                    ? 'bg-white text-orange-700 shadow-md scale-102'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                मराठी
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-150 ${
                  language === 'en'
                    ? 'bg-white text-orange-700 shadow-md scale-102'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('bilingual')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-150 ${
                  language === 'bilingual'
                    ? 'bg-white text-orange-700 shadow-md scale-102'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                दोन्ही (Bilingual)
              </button>
            </div>

            {/* Admin User Badge & Logout */}
            <div className="flex items-center gap-1.5 bg-black/25 p-1 rounded-xl border border-white/20">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-200">
                <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Admin:</span> {adminUser || 'admin'}
              </span>
              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white/20 hover:bg-red-600 text-white transition-all shadow-xs"
                title="Log out of Admin Session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">बाहेर पडा</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
