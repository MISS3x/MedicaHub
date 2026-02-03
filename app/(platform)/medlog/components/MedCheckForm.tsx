'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Check, Trash2, Pill, PackageOpen, ThermometerSnowflake, Archive, Loader2 } from 'lucide-react';
import { DiscardedMed, MedCheckEntry } from '../types';

interface Props {
    onSubmit: (entry: Omit<MedCheckEntry, 'id' | 'is_auto_generated' | 'created_at' | 'organization_id'>) => Promise<void>;
    initialData?: MedCheckEntry | null;
    isLoading?: boolean;
}

const COMMON_MEDS = [
    "Paralen", "Ibalgin", "Aspirin", "Panadol", "Nurofen", "Zodac", "Zyrtec", "Ophthalmo-Septonex", "Septonex",
    "Peroxid vodíku", "Jodisol", "Betadine", "Fenistil", "Voltaren", "Strepsils", "Muconasal", "Nasivin",
    "Sanorin", "Bromhexin", "ACC Long", "Mucosolvan", "Stoptussin", "Endiaron", "Smecta", "Carbo medicinalis",
    "Kinedryl", "Brufen", "Nalgesin", "Ataralgin", "Valetol", "Gutalax", "Laxatyl", "Espumisan", "Rennie",
    "Gastal", "Acylpyrin", "Celaskon", "Coldrex", "Dithiaden", "Exoderil", "Flector", "Framykoin", "Helicid",
    "Ibuprofen", "Indulona", "Kalcium", "Magnesium", "Milgamma", "Olynth", "Pamycon", "Robitussin", "Septolete",
    "Sinecod", "Tantum Verde", "Vera", "Visine", "Wobenzym", "Zovirax"
].sort();

const MedCheckForm: React.FC<Props> = ({ onSubmit, initialData, isLoading = false }) => {
    const [date, setDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });

    const [discardedList, setDiscardedList] = useState<DiscardedMed[]>([]);
    const [activeLocation, setActiveLocation] = useState<'FRIDGE' | 'CABINET' | null>(null);

    // Form inputs
    const [medName, setMedName] = useState("");
    const [medCount, setMedCount] = useState<number>(1);

    // Load initial data for editing
    useEffect(() => {
        if (initialData) {
            setDate(initialData.date);
            setDiscardedList(initialData.discarded || []);
        } else {
            setDiscardedList([]);
            setActiveLocation(null);
            const today = new Date();
            setDate(today.toISOString().split('T')[0]);
        }
    }, [initialData]);

    const handleAddDiscarded = () => {
        if (!medName || !activeLocation) return;
        const newItem: DiscardedMed = {
            id: Math.random().toString(36).substr(2, 9),
            name: medName,
            count: medCount,
            disposed: true,
            location: activeLocation
        };
        setDiscardedList([...discardedList, newItem]);
        setMedName("");
        setMedCount(1);
    };

    const handleRemoveDiscarded = (id: string) => {
        setDiscardedList(discardedList.filter(item => item.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const fridgeItems = discardedList.filter(d => d.location === 'FRIDGE');
        const cabinetItems = discardedList.filter(d => d.location === 'CABINET');

        await onSubmit({
            date,
            fridge_ok: fridgeItems.length === 0,
            cabinet_ok: cabinetItems.length === 0,
            discarded: discardedList
        });

        if (!initialData) {
            setDiscardedList([]);
            setActiveLocation(null);
        }
    };

    const renderLocationSection = (location: 'FRIDGE' | 'CABINET', title: string, icon: React.ReactNode) => {
        const isActive = activeLocation === location;
        const items = discardedList.filter(d => d.location === location);
        const hasItems = items.length > 0;

        return (
            <div
                onClick={() => {
                    if (!isActive) setActiveLocation(location);
                }}
                className={`relative transition-all duration-300 rounded-2xl border-2 overflow-hidden cursor-pointer
          ${isActive
                        ? 'border-blue-500 bg-white ring-4 ring-blue-50 shadow-xl scale-[1.02] z-10'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                    }
        `}
            >
                <div className="p-5 flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-400'}`}>
                            {icon}
                        </div>
                        <div>
                            <h4 className={`font-bold text-lg ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>{title}</h4>
                            <p className="text-xs text-slate-400 font-medium">
                                {hasItems ? `${items.length} vyřazených léků` : 'Vše v pořádku'}
                            </p>
                        </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${hasItems ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                        {hasItems ? <PackageOpen className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </div>
                </div>

                {/* List of items already added */}
                {hasItems && (
                    <div className="px-5 pb-3 space-y-2">
                        {items.map(item => (
                            <div key={item.id} className="flex items-center justify-between text-sm bg-slate-50 border border-slate-100 p-2 rounded-lg">
                                <span className="font-medium text-slate-700">{item.name} ({item.count}ks)</span>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleRemoveDiscarded(item.id); }}
                                    className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50"
                                    title="Odstranit"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Entry Form - Only Visible when Active */}
                {isActive && (
                    <div className="p-5 bg-blue-50/50 border-t border-blue-100 animate-in fade-in slide-in-from-top-4 duration-300" onClick={e => e.stopPropagation()}>
                        <h5 className="text-xs font-bold text-blue-600 uppercase mb-3 flex items-center">
                            <Plus className="w-3 h-3 mr-1" /> Přidat vyřazený lék
                        </h5>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-grow relative">
                                <input
                                    type="text"
                                    list="medication-list"
                                    value={medName}
                                    onChange={e => setMedName(e.target.value)}
                                    className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 placeholder:text-slate-400"
                                    placeholder="Název léku (začněte psát..)"
                                    autoFocus
                                    disabled={isLoading}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddDiscarded();
                                    }}
                                />
                                <datalist id="medication-list">
                                    {COMMON_MEDS.map(med => (
                                        <option key={med} value={med} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    value={medCount}
                                    onChange={e => setMedCount(parseInt(e.target.value) || 0)}
                                    className="w-20 px-3 py-2 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 placeholder:text-slate-400"
                                    disabled={isLoading}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddDiscarded();
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddDiscarded}
                                    disabled={!medName || isLoading}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center"
                                >
                                    Přidat
                                </button>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveLocation(null);
                            }}
                            className="mt-3 text-xs text-slate-400 hover:text-slate-600 underlined text-center w-full"
                        >
                            Hotovo, zavřít editaci
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden`}>
            {initialData && (
                <div className="absolute top-0 left-0 right-0 bg-orange-50 text-orange-600 text-xs font-bold text-center py-1">
                    EDITACE ZÁZNAMU
                </div>
            )}

            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center mt-2">
                <Pill className="w-5 h-5 mr-2 text-blue-500" />
                {initialData ? 'Upravit záznam' : 'Nová měsíční kontrola'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Datum kontroly</label>
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 font-medium"
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {renderLocationSection('FRIDGE', 'Lednice', <ThermometerSnowflake className="w-5 h-5" />)}
                    {renderLocationSection('CABINET', 'Skříňka', <Archive className="w-5 h-5" />)}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center transition-colors shadow-lg shadow-blue-200 active:scale-95 text-lg"
                >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Check className="w-6 h-6 mr-2" />}
                    {initialData ? 'Uložit změny' : 'Potvrdit a zapsat kontrolu'}
                </button>
            </form>
        </div>
    );
};

export default MedCheckForm;
