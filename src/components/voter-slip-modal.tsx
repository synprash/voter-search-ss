'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useVoterStore } from '@/lib/store/use-voter-store';
import { getTranslation } from '@/lib/i18n/translations';
import {
  X,
  Printer,
  Phone,
  Building,
  MapPin,
  ShieldCheck,
  Save,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const VoterSlipModal: React.FC = () => {
  const {
    selectedVoter,
    setSelectedVoter,
    language,
    updateVoterMobile,
  } = useVoterStore();
  const t = getTranslation(language);

  const [mobileVal, setMobileVal] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (selectedVoter) {
      setMobileVal(selectedVoter.mobile_no || '');
      setSavedSuccess(false);
    }
  }, [selectedVoter]);

  if (!selectedVoter) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSaveMobile = async () => {
    if (!selectedVoter) return;
    setIsSaving(true);
    const ok = await updateVoterMobile(selectedVoter.id, mobileVal);
    setIsSaving(false);
    if (ok) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const v = selectedVoter;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-voter-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full border border-orange-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Slip Header with Shiv Sena Saffron Banner */}
        <div className="bg-gradient-to-r from-[#d94e00] via-[#f77324] to-[#ff7b25] text-white p-5 relative border-b border-amber-300/40">
          <button
            type="button"
            onClick={() => setSelectedVoter(null)}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            title={t.close}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0">
              <Image
                src="/images/shivsena-logo.svg"
                alt="Shiv Sena Logo"
                width={40}
                height={40}
                className="object-contain w-full h-full"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-200 uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>शिवसेना शहर चांदवड • अधिकृत मतदार पर्ची</span>
              </div>
              <h3 id="modal-voter-title" className="text-lg sm:text-xl font-black mt-0.5 text-white">
                {t.modalTitle}
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                ११८ - {v.assembly_name_mr} ({v.assembly_name_en}) • भाग क्र. {v.part_no}
              </p>
            </div>
          </div>
        </div>

        {/* Printable Slip Body */}
        <div className="p-6 space-y-4" id="printable-slip">
          {/* Key Identifiers: Serial No & EPIC */}
          <div className="grid grid-cols-2 gap-3 bg-orange-50/60 p-4 rounded-2xl border border-orange-200/80">
            <div>
              <span className="text-[11px] font-bold text-orange-950 uppercase tracking-wider block">
                {t.serialNo} (भाग अनुक्रमांक)
              </span>
              <span className="text-3xl font-black text-orange-600 font-mono">
                {v.serial_no}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-orange-950 uppercase tracking-wider block">
                {t.epicNo} (ओळखपत्र क्र.)
              </span>
              <span className="text-lg sm:text-xl font-bold text-slate-900 font-mono">
                {v.epic_no || '—'}
              </span>
            </div>
          </div>

          {/* Voter Demographics */}
          <div className="space-y-3 text-sm">
            <div className="border-b border-orange-100 pb-2.5">
              <span className="text-xs font-bold text-slate-500 block">
                {t.voterName} (मतदाराचे नाव)
              </span>
              <div className="text-lg font-black text-slate-900">
                {v.voter_name_en}
              </div>
              {v.voter_name_mr && (
                <div className="text-base font-bold text-orange-600">
                  {v.voter_name_mr}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-orange-100 pb-2.5">
              <div>
                <span className="text-xs font-bold text-slate-500 block">
                  {v.relation_type_en} ({v.relation_type_mr})
                </span>
                <span className="font-semibold text-slate-800">
                  {v.relative_name_en}
                </span>
                {v.relative_name_mr && (
                  <span className="block text-xs font-medium text-slate-600">
                    {v.relative_name_mr}
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 block">
                  {t.gender} / {t.age} (लिंग / वय)
                </span>
                <span className="font-semibold text-slate-800">
                  {v.gender_en} ({v.gender_mr}) • {v.age} वर्षे
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-orange-100 pb-2.5">
              <div>
                <span className="text-xs font-bold text-slate-500 block">
                  {t.householdNumber} (कुटुंब क्र.)
                </span>
                <span className="font-bold text-orange-900 bg-orange-100 px-2.5 py-0.5 rounded border border-orange-300 inline-block mt-0.5">
                  #{v.family_id} ({v.family_role_mr || v.family_role_en})
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 block">
                  {t.houseNo} (घर क्रमांक / पत्ता)
                </span>
                <span className="font-semibold text-slate-800">
                  {v.house_no || v.address_en || '—'}
                </span>
              </div>
            </div>

            {/* Mobile Number Update Card (Admin) */}
            <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-orange-950 block">
                    {language === 'mr' ? 'मतदार मोबाईल क्रमांक' : 'Voter Mobile Number'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {language === 'mr' ? 'अद्ययावत करण्यासाठी जतन करा' : 'Edit & save to Supabase'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="tel"
                  maxLength={15}
                  value={mobileVal}
                  onChange={(e) => setMobileVal(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="w-36 px-2.5 py-1.5 bg-white border border-orange-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#f77324]"
                />
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveMobile}
                  className="px-3.5 py-1.5 rounded-lg bg-[#f77324] hover:bg-[#d94e00] text-white text-xs font-bold flex items-center gap-1 shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : savedSuccess ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{savedSuccess ? 'जतन झाले' : 'जतन करा'}</span>
                </button>
              </div>
            </div>

            {/* Polling Station Information */}
            <div className="bg-orange-50/70 rounded-2xl p-4 border border-orange-200 space-y-2 text-xs text-orange-950">
              <div className="flex items-start gap-2.5">
                <Building className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">
                    {t.pollingStation} (मतदान केंद्र):
                  </span>
                  <span className="font-medium">{v.polling_station_en}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-1 border-t border-orange-200/60">
                <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">
                    {t.section} (विभाग):
                  </span>
                  <span className="font-medium">{v.section_name_en}</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic text-center">
            शिवसेना शहर चांदवड जनसंपर्क कक्ष • {t.disclaimer}
          </p>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-orange-50/30 px-6 py-4 border-t border-orange-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => setSelectedVoter(null)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {t.close}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#d94e00] to-[#f77324] hover:brightness-110 text-white shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            {t.print} (पर्ची छापा)
          </button>
        </div>
      </div>
    </div>
  );
};
