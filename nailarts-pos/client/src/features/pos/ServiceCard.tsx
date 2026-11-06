import React from 'react';
import { Clock, Plus, Sparkles } from 'lucide-react';
import { Service } from '../../types';
import { formatRupiah } from '../../utils/format';

interface ServiceCardProps {
  service: Service;
  onSelect: (service: Service) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onSelect }) => {
  const hasAddons = service.addons && service.addons.length > 0;

  return (
    <div
      onClick={() => onSelect(service)}
      className="group relative bg-white rounded-2xl border border-slate-200/70 p-4 hover:border-blush-400 hover:shadow-lg hover:shadow-rose-100/50 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-blush-700 uppercase tracking-wider">
            {service.category?.name || 'Service'}
          </span>
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
            <Clock size={12} />
            <span>{service.durationMinutes} mnt</span>
          </div>
        </div>

        <h3 className="font-bold text-slate-800 text-sm group-hover:text-blush-700 transition-colors line-clamp-2">
          {service.name}
        </h3>

        {service.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {service.description}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 block font-medium">Harga Dasar</span>
          <span className="text-sm font-extrabold text-slate-900">
            {formatRupiah(service.basePrice)}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-50 group-hover:bg-blush-600 group-hover:text-white text-slate-700 transition-colors">
          <Plus size={14} />
          <span>{hasAddons ? 'Pilih Add-on' : 'Tambah'}</span>
        </div>
      </div>
    </div>
  );
};
