'use client';

import React, { useTransition, useState } from 'react';
import { ArrowLeft, Cloud, RefreshCw, Download, Database, TrendingUp, ChevronUp, ChevronDown, Sparkles, X, Calendar } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import EntryForm from './components/EntryForm';
import TemperatureChart from './components/TemperatureChart';
import TemperatureTable from './components/TemperatureTable';
import { TemperatureEntry } from './types';
import { addEntry, deleteEntry, updateEntry, generateDemoData } from './actions';

interface TermoLogClientProps {
    initialEntries: TemperatureEntry[];
    organizationId: string;
}

export default function TermoLogClient({ initialEntries, organizationId }: TermoLogClientProps) {
    const [isPending, startTransition] = useTransition();
    const [isChartExpanded, setIsChartExpanded] = useState(true);

    // Generator Modal State
    const [showGenerator, setShowGenerator] = useState(false);
    const [genStartDate, setGenStartDate] = useState(() => {
        const d = new Date();
        d.setMonth(0, 1); // Jan 1st of current year
        return d.toISOString().split('T')[0];
    });

    // Calculate stats
    const validEntries = initialEntries.filter(e => e.value !== null);
    const averageTemp = validEntries.length > 0
        ? (validEntries.reduce((acc, curr) => acc + (curr.value || 0), 0) / validEntries.length).toFixed(1)
        : "0";

    const handleAddEntry = async (value: number | null, date: string) => {
        startTransition(async () => {
            await addEntry(organizationId, value, date);
        });
    };

    const handleDeleteEntry = async (id: string) => {
        if (!confirm('Opravdu smazat záznam?')) return;
        startTransition(async () => {
            await deleteEntry(id);
        });
    };

    const handleUpdateEntry = async (id: string, updates: { value?: number | null, date?: string }) => {
        startTransition(async () => {
            await updateEntry(id, updates);
        });
    };

    const confirmGenerate = async () => {
        setShowGenerator(false);
        startTransition(async () => {
            await generateDemoData(organizationId, genStartDate);
        });
    };

    const handleExport = () => {
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
        <div className="min-h-[100dvh] pb-12 bg-slate-50 relative">
            {/* Generator Modal */}
            {showGenerator && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center">
                                <Sparkles className="w-5 h-5 mr-2 text-amber-500" /> Generátor Dat
                            </h3>
                            <button onClick={() => setShowGenerator(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                            Vygeneruje demo data s křivkou teplot (20–22°C) pro pracovní dny.
                            <br />
                            <strong className="text-red-600">POZOR: Přepíše existující data ve zvoleném období!</strong>
                        </p>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Od data</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="date"
                                        value={genStartDate}
                                        onChange={e => setGenStartDate(e.target.value)}
                                        className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-amber-200 font-medium"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Do data</label>
                                <div className="w-full px-4 py-3 border border-slate-100 rounded-xl bg-slate-50 text-slate-400 cursor-not-allowed font-medium flex items-center justify-between">
                                    <span>{new Date().toLocaleDateString('cs-CZ')} (Dnes)</span>
                                    <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-500">Automaticky</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowGenerator(false)}
                                className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                            >
                                Zrušit
                            </button>
                            <button
                                onClick={confirmGenerate}
                                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-200 transition-all active:scale-95"
                            >
                                Generovat
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                            <Link href="/hub" className="h-8 w-8 relative mr-3 hover:opacity-80 transition-opacity">
                                <Image src="/logo.svg" alt="Logo" fill className="object-contain" />
                            </Link>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight"><span className="text-blue-600">TermoLog</span> <span className="text-slate-400 font-normal">| Monitoring teplot</span></h1>

                            <div className="ml-6 flex items-center">
                                <div className="flex items-center text-xs font-medium p-2 sm:px-3 sm:py-1.5 rounded-full transition-all bg-green-50 text-green-600">
                                    <Cloud className="w-4 h-4 sm:w-3 sm:h-3 sm:mr-1" />
                                    <span className="hidden sm:inline">Online</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setShowGenerator(true)}
                                className="flex items-center p-2.5 text-amber-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                title="Generovat Demo Data"
                            >
                                <Sparkles className="w-5 h-5" />
                            </button>
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
                        <TemperatureTable
                            data={initialEntries}
                            onDelete={handleDeleteEntry}
                            onUpdate={handleUpdateEntry}
                        />
                    </div>
                </section>
            </main>

            <footer className="mt-12 text-center text-slate-400 text-xs pb-8">
                <p>&copy; {new Date().getFullYear()} TermoLog • Data uložena v cloudu</p>
            </footer>
        </div>
    );
}
