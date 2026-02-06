'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, Calendar, Users, Thermometer, Pill, Sparkles, BarChart3,
    X, ArrowRight, Info
} from 'lucide-react';
import Link from 'next/link';

// Icon Map
const ICON_MAP: Record<string, any> = {
    'Mic': Mic,
    'Calendar': Calendar,
    'Users': Users,
    'Thermometer': Thermometer,
    'Pill': Pill,
    'Sparkles': Sparkles,
    'BarChart3': BarChart3
};

interface AppDef {
    code: string;
    label: string;
    description: string;
    icon_name: string;
    color_class: string;
    href: string;
    is_coming_soon: boolean;
}

export function AppShowcase() {
    const [apps, setApps] = useState<AppDef[]>([]);
    const [selectedApp, setSelectedApp] = useState<AppDef | null>(null);
    const [hoveredApp, setHoveredApp] = useState<string | null>(null);

    useEffect(() => {
        const fetchApps = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('defined_apps')
                .select('*')
                .order('sort_order');

            if (data) setApps(data);
        };
        fetchApps();
    }, []);

    // Helper to get icon component
    const GetIcon = ({ name, className }: { name: string, className?: string }) => {
        const IconComp = ICON_MAP[name] || Info;
        return <IconComp className={className} />;
    };

    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Ekosystém Aplikací</h2>
                        <p className="text-slate-500">
                            Každá aplikace řeší konkrétní problém. Společně tvoří dokonalý celek.
                            Vyberte si ty, které potřebujete.
                        </p>
                    </motion.div>
                </div>

                {/* Horizontal Scrolling Ecosystem */}
                {/* Added 'pt-32' to prevent tooltip clipping at the top */}
                <div className="relative w-full overflow-hidden pt-32 pb-10 fade-mask-x">
                    <motion.div
                        className="flex gap-8 md:gap-12 w-max px-4"
                        animate={{ x: ["0%", "-50%", "0%"] }}
                        transition={{
                            duration: 40,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        {/* Duplicate list to ensure we have enough content to scroll nicely */}
                        {[...apps, ...apps, ...apps].map((app, index) => (
                            <div key={`${app.code}-${index}`} className="relative group shrink-0">
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedApp(app)}
                                    onMouseEnter={() => setHoveredApp(`${app.code}-${index}`)}
                                    onMouseLeave={() => setHoveredApp(null)}
                                    className={`w-28 h-28 md:w-40 md:h-40 rounded-[2rem] shadow-xl border border-slate-100 flex items-center justify-center bg-white transition-all duration-300 group-hover:shadow-2xl group-hover:border-blue-200 ${app.is_coming_soon ? 'opacity-80' : ''}`}
                                >
                                    <GetIcon
                                        name={app.icon_name}
                                        className={`w-12 h-12 md:w-16 md:h-16 ${app.color_class}`}
                                    />

                                    {app.is_coming_soon && (
                                        <span className="absolute top-4 right-4 bg-slate-100/80 backdrop-blur text-slate-500 text-[10px] uppercase font-bold px-2 py-1 rounded-full border border-slate-200">
                                            Brzy
                                        </span>
                                    )}
                                </motion.button>

                                <p className="mt-4 text-center font-bold text-slate-700">{app.label}</p>

                                {/* Hover Tooltip */}
                                <AnimatePresence>
                                    {hoveredApp === `${app.code}-${index}` && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                            className="absolute -top-4 -translate-y-full left-1/2 -translate-x-1/2 w-56 p-4 bg-slate-900/90 backdrop-blur text-white text-xs rounded-2xl shadow-xl z-50 pointer-events-none"
                                        >
                                            <p className="leading-relaxed">{(app.description || "").slice(0, 80)}...</p>
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900/90 rotate-45"></div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </motion.div>

                    {/* Gradient Fade Edges */}
                    <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {selectedApp && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedApp(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[80vh] flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-2xl bg-white shadow-sm border border-slate-100`}>
                                        <GetIcon name={selectedApp.icon_name} className={`w-8 h-8 ${selectedApp.color_class}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900">{selectedApp.label}</h3>
                                        <p className={`text-sm font-medium ${selectedApp.is_coming_soon ? 'text-slate-400' : 'text-blue-600'}`}>
                                            {selectedApp.is_coming_soon ? 'Ve vývoji' : 'Dostupné'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedApp(null)}
                                    className="p-2 bg-white rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="p-8 overflow-y-auto">
                                <p className="text-lg text-slate-600 leading-relaxed mb-6">
                                    {selectedApp.description}
                                </p>

                                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                                    <h4 className="font-bold text-slate-900 mb-2 text-sm uppercase tracking-wide">Klíčové funkce</h4>
                                    <ul className="space-y-2 text-slate-600 text-sm">
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Intuitivní ovládání</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Bezpečná data</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Plně responzivní</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-end gap-3">
                                <button
                                    onClick={() => setSelectedApp(null)}
                                    className="px-6 py-3 rounded-full font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                                >
                                    Zavřít
                                </button>

                                {!selectedApp.is_coming_soon && (
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        Vyzkoušet <ArrowRight size={18} />
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
}
