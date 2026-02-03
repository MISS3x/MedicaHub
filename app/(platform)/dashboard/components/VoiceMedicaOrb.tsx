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
}

export const VoiceMedicaOrb = ({ isOn, onClick }: VoiceMedicaOrbProps) => {
    return (
        <div className="relative group cursor-pointer" onClick={onClick}>
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
                    borderColor: isOn ? "rgba(59, 130, 246, 0.5)" : "rgba(226, 232, 240, 1)", // blue-500/50 vs slate-200
                    backgroundColor: isOn ? "rgba(255, 255, 255, 1)" : "rgba(248, 250, 252, 1)", // white vs slate-50
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
                    <VoiceEqualizer isOn={isOn} />
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
                        isOn ? "text-blue-600 drop-shadow-sm" : "text-slate-400"
                    )}>
                        {isOn ? 'Již brzy' : 'VoiceMedica'}
                    </span>
                </div>
            </motion.div>
        </div>
    );
};

const VoiceEqualizer = ({ isOn }: { isOn: boolean }) => {
    return (
        <div className="flex items-center gap-2 h-16">
            {[1, 2, 3, 4, 5].map((i) => (
                <EqualizerBar key={i} index={i} isOn={isOn} />
            ))}
        </div>
    )
}

const EqualizerBar = ({ index, isOn }: { index: number, isOn: boolean }) => {
    return (
        <motion.div
            initial={false}
            animate={{
                // Height animation
                height: isOn
                    ? ["20%", `${Math.random() * 80 + 20}%`, "20%"] // Active: Full range
                    : ["30%", "40%", "30%"], // Inactive: Subtle breathing
                // Color animation
                backgroundColor: isOn ? "#3b82f6" : "#94a3b8", // Blue-500 vs Slate-400
            }}
            transition={{
                height: {
                    repeat: Infinity,
                    duration: isOn ? 0.5 + Math.random() * 0.5 : 2 + Math.random(), // Fast vs Slow
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
                // If using gradient class, we need to override/handle bg color carefully.
                // Framer motion 'backgroundColor' works best on solid colors. 
                // Let's use solid colors for reliability or conditional class.
                background: isOn ? undefined : undefined // Let motion handle it or classes
            }}
        >
            {/* Gradient overlay for Active state if we want gradient bars */}
            {isOn && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-full"
                />
            )}
        </motion.div>
    )
}
