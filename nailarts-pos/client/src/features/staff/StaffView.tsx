import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Award,
  Percent,
  DollarSign,
  Edit,
  Phone,
  Mail,
  Sparkles,
  CheckCircle,
  Clock,
  Calendar,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { formatRupiah, formatDate } from '../../utils/format';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/axios';

export const StaffView: React.FC = () => {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit commission modal
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [editRate, setEditRate] = useState<number>(20);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payout confirmation modal
  const [payoutTarget, setPayoutTarget] = useState<any | null>(null);
  const [isPayingOut, setIsPayingOut] = useState(false);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    fetchStaffAndCommissions();
  }, []);

  const fetchStaffAndCommissions = async () => {
    setLoading(true);
    try {
      const [commRes, staffRes] = await Promise.all([
        api.get('/staff/commissions'),
        api.get('/staff'),
      ]);
      if (commRes.data.success) setCommissions(commRes.data.data);
      if (staffRes.data.success) setStaffList(staffRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCommission = async () => {
    if (!selectedStaff) return;
    setIsSubmitting(true);
    try {
      await api.put(`/staff/${selectedStaff.id}`, {
        commissionRate: editRate / 100,
      });
      setSelectedStaff(null);
      fetchStaffAndCommissions();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayoutCommissions = async () => {
    if (!payoutTarget) return;
    setIsPayingOut(true);
    try {
      const res = await api.post(`/staff/commissions/${payoutTarget.id}/payout`);
      if (res.data.success) {
        setPayoutSuccessMsg(
          `Komisi senilai ${formatRupiah(payoutTarget.pendingCommission)} untuk ${payoutTarget.name} berhasil dicairkan (PAID).`
        );
        setTimeout(() => setPayoutSuccessMsg(null), 4000);
        setPayoutTarget(null);
        fetchStaffAndCommissions();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memproses payout komisi.');
    } finally {
      setIsPayingOut(false);
    }
  };

  return (
    <div className="space-y-6">
      {payoutSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-in fade-in">
          <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
          <span>{payoutSuccessMsg}</span>
        </div>
      )}

      {/* Commission Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {commissions.map((c) => (
          <div
            key={c.id || c.artistId}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-blush-700 bg-rose-50 px-2.5 py-1 rounded-full">
                  💅 {c.commissionRatePercent}% Komisi Per Layanan
                </span>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setSelectedStaff({ id: c.userId || c.artistId, name: c.name });
                      setEditRate(c.commissionRatePercent);
                    }}
                    className="text-slate-400 hover:text-blush-600 p-1 rounded-lg"
                    title="Ubah Tarif Komisi"
                  >
                    <Edit size={14} />
                  </button>
                )}
              </div>

              <h3 className="font-extrabold text-base text-slate-800">{c.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{c.phone || '0812-xxxx-xxxx'}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Treatment Dikerjakan:</span>
                  <span className="font-bold text-slate-800">{c.totalServicesHandled} layanan</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Kontribusi Omzet:</span>
                  <span className="font-bold text-slate-800">{formatRupiah(c.totalGrossGenerated)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Komisi Sudah Ditransfer:</span>
                  <span className="font-bold text-emerald-600">{formatRupiah(c.paidCommission || 0)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-baseline justify-between bg-rose-50/60 p-3 rounded-xl border border-rose-100">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Pending Payout:
                  </span>
                  <span className="text-sm font-black text-blush-700">
                    {formatRupiah(c.pendingCommission || c.totalCommissionPayout)}
                  </span>
                </div>

                {isAdmin && (c.pendingCommission > 0 || c.totalCommissionPayout > 0) && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs shadow-xs"
                    onClick={() => setPayoutTarget(c)}
                  >
                    Cairkan
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Staff Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-800">Daftar Anggota Tim & Nail Artist Salon</h3>
          <span className="text-xs text-slate-400">{staffList.length} Anggota</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Staf</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role / Posisi</th>
                <th className="py-3 px-4">Tarif Komisi (%)</th>
                <th className="py-3 px-4">Status</th>
                {isAdmin && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffList.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800">{s.name}</td>
                  <td className="py-3 px-4 text-slate-500">{s.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {s.roleDisplayName || s.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-blush-700">
                    {Math.round((s.commissionRate || 0) * 100)}%
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={s.isActive ? 'emerald' : 'slate'}>
                      {s.isActive ? 'Aktif' : 'Non-aktif'}
                    </Badge>
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStaff(s);
                          setEditRate(Math.round((s.commissionRate || 0) * 100));
                        }}
                      >
                        Ubah % Komisi
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Commission Modal */}
      <Modal
        isOpen={Boolean(selectedStaff)}
        onClose={() => setSelectedStaff(null)}
        title="Ubah Tarif Komisi Artist"
        subtitle={selectedStaff ? `Konfigurasi bagi hasil untuk ${selectedStaff.name}` : ''}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Persentase Komisi (%):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editRate}
                onChange={(e) => setEditRate(Number(e.target.value))}
                min={0}
                max={100}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-none"
              />
              <span className="text-sm font-bold text-slate-600">%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Contoh: 20% berarti Nail Artist menerima Rp 20.000 dari setiap treatment senilai Rp 100.000.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setSelectedStaff(null)}>
              Batal
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleUpdateCommission}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payout Confirmation Modal */}
      {payoutTarget && (
        <Modal
          isOpen={Boolean(payoutTarget)}
          onClose={() => setPayoutTarget(null)}
          title="Konfirmasi Pencairan Hak Komisi"
          subtitle={`Artist: ${payoutTarget.name}`}
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
              <span className="text-xs text-emerald-800 font-bold block">
                Total Komisi yang Akan Dicairkan:
              </span>
              <span className="text-2xl font-black text-emerald-700 block">
                {formatRupiah(payoutTarget.pendingCommission || payoutTarget.totalCommissionPayout)}
              </span>
              <span className="text-[10px] text-emerald-600">
                Status seluruh komisi pending akan diubah menjadi PAID.
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setPayoutTarget(null)}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="primary"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={isPayingOut}
                onClick={handlePayoutCommissions}
              >
                {isPayingOut ? 'Memproses...' : 'Cairkan Sekarang'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
