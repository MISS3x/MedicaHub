"use client";

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { RoadmapCanvas } from '@/components/RoadmapCanvasFix';

export default function RoadmapPage() {
    return (
        <div className="w-full h-screen bg-[#F8FAFC] overflow-hidden relative font-sans text-slate-900 selection:bg-blue-100">

            {/* --- HEADER / NAV --- */}
            <div className="absolute top-0 left-0 w-full z-50 p-6 flex justify-between items-start pointer-events-none">
                <Link href="/" className="pointer-events-auto flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                    <ChevronLeft className="w-5 h-5" />
                    <span className="font-medium text-sm">Zpět na Start</span>
                </Link>

                <div className="text-right pointer-events-auto bg-white/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Roadmapa</h1>
                    <p className="text-sm text-slate-500 font-medium">Medica Hub Evolution 2026</p>
                </div>
            </div>

            {/* --- BACKGROUND GRID --- */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* --- CANVAS COMPONENT --- */}
            <RoadmapCanvas className="w-full h-full" />
        </div>
    );
}
