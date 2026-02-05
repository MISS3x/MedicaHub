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
        <div className="group relative">
            {/* Main Card */}
            <div className={`
                p-3 rounded-2xl bg-white shadow-xl border border-slate-100 
                flex items-center gap-3 min-w-[140px] max-w-[180px]
                transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-blue-200
                cursor-pointer z-30
            `}>
                {/* Icon Box */}
                <div className={`p-2 rounded-xl ${iconClass} flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                </div>

                {/* Text Content */}
                <div className="flex flex-col min-w-0">
                    {/* Main Label (Bold) */}
                    <span className="text-sm font-bold text-slate-800 leading-tight truncate">
                        {label || value}
                    </span>

                    {/* Sub Label (Lighter) */}
                    {(subLabel || (label && value)) && (
                        <div className="h-4 flex items-center mt-0.5">
                            <span className="text-xs text-slate-500 font-medium truncate">
                                {subLabel || (label !== value ? label : '')}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Hover Tooltip / Expanded Info (Simulated) */}
            {/* If the content is truncated or user wants "more info", this floats above */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] 
                            bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg 
                            opacity-0 translate-y-2 pointer-events-none transition-all duration-300
                            group-hover:opacity-100 group-hover:translate-y-0 z-50">
                <div className="font-bold">{label}</div>
                {value && <div className="opacity-80">Hodnota: {value}</div>}
                {subLabel && <div className="opacity-80">{subLabel}</div>}
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
            </div>
        </div>
    );
};
