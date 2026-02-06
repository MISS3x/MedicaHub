'use client';

import React, { useTransition, useState } from 'react';
import { ArrowLeft, Cloud, RefreshCw, Download, Database, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import MedCheckForm from './components/MedCheckForm';
import MedCheckTable from './components/MedCheckTable';
import { MedCheckEntry } from './types';
import { addMedLogEntry, deleteMedLogEntry, updateMedLogEntry } from './actions';

interface MedLogClientProps {
    initialEntries: MedCheckEntry[];
    organizationId: string;
}

export default function MedLogClient({ initialEntries, organizationId }: MedLogClientProps) {
    const [isPending, startTransition] = useTransition();
    const [editingEntry, setEditingEntry] = useState<MedCheckEntry | null>(null);

    const handleSubmit = async (entryData: any) => {
        startTransition(async () => {
            if (editingEntry) {
                await updateMedLogEntry(editingEntry.id, entryData);
                setEditingEntry(null);
            } else {
                await addMedLogEntry(organizationId, entryData);
            }
        });
    };

    const handleDeleteEntry = async (id: string) => {
        if (!confirm('Opravdu smazat záznam kontroly?')) return;
        startTransition(async () => {
            await deleteMedLogEntry(id);
            if (editingEntry && editingEntry.id === id) {
                setEditingEntry(null);
            }
        });
    };

    const handleEditEntry = (entry: MedCheckEntry) => {
        setEditingEntry(entry);
    };

    const handleExport = () => {
        // Reuse logic from old app
        const sorted = [...initialEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const textContent = sorted.map(e => {
            const dateStr = new Date(e.date).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });

            // In old app logic: fridgeItems = discarded.filter(...)
            // discarded might be undefined in raw DB data if not set, but schema has default '[]'
            const discarded = e.discarded || [];
            const fridgeItems = discarded.filter(d => d.location === 'FRIDGE');
            const cabinetItems = discarded.filter(d => d.location === 'CABINET');

            // The logic: if no items in location -> OK. Else list items.
            // Note: fridge_ok/cabinet_ok boolean flags are also stored, but generating text from items is safer/more descriptive
            const fridge = fridgeItems.length > 0
                ? `Lednice NÁLEZ: ${fridgeItems.map(d => `${d.name} (${d.count}ks)`).join(', ')}`
                : "Lednice OK";

            const cabinet = cabinetItems.length > 0
                ? `Skříňka NÁLEZ: ${cabinetItems.map(d => `${d.name} (${d.count}ks)`).join(', ')}`
                : "Skříňka OK";

            return `${dateStr} | ${fridge} | ${cabinet}`;
        }).join('\n');

        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `medlog_prehled_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-[100dvh] pb-12 bg-slate-50">
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
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight"><span className="text-blue-600">MedLog</span> <span className="text-slate-400 font-normal">| Evidence kontrol</span></h1>

                            <div className="ml-6 flex items-center">
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
                    <MedCheckForm
                        onSubmit={handleSubmit}
                        initialData={editingEntry}
                        isLoading={isPending}
                    />
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center"><ClipboardList className="w-5 h-5 mr-2 text-slate-400" /> Evidence kontrol</h2>
                    </div>
                    <div className={`transition-opacity ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
                        <MedCheckTable
                            data={initialEntries}
                            onDelete={handleDeleteEntry}
                            onEdit={handleEditEntry}
                        />
                    </div>
                </section>
            </main>

            <footer className="mt-12 text-center text-slate-400 text-xs pb-8">
                <p>&copy; {new Date().getFullYear()} MedLog • Data uložena v cloudu</p>
            </footer>
        </div>
    );
}
