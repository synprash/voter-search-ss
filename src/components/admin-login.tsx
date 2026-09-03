'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useVoterStore } from '@/lib/store/use-voter-store';
import { ShieldCheck, User, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { login } = useVoterStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'प्रवेश अयशस्वी झाला (Authentication failed)');
      } else {
        login(data.user?.username || username);
      }
    } catch (err: any) {
      setError(err.message || 'नेटवर्क त्रुटी आली (Network error during login)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-neutral-900 to-orange-950 flex flex-col items-center justify-center p-4 sm:p-6 text-white relative overflow-hidden">
      {/* Saffron Ambient Glows */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white/10 backdrop-blur-2xl border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Official Shiv Sena Logo */}
        <div className="text-center relative flex flex-col items-center">
          <div className="h-20 w-20 rounded-2xl bg-white p-2.5 flex items-center justify-center shadow-xl shadow-orange-950/40 border-2 border-amber-400 mb-3.5">
            <Image
              src="/images/shivsena-logo.svg"
              alt="Shiv Sena Official Logo"
              width={70}
              height={70}
              className="object-contain w-full h-full"
              priority
            />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans drop-shadow-sm">
            शिवसेना शहर चांदवड
          </h2>
          <p className="text-xs font-bold text-amber-300 uppercase tracking-widest mt-1">
            ११८ - चांदवड विधानसभा मतदारसंघ
          </p>
          <p className="text-xs text-stone-300 mt-2 max-w-xs">
            मतदार यादी शोध, पडताळणी आणि मोबाईल क्रमांक अद्ययावत करण्यासाठी प्रशासकीय लॉगिन आवश्यक आहे.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs text-center font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1">
              वापरकर्ता नाव (Username)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="उदा. admin"
                className="w-full pl-10 pr-3 py-2.5 bg-black/40 border border-amber-500/30 rounded-xl text-sm text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#f77324] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1">
              पासवर्ड (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-black/40 border border-amber-500/30 rounded-xl text-sm text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#f77324] focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#d94e00] via-[#f77324] to-[#ff7b25] hover:brightness-110 text-white font-extrabold text-sm shadow-lg shadow-orange-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-6 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>प्रमाणित करत आहे (Authenticating)...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-amber-200" />
                <span>सुरक्षित लॉगिन करा (Sign In)</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer Branding */}
      <div className="mt-8 text-center text-xs text-amber-200/60">
        <span>शिवसेना शहर चांदवड • सर्व हक्क राखीव २०२६</span>
      </div>
    </div>
  );
};
