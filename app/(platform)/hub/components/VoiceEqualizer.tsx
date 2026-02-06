"use client";

import { motion } from "framer-motion";

interface VoiceEqualizerProps {
    isOn: boolean;
    isListening?: boolean;
}

export const VoiceEqualizer = ({ isOn, isListening }: VoiceEqualizerProps) => {
    // 5 bars simulation
    const bars = [1, 2, 3, 4, 5];

    return (
        <div className="flex items-center justify-center gap-1.5 h-12">
            {bars.map((i) => {
                // Different heights for "random" look
                const baseHeight = [16, 24, 32, 24, 16][i - 1];

                return (
                    <motion.div
                        key={i}
                        initial={{ height: baseHeight, opacity: 0.5 }}
                        animate={{
                            height: isOn ? [baseHeight, baseHeight * 1.5, baseHeight * 0.8, baseHeight] : baseHeight,
                            backgroundColor: isOn ? "#9333ea" : "#94a3b8", // purple-600 vs slate-400
                            opacity: isOn ? 1 : 0.5
                        }}
                        transition={{
                            duration: 0.8,
                            repeat: isOn ? Infinity : 0,
                            repeatType: "reverse",
                            delay: i * 0.1, // Stagger effect
                            ease: "easeInOut"
                        }}
                        className="w-3 rounded-full"
                        style={{
                            backgroundColor: isOn ? "#9333ea" : "#94a3b8"
                        }}
                    />
                );
            })}
        </div>
    );
};
