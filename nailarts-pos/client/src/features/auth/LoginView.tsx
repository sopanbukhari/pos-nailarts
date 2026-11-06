import React, { useState } from 'react';
import { Flower2, Lock, Mail, Sparkles, UserCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/axios';

export const LoginView: React.FC = () => {
  const [email, setEmail] = useState('admin@nailart.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setAuth } = useAuthStore();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        setAuth(res.data.data.user, res.data.data.token);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login gagal. Silakan periksa kembali email dan password.');
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50/40 to-champagne-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-rose-100/60 border border-rose-100 p-8">
        {/* Salon Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blush-600 to-rose-400 mx-auto flex items-center justify-center text-white shadow-lg shadow-blush-200 mb-4">
            <Flower2 size={36} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">NailArt POS Studio</h1>
          <p className="text-xs text-slate-500 mt-1">Sistem Kasir & Manajemen Salon Kuku Terpadu</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email Akun"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@nailart.com"
            icon={<Mail size={16} />}
            required
          />

          <Input
            label="Kata Sandi"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={<Lock size={16} />}
            required
          />

          <Button type="submit" className="w-full py-3" disabled={isLoading}>
            {isLoading ? 'Memproses Masuk...' : 'Masuk ke Sistem POS'}
          </Button>
        </form>

        {/* Demo Quick Access */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
            Akses Cepat Mode Demo:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDemoAccount('admin@nailart.com', 'admin123')}
              className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-blush-700 border border-slate-200/60 transition-all text-center"
            >
              👑 Owner / Admin
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount('kasir@nailart.com', 'kasir123')}
              className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-blush-700 border border-slate-200/60 transition-all text-center"
            >
              💼 Kasir
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount('sarah@nailart.com', 'artist123')}
              className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-blush-700 border border-slate-200/60 transition-all text-center"
            >
              💅 Nail Artist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
