"use client";

import { LucideIcon } from 'lucide-react';

interface SubNodeProps {
    icon: LucideIcon;
    color: string; // e.g., "blue", "green", "purple", "orange"
    value?: string | number; // Optional value to display
    label?: string; // Optional label
    subLabel?: string; // Optional subtitle (timestamp, status, etc.)
    variant?: 'compact' | 'full'; // compact = just icon, full = icon + text
}

export const SubNode = ({
    icon: Icon,
    color,
    value,
    label,
    subLabel,
    variant = 'full'
}: SubNodeProps) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
        teal: 'bg-teal-50 text-teal-600',
        pink: 'bg-pink-50 text-pink-600',
    };

    const bgClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

    // Full variant with icon + text (Matches Landing Page "Satellite Cards")
    // Style: bg-white p-3 rounded-2xl shadow-xl border border-slate-100

    // Icon colors matching Landing Page (lighter backgrounds)
    const iconBgClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
        teal: 'bg-teal-50 text-teal-600',
        pink: 'bg-pink-50 text-pink-600',
    };

    const iconClass = iconBgClasses[color as keyof typeof iconBgClasses] || iconBgClasses.blue;

    return (
        <div className="group relative" onClick={() => alert("Editace zatím není k dispozici (Beta)")}>
            {/* Main Small Bubble (Icon Only) */}
            <div className={`
                w-10 h-10 rounded-full bg-white shadow-md border border-slate-200
                flex items-center justify-center
                transition-all duration-300 hover:scale-110 hover:shadow-lg hover:border-blue-400
                cursor-pointer z-30 relative
            `}>
                {/* Icon or Value (if number) */}
                {/* Special case: If it's a temp value, maybe just show number? User said 'termolog ukazuje cislo'. 
                    But let's stick to Icon for consistency unless it's explicitly purely value based. 
                    Actually, for TermoLog, showing the number is better. */}
                {label && label.includes('°C') ? (
                    <span className={`text-[10px] font-bold ${iconClass.replace('bg-', 'text-').split(' ')[1]}`}>{value}</span>
                ) : (
                    <Icon className={`w-5 h-5 ${iconClass.replace('bg-', 'text-').split(' ')[1]}`} />
                )}
            </div>

            {/* Hover Tooltip / Details */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] 
                            bg-slate-800/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg shadow-xl 
                            opacity-0 translate-y-2 pointer-events-none transition-all duration-200
                            group-hover:opacity-100 group-hover:translate-y-0 z-50 flex flex-col items-center gap-0.5">
                <div className="font-bold">{label}</div>
                {(subLabel || (value && value !== label)) && (
                    <div className="opacity-80 font-medium text-[10px]">
                        {subLabel || value}
                    </div>
                )}
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800/90"></div>
            </div>
        </div>
    );
};
