'use client';

import React, { useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';

interface EntryFormProps {
    onSubmit: (temp: number | null) => Promise<void>;
    isLoading?: boolean;
}

const EntryForm: React.FC<EntryFormProps> = ({ onSubmit, isLoading = false }) => {
    const [temperature, setTemperature] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!temperature) return;

        const val = parseFloat(temperature.replace(',', '.'));
        if (!isNaN(val)) {
            await onSubmit(val);
            setTemperature('');
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <PlusCircle className="w-5 h-5 mr-2 text-blue-500" /> Nový Záznam
            </h3>
            <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                <div className="flex-1">
                    <label htmlFor="temp-input" className="block text-sm font-medium text-slate-500 mb-1 ml-1">
                        Teplota (°C)
                    </label>
                    <div className="relative">
                        <input
                            id="temp-input"
                            type="number"
                            step="0.1"
                            value={temperature}
                            onChange={(e) => setTemperature(e.target.value)}
                            className="block w-full rounded-xl border-slate-200 pl-4 pr-12 py-3 text-2xl font-bold text-slate-900 focus:border-blue-500 focus:ring-blue-500 bg-slate-50 transition-all placeholder:text-slate-300"
                            placeholder="00.0"
                            disabled={isLoading}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">°C</span>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={!temperature || isLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-medium transition-all shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 flex items-center justify-center min-w-[120px]"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Uložit'}
                </button>
            </form>
        </div>
    );
};

export default EntryForm;
