"use client";

import { LucideIcon } from 'lucide-react';

interface SubNodeProps {
    icon: LucideIcon;
    color: string; // e.g., "blue", "green", "purple", "orange"
    value?: string | number; // Optional value to display
    label?: string; // Optional label
    variant?: 'compact' | 'full'; // compact = just icon, full = icon + text
}

export const SubNode = ({
    icon: Icon,
    color,
    value,
    label,
    variant = 'compact'
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

    if (variant === 'compact') {
        // Small square icon-only
        return (
            <div className={`w-12 h-12 rounded-xl ${bgClass} shadow-lg flex items-center justify-center backdrop-blur-sm bg-white/90`}>
                <Icon className="w-5 h-5" />
            </div>
        );
    }

    // Full variant with icon + text
    return (
        <div className={`px-4 py-3 rounded-xl ${bgClass} shadow-lg backdrop-blur-sm bg-white/90 flex items-center gap-3 min-w-[140px]`}>
            <Icon className="w-5 h-5 flex-shrink-0" />
            <div className="flex flex-col">
                {value && (
                    <span className="text-sm font-bold leading-none">{value}</span>
                )}
                {label && (
                    <span className="text-xs opacity-70 leading-tight mt-0.5">{label}</span>
                )}
            </div>
        </div>
    );
};
