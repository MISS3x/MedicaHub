'use client';

import React from 'react';
import { Trash2, Edit2, CheckCircle, PackageOpen } from 'lucide-react';
import { MedCheckEntry, DiscardedMed } from '../types';

interface Props {
    data: MedCheckEntry[];
    onDelete: (id: string) => Promise<void>;
    onEdit?: (entry: MedCheckEntry) => void;
}

const MedCheckTable: React.FC<Props> = ({ data, onDelete, onEdit }) => {
    // Sort by date descending
    const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (sortedData.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm">
                <p className="text-slate-500">Zatím žádné záznamy v evidenci.</p>
            </div>
        );
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });
    };

    const renderStatusCell = (isOk: boolean, items: DiscardedMed[]) => {
        if (items.length === 0) {
            // Just OK
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" /> OK
                </span>
            );
        }

        // List items
        return (
            <div className="space-y-1 text-left">
                {items.map(item => (
                    <div key={item.id} className="text-xs flex items-center text-slate-700 bg-red-50 p-1.5 rounded border border-red-100">
                        <PackageOpen className="w-3 h-3 mr-1.5 text-red-400 shrink-0" />
                        <span>
                            <span className="font-semibold">{item.name}</span>
                            <span className="text-slate-500 ml-1">({item.count}ks)</span>
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Měsíc</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Lednice</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Skříňka</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Akce</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedData.map((entry) => {
                            const fridgeItems = entry.discarded ? entry.discarded.filter(d => d.location === 'FRIDGE') : [];
                            const cabinetItems = entry.discarded ? entry.discarded.filter(d => d.location === 'CABINET') : [];

                            return (
                                <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="font-semibold text-slate-900 capitalize">{formatDate(entry.date)}</div>
                                        <div className="text-xs text-slate-400">{new Date(entry.date).toLocaleDateString('cs-CZ')}</div>
                                    </td>

                                    <td className="px-4 py-3 align-top text-center">
                                        {renderStatusCell(entry.fridge_ok, fridgeItems)}
                                    </td>

                                    <td className="px-4 py-3 align-top text-center">
                                        {renderStatusCell(entry.cabinet_ok, cabinetItems)}
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium align-top">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => {
                                                    if (onEdit) onEdit(entry);
                                                    // Scroll to top for UX
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="text-slate-300 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Upravit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(entry.id)}
                                                className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-all"
                                                title="Smazat"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MedCheckTable;
