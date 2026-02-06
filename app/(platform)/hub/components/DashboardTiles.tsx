"use client";

import { motion } from "framer-motion";
import { Lock, LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface DashboardTilesProps {
    orbs: any[];
    isPro: boolean;
    isBrainActive: boolean;
    handleBrainClick: () => void;
}

export const DashboardTiles = ({ orbs, isPro, isBrainActive, handleBrainClick }: DashboardTilesProps) => {
    // Filter items
    const brain = orbs.find(o => o.type === 'brain');
    const apps = orbs.filter(o => o.type === 'app');

    return (
        <div className="w-full min-h-screen bg-slate-50/50 pt-32 pb-20 px-4 overflow-y-auto">
            <div className="max-w-2xl mx-auto grid grid-cols-4 gap-3 sm:gap-4 grid-flow-dense auto-rows-[minmax(80px,auto)] sm:auto-rows-[minmax(120px,auto)]">

                {/* VoiceMedica Tile - Fixed to Row 2, Col 2, Spanning 2x2 */}
                {brain && (
                    <div className="col-span-2 row-span-2 col-start-2 row-start-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-2 flex flex-col items-center justify-center relative overlow-hidden">
                        <VoiceMedicaTile
                            isOn={isBrainActive}
                            onClick={handleBrainClick}
                            isPro={isPro}
                        />
                    </div>
                )}

                {/* Apps */}
                {apps.map((app) => (
                    <AppTile key={app.id} app={app} />
                ))}

            </div>

            {/* Third Perimeter: Sub-nodes (Satellites) */}
            <div className="max-w-2xl mx-auto mt-12 mb-12">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 pl-2 opacity-70">
                    Aktivní přehled (Activity)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {orbs.filter(o => o.type === 'subnode').map(node => {
                        const parentApp = apps.find(a => a.id === node.parentId);
                        return (
                            <SubNodeTile
                                key={node.id}
                                node={node}
                                ParentIcon={parentApp?.icon}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// --- Sub Components ---

const SubNodeTile = ({ node, ParentIcon }: { node: any, ParentIcon?: LucideIcon }) => {
    const Icon = node.icon;

    // Icon colors matching Landing Page (lighter backgrounds)
    const iconBgClasses: any = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
        teal: 'bg-teal-50 text-teal-600',
        pink: 'bg-pink-50 text-pink-600',
    };

    const iconClass = iconBgClasses[node.color] || iconBgClasses.blue;

    return (
        <div
            onClick={() => alert("Editace zatím není k dispozici (Beta sub-tile)")}
            className="group bg-white rounded-2xl p-3 border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-3 relative overflow-hidden"
        >
            {/* Parent App Icon Badge */}
            {ParentIcon && (
                <div className="absolute top-2 right-2 p-1 bg-slate-50 rounded-full border border-slate-100 opacity-60 group-hover:opacity-100 transition-all">
                    <ParentIcon className="w-3 h-3 text-slate-400" />
                </div>
            )}

            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconClass}`}>
                {/* Special case: If it's a temp value (contains numbers), maybe show number? 
                    User said 'termolog ukazuje cislo'. 
                    If label is a number (e.g. 24.5°C), we might want to show that instead of icon?
                    But for consistency, let's stick to Icon unless explicitly requested to drop icon in tiles too. 
                    Actually, let's try to show value if available and short?
                    For now, stick to Icon to be safe and consistent with "icon-only" design requested.
                 */}
                {Icon && <Icon className="w-5 h-5" />}
            </div>

            <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-700 truncate">
                    {node.label || node.value}
                </span>
                <span className="text-[10px] text-slate-400 font-medium truncate">
                    {node.subLabel || "Detail"}
                </span>
            </div>
        </div>
    )
}

const AppTile = ({ app }: { app: any }) => {
    const [showOverlay, setShowOverlay] = useState(false);
    const Icon = app.icon;

    const handleLockedClick = (e: React.MouseEvent) => {
        setShowOverlay(true);
        setTimeout(() => setShowOverlay(false), 2000);
    };

    const containerClasses = cn(
        "w-full aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 border shadow-sm select-none",
        app.isLocked
            ? "bg-slate-100 border-slate-200 grayscale opacity-80 cursor-not-allowed"
            : "bg-white border-slate-100 hover:border-blue-200 hover:shadow-md cursor-pointer hover:scale-[1.02] active:scale-95"
    );

    const Content = (
        <div className="flex flex-col items-center gap-2 p-2">
            {showOverlay ? (
                <div className="absolute inset-0 bg-white/90 rounded-2xl flex items-center justify-center z-20">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 text-center leading-tight">
                        Již<br />brzy
                    </span>
                </div>
            ) : (
                <>
                    <Icon className={cn("w-6 h-6 sm:w-8 sm:h-8", app.color, app.isLocked && "text-slate-400")} />
                    <span className={cn(
                        "text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center leading-none",
                        app.isLocked ? "text-slate-400" : "text-slate-600"
                    )}>
                        {app.label}
                    </span>
                    {app.isLocked && (
                        <div className="absolute top-2 right-2">
                            <Lock className="w-3 h-3 text-slate-400" />
                        </div>
                    )}
                </>
            )}
        </div>
    );

    if (app.isLocked) {
        return (
            <div className={containerClasses} onClick={handleLockedClick}>
                {Content}
            </div>
        );
    }

    return (
        <Link href={app.href} className={containerClasses}>
            {Content}
        </Link>
    );
};

const VoiceMedicaTile = ({ isOn, onClick, isPro }: { isOn: boolean, onClick: () => void, isPro: boolean }) => {
    return (
        <div
            onClick={onClick}
            className="w-full h-full flex flex-col items-center justify-center cursor-pointer group"
        >
            {/* Background glow if active */}
            {isOn && (
                <div className="absolute inset-0 bg-blue-500/5 rounded-3xl animate-pulse" />
            )}

            <div className="relative z-10 flex flex-col items-center gap-3">
                {/* Equalizer or Icon */}
                <div className="h-12 flex items-center justify-center">
                    <VoiceEqualizer isOn={isOn} />
                </div>

                <span className={cn(
                    "text-xs sm:text-sm font-bold uppercase tracking-widest transition-colors",
                    isOn ? "text-blue-600" : "text-slate-400"
                )}>
                    {isOn ? "Již brzy" : "VoiceMedica"}
                </span>
            </div>
        </div>
    )
}

// Reused Equalizer (Simplified)
const VoiceEqualizer = ({ isOn }: { isOn: boolean }) => {
    return (
        <div className="flex items-center gap-1.5 h-full">
            {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                    key={i}
                    initial={false}
                    animate={{
                        height: isOn ? ["30%", `${Math.random() * 80 + 20}%`, "30%"] : ["40%", "50%", "40%"],
                        backgroundColor: isOn ? "#3b82f6" : "#cbd5e1",
                    }}
                    transition={{
                        height: {
                            repeat: Infinity,
                            duration: isOn ? 0.4 : 1.5,
                            ease: "easeInOut",
                            delay: i * 0.1
                        },
                        backgroundColor: { duration: 0.3 }
                    }}
                    className="w-2 rounded-full"
                />
            ))}
        </div>
    )
}
