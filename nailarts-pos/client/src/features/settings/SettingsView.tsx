import React, { useState, useRef } from 'react';
import {
  Store,
  Flower2,
  Sparkles,
  Crown,
  Gem,
  Heart,
  Paintbrush,
  Star,
  Upload,
  Check,
  RotateCcw,
  Save,
  Image as ImageIcon,
  MapPin,
  Phone,
  Instagram,
  FileText,
} from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useSalonStore, SalonIconType, SalonColorTheme, SalonSettings } from '../../store/salonStore';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSalonStore();
  const [form, setForm] = useState<SalonSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const icons: Array<{ id: SalonIconType; label: string; icon: any }> = [
    { id: 'flower', label: 'Bunga Sakura', icon: Flower2 },
    { id: 'sparkles', label: 'Kilau Glamour', icon: Sparkles },
    { id: 'crown', label: 'Mahkota Ratu', icon: Crown },
    { id: 'gem', label: 'Permata Kristal', icon: Gem },
    { id: 'heart', label: 'Cinta & Hati', icon: Heart },
    { id: 'brush', label: 'Kuas Nail Art', icon: Paintbrush },
    { id: 'star', label: 'Bintang Emas', icon: Star },
  ];

  const colors: Array<{ id: SalonColorTheme; label: string; gradient: string }> = [
    { id: 'blush', label: 'Blush Pink', gradient: 'from-blush-600 to-rose-400' },
    { id: 'purple', label: 'Royal Purple', gradient: 'from-purple-600 to-pink-500' },
    { id: 'emerald', label: 'Emerald Mint', gradient: 'from-emerald-600 to-teal-400' },
    { id: 'amber', label: 'Luxury Gold', gradient: 'from-amber-500 to-yellow-400' },
    { id: 'blue', label: 'Ocean Sky', gradient: 'from-sky-600 to-indigo-500' },
    { id: 'slate', label: 'Midnight Slate', gradient: 'from-slate-900 to-slate-700' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setForm((prev) => ({ ...prev, customLogoUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomLogo = () => {
    setForm((prev) => ({ ...prev, customLogoUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Apakah Anda yakin ingin mengembalikan pengaturan ke nama dan logo bawaan?')) {
      resetSettings();
      // Reload current settings from store
      setTimeout(() => {
        const stored = useSalonStore.getState().settings;
        setForm({ ...stored });
      }, 50);
    }
  };

  const currentThemeGradient =
    colors.find((c) => c.id === form.colorTheme)?.gradient || 'from-blush-600 to-rose-400';

  const CurrentIcon =
    icons.find((i) => i.id === form.icon)?.icon || Flower2;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Live Preview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[11px] font-bold text-rose-300 uppercase tracking-widest bg-rose-500/20 px-3 py-1 rounded-full border border-rose-500/30">
              Live Preview Brand Studio
            </span>
            <h3 className="text-xl font-black mt-2 text-white tracking-tight">
              Tampilan Langsung Identitas Salon
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Logo, nama salon, dan informasi cabang yang terlihat di Sidebar, Header, dan Struk Pembayaran.
            </p>
          </div>

          {/* Mini Sidebar Preview Card */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex items-center gap-3.5 shadow-md">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${currentThemeGradient} flex items-center justify-center text-white shadow-md overflow-hidden flex-shrink-0`}
            >
              {form.customLogoUrl ? (
                <img
                  src={form.customLogoUrl}
                  alt="Custom Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <CurrentIcon size={24} className="animate-spin-slow" />
              )}
            </div>
            <div>
              <h4 className="font-extrabold text-base text-white tracking-tight leading-tight">
                {form.name || 'Nama Salon Anda'}
              </h4>
              <p className="text-[11px] font-medium text-rose-200 tracking-wider uppercase mt-0.5">
                {form.tagline || 'Tagline Salon'}
              </p>
              <p className="text-[10px] text-slate-300 mt-1 flex items-center gap-1">
                <Store size={10} className="text-rose-300" />
                <span>{form.branchName}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Nama & Tagline Salon */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-blush-50 text-blush-600 flex items-center justify-center font-bold">
              <Store size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Nama & Slogan Studio</h3>
              <p className="text-xs text-slate-400">Identitas utama yang muncul di sistem POS dan struk</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Nail Art Studio / Salon"
              placeholder="Contoh: Bella Nail Art & Spa"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Tagline / Slogan Sub-judul"
              placeholder="Contoh: Luxury Nail & Lash Studio"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            />
          </div>
        </div>

        {/* Card 2: Pilihan Ikon atau Upload Logo Gambar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Ikon & Logo Brand</h3>
              <p className="text-xs text-slate-400">Pilih ikon cantik bawaan atau unggah file foto/logo salon Anda sendiri</p>
            </div>
          </div>

          {/* Opsi 1: Pilihan Ikon Lucide Preset */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
              1. Pilihan Ikon Vektor Salon
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {icons.map((item) => {
                const IconComponent = item.icon;
                const isSelected = form.icon === item.id && !form.customLogoUrl;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setForm({ ...form, icon: item.id, customLogoUrl: '' })}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blush-500 bg-rose-50/80 ring-2 ring-blush-500/20 text-blush-700 font-bold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <IconComponent size={22} className={isSelected ? 'text-blush-600' : 'text-slate-400'} />
                    <span className="text-[10px] text-center leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opsi 2: Upload Custom Logo */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              2. Atau Unggah File Logo / Foto Salon Sendiri (PNG / JPG)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${currentThemeGradient} flex items-center justify-center text-white shadow-md overflow-hidden flex-shrink-0 border-2 border-white`}
              >
                {form.customLogoUrl ? (
                  <img
                    src={form.customLogoUrl}
                    alt="Custom Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon size={28} className="text-white/80" />
                )}
              </div>

              <div className="space-y-1 text-center sm:text-left flex-1">
                <p className="text-xs font-bold text-slate-800">
                  {form.customLogoUrl ? 'Logo Kustom Aktif' : 'Belum Ada Logo Kustom'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Format disarankan persegi (1:1), PNG transparan atau JPG maksimal 2MB.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5"
                >
                  <Upload size={14} />
                  <span>Pilih Gambar</span>
                </Button>
                {form.customLogoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveCustomLogo}
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs"
                  >
                    Hapus Logo
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Opsi 3: Pilihan Warna Tema Gradien Logo */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
              3. Warna Tema & Gradien Aksen Logo
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {colors.map((c) => {
                const isSelected = form.colorTheme === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setForm({ ...form, colorTheme: c.id })}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-800/10 font-bold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${c.gradient} flex-shrink-0 shadow-xs`}
                    ></span>
                    <span className="text-[11px] text-slate-700 truncate">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 3: Informasi Cabang, Alamat, dan Struk Thermal */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Informasi Cabang & Format Struk</h3>
              <p className="text-xs text-slate-400">Data yang tercetak pada header & footer struk kasir serta WhatsApp</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Cabang / Outlet"
              placeholder="Contoh: Cabang Utama - Senopati"
              icon={<Store size={16} />}
              value={form.branchName}
              onChange={(e) => setForm({ ...form, branchName: e.target.value })}
            />
            <Input
              label="Nomor Telepon / WhatsApp Salon"
              placeholder="Contoh: 0812-3456-7890"
              icon={<Phone size={16} />}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <Input
            label="Alamat Lengkap Salon"
            placeholder="Contoh: Jl. Senopati Raya No. 42, Kebayoran Baru, Jakarta Selatan"
            icon={<MapPin size={16} />}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Instagram Salon"
              placeholder="Contoh: @nailart.studio"
              icon={<Instagram size={16} />}
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
            />
            <Input
              label="Pesan Catatan Kaki Struk (Footer)"
              placeholder="Contoh: Kuku cantik & terawat adalah kebahagiaan kami 💅"
              value={form.footerNote}
              onChange={(e) => setForm({ ...form, footerNote: e.target.value })}
            />
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset ke Pengaturan Bawaan</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {savedSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 animate-fade-in">
                <Check size={14} className="text-emerald-600" />
                <span>Pengaturan Berhasil Disimpan!</span>
              </span>
            )}

            <Button
              type="submit"
              variant="primary"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6"
            >
              <Save size={16} />
              <span>Simpan Perubahan</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
