import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  User,
  CheckCircle,
  Clock3,
  ArrowRight,
  Sparkles,
  Edit2,
  XCircle,
  AlertCircle,
  CheckCircle2,
  CalendarClock,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { NewBookingModal } from './NewBookingModal';
import { Booking, Customer, Service, User as ArtistUser } from '../../types';
import { formatRupiah, formatDate } from '../../utils/format';
import { useCartStore } from '../../store/cartStore';
import api from '../../lib/axios';

interface BookingViewProps {
  onNavigateToPos: () => void;
}

export const BookingView: React.FC<BookingViewProps> = ({ onNavigateToPos }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [artists, setArtists] = useState<ArtistUser[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Reschedule modal state
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('11:00');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const { addItem, setCustomer, setArtist, setAppointment } = useCartStore();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [selectedDate, statusFilter]);

  const fetchInitialData = async () => {
    try {
      const [custRes, staffRes, srvRes] = await Promise.all([
        api.get('/customers'),
        api.get('/staff?role=ARTIST'),
        api.get('/catalog/services'),
      ]);
      if (custRes.data.success) setCustomers(custRes.data.data);
      if (staffRes.data.success) setArtists(staffRes.data.data);
      if (srvRes.data.success) setServices(srvRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let url = `/bookings?date=${selectedDate}`;
      if (statusFilter !== 'ALL') {
        url += `&status=${statusFilter}`;
      }
      const res = await api.get(url);
      if (res.data.success) {
        setBookings(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status });
      fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendToPos = (booking: Booking) => {
    setCustomer(booking.customer);
    setArtist(booking.artist?.id || null, booking.artist?.name || null);
    setAppointment(booking.id, booking.downPaymentAmount || 0);

    booking.items.forEach((item) => {
      if (item.service) {
        addItem(item.service, [], booking.artist?.id, booking.artist?.name);
      }
    });

    handleUpdateStatus(booking.id, 'IN_PROGRESS');
    onNavigateToPos();
  };

  const handleOpenReschedule = (booking: Booking) => {
    setRescheduleBooking(booking);
    setNewDate(booking.date);
    setNewTime(booking.startTime);
    setRescheduleError(null);
  };

  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleBooking) return;

    setIsRescheduling(true);
    setRescheduleError(null);

    try {
      const res = await api.put(`/bookings/${rescheduleBooking.id}`, {
        date: newDate,
        startTime: newTime,
      });

      if (res.data.success) {
        setRescheduleBooking(null);
        fetchBookings();
      }
    } catch (err: any) {
      setRescheduleError(err.response?.data?.message || 'Jadwal bentrok atau gagal mengubah jadwal.');
    } finally {
      setIsRescheduling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="amber">Menunggu</Badge>;
      case 'CONFIRMED':
        return <Badge variant="pink">Terkonfirmasi</Badge>;
      case 'CHECKED_IN':
        return <Badge variant="indigo">Hadir (Check-in)</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="indigo">Sedang Dikerjakan</Badge>;
      case 'COMPLETED':
        return <Badge variant="emerald">Selesai</Badge>;
      case 'CANCELLED':
        return <Badge variant="slate">Dibatalkan</Badge>;
      case 'NO_SHOW':
        return <Badge variant="rose">Tidak Hadir (No Show)</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <Calendar size={16} className="text-blush-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="ALL">Semua Status Booking</option>
            <option value="PENDING">Menunggu Konfirmasi</option>
            <option value="CONFIRMED">Terkonfirmasi</option>
            <option value="CHECKED_IN">Check-in (Hadir)</option>
            <option value="IN_PROGRESS">Sedang Dikerjakan</option>
            <option value="COMPLETED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
            <option value="NO_SHOW">Tidak Hadir (No Show)</option>
          </select>

          <span className="text-xs text-slate-500 font-medium">
            Total {bookings.length} Janji Temu
          </span>
        </div>

        <Button
          variant="primary"
          size="md"
          className="flex items-center gap-2 shadow-sm"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={16} />
          <span>Tambah Booking Baru</span>
        </Button>
      </div>

      {/* Bookings Timeline / Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Memuat jadwal booking...
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
            <Clock3 size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">Belum Ada Janji Temu di Tanggal Ini</p>
            <p className="text-xs text-slate-400 mt-1">
              Klik tombol "Tambah Booking Baru" untuk menjadwalkan pelanggan.
            </p>
          </div>
        ) : (
          bookings.map((booking) => (
            <div
              key={booking.id}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
            >
              {/* Left Column: Time & Customer */}
              <div className="flex items-start gap-4">
                <div className="w-24 text-center py-2 px-2.5 rounded-xl bg-rose-50/70 border border-rose-100 flex-shrink-0">
                  <span className="text-xs font-black text-blush-700 block">
                    {booking.startTime}
                  </span>
                  <span className="text-[10px] text-slate-400">s/d {booking.endTime}</span>
                  <span className="text-[9px] font-bold text-slate-500 block mt-0.5">
                    ({booking.totalDuration} mnt)
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-sm text-slate-900">{booking.customer.name}</h3>
                    {getStatusBadge(booking.status)}
                    {(booking.downPaymentAmount || 0) > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        💰 DP: {formatRupiah(booking.downPaymentAmount || 0)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    No. Telp: {booking.customer.phone}
                    {booking.customer.nailShapePreference && (
                      <span className="ml-2 text-rose-600 font-semibold">
                        • Kuku: {booking.customer.nailShapePreference}
                      </span>
                    )}
                  </p>
                  {booking.notes && (
                    <p className="text-xs text-slate-600 italic mt-1 bg-slate-50 px-2 py-1 rounded-md inline-block">
                      "{booking.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Middle Column: Artist & Services */}
              <div className="flex flex-col md:items-start text-xs text-slate-600">
                <span className="font-semibold text-slate-800">
                  💅 Nail Artist: <span className="text-blush-700">{booking.artist?.name}</span>
                </span>
                <span className="text-slate-400 mt-0.5">
                  Layanan: {booking.items.map((it) => it.service?.name).join(', ')}
                </span>
                <span className="font-bold text-slate-900 mt-1">
                  Estimasi Biaya: {formatRupiah(booking.totalPrice)}
                </span>
              </div>

              {/* Right Column: Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Status Quick Changer Dropdown */}
                <select
                  value={booking.status}
                  onChange={(e) => handleUpdateStatus(booking.id, e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value="PENDING">Menunggu</option>
                  <option value="CONFIRMED">Terkonfirmasi</option>
                  <option value="CHECKED_IN">Hadir (Check-in)</option>
                  <option value="IN_PROGRESS">Sedang Dikerjakan</option>
                  <option value="COMPLETED">Selesai</option>
                  <option value="CANCELLED">Dibatalkan</option>
                  <option value="NO_SHOW">No Show</option>
                </select>

                {/* Reschedule Button */}
                {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => handleOpenReschedule(booking)}
                    title="Ubah Jadwal"
                  >
                    <CalendarClock size={14} />
                    <span className="hidden sm:inline">Reschedule</span>
                  </Button>
                )}

                {/* POS Button */}
                {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-1.5 shadow-xs"
                    onClick={() => handleSendToPos(booking)}
                  >
                    <span>Buka di Kasir POS</span>
                    <ArrowRight size={14} />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Booking Modal */}
      <NewBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customers={customers}
        artists={artists}
        services={services}
        onBookingCreated={() => {
          fetchBookings();
        }}
      />

      {/* Reschedule Modal */}
      {rescheduleBooking && (
        <Modal
          isOpen={Boolean(rescheduleBooking)}
          onClose={() => setRescheduleBooking(null)}
          title="Ubah Jadwal Janji Temu (Reschedule)"
          subtitle={`Pelanggan: ${rescheduleBooking.customer.name} • Nail Artist: ${rescheduleBooking.artist?.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveReschedule} className="space-y-4">
            {rescheduleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{rescheduleError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tanggal Baru:
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Jam Mulai Baru:
                </label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                >
                  {[
                    '09:00',
                    '10:00',
                    '11:00',
                    '12:00',
                    '13:00',
                    '14:00',
                    '15:00',
                    '16:00',
                    '17:00',
                    '18:00',
                    '19:00',
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t} WIB
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              Durasi pengerjaan: <strong>{rescheduleBooking.totalDuration} menit</strong>.
              Sistem akan otomatis mengecek agar tidak terjadi bentrok jadwal bagi Nail Artist.
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setRescheduleBooking(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={isRescheduling}
              >
                {isRescheduling ? 'Menyimpan...' : 'Simpan Jadwal Baru'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
