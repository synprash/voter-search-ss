import { create } from 'zustand';
import { Voter, Booth, LanguageMode, VoterFilters, VoterStats } from '../types';
import seedVoters from '../data/seed-voters.json';
import seedBooths from '../data/seed-booths.json';

interface VoterStoreState {
  // Auth state
  isAuthenticated: boolean;
  adminUser: string | null;
  isCheckingAuth: boolean;

  // App state
  language: LanguageMode;
  viewMode: 'table' | 'family';
  filters: VoterFilters;
  selectedVoter: Voter | null;
  allVoters: Voter[];
  booths: Booth[];
  isUsingSupabase: boolean;
  isLoadingData: boolean;

  // Actions
  checkAuth: () => Promise<void>;
  login: (username: string) => void;
  logout: () => Promise<void>;
  setLanguage: (lang: LanguageMode) => void;
  setViewMode: (mode: 'table' | 'family') => void;
  setFilter: <K extends keyof VoterFilters>(key: K, value: VoterFilters[K]) => void;
  resetFilters: () => void;
  setSelectedVoter: (voter: Voter | null) => void;
  loadFromSupabase: () => Promise<void>;
  updateVoterMobile: (voterId: string, mobileNo: string) => Promise<boolean>;
  getFilteredVoters: () => Voter[];
  getStats: () => VoterStats;
}

const initialFilters: VoterFilters = {
  query: '',
  partNo: 'all',
  gender: '',
  ageBracket: '',
  familyId: '',
};

export const useVoterStore = create<VoterStoreState>((set, get) => ({
  isAuthenticated: false,
  adminUser: null,
  isCheckingAuth: true,

  language: 'en',
  viewMode: 'table',
  filters: initialFilters,
  selectedVoter: null,
  allVoters: seedVoters as Voter[],
  booths: seedBooths as Booth[],
  isUsingSupabase: false,
  isLoadingData: false,

  checkAuth: async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        set({
          isAuthenticated: true,
          adminUser: data.user?.username || 'admin',
          isCheckingAuth: false,
        });
        get().loadFromSupabase();
      } else {
        set({
          isAuthenticated: false,
          adminUser: null,
          isCheckingAuth: false,
        });
      }
    } catch {
      set({
        isAuthenticated: false,
        adminUser: null,
        isCheckingAuth: false,
      });
    }
  },

  login: (username: string) => {
    set({
      isAuthenticated: true,
      adminUser: username,
    });
    get().loadFromSupabase();
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      set({
        isAuthenticated: false,
        adminUser: null,
      });
    }
  },

  setLanguage: (language) => set({ language }),
  setViewMode: (viewMode) => set({ viewMode }),
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  resetFilters: () => set({ filters: initialFilters }),
  setSelectedVoter: (selectedVoter) => set({ selectedVoter }),

  loadFromSupabase: async () => {
    set({ isLoadingData: true });
    try {
      const res = await fetch('/api/voters');
      const json = await res.json();
      if (json.voters && json.voters.length > 0) {
        set({
          allVoters: json.voters as Voter[],
          isUsingSupabase: json.source === 'supabase_postgres',
        });
      }
    } catch (err) {
      console.warn('Failed to load voters from API, using local seed:', err);
    } finally {
      set({ isLoadingData: false });
    }
  },

  updateVoterMobile: async (voterId: string, mobileNo: string) => {
    const cleanMobile = mobileNo.trim();
    try {
      const res = await fetch('/api/voters/update-mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId, mobileNo: cleanMobile }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update mobile number');
      }

      // Update state in memory immediately
      set((state) => ({
        allVoters: state.allVoters.map((v) =>
          v.id === voterId ? { ...v, mobile_no: cleanMobile } : v
        ),
        selectedVoter:
          state.selectedVoter?.id === voterId
            ? { ...state.selectedVoter, mobile_no: cleanMobile }
            : state.selectedVoter,
      }));

      return true;
    } catch (err) {
      console.error('Mobile update error:', err);
      return false;
    }
  },

  getFilteredVoters: () => {
    const { allVoters, filters } = get();
    const q = filters.query.trim().toLowerCase();
    const partNo = filters.partNo;
    const gender = filters.gender;
    const ageBracket = filters.ageBracket;
    const familyId = filters.familyId.trim();

    return allVoters.filter((v) => {
      // 1. Part / Booth filter
      if (partNo !== 'all' && v.part_no !== partNo) {
        return false;
      }

      // 2. Family ID filter
      if (familyId && String(v.family_id) !== familyId) {
        return false;
      }

      // 3. Gender filter
      if (gender) {
        const matchesGender =
          v.gender_en.toLowerCase() === gender.toLowerCase() ||
          v.gender_mr === gender;
        if (!matchesGender) return false;
      }

      // 4. Age bracket filter
      if (ageBracket) {
        const age = v.age;
        if (ageBracket === '18-25' && (age < 18 || age > 25)) return false;
        if (ageBracket === '26-40' && (age < 26 || age > 40)) return false;
        if (ageBracket === '41-60' && (age < 41 || age > 60)) return false;
        if (ageBracket === '61+' && age < 61) return false;
      }

      // 5. Bilingual text & mobile number query search
      if (q) {
        const searchableText = [
          v.voter_name_en,
          v.voter_name_mr,
          v.relative_name_en,
          v.relative_name_mr,
          v.epic_no,
          v.mobile_no,
          v.address_en,
          v.address_mr,
          v.house_no,
          String(v.serial_no),
          String(v.family_id),
          v.section_name_en,
          v.section_name_mr,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(q)) return false;
      }

      return true;
    });
  },

  getStats: () => {
    const filtered = get().getFilteredVoters();
    const male = filtered.filter(
      (v) => v.gender_en === 'Male' || v.gender_mr === 'पुरुष'
    ).length;
    const female = filtered.filter(
      (v) => v.gender_en === 'Female' || v.gender_mr === 'महिला'
    ).length;
    const uniqueFamilies = new Set(filtered.map((v) => v.family_id)).size;
    const uniqueBooths = new Set(filtered.map((v) => v.part_no)).size;

    return {
      total: filtered.length,
      male,
      female,
      families: uniqueFamilies,
      boothCount: uniqueBooths,
    };
  },
}));
