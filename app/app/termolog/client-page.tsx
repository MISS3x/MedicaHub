'use client';

import React, { useTransition } from 'react';
import { ArrowLeft, Cloud, CloudOff, RefreshCw, Download, Database, TrendingUp, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import EntryForm from './components/EntryForm';
import TemperatureChart from './components/TemperatureChart';
import TemperatureTable from './components/TemperatureTable';
import { TemperatureEntry } from './types';
import { addEntry, deleteEntry } from './actions';

interface TermoLogClientProps {
    initialEntries: TemperatureEntry[];
    organizationId: string;
}

export default function TermoLogClient({ initialEntries, organizationId }: TermoLogClientProps) {
    const [isPending, startTransition] = useTransition();
    const [isChartExpanded, setIsChartExpanded] = React.useState(true);

    // Calculate stats
    const validEntries = initialEntries.filter(e => e.value !== null);
    const averageTemp = validEntries.length > 0
        ? (validEntries.reduce((acc, curr) => acc + (curr.value || 0), 0) / validEntries.length).toFixed(1)
        : "0";

    const handleAddEntry = async (value: number | null) => {
        if (value === null) return;
        startTransition(async () => {
            await addEntry(organizationId, value);
        });
    };

    const handleDeleteEntry = async (id: string) => {
        if (!confirm('Opravdu smazat záznam?')) return;
        startTransition(async () => {
            await deleteEntry(id);
        });
    };

    const handleExport = () => {
        // Reuse logic from old app
        const sorted = [...initialEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const textContent = sorted.map(e => {
            const dateStr = new Date(e.date).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
            return `${dateStr} - ${e.value !== null ? e.value.toFixed(1) + ' °C' : 'Neměřeno'}`;
        }).join('\n');

        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `termolog_export_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen pb-12 bg-slate-50">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Link
                                href="/hub"
                                className="mr-4 p-2 -ml-2 text-pink-500 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all"
                                title="Zpět na Hub"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            {/* Logo placeholder - using text/icon for now or Next/Image if available */}
                            <div className="h-8 w-8 relative mr-3">
                                <Image src="/logo.svg" alt="Logo" fill className="object-contain" />
                            </div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">FineMedica <span className="text-blue-600">TermoLog</span></h1>

                            <div className="ml-6 flex items-center">
                                {/* Status indicator always synced for now since we are SSR */}
                                <div className="flex items-center text-xs font-medium p-2 sm:px-3 sm:py-1.5 rounded-full transition-all bg-green-50 text-green-600">
                                    <Cloud className="w-4 h-4 sm:w-3 sm:h-3 sm:mr-1" />
                                    <span className="hidden sm:inline">Online</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex items-center p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                title="Obnovit data"
                            >
                                <RefreshCw className={`w-5 h-5 ${isPending ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={handleExport}
                                className="flex items-center p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                title="Stáhnout textový přehled"
                            >
                                <Download className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
                <section>
                    <EntryForm onSubmit={handleAddEntry} isLoading={isPending} />
                </section>

                <section className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center">
                                <TrendingUp className="w-5 h-5 mr-2 text-blue-500" /> Aktuální Přehled
                            </h2>
                            <button onClick={() => setIsChartExpanded(!isChartExpanded)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                                {isChartExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                        </div>
                        <div className="flex space-x-6 text-sm">
                            <div className="text-right">
                                <span className="text-slate-400 text-[10px] uppercase font-bold block">Průměr</span>
                                <span className="font-bold text-slate-700">{averageTemp}°C</span>
                            </div>
                            <div className="text-right border-l border-slate-200 pl-6">
                                <span className="text-slate-400 text-[10px] uppercase font-bold block">Záznamů</span>
                                <span className="font-bold text-slate-700">{initialEntries.length}</span>
                            </div>
                        </div>
                    </div>
                    {isChartExpanded && <TemperatureChart data={initialEntries} />}
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center"><Database className="w-5 h-5 mr-2 text-slate-400" /> Historie</h2>
                    </div>
                    <div className={`transition-opacity ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
                        <TemperatureTable data={initialEntries} onDelete={handleDeleteEntry} />
                    </div>
                </section>
            </main>

            <footer className="mt-12 text-center text-slate-400 text-xs pb-8">
                <p>&copy; {new Date().getFullYear()} FineMedica TermoLog • Data uložena v cloudu</p>
            </footer>
        </div>
    );
}
