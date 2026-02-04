"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface TaskWidgetProps {
    title: string;
    date: string;
    categoryColor?: string;
    isOverdue?: boolean;
    checkIsDragging?: () => boolean;
}

export const TaskWidget = ({ title, date, categoryColor = "text-orange-500", isOverdue = false, checkIsDragging }: TaskWidgetProps) => {
    return (
        <motion.div
            className={cn(
                "w-48 h-auto p-4 rounded-2xl backdrop-blur-xl border flex flex-col gap-2 relative z-30 transition-all duration-300 group cursor-grab active:cursor-grabbing",
                "bg-white/80 border-slate-200 shadow-xl",
                "hover:scale-105 hover:bg-white hover:shadow-2xl hover:border-blue-200"
            )}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Header / Category indicator */}
            <div className="flex items-center justify-between">
                <div className={cn("w-2 h-2 rounded-full", isOverdue ? "bg-red-500" : "bg-orange-500")}></div>
                {isOverdue && <AlertCircle className="w-3 h-3 text-red-500" />}
            </div>

            {/* Title */}
            <h3 className="text-sm font-bold text-slate-800 leading-tight line-clamp-2">
                {title}
            </h3>

            {/* Date */}
            <div className="flex items-center gap-1.5 mt-1 border-t border-slate-100 pt-2">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span className={cn(
                    "text-xs font-medium",
                    isOverdue ? "text-red-600" : "text-slate-500"
                )}>
                    {new Date(date).toLocaleDateString('cs-CZ')}
                </span>
            </div>

            {/* Decoration Glow */}
            <div className="absolute -inset-1 bg-gradient-to-br from-orange-100/0 to-orange-100/50 rounded-3xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500" />
        </motion.div>
    );
};
