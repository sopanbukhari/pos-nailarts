import { create } from 'zustand';

export type SalonIconType = 'flower' | 'sparkles' | 'crown' | 'gem' | 'heart' | 'brush' | 'star';
export type SalonColorTheme = 'blush' | 'purple' | 'emerald' | 'amber' | 'blue' | 'slate';

export interface SalonSettings {
  name: string;
  tagline: string;
  icon: SalonIconType;
  customLogoUrl?: string; // Base64 data url atau URL gambar
  colorTheme: SalonColorTheme;
  branchName: string;
  address: string;
  phone: string;
  instagram: string;
  footerNote: string;
}

const DEFAULT_SETTINGS: SalonSettings = {
  name: 'NailArt Studio',
  tagline: 'Salon & POS System',
  icon: 'flower',
  customLogoUrl: '',
  colorTheme: 'blush',
  branchName: 'Cabang Utama - Senopati',
  address: 'Jl. Senopati Raya No. 42, Kebayoran Baru, Jakarta Selatan',
  phone: '0812-3456-7890',
  instagram: '@nailart.studio',
  footerNote: 'Kuku cantik & terawat adalah kebahagiaan kami 💅',
};

const STORAGE_KEY = 'nailart_salon_settings';

function loadStoredSettings(): SalonSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to load salon settings from localStorage', err);
  }
  return DEFAULT_SETTINGS;
}

interface SalonStoreState {
  settings: SalonSettings;
  updateSettings: (newSettings: Partial<SalonSettings>) => void;
  resetSettings: () => void;
}

export const useSalonStore = create<SalonStoreState>((set) => ({
  settings: loadStoredSettings(),

  updateSettings: (newSettings) => {
    set((state) => {
      const updated = { ...state.settings, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save salon settings', err);
      }
      return { settings: updated };
    });
  },

  resetSettings: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {}
    set({ settings: DEFAULT_SETTINGS });
  },
}));
