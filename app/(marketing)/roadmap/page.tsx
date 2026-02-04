"use client";

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
    Rocket, Cpu, Globe, Brain, Zap, Monitor, Activity, Radio,
    CheckCircle2, Circle, Clock, ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

// --- TYPES ---
type RoadmapStatus = 'done' | 'in-progress' | 'planned';

interface SubNode {
    id: string;
    label: string;
}

interface RoadmapNode {
    id: string;
    title: string;
    date: string;
    icon: any;
    status: RoadmapStatus;
    subNodes: SubNode[];
    x: number;
    y: number;
}

// --- DATA ---
const ROADMAP_DATA: RoadmapNode[] = [
    {
        id: 'start',
        title: 'Start',
        date: 'Leden 2026',
        icon: Rocket,
        status: 'done',
        subNodes: [
            { id: 'start-1', label: 'Vize & Koncept' },
            { id: 'start-2', label: 'Tech Stack' },
            { id: 'start-3', label: 'Design System' }
        ],
        x: 200,
        y: 400
    },
    {
        id: 'core',
        title: 'Core',
        date: 'Únor 2026',
        icon: Cpu,
        status: 'done',
        subNodes: [
            { id: 'core-1', label: 'Refactoring' },
            { id: 'core-2', label: 'VoiceLog MVP' },
            { id: 'core-3', label: 'Auth & DB' }
        ],
        x: 500,
        y: 250 // Wave Up
    },
    {
        id: 'business',
        title: 'Business',
        date: 'Březen 2026',
        icon: Activity,
        status: 'in-progress',
        subNodes: [
            { id: 'biz-1', label: 'Stripe Integrace' },
            { id: 'biz-2', label: 'Admin Panel' },
            { id: 'biz-3', label: 'Kreditní systém' }
        ],
        x: 800,
        y: 450 // Wave Down
    },
    {
        id: 'ai',
        title: 'AI Brain',
        date: 'Q2 2026',
        icon: Brain,
        status: 'planned',
        subNodes: [
            { id: 'ai-1', label: 'Context Search' },
            { id: 'ai-2', label: 'Voice Control' },
            { id: 'ai-3', label: 'RAG Model' }
        ],
        x: 1100,
        y: 300 // Wave Up
    },
    {
        id: 'hw',
        title: 'Hardware',
        date: 'Q3 2026',
        icon: Monitor,
        status: 'planned',
        subNodes: [
            { id: 'hw-1', label: 'Touch Kiosk' },
            { id: 'hw-2', label: 'Tablet PWA' },
            { id: 'hw-3', label: 'IoT Senzory' }
        ],
        x: 1400,
        y: 500 // Wave Down
    },
    {
        id: 'eco',
        title: 'Ekosystém',
        date: 'Q4 2026',
        icon: Globe,
        status: 'planned',
        subNodes: [
            { id: 'eco-1', label: 'Nemocniční integrace' },
            { id: 'eco-2', label: 'Public Launch' },
            { id: 'eco-3', label: 'Marketplace' }
        ],
        x: 1700,
        y: 350 // End
    }
];

export default function RoadmapPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

    // Initial centering logic could be added here

    // --- RENDER HELPERS ---

    // Draw connections between nodes (The "Neural Line")
    const renderConnections = () => {
        return (
            <svg className="absolute top-0 left-0 w-[2000px] h-full pointer-events-none opacity-20">
                <path
                    d={`
                        M ${ROADMAP_DATA[0].x} ${ROADMAP_DATA[0].y}
                        C ${ROADMAP_DATA[0].x + 150} ${ROADMAP_DATA[0].y}, 
                          ${ROADMAP_DATA[1].x - 150} ${ROADMAP_DATA[1].y}, 
                          ${ROADMAP_DATA[1].x} ${ROADMAP_DATA[1].y}
                        S ${ROADMAP_DATA[2].x - 150} ${ROADMAP_DATA[2].y}, 
                          ${ROADMAP_DATA[2].x} ${ROADMAP_DATA[2].y}
                        S ${ROADMAP_DATA[3].x - 150} ${ROADMAP_DATA[3].y}, 
                          ${ROADMAP_DATA[3].x} ${ROADMAP_DATA[3].y}
                        S ${ROADMAP_DATA[4].x - 150} ${ROADMAP_DATA[4].y}, 
                          ${ROADMAP_DATA[4].x} ${ROADMAP_DATA[4].y}
                        S ${ROADMAP_DATA[5].x - 150} ${ROADMAP_DATA[5].y}, 
                          ${ROADMAP_DATA[5].x} ${ROADMAP_DATA[5].y}
                    `}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-slate-400"
                />
            </svg>
        );
    };

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

            {/* --- DRAGGABLE CANVAS --- */}
            <motion.div
                ref={containerRef}
                className="w-full h-full relative cursor-grab active:cursor-grabbing"
                drag
                dragConstraints={{ left: -1200, right: 0, top: -500, bottom: 0 }}
                dragElastic={0.1}
            >
                {renderConnections()}

                {ROADMAP_DATA.map((node, index) => {
                    const isActive = activeNodeId === node.id;
                    const Icon = node.icon;

                    // Colors based on status
                    let colorClass = "bg-slate-100 text-slate-400 border-slate-200"; // planned
                    let glowClass = "";

                    if (node.status === 'done') {
                        colorClass = "bg-white text-blue-600 border-blue-200 shadow-blue-100";
                        glowClass = "shadow-[0_0_30px_rgba(37,99,235,0.15)]";
                    } else if (node.status === 'in-progress') {
                        colorClass = "bg-white text-orange-500 border-orange-200";
                        glowClass = "shadow-[0_0_30px_rgba(249,115,22,0.15)] animate-pulse-slow"; // Custom pulse would be better
                    }

                    return (
                        <div
                            key={node.id}
                            className="absolute"
                            style={{ left: node.x, top: node.y }}
                        >
                            {/* NODE ORB */}
                            <motion.div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveNodeId(isActive ? null : node.id);
                                }}
                                className={`
                                    relative z-20 w-20 h-20 rounded-full border-2 flex items-center justify-center 
                                    shadow-xl cursor-pointer transition-all duration-300
                                    ${colorClass} ${glowClass}
                                    ${isActive ? 'scale-110 border-blue-500 ring-4 ring-blue-50' : 'hover:scale-105'}
                                `}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Icon className="w-8 h-8" />

                                {/* Status Indicator Dot */}
                                <div className={`absolute top-0 right-0 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center
                                    ${node.status === 'done' ? 'bg-blue-500' : node.status === 'in-progress' ? 'bg-orange-500' : 'bg-slate-300'}
                                `}>
                                    {node.status === 'done' && <CheckCircle2 className="w-3 h-3 text-white" />}
                                    {node.status === 'in-progress' && <Activity className="w-3 h-3 text-white animate-spin-slow" />}
                                    {node.status === 'planned' && <Clock className="w-3 h-3 text-white" />}
                                </div>
                            </motion.div>

                            {/* LABELS */}
                            <div className="absolute top-24 left-1/2 -translate-x-1/2 text-center w-40 pointer-events-none">
                                <h3 className={`font-bold text-lg ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>{node.title}</h3>
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 bg-white/80 px-2 py-0.5 rounded-full border border-slate-100">
                                    {node.date}
                                </span>
                            </div>

                            {/* SATELLITES (Sub-nodes) */}
                            <AnimatePresence>
                                {isActive && (
                                    <>
                                        {node.subNodes.map((sub, i) => {
                                            // Orbit positioning
                                            const angle = (i * (360 / node.subNodes.length)) - 90; // Start top
                                            const radius = 90; // Distance from center
                                            const rad = angle * (Math.PI / 180);
                                            const sx = Math.cos(rad) * radius;
                                            const sy = Math.sin(rad) * radius;

                                            return (
                                                <motion.div
                                                    key={sub.id}
                                                    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                                    animate={{ opacity: 1, scale: 1, x: sx, y: sy }}
                                                    exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                                    transition={{ delay: i * 0.1, type: "spring", stiffness: 200, damping: 15 }}
                                                    className="absolute top-1/2 left-1/2 -ml-[60px] -mt-[18px] z-10 w-[120px] pointer-events-none"
                                                >
                                                    <div className="bg-white/90 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-xl shadow-lg text-center">
                                                        <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">{sub.label}</span>
                                                    </div>

                                                    {/* Orbit Line Connector */}
                                                    <div
                                                        className="absolute top-1/2 left-1/2 w-full h-[1px] bg-blue-200 -z-10 origin-center opacity-50"
                                                        style={{
                                                            width: radius,
                                                            transform: `rotate(${angle + 180}deg) translateY(-50%)`,
                                                            left: '50%',
                                                            top: '50%'
                                                        }}
                                                    />
                                                </motion.div>
                                            )
                                        })}

                                        {/* Orbit Circle visual */}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] rounded-full border border-dashed border-blue-200 -z-10 pointer-events-none"
                                        />
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </motion.div>

            {/* --- INSTRUCTIONS HINT --- */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-400 text-sm font-medium animate-pulse pointer-events-none">
                <span className="bg-white/80 px-3 py-1 rounded-full shadow-sm">
                    Drag to explore • Click to expand
                </span>
            </div>
        </div>
    );
}
