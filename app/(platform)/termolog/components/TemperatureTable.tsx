'use client';

import React, { useState, useMemo } from 'react';
import { Trash2, Edit2, AlertCircle, ChevronDown, ChevronRight, Save, X, CloudOff } from 'lucide-react';
import { TemperatureEntry } from '../types';

interface TemperatureTableProps {
    data: TemperatureEntry[];
    onDelete: (id: string) => Promise<void>;
    onUpdate: (id: string, updates: { value?: number | null, date?: string }) => Promise<void>;
}

const TemperatureTable: React.FC<TemperatureTableProps> = ({ data, onDelete, onUpdate }) => {
    // Grouping state
    const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

    // Editing state (Temperature)
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');

    // Editing state (Time)
    const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
    const [editTimeValue, setEditTimeValue] = useState<string>('');

    // Pre-expand the first month (most recent)
    useMemo(() => {
        if (data.length > 0) {
            const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const latestMonth = sorted[0].date.substring(0, 7); // YYYY-MM
            setExpandedMonths(prev => ({ ...prev, [latestMonth]: true }));
        }
    }, [data.length]);

    const groupedData = useMemo(() => {
        const groups: Record<string, TemperatureEntry[]> = {};
        data.forEach(entry => {
            const monthKey = entry.date.substring(0, 7); // YYYY-MM
            if (!groups[monthKey]) groups[monthKey] = [];
            groups[monthKey].push(entry);
        });
        return groups;
    }, [data]);

    const sortedMonthKeys = Object.keys(groupedData).sort((a, b) => b.localeCompare(a));

    const toggleMonth = (key: string) => {
        setExpandedMonths(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Temperature Edit Handlers
    const startEdit = (entry: TemperatureEntry) => {
        setEditingId(entry.id);
        setEditValue(entry.value !== null ? entry.value.toString() : '');
        setEditingTimeId(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValue('');
    };

    const saveEdit = async (id: string) => {
        const val = editValue === '' ? null : parseFloat(editValue.replace(',', '.'));
        if (editValue !== '' && isNaN(val as number)) return; // Invalid input

        await onUpdate(id, { value: val });
        setEditingId(null);
    };

    // Time Edit Handlers
    const startTimeEdit = (entry: TemperatureEntry) => {
        const dateObj = new Date(entry.date);
        const hours = dateObj.getHours().toString().padStart(2, '0');
        const mins = dateObj.getMinutes().toString().padStart(2, '0');
        setEditTimeValue(`${hours}:${mins}`);
        setEditingTimeId(entry.id);
        setEditingId(null);
    };

    const cancelTimeEdit = () => {
        setEditingTimeId(null);
        setEditTimeValue('');
    };

    const saveTimeEdit = async (entry: TemperatureEntry) => {
        if (!editTimeValue) return;

        const [h, m] = editTimeValue.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return;

        const originalDate = new Date(entry.date);
        // Preserve year, month, day. Update hour, min.
        const newDate = new Date(
            originalDate.getFullYear(),
            originalDate.getMonth(),
            originalDate.getDate(),
            h,
            m,
            0 // seconds 0
        );

        await onUpdate(entry.id, { date: newDate.toISOString() });
        setEditingTimeId(null);
    };


    const formatMonthName = (yyyymm: string) => {
        const [year, month] = yyyymm.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });
    };

    const calculateAverage = (entries: TemperatureEntry[]) => {
        const valid = entries.filter(e => e.value !== null);
        if (valid.length === 0) return null;
        const sum = valid.reduce((acc, curr) => acc + (curr.value || 0), 0);
        return (sum / valid.length).toFixed(1);
    };

    if (!data.length) {
        return (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-500">Zatím žádné záznamy v historii.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {sortedMonthKeys.map(monthKey => {
                const entries = groupedData[monthKey].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                const avg = calculateAverage(entries);
                const isExpanded = expandedMonths[monthKey];

                return (
                    <div key={monthKey} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <button
                            onClick={() => toggleMonth(monthKey)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                            <div className="flex items-center font-semibold text-slate-700 capitalize">
                                {isExpanded ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                                {formatMonthName(monthKey)}
                            </div>
                            <div className="text-sm text-slate-500 font-medium">
                                {avg ? `Průměr: ${avg} °C` : 'Bez dat'}
                                <span className="mx-2 text-slate-300">|</span>
                                <span className="text-slate-400 font-normal">{entries.length} záznamů</span>
                            </div>
                        </button>

                        {isExpanded && (
                            <div className="overflow-x-auto border-t border-slate-100">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead className="bg-white text-slate-400">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs uppercase font-medium">Datum a Čas</th>
                                            <th className="px-4 py-2 text-left text-xs uppercase font-medium">Teplota</th>
                                            <th className="px-4 py-2 text-right text-xs uppercase font-medium">Akce</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {entries.map((entry) => (
                                            <tr key={entry.id} className="hover:bg-slate-50/50 group">
                                                {/* Date & Time Column */}
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                                                    <div className="font-medium">
                                                        {new Date(entry.date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}
                                                    </div>

                                                    {editingTimeId === entry.id ? (
                                                        <div className="flex items-center space-x-1 mt-1">
                                                            <input
                                                                type="time"
                                                                value={editTimeValue}
                                                                onChange={e => setEditTimeValue(e.target.value)}
                                                                className="px-1 py-0.5 border border-blue-300 rounded text-xs focus:ring-2 focus:ring-blue-100 outline-none w-20 bg-white"
                                                                autoFocus
                                                                onKeyDown={e => e.key === 'Enter' && saveTimeEdit(entry)}
                                                            />
                                                            <button onClick={() => saveTimeEdit(entry)} className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100"><Save className="w-3 h-3" /></button>
                                                            <button onClick={cancelTimeEdit} className="p-1 bg-gray-50 text-gray-400 rounded hover:bg-gray-100"><X className="w-3 h-3" /></button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-slate-400 mt-1 flex items-center group/edit-time">
                                                            {new Date(entry.date).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                                                            <button
                                                                onClick={() => startTimeEdit(entry)}
                                                                className="ml-2 text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                                title="Upravit čas"
                                                            >
                                                                <Edit2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Temperature Column */}
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {editingId === entry.id ? (
                                                        <div className="flex items-center space-x-1">
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                value={editValue}
                                                                onChange={e => setEditValue(e.target.value)}
                                                                className="w-20 px-2 py-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                                                                placeholder="---"
                                                                autoFocus
                                                                onKeyDown={e => e.key === 'Enter' && saveEdit(entry.id)}
                                                            />
                                                            <button onClick={() => saveEdit(entry.id)} className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100"><Save className="w-3 h-3" /></button>
                                                            <button onClick={cancelEdit} className="p-1 bg-gray-50 text-gray-400 rounded hover:bg-gray-100"><X className="w-3 h-3" /></button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center group/edit-temp">
                                                            {entry.value !== null ? (
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-sm font-bold
                                                                    ${(entry.value < 19 || entry.value > 26) ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}
                                                                `}>
                                                                    {entry.value.toFixed(1)} °C
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-sm font-medium bg-gray-100 text-gray-500">
                                                                    <CloudOff className="w-3 h-3 mr-1.5" />
                                                                    Neměřeno
                                                                </span>
                                                            )}

                                                            <button
                                                                onClick={() => startEdit(entry)}
                                                                className="ml-2 text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                                title="Upravit teplotu"
                                                            >
                                                                <Edit2 className="w-3 h-3" />
                                                            </button>

                                                            {entry.isAutoGenerated && (
                                                                <span title="Automaticky generováno" className="ml-1 text-amber-400">
                                                                    <AlertCircle size={12} />
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Actions Column */}
                                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                                                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => onDelete(entry.id)}
                                                            className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Smazat záznam"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default TemperatureTable;
