"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { AiNurseSurvey } from "./AiNurseSurvey";
import { createClient } from "@/utils/supabase/client";

export const FloatingSurvey = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [remainingSlots, setRemainingSlots] = useState(500);

    const supabase = createClient();

    useEffect(() => {
        const fetchCount = async () => {
            // Try RPC first (safest/fastest)
            const { data, error } = await supabase.rpc('get_beta_request_count');
            if (!error && typeof data === 'number') {
                setRemainingSlots(Math.max(0, 500 - data));
            } else {
                // Fallback (only works if RLS allows or user is admin)
                const { count } = await supabase.from('beta_requests').select('*', { count: 'exact', head: true });
                if (count !== null) setRemainingSlots(Math.max(0, 500 - count));
            }
        };
        fetchCount();

        // Refresh every minute to keep it "live" for new visitors/long waits
        const interval = setInterval(fetchCount, 60000);
        return () => clearInterval(interval);
    }, []);

    if (isDismissed) return null;

    return (
        <>
            {/* Teaser Bubble (Bottom Right) */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="fixed bottom-6 right-6 z-50 flex items-end gap-4"
                    >
                        {/* Floating Badge above bubble */}
                        <div className="absolute -top-12 right-0 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce z-20 border border-white/20 whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                            Zbývá jen {remainingSlots} míst!
                        </div>

                        {/* Close/Dismiss Button */}
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsDismissed(true); }}
                            className="absolute -top-2 -right-2 bg-slate-800 text-slate-400 hover:text-white rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity z-10"
                            title="Zavřít"
                        >
                            <X className="w-3 h-3" />
                        </button>

                        {/* Bubble */}
                        <button
                            onClick={() => setIsOpen(true)}
                            className="group relative bg-slate-900 border border-cyan-500/30 text-left p-4 pr-12 rounded-2xl shadow-2xl hover:shadow-cyan-900/40 hover:-translate-y-1 transition-all duration-300 max-w-xs"
                        >
                            {/* Pulse Effect */}
                            <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                            </span>

                            <div className="flex items-center gap-3 mb-1">
                                <Sparkles className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
                                <span className="text-xs font-bold text-cyan-500 uppercase tracking-wider">Novinka</span>
                            </div>
                            <h4 className="text-white font-semibold text-sm leading-tight">
                                AI Sestra: Budoucnost vaší ambulance je tady. Vyzkoušíte?
                            </h4>

                            {/* CTA Arrow */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg z-10"
                        >
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors"
                            >
                                <X className="w-8 h-8" />
                            </button>

                            <AiNurseSurvey remainingSlots={remainingSlots} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
