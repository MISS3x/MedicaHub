"use client";

import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface VoiceMedicaOrbProps {
    isOn: boolean;
    onClick: () => void;
    isPro?: boolean;
    voiceStatus?: 'listening' | 'processing' | 'idle' | 'off';
}

export const VoiceMedicaOrb = ({ isOn, onClick, isPro, voiceStatus = 'off' }: VoiceMedicaOrbProps) => {
    const handleClick = () => {
        onClick();
    };

    // Determine status text/color
    let statusText = isOn ? 'Aktivní' : 'VoiceMedica';
    let statusColor = isOn ? "text-blue-600 drop-shadow-sm" : "text-slate-400";

    if (voiceStatus === 'listening') {
        statusText = 'Poslouchám...';
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
                {/* Content: ALWAYS Equalizer */}
                <div className="relative z-20">
                    <VoiceEqualizer isOn={isOn} isListening={voiceStatus === 'listening'} />
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
        </div>
    );
};

const VoiceEqualizer = ({ isOn, isListening }: { isOn: boolean, isListening?: boolean }) => {
    return (
        <div className="flex items-center gap-2 h-16">
            {[1, 2, 3, 4, 5].map((i) => (
                <EqualizerBar key={i} index={i} isOn={isOn} isListening={isListening} />
            ))}
        </div>
    )
}

const EqualizerBar = ({ index, isOn, isListening }: { index: number, isOn: boolean, isListening?: boolean }) => {
    return (
        <motion.div
            initial={false}
            animate={{
                // Height animation
                height: isListening
                    ? ["20%", `${Math.random() * 95 + 5}%`, "20%"] // Crazy active when listening
                    : isOn
                        ? ["20%", `${Math.random() * 80 + 20}%`, "20%"] // Active: Full range
                        : ["30%", "40%", "30%"], // Inactive: Subtle breathing
                // Color animation
                backgroundColor: isListening ? "#ef4444" : (isOn ? "#3b82f6" : "#94a3b8"),
            }}
            transition={{
                height: {
                    repeat: Infinity,
                    duration: isListening ? 0.2 + Math.random() * 0.2 : (isOn ? 0.5 + Math.random() * 0.5 : 2 + Math.random()), // Fast vs Slow
                    ease: "easeInOut",
                    delay: index * 0.1
                },
                backgroundColor: { duration: 0.5 } // Smooth color transition
            }}
            className={cn(
                "w-3 rounded-full", // Thicker bars
                isOn && "bg-gradient-to-t from-blue-500 to-purple-500" // Optional gradient for active
            )}
            style={{
                // For listening (red), override gradient
                background: isListening ? undefined : (isOn ? undefined : undefined)
            }}
        >
            {/* Gradient overlay for Active state if we want gradient bars */}
            {isOn && !isListening && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-full"
                />
            )}
        </motion.div>
    )
}
