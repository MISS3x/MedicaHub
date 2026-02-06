"use client";

import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { VoiceEqualizer } from "./VoiceEqualizer";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface VoiceMedicaOrbProps {
    isOn: boolean;
    onClick: () => void;
    isPro?: boolean;
    voiceStatus?: 'listening' | 'processing' | 'idle' | 'off';
    transcript?: string | null;
}

export const VoiceMedicaOrb = ({ isOn, onClick, isPro, voiceStatus = 'off', transcript }: VoiceMedicaOrbProps) => {
    const handleClick = () => {
        onClick();
    };

    // Determine status text/color
    let statusText = isOn ? 'Aktivní' : 'VoiceMedica';
    let statusColor = isOn ? "text-blue-600 drop-shadow-sm" : "text-slate-400";

    if (voiceStatus === 'listening') {
        // statusText = 'Poslouchám...'; // HIDDEN as per user request
        statusColor = "text-red-500 animate-pulse";
    } else if (voiceStatus === 'processing') {
        statusText = 'Zpracovávám...';
        statusColor = "text-purple-600 animate-pulse";
    }

    return (
        <div className="relative group cursor-pointer" onClick={handleClick}>
            {/* Active Glow (Behind) - Pulsates ONLY when ON */}
            <motion.div
                animate={{
                    scale: isOn ? [1, 1.2, 1] : 1,
                    opacity: isOn ? 0.5 : 0,
                }}
                transition={{
                    repeat: Infinity,
                    duration: 3, // Slow pulse
                    ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-full bg-blue-500 blur-3xl pointer-events-none"
            />

            {/* Main Orb Body */}
            <motion.div
                initial={false}
                animate={{
                    borderColor: voiceStatus === 'listening' ? "rgba(239, 68, 68, 0.5)" : (isOn ? "rgba(59, 130, 246, 0.5)" : "rgba(226, 232, 240, 1)"),
                    backgroundColor: isOn ? "rgba(255, 255, 255, 1)" : "rgba(248, 250, 252, 1)",
                }}
                transition={{ duration: 0.5 }}
                className={cn(
                    "w-48 h-48 rounded-full shadow-2xl backdrop-blur-xl flex items-center justify-center relative z-10 transition-all duration-500 border",
                    // Base classes that don't animate via framer
                    "hover:scale-105"
                )}
            >
                {/* Content: Equalizer */}
                <div className="relative z-20 flex items-center justify-center scale-150">
                    <VoiceEqualizer isOn={isOn || voiceStatus === 'listening' || voiceStatus === 'processing'} />
                </div>
            </motion.div>

            {/* Label */}
            <motion.div
                layout // Helps with smooth text changes
                className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
            >
                <div className="flex flex-col items-center">
                    <span className={cn(
                        "text-sm font-bold tracking-widest uppercase transition-colors duration-300",
                        statusColor
                    )}>
                        {statusText}
                    </span>
                </div>
            </motion.div>

            {/* Transcript Bubble (Speech Cloud) - Floating UP and fading */}
            {transcript && (
                <motion.div
                    key={transcript} // Re-animate on new text
                    initial={{ opacity: 0, y: -60, scale: 0.8 }}
                    animate={{ opacity: 1, y: -90, scale: 1 }}
                    exit={{ opacity: 0, y: -120, scale: 0.8 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 pointer-events-none"
                >
                    <div className="bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-3 rounded-2xl shadow-xl text-slate-800 font-medium text-lg flex flex-col items-center">
                        <span className="text-xs text-slate-400 font-bold uppercase mb-1 tracking-widest">Slyším</span>
                        "{transcript}"

                        {/* Little triangle tail */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-slate-200" />
                    </div>
                </motion.div>
            )}
        </div>
    );
};
