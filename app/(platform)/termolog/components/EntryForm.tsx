'use client';

import React, { useState, useEffect } from 'react';
import { PlusCircle, Loader2, Calendar, Clock, CloudOff } from 'lucide-react';

interface EntryFormProps {
    onSubmit: (temp: number | null, date: string) => Promise<void>;
    isLoading?: boolean;
}

const PRESET_TEMPS = [19, 19.5, 20, 20.5, 21, 21.5, 22, 22.5, 23, 23.5, 24, 24.5, 25];

const EntryForm: React.FC<EntryFormProps> = ({ onSubmit, isLoading = false }) => {
    const [temperature, setTemperature] = useState<string>('');
    const [date, setDate] = useState<string>('');
    const [time, setTime] = useState<string>('');

    useEffect(() => {
        const now = new Date();
        // Manual formatting to ensure correct value for input type="date" (YYYY-MM-DD)
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        setDate(`${year}-${month}-${day}`);

        // Manual formatting for input type="time" (HH:MM)
        const hours = now.getHours().toString().padStart(2, '0');
        const mins = now.getMinutes().toString().padStart(2, '0');
        setTime(`${hours}:${mins}`);
    }, []);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Robust construction of Date object from inputs in local time
        const [y, m, d] = date.split('-').map(Number);
        const [h, min] = time.split(':').map(Number);

        // Month is 0-indexed in Date constructor
        const localDate = new Date(y, m - 1, d, h, min, 0);
        const entryDate = localDate.toISOString();

        if (temperature === 'null' || temperature === '') {
            // Neměřeno
            await onSubmit(null, entryDate);
            resetForm();
            return;
        }

        const val = parseFloat(temperature.replace(',', '.'));
        if (!isNaN(val)) {
            await onSubmit(val, entryDate);
            resetForm();
        }
    };

    const resetForm = () => {
        // Keep date/time current or reset? 
        // Usually for consecutive entries maybe keep date? 
        // Use case: logging multiple history entries.
        // But user might want to log "now". 
        // Let's just clear value.
        setTemperature('');
    };

    const handlePreset = (val: number) => {
        setTemperature(val.toString());
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <PlusCircle className="w-5 h-5 mr-2 text-blue-500" /> Nový Záznam
            </h3>

            <div className="flex flex-col gap-4">
                {/* Date & Time Selection */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Datum</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="date"
                                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="w-32">
                        <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Čas</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="time"
                                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Manual Input + Main Action */}
                    <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                        <div className="relative flex-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Teplota (°C)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={temperature === 'null' ? '' : temperature}
                                onChange={(e) => setTemperature(e.target.value)}
                                className="block w-full rounded-xl border-slate-200 pl-4 pr-12 py-3 text-2xl font-bold text-slate-900 focus:border-blue-500 focus:ring-blue-500 bg-slate-50 transition-all placeholder:text-slate-300"
                                placeholder={temperature === 'null' ? "Neměřeno" : "00.0"}
                                disabled={isLoading || temperature === 'null'}
                            />
                            {temperature !== 'null' && (
                                <span className="absolute right-4 top-[38px] -translate-y-1/2 text-slate-400 font-medium">°C</span>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={(!temperature && temperature !== 'null') || isLoading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 flex items-center justify-center min-w-[100px]"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Uložit'}
                        </button>
                    </form>

                    {/* Presets */}
                    <div className="flex flex-wrap gap-2">
                        {PRESET_TEMPS.map(val => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => handlePreset(val)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border
                                    ${temperature === val.toString()
                                        ? 'bg-blue-100 text-blue-700 border-blue-200 ring-2 ring-blue-50'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:border-slate-300'
                                    }`}
                            >
                                {val.toFixed(1)}
                            </button>
                        ))}
                        <div className="w-px h-8 bg-slate-200 mx-1"></div>
                        <button
                            type="button"
                            onClick={() => setTemperature('null')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border flex items-center
                                ${temperature === 'null'
                                    ? 'bg-gray-100 text-gray-700 border-gray-300 ring-2 ring-gray-100'
                                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-white hover:border-slate-300'
                                }`}
                        >
                            <CloudOff className="w-3 h-3 mr-1.5" />
                            Neměřeno
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EntryForm;
