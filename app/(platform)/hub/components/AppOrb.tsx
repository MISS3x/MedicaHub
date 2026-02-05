"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { LucideIcon, Lock } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface AppOrbProps {
    label: string;
    icon: LucideIcon;
    href: string;
    color?: string;
    isLocked?: boolean;
    checkIsDragging?: () => boolean;
}

export const AppOrb = ({ label, icon: Icon, href, color = "text-sky-400", isLocked = false, checkIsDragging }: AppOrbProps) => {
    const [showOverlay, setShowOverlay] = useState(false);

    const handleLockedClick = (e: React.MouseEvent) => {
        if (checkIsDragging && checkIsDragging()) return;

        setShowOverlay(true);
        setTimeout(() => setShowOverlay(false), 2000);
    };

    const handleLinkClick = (e: React.MouseEvent) => {
        if (isLocked) {
            e.preventDefault();
            return;
        }
        if (checkIsDragging && checkIsDragging()) {
            e.preventDefault();
            console.log("Navigation prevented - dragging detected");
            return;
        }
    };

    // Locked state: Grayscale + Opacity
    const containerClasses = cn(
        "w-28 h-28 rounded-full flex items-center justify-center relative z-10 transition-all duration-300 border shadow-[0_30px_60px_-12px_rgba(0,0,0,0.2)] cursor-pointer",
        isLocked
            ? "bg-slate-100 border-slate-200 grayscale opacity-80"
            : "bg-gradient-to-br from-white to-slate-50 border-white/80 group-hover:border-blue-100 group-hover:shadow-[0_40px_80px_-12px_rgba(37,99,235,0.25)]"
    );

    const Content = (
        <motion.div
            className={containerClasses}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isLocked ? handleLockedClick : undefined}
        >
            <AnimatePresence mode="wait">
                {showOverlay ? (
                    <motion.div
                        key="overlay"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-white rounded-full flex flex-col items-center justify-center border border-slate-100 shadow-inner z-20"
                    >
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                            Již<br />brzy
                        </span>
                    </motion.div>
                ) : (
                    <motion.div
                        key="icon"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.2 }}
                        className="relative"
                    >
                        {/* Always colorful, no slate-300 */}
                        <Icon className={cn("w-8 h-8 transition-transform duration-300 group-hover:scale-110", color, isLocked && "text-slate-400")} />

                        {isLocked && (
                            <div className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-sm border border-slate-100">
                                <Lock className="w-3 h-3 text-slate-400" />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );

    return (
        <div className="group block relative select-none">
            {/* Hover Glow for everyone */}
            <div className="absolute inset-0 bg-slate-200/50 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {isLocked ? (
                <div>
                    {Content}
                </div>
            ) : (
                <Link
                    href={href}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    onClick={handleLinkClick}
                >
                    {Content}
                </Link>
            )}

            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
                <span className={cn(
                    "text-xs font-bold uppercase tracking-wider transition-colors text-slate-500 group-hover:text-slate-800"
                )}>
                    {label}
                </span>
            </div>
        </div>
    )
}
