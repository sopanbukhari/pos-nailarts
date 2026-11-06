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
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { NewBookingModal } from './NewBookingModal';
import { Booking, Customer, Service, User as ArtistUser } from '../../types';
import { formatRupiah } from '../../utils/format';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { addItem, setCustomer, setArtist } = useCartStore();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [selectedDate]);

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
      const res = await api.get(`/bookings?date=${selectedDate}`);
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
    setArtist(booking.artist.id, booking.artist.name);

    booking.items.forEach((item) => {
      if (item.service) {
        addItem(item.service, [], booking.artist.id, booking.artist.name);
      }
    });

    handleUpdateStatus(booking.id, 'IN_PROGRESS');
    onNavigateToPos();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge variant="pink">Terkonfirmasi</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="indigo">Sedang Dikerjakan</Badge>;
      case 'COMPLETED':
        return <Badge variant="emerald">Selesai</Badge>;
      case 'CANCELLED':
        return <Badge variant="slate">Dibatalkan</Badge>;
      default:
        return <Badge variant="amber">Menunggu</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <Calendar size={16} className="text-blush-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
            />
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Total {bookings.length} Janji Temu Hari Ini
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
                <div className="w-20 text-center py-2 px-2.5 rounded-xl bg-rose-50/70 border border-rose-100 flex-shrink-0">
                  <span className="text-xs font-black text-blush-700 block">
                    {booking.startTime}
                  </span>
                  <span className="text-[10px] text-slate-400">s/d {booking.endTime}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm text-slate-900">{booking.customer.name}</h3>
                    {getStatusBadge(booking.status)}
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
                  Layanan: {booking.items.map(it => it.service?.name).join(', ')}
                </span>
                <span className="font-bold text-slate-900 mt-1">
                  Estimasi: {formatRupiah(booking.totalPrice)}
                </span>
              </div>

              {/* Right Column: Actions */}
              <div className="flex items-center gap-2">
                {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-1.5"
                    onClick={() => handleSendToPos(booking)}
                  >
                    <span>Buka di Kasir POS</span>
                    <ArrowRight size={14} />
                  </Button>
                )}

                {booking.status === 'CONFIRMED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus(booking.id, 'IN_PROGRESS')}
                  >
                    Mulai Treatment
                  </Button>
                )}

                {booking.status === 'IN_PROGRESS' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleUpdateStatus(booking.id, 'COMPLETED')}
                  >
                    Tandai Selesai
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

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
    </div>
  );
};
